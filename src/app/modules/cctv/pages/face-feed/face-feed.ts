import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
import { CctvService } from '../../../../core/services/cctv.service';

export interface FaceDetectionRecord {
  id: string;
  driverName: string;
  licenseNumber: string;
  truckPlate: string;
  confidence: number;
  status: 'VERIFIED' | 'FLAGGED' | 'UNKNOWN';
  timestamp: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-face-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule],
  templateUrl: './face-feed.html',
  styleUrl: './face-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class FaceFeed implements OnInit, OnDestroy {
  private cctvService = inject(CctvService);

  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  streamId = 'gate_face';
  connectionState = signal<'connecting' | 'connected' | 'failed' | 'disconnected'>('connecting');
  error = signal<string | null>(null);
  isMuted = signal<boolean>(true);

  recentDetections = signal<FaceDetectionRecord[]>([
    {
      id: 'fd-01',
      driverName: 'Juan Dela Cruz',
      licenseNumber: 'N01-12-345678',
      truckPlate: 'NXX-8899',
      confidence: 98.6,
      status: 'VERIFIED',
      timestamp: '2 mins ago',
    },
    {
      id: 'fd-02',
      driverName: 'Pedro Santos',
      licenseNumber: 'N02-98-765432',
      truckPlate: 'RST-4561',
      confidence: 95.2,
      status: 'VERIFIED',
      timestamp: '14 mins ago',
    },
    {
      id: 'fd-03',
      driverName: 'Unrecognized Driver',
      licenseNumber: 'N/A',
      truckPlate: 'XYZ-9900',
      confidence: 42.1,
      status: 'FLAGGED',
      timestamp: '32 mins ago',
    },
  ]);

  private peerConnection: RTCPeerConnection | null = null;

  ngOnInit(): void {
    setTimeout(() => this.connectStream(), 100);
  }

  ngOnDestroy(): void {
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
      this.error.set(err?.message || 'Failed to establish WebRTC connection to Face Camera.');
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

  retry(): void {
    this.connectStream();
  }

  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
