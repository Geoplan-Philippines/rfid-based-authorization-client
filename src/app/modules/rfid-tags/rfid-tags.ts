import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Subject, switchMap } from 'rxjs';

import { RfidTagService } from './services/rfid-tags.service';
import { RfidTag, RfidTagStatus } from './types/rfid-tags.types';

// NOTE: "Last Event" and "Events" columns in the template are intentionally hardcoded
// ("-" and "0") because GET /api/v1/rfid-tags does not yet return last-event timestamp
// or gate-event counts for a tag. Confirmed with the team to ship hardcoded for now;
// see rfid-tags.html for inline TODOs once the backend exposes these fields.
// The "Open" action button is similarly disabled pending a /rfid-tags/:id detail route.
@Component({
  selector: 'app-rfid-tags',
  imports: [TableModule, AvatarModule, ProgressSpinnerModule, PaginatorModule, TagModule, DatePipe],
  templateUrl: './rfid-tags.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class RfidTags implements OnInit {
  private static readonly STATUS_SEVERITY: Record<RfidTagStatus, 'success' | 'warn' | 'danger'> = {
    ACTIVE: 'success',
    INACTIVE: 'warn',
    BLOCKED: 'danger',
    LOST: 'warn',
  };

  private rfidTagService = inject(RfidTagService);
  private destroyRef = inject(DestroyRef);
  private pageRequest$ = new Subject<{ page: number; limit: number }>();

  rfidTags = signal<RfidTag[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  limit = signal(10);

  ngOnInit(): void {
    this.pageRequest$
      .pipe(
        switchMap(({ page, limit }) => {
          this.loading.set(true);
          this.error.set(null);
          return this.rfidTagService.getRfidTags(page, limit);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ data, meta }) => {
          this.rfidTags.set(data);
          this.total.set(meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load RFID tags. Please try again.');
          this.loading.set(false);
        },
      });

    this.pageRequest$.next({ page: this.page(), limit: this.limit() });
  }

  onPageChange(event: PaginatorState): void {
    this.page.set((event.page ?? 0) + 1);
    this.limit.set(event.rows ?? 10);

    this.pageRequest$.next({ page: this.page(), limit: this.limit() });
  }

  statusSeverity(status: RfidTagStatus): 'success' | 'warn' | 'danger' {
    return RfidTags.STATUS_SEVERITY[status];
  }

  epcInitials(epcId: string): string {
    return epcId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  }
}
