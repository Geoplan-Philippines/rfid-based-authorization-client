import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';

/** Thin wrapper over PrimeNG `MessageService` + HTTP error → friendly text mapping. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messageService = inject(MessageService);

  success(detail: string, summary = 'Success'): void {
    this.messageService.add({ severity: 'success', summary, detail, life: 3000 });
  }

  info(detail: string, summary = 'Info'): void {
    this.messageService.add({ severity: 'info', summary, detail, life: 3000 });
  }

  error(detail: string, summary = 'Error'): void {
    this.messageService.add({ severity: 'error', summary, detail, life: 5000 });
  }

  /** Show a toast for a failed HTTP request, preferring the backend message. */
  fromHttpError(error: unknown, fallback = 'Something went wrong. Please try again.'): void {
    this.error(this.messageFromHttpError(error, fallback));
  }

  messageFromHttpError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = this.extractApiMessage(error);
      if (apiMessage) return apiMessage;

      switch (error.status) {
        case 0:
          return 'Cannot reach the server. Check your connection.';
        case 400:
          return 'Invalid request. Please check the form and try again.';
        case 401:
          return 'Your session has expired. Please sign in again.';
        case 403:
          return 'You do not have permission to do that.';
        case 404:
          return 'The requested item was not found.';
        case 409:
          return 'That conflicts with an existing record.';
      }
    }
    return fallback;
  }

  /** Reads NestJS error bodies: `{ message: string | string[] }`. */
  private extractApiMessage(error: HttpErrorResponse): string | null {
    const body = error.error;
    if (!body || typeof body !== 'object') return null;

    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every(item => typeof item === 'string')) {
      return message.join(' ');
    }
    return null;
  }
}
