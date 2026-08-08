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
import { SkeletonModule } from 'primeng/skeleton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

import { CCTVStreamMetadata, CctvService } from '../../core/services/cctv.service';

@Component({
  selector: 'app-cctv',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    SelectButtonModule,
  ],
  templateUrl: './cctv.html',
  styleUrl: './cctv.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Cctv implements OnInit, OnDestroy {
  private cctvService = inject(CctvService);

  @ViewChild('cctvVideo') videoElement!: ElementRef<HTMLVideoElement>;

  streams = signal<CCTVStreamMetadata[]>([]);
  activeStreamId = signal<string>('eagle_cam_sub');
  connectionState = signal<string>('connecting');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  isMuted = signal<boolean>(true);

  private peerConnection: RTCPeerConnection | null = null;

  ngOnInit(): void {
    this.fetchStreamsAndConnect();
  }

  ngOnDestroy(): void {
    this.closePeerConnection();
  }

  async fetchStreamsAndConnect(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    this.cctvService.getStreams().subscribe({
      next: (data) => {
        this.streams.set(data);
        this.loading.set(false);
        // Start streaming default stream once view is ready
        setTimeout(() => this.connectStream(this.activeStreamId()), 100);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load CCTV stream metadata. Please check backend connection.');
      },
    });
  }

  async connectStream(streamId: string): Promise<void> {
    this.activeStreamId.set(streamId);
    this.connectionState.set('connecting');
    this.error.set(null);

    this.closePeerConnection();

    if (!this.videoElement?.nativeElement) {
      setTimeout(() => this.connectStream(streamId), 200);
      return;
    }

    const videoEl = this.videoElement.nativeElement;

    try {
      this.peerConnection = await this.cctvService.createWebRTCConnection(
        streamId,
        videoEl,
        (state) => {
          this.connectionState.set(state);
        }
      );
    } catch (err: any) {
      this.connectionState.set('failed');
      this.error.set(err?.message || 'Unable to establish WebRTC connection to CCTV camera.');
    }
  }

  switchStream(streamId: string): void {
    if (this.activeStreamId() === streamId) return;
    this.connectStream(streamId);
  }

  toggleMute(): void {
    if (this.videoElement?.nativeElement) {
      const newMuted = !this.isMuted();
      this.videoElement.nativeElement.muted = newMuted;
      this.isMuted.set(newMuted);
    }
  }

  toggleFullscreen(): void {
    if (this.videoElement?.nativeElement) {
      const el = this.videoElement.nativeElement;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen();
      }
    }
  }

  retry(): void {
    this.connectStream(this.activeStreamId());
  }

  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
