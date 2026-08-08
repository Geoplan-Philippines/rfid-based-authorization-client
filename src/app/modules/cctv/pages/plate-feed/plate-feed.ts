import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { AnprDetectResult, CctvService, PlateDetection } from '../../../../core/services/cctv.service';

/** A distinct plate read, surfaced in the live log. */
export interface PlateReadRecord {
  id: string;
  plateNumber: string;
  confidence: number;
  textConfidence: number;
  timestamp: string;
}

/** A bounding box already projected into the on-screen video coordinate space. */
export interface OverlayBox {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

@Component({
  selector: 'app-plate-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule],
  templateUrl: './plate-feed.html',
  styleUrl: './plate-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class PlateFeed implements OnInit, OnDestroy {
  private cctvService = inject(CctvService);

  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  streamId = 'gate_plate';
  connectionState = signal<'connecting' | 'connected' | 'failed' | 'disconnected'>('connecting');
  error = signal<string | null>(null);
  isMuted = signal<boolean>(true);

  // ---- ANPR live detection state ----
  detectionEnabled = signal<boolean>(true);
  scanning = signal<boolean>(false);
  anprError = signal<string | null>(null);
  overlayBoxes = signal<OverlayBox[]>([]);
  platesInView = signal<number>(0);
  recentReads = signal<PlateReadRecord[]>([]);

  /** How often to sample a frame for detection (ms). */
  private readonly POLL_INTERVAL_MS = 1500;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private polling = false;
  /** Last raw detections + frame dims, kept so we can re-project boxes on resize. */
  private lastDetections: PlateDetection[] = [];
  private lastFrameW = 0;
  private lastFrameH = 0;

  private peerConnection: RTCPeerConnection | null = null;

  ngOnInit(): void {
    setTimeout(() => this.connectStream(), 100);
  }

  ngOnDestroy(): void {
    this.stopDetectionLoop();
    this.closePeerConnection();
  }

  async connectStream(): Promise<void> {
    if (!this.videoRef?.nativeElement) return;
    this.connectionState.set('connecting');
    this.error.set(null);
    this.closePeerConnection();

    try {
      this.peerConnection = await this.cctvService.createWebRTCConnection(
        this.streamId,
        this.videoRef.nativeElement,
        (state) => {
          this.connectionState.set(state as any);
          if (state === 'connected') {
            this.startDetectionLoop();
          } else if (state === 'failed' || state === 'disconnected') {
            this.stopDetectionLoop();
          }
        }
      );
    } catch (err: any) {
      this.connectionState.set('failed');
      this.error.set(err?.message || 'Failed to connect to Plate Recognition Camera.');
    }
  }

  toggleMute(): void {
    if (this.videoRef?.nativeElement) {
      const el = this.videoRef.nativeElement;
      el.muted = !el.muted;
      this.isMuted.set(el.muted);
    }
  }

  toggleFullscreen(): void {
    if (this.videoRef?.nativeElement) {
      const el = this.videoRef.nativeElement;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen();
      }
    }
  }

  toggleDetection(): void {
    const next = !this.detectionEnabled();
    this.detectionEnabled.set(next);
    if (next) {
      this.startDetectionLoop();
    } else {
      this.stopDetectionLoop();
      this.overlayBoxes.set([]);
      this.platesInView.set(0);
    }
  }

  retry(): void {
    this.connectStream();
  }

  // --------------------------------------------------------------------- //
  // ANPR detection loop
  // --------------------------------------------------------------------- //
  private startDetectionLoop(): void {
    if (this.polling || !this.detectionEnabled()) return;
    this.polling = true;
    this.anprError.set(null);
    this.scheduleNextDetection(0);
  }

  private stopDetectionLoop(): void {
    this.polling = false;
    this.scanning.set(false);
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private scheduleNextDetection(delay: number): void {
    if (!this.polling) return;
    this.pollTimer = setTimeout(() => this.runDetection(), delay);
  }

  private runDetection(): void {
    if (!this.polling) return;
    this.scanning.set(true);
    this.cctvService.detectPlates(this.streamId).subscribe({
      next: (result) => {
        this.anprError.set(null);
        this.applyDetections(result);
        this.scanning.set(false);
        this.scheduleNextDetection(this.POLL_INTERVAL_MS);
      },
      error: (err) => {
        this.anprError.set(err?.error?.message || 'Plate recognition unavailable.');
        this.scanning.set(false);
        // Back off a little longer on error so we don't hammer a down service.
        this.scheduleNextDetection(this.POLL_INTERVAL_MS * 2);
      },
    });
  }

  private applyDetections(result: AnprDetectResult): void {
    this.lastDetections = result.detections ?? [];
    this.lastFrameW = result.frameWidth || 0;
    this.lastFrameH = result.frameHeight || 0;
    this.platesInView.set(result.platesDetected ?? 0);
    this.projectOverlayBoxes();
    this.recordReads(result);
  }

  /** Map frame-space bounding boxes onto the rendered (object-cover) video box. */
  private projectOverlayBoxes(): void {
    const video = this.videoRef?.nativeElement;
    const fw = this.lastFrameW || video?.videoWidth || 0;
    const fh = this.lastFrameH || video?.videoHeight || 0;
    if (!video || !fw || !fh) {
      this.overlayBoxes.set([]);
      return;
    }

    const cw = video.clientWidth;
    const ch = video.clientHeight;
    // object-cover: scale so the frame fully covers the box, center-crop overflow.
    const scale = Math.max(cw / fw, ch / fh);
    const offsetX = (cw - fw * scale) / 2;
    const offsetY = (ch - fh * scale) / 2;

    const boxes: OverlayBox[] = this.lastDetections.map((d) => ({
      left: offsetX + d.bbox.x1 * scale,
      top: offsetY + d.bbox.y1 * scale,
      width: (d.bbox.x2 - d.bbox.x1) * scale,
      height: (d.bbox.y2 - d.bbox.y1) * scale,
      label: d.plateText || '—',
      confidence: d.confidence,
    }));
    this.overlayBoxes.set(boxes);
  }

  /** Prepend newly-read plate texts to the live log, de-duplicating repeats. */
  private recordReads(result: AnprDetectResult): void {
    const named = (result.detections ?? []).filter((d) => d.plateText.trim().length > 0);
    if (named.length === 0) return;

    const time = new Date(result.capturedAt);
    const stamp = time.toLocaleTimeString();

    this.recentReads.update((current) => {
      const recentText = current[0]?.plateNumber;
      const next = [...current];
      for (const d of named) {
        const plate = d.plateText.trim();
        // Skip if it's the same plate we just logged (steady vehicle in frame).
        if (plate === recentText) continue;
        next.unshift({
          id: `${plate}-${time.getTime()}`,
          plateNumber: plate,
          confidence: d.confidence,
          textConfidence: d.textConfidence,
          timestamp: stamp,
        });
      }
      return next.slice(0, 20);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.projectOverlayBoxes();
  }

  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
