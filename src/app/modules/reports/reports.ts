import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';

import { SkeletonModule } from 'primeng/skeleton';

import { ReportService } from './services/report.service';
import { DailySummaryData, ExceptionsMeta, MonthlyBreakdownData, PeakHoursData } from './types/report.types';

/** The live figure a report card leads with, so choosing one is an informed click. */
interface Glance {
  /** The headline figure. `null` renders as "unavailable" — a failed fetch is never a zero. */
  value: string | null;
  caption: string;
  /** Weights the figure as an anomaly (red) rather than a neutral count. */
  alert: boolean;
}

interface ReportCard {
  id: string;
  title: string;
  description: string;
  /** PrimeIcons class, e.g. `pi-chart-bar`. */
  icon: string;
  route: string;
  glance: Glance;
}

const UNAVAILABLE: Glance = { value: null, caption: 'figures unavailable', alert: false };

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Reports index — where an admin picks a report.
 *
 * Every card carries the live figure that report would open on, so the choice is
 * made on data rather than on a title: an admin who only wants to know whether
 * anything is wrong today can read that here and never open a report at all.
 * Each request fails independently; one dead endpoint costs one figure, not the page.
 */
@Component({
  selector: 'app-reports',
  imports: [RouterLink, SkeletonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Reports implements OnInit {
  private reportService = inject(ReportService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);

  private daily = signal<DailySummaryData | null>(null);
  private monthly = signal<MonthlyBreakdownData | null>(null);
  private exceptions = signal<ExceptionsMeta | null>(null);
  private peak = signal<PeakHoursData | null>(null);

  cards = computed<ReportCard[]>(() => [
    {
      id: 'daily-summary',
      title: 'Daily Summary',
      description: 'Everything that happened on one day — volume, verified vs exceptions, overrides, hourly throughput.',
      icon: 'pi-chart-bar',
      route: '/reports/daily-summary',
      glance: this.dailyGlance(),
    },
    {
      id: 'monthly-breakdown',
      title: 'Monthly Breakdown',
      description: 'A calendar of the month. Spot the days that went wrong, then open any one of them.',
      icon: 'pi-calendar',
      route: '/reports/monthly-breakdown',
      glance: this.monthlyGlance(),
    },
    {
      id: 'exceptions',
      title: 'Exceptions',
      description: 'Unknown tags, face and plate mismatches, denials and errors — filter, search, and open the evidence.',
      icon: 'pi-exclamation-triangle',
      route: '/reports/exceptions',
      glance: this.exceptionsGlance(),
    },
    {
      id: 'peak-hours',
      title: 'Peak Hours',
      description: "Hour-of-day histogram — where the gate's real rush windows are.",
      icon: 'pi-clock',
      route: '/reports/peak-hours',
      glance: this.peakGlance(),
    },
  ]);

  private dailyGlance(): Glance {
    const daily = this.daily();
    if (!daily) return UNAVAILABLE;

    const { totalGateEvents, exceptions } = daily.summary;
    return {
      value: plural(totalGateEvents, 'event'),
      caption: totalGateEvents === 0 ? 'no gate activity today' : `today · ${plural(exceptions, 'exception')}`,
      alert: exceptions > 0,
    };
  }

  private monthlyGlance(): Glance {
    const monthly = this.monthly();
    if (!monthly) return UNAVAILABLE;

    const flagged = monthly.days.filter(day => day.exceptions > 0).length;
    return {
      value: plural(monthly.summary.totalGateEvents, 'event'),
      caption: flagged === 0 ? 'this month · no days flagged' : `this month · ${plural(flagged, 'day')} flagged`,
      alert: flagged > 0,
    };
  }

  private exceptionsGlance(): Glance {
    const meta = this.exceptions();
    if (!meta) return UNAVAILABLE;

    return {
      value: meta.total === 0 ? 'All clear' : `${meta.total} to review`,
      caption: meta.openCount > 0 ? `last 7 days · ${meta.openCount} still open` : 'last 7 days',
      alert: meta.total > 0,
    };
  }

  private peakGlance(): Glance {
    const peak = this.peak();
    if (!peak) return UNAVAILABLE;

    const [busiest] = peak.peakHours;
    return {
      value: busiest ? busiest.label : 'No activity',
      caption: busiest ? `busiest hour · ${plural(busiest.totalGateEvents, 'pass')}` : 'last 30 days',
      alert: false,
    };
  }

  ngOnInit(): void {
    // Each call is caught on its own: a card without a figure still navigates.
    forkJoin({
      daily: this.reportService.getDailySummary().pipe(catchError(() => of(null))),
      monthly: this.reportService.getMonthlyBreakdown().pipe(catchError(() => of(null))),
      exceptions: this.reportService.getExceptions({ page: 1, limit: 1 }).pipe(catchError(() => of(null))),
      peak: this.reportService.getPeakHours().pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ daily, monthly, exceptions, peak }) => {
        this.daily.set(daily);
        this.monthly.set(monthly);
        this.exceptions.set(exceptions?.meta ?? null);
        this.peak.set(peak);
        this.loading.set(false);
      });
  }
}
