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

@Injectable({ providedIn: 'root' })
export class CctvService {
  private http = inject(HttpClient);
  private readonly CCTV_URL = `${environment.apiBaseUrl}/cctv`;

  getStreams(): Observable<CCTVStreamMetadata[]> {
    return this.http
      .get<ApiResponse<{ streams: CCTVStreamMetadata[] }>>(`${this.CCTV_URL}/streams`)
      .pipe(map((res) => res.data.streams));
  }

  sendWhepOffer(sdp: string, streamId: string = 'eagle_cam_sub'): Observable<{ sdp: string }> {
    return this.http
      .post<ApiResponse<{ sdp: string }>>(`${this.CCTV_URL}/whep`, { sdp, streamId })
      .pipe(map((res) => res.data));
  }

  async createWebRTCConnection(
    streamId: string,
    videoElement: HTMLVideoElement,
    onStateChange?: (state: RTCPeerConnectionState) => void
  ): Promise<RTCPeerConnection> {
    const MediaSourceClass = (window as any).MediaSource || (window as any).ManagedMediaSource;

    // Use MSE (Media Source Extensions over WebSocket) as the primary streaming transport.
    // It runs over standard HTTP/TCP (port 4201), avoiding enterprise UDP blocking,
    // VPN MTU packet fragmentation, and NAT traversal issues across subnets.
    if (MediaSourceClass) {
      return this.connectViaMSE(streamId, videoElement, onStateChange);
    }

    // Fallback to pure WebRTC for environments without MediaSource
    return this.connectViaWebRTC(streamId, videoElement, onStateChange);
  }

  private connectViaMSE(
    streamId: string,
    videoElement: HTMLVideoElement,
    onStateChange?: (state: RTCPeerConnectionState) => void
  ): RTCPeerConnection {
    const MediaSourceClass = (window as any).MediaSource || (window as any).ManagedMediaSource;
    const ms = new MediaSourceClass();
    const objectUrl = URL.createObjectURL(ms);

    videoElement.srcObject = null;
    videoElement.src = objectUrl;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/go2rtc/api/ws?src=${encodeURIComponent(streamId)}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    let sourceBuffer: SourceBuffer | null = null;
    const queue: ArrayBuffer[] = [];
    let isConnected = false;
    let isClosed = false;

    onStateChange?.('connecting');

    const sendMseHandshake = () => {
      if (ws.readyState === WebSocket.OPEN && ms.readyState === 'open') {
        ws.send(
          JSON.stringify({
            type: 'mse',
            value: 'video/mp4; codecs="avc1.4D0028,avc1.640028,avc1.640029,avc1.64002A"',
          })
        );
      }
    };

    ms.addEventListener('sourceopen', sendMseHandshake, { once: true });
    ws.onopen = sendMseHandshake;

    ws.onmessage = (event) => {
      if (isClosed) return;

      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'mse' && !sourceBuffer && ms.readyState === 'open') {
            const sb = ms.addSourceBuffer(msg.value);
            sourceBuffer = sb;
            sb.mode = 'segments';

            sb.addEventListener('updateend', () => {
              if (isClosed) return;

              // Append queued chunks
              if (!sb.updating && queue.length > 0) {
                const next = queue.shift();
                if (next) {
                  try {
                    sb.appendBuffer(next);
                  } catch (e) {
                    console.debug('[CCTV MSE] appendBuffer error', e);
                  }
                }
              }

              // Prune old buffer to keep stream real-time with ultra-low latency (<200ms)
              if (!sb.updating && sb.buffered.length > 0) {
                const end = sb.buffered.end(sb.buffered.length - 1);
                const start = end - 5;
                const start0 = sb.buffered.start(0);
                if (start > start0 && !sb.updating) {
                  try {
                    sb.remove(start0, start);
                  } catch {}
                }
                if (videoElement.currentTime < start) {
                  videoElement.currentTime = start;
                }
                const gap = end - videoElement.currentTime;
                if (gap > 2) {
                  videoElement.currentTime = end - 0.2;
                }
              }
            });

            isConnected = true;
            onStateChange?.('connected');
            videoElement.play().catch(() => {
              videoElement.muted = true;
              videoElement.play().catch(() => {});
            });
          }
        } catch (err) {
          console.error('[CCTV MSE] Parse error', err);
        }
      } else if (event.data instanceof ArrayBuffer) {
        if (sourceBuffer && !sourceBuffer.updating && queue.length === 0) {
          try {
            sourceBuffer.appendBuffer(event.data);
          } catch {
            queue.push(event.data);
          }
        } else {
          queue.push(event.data);
        }

        if (!isConnected) {
          isConnected = true;
          onStateChange?.('connected');
          videoElement.play().catch(() => {
            videoElement.muted = true;
            videoElement.play().catch(() => {});
          });
        }
      }
    };

    ws.onerror = (err) => {
      console.warn('[CCTV MSE] WebSocket error for', streamId, err);
      if (!isConnected) {
        onStateChange?.('failed');
      }
    };

    ws.onclose = () => {
      if (!isClosed) {
        onStateChange?.('disconnected');
      }
    };

    // Return a mock RTCPeerConnection object satisfying the caller interface
    const connectionHandle = {
      connectionState: 'connected' as RTCPeerConnectionState,
      close: () => {
        isClosed = true;
        try {
          ws.close();
        } catch {}
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        if (sourceBuffer && ms.readyState === 'open') {
          try {
            ms.endOfStream();
          } catch {}
        }
      },
    } as unknown as RTCPeerConnection;

    return connectionHandle;
  }

  private async connectViaWebRTC(
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

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
      } else if (event.track) {
        let stream = videoElement.srcObject as MediaStream;
        if (!stream || !(stream instanceof MediaStream)) {
          stream = new MediaStream();
          videoElement.srcObject = stream;
        }
        stream.addTrack(event.track);
      }
      videoElement.play().catch(() => {
        videoElement.muted = true;
        videoElement.play().catch(() => {});
      });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const check = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', check);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', check);
        setTimeout(() => {
          pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }, 1200);
      }
    });

    const sdpToSend = pc.localDescription?.sdp || offer.sdp!;
    const response = await firstValueFrom(this.sendWhepOffer(sdpToSend, streamId));

    await pc.setRemoteDescription(
      new RTCSessionDescription({
        type: 'answer',
        sdp: response.sdp,
      })
    );

    return pc;
  }
}
