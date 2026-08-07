import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { ReportService } from '../../services/report.service';
import { PeakHoursData } from '../../types/report.types';
import { ExceptionsDrilldown, ReportSummaryPanel } from '../../components/report-summary-panel/report-summary-panel';
import { PeakHoursChart } from '../../components/peak-hours-chart/peak-hours-chart';
import { DateRange, ReportRangePicker } from '../../components/report-range-picker/report-range-picker';
import { parseQueryDate, toQueryDate } from '../../../../shared/utils/date';

interface DateRangeParams {
  from?: string;
  to?: string;
}

/** Hour-of-day histogram across a date range — where the gate's real rush windows are. */
@Component({
  selector: 'app-peak-hours',
  imports: [DatePipe, RouterLink, ButtonModule, SkeletonModule, ReportSummaryPanel, PeakHoursChart, ReportRangePicker],
  templateUrl: './peak-hours.html',
  styleUrl: './peak-hours.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class PeakHours implements OnInit {
  private reportService = inject(ReportService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<DateRangeParams>();

  report = signal<PeakHoursData | null>(null);
  loading = signal(true);
  error = signal(false);

  /** Null until the first response: the API owns the default 30-day window. */
  range = signal<DateRange | null>(null);

  exceptionsDrilldown = computed<ExceptionsDrilldown | null>(() => {
    const report = this.report();
    return report ? { from: report.period.from, to: report.period.to } : null;
  });

  ngOnInit(): void {
    const from = parseQueryDate(this.route.snapshot.queryParamMap.get('from'));
    const to = parseQueryDate(this.route.snapshot.queryParamMap.get('to'));
    if (from && to) this.range.set({ from, to });

    this.reload$
      .pipe(
        switchMap(({ from, to }) => {
          this.loading.set(true);
          this.error.set(false);
          return this.reportService.getPeakHours(from, to).pipe(
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

        const periodFrom = parseQueryDate(report.period.from);
        const periodTo = parseQueryDate(report.period.to);
        if (periodFrom && periodTo) this.range.set({ from: periodFrom, to: periodTo });

        this.loading.set(false);
      });

    this.load();
  }

  private load(): void {
    const range = this.range();
    this.reload$.next({
      from: range ? toQueryDate(range.from) : undefined,
      to: range ? toQueryDate(range.to) : undefined,
    });
  }

  onRangeChange(range: DateRange): void {
    this.range.set(range);
    this.load();
  }

  retry(): void {
    this.load();
  }
}
