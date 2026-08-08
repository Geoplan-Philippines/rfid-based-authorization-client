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

export interface PlateScanRecord {
  id: string;
  plateNumber: string;
  vehicleType: string;
  driverName: string;
  rfidTag: string;
  status: 'MATCH' | 'DISCREPANCY' | 'UNREGISTERED';
  timestamp: string;
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

  recentScans = signal<PlateScanRecord[]>([
    {
      id: 'ps-101',
      plateNumber: 'NXX-8899',
      vehicleType: 'Bulk Cement Tanker 10-Wheeler',
      driverName: 'Juan Dela Cruz',
      rfidTag: 'RFID-990182',
      status: 'MATCH',
      timestamp: 'Just now',
    },
    {
      id: 'ps-102',
      plateNumber: 'RST-4561',
      vehicleType: 'Flatbed Hauler',
      driverName: 'Pedro Santos',
      rfidTag: 'RFID-881023',
      status: 'MATCH',
      timestamp: '12 mins ago',
    },
    {
      id: 'ps-103',
      plateNumber: 'XYZ-9900',
      vehicleType: 'Dump Truck',
      driverName: 'Unknown Driver',
      rfidTag: 'NONE',
      status: 'UNREGISTERED',
      timestamp: '28 mins ago',
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
