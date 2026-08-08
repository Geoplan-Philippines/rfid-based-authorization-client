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
import {
  AnprLatestState,
  CctvService,
  PlateDetection,
  PlateReadRecord,
} from '../../../../core/services/cctv.service';

/** A plate read shown in the live log (server record + display fields). */
export interface PlateReadDisplay extends PlateReadRecord {
  id: string;
  time: string;
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

  // ---- ANPR display state (detection itself runs server-side, continuously) ----
  /** Controls the client overlay/log refresh only — the server keeps detecting. */
  overlayEnabled = signal<boolean>(true);
  workerRunning = signal<boolean>(false);
  scanning = signal<boolean>(false);
  anprError = signal<string | null>(null);
  overlayBoxes = signal<OverlayBox[]>([]);
  platesInView = signal<number>(0);
  recentReads = signal<PlateReadDisplay[]>([]);

  /**
   * How often to refresh the worker state for display (ms). Seeded with a
   * sensible default, then driven by the interval the server worker reports
   * (`state.intervalMs`) so the single ANPR_POLL_INTERVAL_MS knob controls both
   * the server detection cadence and the client refresh rate.
   */
  private readonly MIN_POLL_INTERVAL_MS = 500;
  private pollIntervalMs = 1500;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private polling = false;
  /** Last raw detections + frame dims, kept so we can re-project boxes on resize. */
  private lastDetections: PlateDetection[] = [];
  private lastFrameW = 0;
  private lastFrameH = 0;

  private peerConnection: RTCPeerConnection | null = null;

  ngOnInit(): void {
    // Start showing server-side detections immediately — independent of the video.
    this.startPolling();
    setTimeout(() => this.connectStream(), 100);
  }

  ngOnDestroy(): void {
    this.stopPolling();
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

  /** Show/hide the detection overlay (does not stop the server-side worker). */
  toggleOverlay(): void {
    const next = !this.overlayEnabled();
    this.overlayEnabled.set(next);
    if (next) {
      this.startPolling();
    } else {
      this.stopPolling();
      this.overlayBoxes.set([]);
      this.platesInView.set(0);
    }
  }

  retry(): void {
    this.connectStream();
  }

  // --------------------------------------------------------------------- //
  // Poll the continuous server-side ANPR worker (display only)
  // --------------------------------------------------------------------- //
  private startPolling(): void {
    if (this.polling || !this.overlayEnabled()) return;
    this.polling = true;
    this.scheduleNextPoll(0);
  }

  private stopPolling(): void {
    this.polling = false;
    this.scanning.set(false);
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private scheduleNextPoll(delay: number): void {
    if (!this.polling) return;
    this.pollTimer = setTimeout(() => this.pollLatest(), delay);
  }

  private pollLatest(): void {
    if (!this.polling) return;
    this.scanning.set(true);
    this.cctvService.getAnprLatest().subscribe({
      next: (state) => {
        this.applyState(state);
        this.scanning.set(false);
        // Follow the server's reported cadence so one env knob drives both.
        this.pollIntervalMs = Math.max(this.MIN_POLL_INTERVAL_MS, state.intervalMs || this.pollIntervalMs);
        this.scheduleNextPoll(this.pollIntervalMs);
      },
      error: (err) => {
        this.anprError.set(err?.error?.message || 'Plate recognition unavailable.');
        this.workerRunning.set(false);
        this.scanning.set(false);
        this.scheduleNextPoll(this.pollIntervalMs * 2);
      },
    });
  }

  private applyState(state: AnprLatestState): void {
    this.workerRunning.set(state.running);
    this.anprError.set(state.lastError);

    const latest = state.latest;
    this.lastDetections = latest?.detections ?? [];
    this.lastFrameW = latest?.frameWidth ?? 0;
    this.lastFrameH = latest?.frameHeight ?? 0;
    this.platesInView.set(latest?.platesDetected ?? 0);
    this.projectOverlayBoxes();

    this.recentReads.set(
      state.recentReads.map((r, i) => ({
        ...r,
        id: `${r.plateText}-${r.capturedAt}-${i}`,
        time: new Date(r.capturedAt).toLocaleTimeString(),
      }))
    );
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
