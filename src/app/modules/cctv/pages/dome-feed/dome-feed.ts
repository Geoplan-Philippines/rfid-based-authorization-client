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

export interface PtzPreset {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-dome-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule],
  templateUrl: './dome-feed.html',
  styleUrl: './dome-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class DomeFeed implements OnInit, OnDestroy {
  private cctvService = inject(CctvService);

  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  streamId = 'gate_dome';
  connectionState = signal<'connecting' | 'connected' | 'failed' | 'disconnected'>('connecting');
  error = signal<string | null>(null);
  isMuted = signal<boolean>(true);
  activePreset = signal<string>('gate_overview');

  presets: PtzPreset[] = [
    { id: 'gate_overview', name: 'Gate Overview', description: 'Wide view of entry/exit lanes' },
    { id: 'weighbridge_scale', name: 'Weighbridge Scale', description: 'Close-up of truck scale platform' },
    { id: 'inspection_bay', name: 'Inspection Bay', description: 'Guard manual check booth' },
  ];

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
      this.error.set(err?.message || 'Failed to connect to Dome PTZ Camera.');
    }
  }

  selectPreset(presetId: string): void {
    this.activePreset.set(presetId);
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
