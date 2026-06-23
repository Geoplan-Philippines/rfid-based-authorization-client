import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';

import { DashboardService } from './services/dashboard.service';
import { DashboardOverview, NeedsReviewItem } from './types/dashboard.types';
import { deltaDisplay, formatPassTime } from './utils/dashboard-display';
import { gateResultTag } from '../../shared/ui/status-tags';
import { HourlyThroughputChart } from './components/hourly-throughput-chart/hourly-throughput-chart';

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toQueryDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    DatePickerModule,
    HourlyThroughputChart,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<string | undefined>();

  /** Exposed for the needs-review result chips. */
  protected readonly resultTag = gateResultTag;

  /** Midnight today (gate-local) — the date-picker ceiling and "Today" anchor. */
  readonly today = startOfToday();

  overview = signal<DashboardOverview | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedDate = signal<Date>(this.today);

  isToday = computed(() => isSameDay(this.selectedDate(), this.today));

  passTime = computed(() => {
    const overview = this.overview();
    return overview ? formatPassTime(overview.cards.avgPassTime) : null;
  });

  delta = computed(() => {
    const overview = this.overview();
    return overview ? deltaDisplay(overview.cards.trucksToday.deltaVsYesterday) : null;
  });

  ngOnInit(): void {
    // switchMap so a date change cancels any in-flight request; catchError on the
    // inner stream keeps the outer reload$ alive after a failed load.
    this.reload$
      .pipe(
        switchMap((date) => {
          this.loading.set(true);
          this.error.set(false);
          return this.dashboardService.getOverview(date).pipe(
            catchError(() => {
              this.error.set(true);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((overview) => {
        this.overview.set(overview);
        this.loading.set(false);
      });

    this.load();
  }

  private load(): void {
    // Today is sent as no `date` param so the API resolves its own gate-local day.
    this.reload$.next(this.isToday() ? undefined : toQueryDate(this.selectedDate()));
  }

  onDateSelect(date: Date): void {
    this.selectedDate.set(date);
    this.load();
  }

  resetToToday(): void {
    if (this.isToday()) return;
    this.selectedDate.set(this.today);
    this.load();
  }

  retry(): void {
    this.load();
  }

  openTransaction(item: NeedsReviewItem): void {
    this.router.navigate(['/transactions', item.id]);
  }

  viewAllTransactions(): void {
    this.router.navigate(['/transactions']);
  }
}
