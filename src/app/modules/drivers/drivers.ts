import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Subject, switchMap } from 'rxjs';

import { DriverService } from './services/driver.service';
import { Driver } from './types/driver.types';

@Component({
  selector: 'app-drivers',
  imports: [TableModule, AvatarModule, ProgressSpinnerModule, PaginatorModule],
  templateUrl: './drivers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Drivers implements OnInit {
  private driverService = inject(DriverService);
  private destroyRef = inject(DestroyRef);
  private pageRequest$ = new Subject<{ page: number; limit: number }>();

  drivers = signal<Driver[]>([]);
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
          return this.driverService.getDrivers(page, limit);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ data, meta }) => {
          this.drivers.set(data);
          this.total.set(meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load drivers. Please try again.');
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

  initials(driver: Driver): string {
    return `${driver.firstName?.[0] ?? ''}${driver.lastName?.[0] ?? ''}`.toUpperCase();
  }

}