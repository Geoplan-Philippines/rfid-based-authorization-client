import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';

import { CCTVStreamMetadata, CctvService } from '../../core/services/cctv.service';

export interface GateCameraFeed {
  id: string;
  name: string;
  role: string;
  icon: string;
  connectionState: 'connecting' | 'connected' | 'failed' | 'disconnected';
  error?: string | null;
  isMuted: boolean;
}

@Component({
  selector: 'app-cctv',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
  ],
  templateUrl: './cctv.html',
  styleUrl: './cctv.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Cctv implements OnInit, OnDestroy {
  private cctvService = inject(CctvService);

  @ViewChildren('cameraVideo') videoElements!: QueryList<ElementRef<HTMLVideoElement>>;

  cameraFeeds = signal<GateCameraFeed[]>([
    {
      id: 'gate_dome',
      name: 'Gate Dome Camera',
      role: 'Gate Overview & PTZ Control',
      icon: 'pi-video',
      connectionState: 'connecting',
      isMuted: true,
    },
    {
      id: 'gate_face',
      name: 'Gate Face Camera',
      role: 'Driver Identification & Verification',
      icon: 'pi-user',
      connectionState: 'connecting',
      isMuted: true,
    },
    {
      id: 'gate_plate',
      name: 'Gate Plate Camera',
      role: 'Truck Plate Reader',
      icon: 'pi-truck',
      connectionState: 'connecting',
      isMuted: true,
    },
  ]);

  activeFocusedStreamId = signal<string | null>(null);
  loading = signal<boolean>(true);
  globalError = signal<string | null>(null);

  private peerConnections = new Map<string, RTCPeerConnection>();

  ngOnInit(): void {
    this.fetchStreamsAndConnectAll();
  }

  ngOnDestroy(): void {
    this.closeAllPeerConnections();
  }

  async fetchStreamsAndConnectAll(): Promise<void> {
    this.loading.set(true);
    this.globalError.set(null);

    this.cctvService.getStreams().subscribe({
      next: (metadata) => {
        this.loading.set(false);
        // Connect streams after view initialization
        setTimeout(() => this.connectAllFeeds(), 150);
      },
      error: (err) => {
        this.loading.set(false);
        this.globalError.set('Failed to load CCTV stream metadata. Please verify backend connection.');
      },
    });
  }

  private connectAllFeeds(): void {
    const videoElArray = this.videoElements.toArray();
    this.cameraFeeds().forEach((feed, index) => {
      const videoRef = videoElArray[index];
      if (videoRef?.nativeElement) {
        this.connectSingleFeed(feed.id, videoRef.nativeElement);
      }
    });
  }

  async connectSingleFeed(streamId: string, videoEl: HTMLVideoElement): Promise<void> {
    this.updateFeedState(streamId, { connectionState: 'connecting', error: null });

    // Close existing connection for this feed if any
    const existingPc = this.peerConnections.get(streamId);
    if (existingPc) {
      existingPc.close();
      this.peerConnections.delete(streamId);
    }

    try {
      const pc = await this.cctvService.createWebRTCConnection(
        streamId,
        videoEl,
        (state) => {
          this.updateFeedState(streamId, {
            connectionState: state as any,
          });
        }
      );
      this.peerConnections.set(streamId, pc);
    } catch (err: any) {
      this.updateFeedState(streamId, {
        connectionState: 'failed',
        error: err?.message || 'Unable to connect to stream',
      });
    }
  }

  toggleFocusStream(streamId: string): void {
    if (this.activeFocusedStreamId() === streamId) {
      this.activeFocusedStreamId.set(null);
    } else {
      this.activeFocusedStreamId.set(streamId);
    }
  }

  toggleMute(feedId: string, event: Event): void {
    event.stopPropagation();
    const videoArray = this.videoElements.toArray();
    const feedIndex = this.cameraFeeds().findIndex((f) => f.id === feedId);
    if (feedIndex !== -1 && videoArray[feedIndex]?.nativeElement) {
      const videoEl = videoArray[feedIndex].nativeElement;
      videoEl.muted = !videoEl.muted;
      this.updateFeedState(feedId, { isMuted: videoEl.muted });
    }
  }

  toggleFullscreen(feedId: string, event: Event): void {
    event.stopPropagation();
    const videoArray = this.videoElements.toArray();
    const feedIndex = this.cameraFeeds().findIndex((f) => f.id === feedId);
    if (feedIndex !== -1 && videoArray[feedIndex]?.nativeElement) {
      const videoEl = videoArray[feedIndex].nativeElement;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoEl.requestFullscreen();
      }
    }
  }

  getFeedById(id: string): GateCameraFeed {
    return this.cameraFeeds().find((f) => f.id === id) || this.cameraFeeds()[0];
  }

  getFeedIndex(id: string): number {
    return this.cameraFeeds().findIndex((f) => f.id === id);
  }

  retryFeed(feedId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const videoArray = this.videoElements.toArray();
    const feedIndex = this.cameraFeeds().findIndex((f) => f.id === feedId);
    if (feedIndex !== -1 && videoArray[feedIndex]?.nativeElement) {
      this.connectSingleFeed(feedId, videoArray[feedIndex].nativeElement);
    }
  }

  retryAll(): void {
    this.fetchStreamsAndConnectAll();
  }

  private updateFeedState(streamId: string, partialState: Partial<GateCameraFeed>): void {
    this.cameraFeeds.update((feeds) =>
      feeds.map((feed) => (feed.id === streamId ? { ...feed, ...partialState } : feed))
    );
  }

  private closeAllPeerConnections(): void {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
  }
}

