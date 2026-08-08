import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/api-response.types';

export interface CCTVStreamMetadata {
  id: string;
  name: string;
  channel: string;
  resolution: string;
  isOnline: boolean;
}

export interface PlateBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PlateDetection {
  confidence: number;
  plateText: string;
  textConfidence: number;
  bbox: PlateBoundingBox;
}

export interface AnprDetectResult {
  streamId: string;
  platesDetected: number;
  detections: PlateDetection[];
  frameWidth: number;
  frameHeight: number;
  capturedAt: string;
}

export interface PlateReadRecord {
  plateText: string;
  confidence: number;
  textConfidence: number;
  capturedAt: string;
}

/** State of the continuous server-side ANPR worker. */
export interface AnprLatestState {
  running: boolean;
  streamId: string;
  intervalMs: number;
  lastError: string | null;
  updatedAt: string | null;
  latest: AnprDetectResult | null;
  recentReads: PlateReadRecord[];
}

@Injectable({ providedIn: 'root' })
export class CctvService {
  private http = inject(HttpClient);
  private readonly CCTV_URL = `${environment.apiBaseUrl}/cctv`;

  getStreams(): Observable<CCTVStreamMetadata[]> {
    return this.http
      .get<ApiResponse<{ streams: CCTVStreamMetadata[] }>>(`${this.CCTV_URL}/streams`)
      .pipe(map(res => res.data.streams));
  }

  sendWhepOffer(sdp: string, streamId: string = 'eagle_cam_sub'): Observable<{ sdp: string }> {
    return this.http
      .post<ApiResponse<{ sdp: string }>>(`${this.CCTV_URL}/whep`, { sdp, streamId })
      .pipe(map(res => res.data));
  }

  /** Grab a live still from the stream and return ANPR plate detections for it. */
  detectPlates(streamId: string): Observable<AnprDetectResult> {
    return this.http
      .get<ApiResponse<AnprDetectResult>>(`${this.CCTV_URL}/anpr/detect`, {
        params: { streamId },
      })
      .pipe(map(res => res.data));
  }

  /** Latest detections + read log from the continuous server-side ANPR worker. */
  getAnprLatest(): Observable<AnprLatestState> {
    return this.http
      .get<ApiResponse<AnprLatestState>>(`${this.CCTV_URL}/anpr/latest`)
      .pipe(map(res => res.data));
  }

  async createWebRTCConnection(
    streamId: string,
    videoElement: HTMLVideoElement,
    onStateChange?: (state: RTCPeerConnectionState) => void
  ): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    if (onStateChange) {
      pc.onconnectionstatechange = () => {
        onStateChange(pc.connectionState);
      };
    }

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send SDP offer through NestJS backend WHEP proxy endpoint
    const response = await firstValueFrom(this.sendWhepOffer(offer.sdp!, streamId));
    
    await pc.setRemoteDescription(
      new RTCSessionDescription({
        type: 'answer',
        sdp: response.sdp,
      })
    );

    return pc;
  }
}
