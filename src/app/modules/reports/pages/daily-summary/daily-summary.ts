import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';

import { ReportService } from '../../services/report.service';
import { DailySummaryData } from '../../types/report.types';
import { ExceptionsDrilldown, ReportSummaryPanel } from '../../components/report-summary-panel/report-summary-panel';
import { HourlyThroughputChart } from '../../../../shared/components/hourly-throughput-chart/hourly-throughput-chart';
import { isSameDay, parseQueryDate, startOfToday, toQueryDate } from '../../../../shared/utils/date';

/**
 * Single-day report. Stepping one day at a time is the common move when an
 * admin is working backwards through a quiet week, so the arrows sit next to
 * the picker rather than making them open a calendar for every hop.
 */
@Component({
  selector: 'app-daily-summary',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    SkeletonModule,
    DatePickerModule,
    ReportSummaryPanel,
    HourlyThroughputChart,
  ],
  templateUrl: './daily-summary.html',
  styleUrl: './daily-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class DailySummary implements OnInit {
  private reportService = inject(ReportService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<string | undefined>();

  /** Midnight today (gate-local) — the date-picker ceiling and "Today" anchor. */
  readonly today = startOfToday();

  report = signal<DailySummaryData | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedDate = signal<Date>(this.today);

  isToday = computed(() => isSameDay(this.selectedDate(), this.today));

  /** Same-day exception drill-down: read the count, click through to the rows. */
  exceptionsDrilldown = computed<ExceptionsDrilldown | null>(() => {
    const report = this.report();
    return report ? { from: report.date, to: report.date } : null;
  });

  ngOnInit(): void {
    // Seed once from ?date= (e.g. a Monthly Breakdown drill-down); state is
    // component-owned afterward, matching Dashboard/Transactions.
    const seeded = parseQueryDate(this.route.snapshot.queryParamMap.get('date'));
    if (seeded) this.selectedDate.set(seeded);

    this.reload$
      .pipe(
        switchMap(date => {
          this.loading.set(true);
          this.error.set(false);
          return this.reportService.getDailySummary(date).pipe(
            catchError(() => {
              this.error.set(true);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(report => {
        this.report.set(report);
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

  /** Step one day; `+1` is blocked at today since the gate has no future events. */
  stepDay(days: -1 | 1): void {
    const next = new Date(this.selectedDate());
    next.setDate(next.getDate() + days);
    if (next > this.today) return;

    this.selectedDate.set(next);
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
}
