import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';

import { ReportService } from '../../services/report.service';
import { MonthlyBreakdownData, MonthlyBreakdownDay } from '../../types/report.types';
import { ReportSummaryPanel, ExceptionsDrilldown } from '../../components/report-summary-panel/report-summary-panel';
import { isSameDay, startOfToday, toQueryDate } from '../../../../shared/utils/date';

/** A single calendar square. Carries its own counts so the grid is readable without hovering. */
interface DayCell {
  date: string;
  dayOfMonth: number;
  total: number;
  exceptions: number;
  /** 0 (no activity) through 4 (busiest quartile) — drives the volume tint. */
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  /** A day later than today in the current month: no data can exist yet. */
  isFuture: boolean;
  label: string;
}

/** A day worth an admin's attention, for the review rail. */
interface ReviewDay {
  date: string;
  dayLabel: string;
  exceptions: number;
  total: number;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function toQueryMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Parses a `YYYY-MM` queryParam into a local Date (day 1); `null` if absent/malformed. */
function parseQueryMonth(value: string | null): Date | null {
  const match = value ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const [, y, m] = match;
  return new Date(Number(y), Number(m) - 1, 1);
}

/** `YYYY-MM-DD` → local Date. The API's day keys are always well-formed. */
function fromApiDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function intensityLevel(total: number, max: number): DayCell['level'] {
  if (total <= 0 || max <= 0) return 0;
  const ratio = total / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * A month of gate activity as a compact calendar. Each square prints its own
 * event count — the tint is for scanning, the number is for reading — and the
 * review rail beside it answers the question the calendar can't: which days
 * actually need an admin's attention.
 */
@Component({
  selector: 'app-monthly-breakdown',
  imports: [DatePipe, FormsModule, RouterLink, ButtonModule, SkeletonModule, DatePickerModule, ReportSummaryPanel],
  templateUrl: './monthly-breakdown.html',
  styleUrl: './monthly-breakdown.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class MonthlyBreakdown implements OnInit {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<string | undefined>();

  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly today = startOfToday();
  /** First-of-month (gate-local) — the month-picker ceiling and "This month" anchor. */
  readonly thisMonth = startOfMonth(this.today);
  /** Legend swatches, highest volume first. */
  readonly legendLevels = [1, 2, 3, 4] as const;

  report = signal<MonthlyBreakdownData | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedMonth = signal<Date>(this.thisMonth);

  isCurrentMonth = computed(() => isSameMonth(this.selectedMonth(), this.thisMonth));

  /** The reported month, parsed for display — kept separate from `selectedMonth` so the
   *  header never shows a month whose data hasn't arrived yet. */
  monthDate = computed(() => {
    const report = this.report();
    return report ? parseQueryMonth(report.month) : null;
  });

  /** Leading blank cells so day-of-week columns line up (0=Sun..6=Sat). */
  leadingBlanks = computed(() => {
    const month = this.monthDate();
    return month ? Array.from({ length: month.getDay() }) : [];
  });

  dayCells = computed<DayCell[]>(() => {
    const report = this.report();
    if (!report) return [];

    const max = Math.max(0, ...report.days.map(day => day.totalGateEvents));

    return report.days.map(day => {
      const date = fromApiDate(day.date);
      return {
        date: day.date,
        dayOfMonth: date.getDate(),
        total: day.totalGateEvents,
        exceptions: day.exceptions,
        level: intensityLevel(day.totalGateEvents, max),
        isToday: isSameDay(date, this.today),
        isFuture: date > this.today,
        label: this.cellLabel(day, date),
      };
    });
  });

  /** Exception days, worst first — the month's actual to-do list. */
  reviewDays = computed<ReviewDay[]>(() =>
    (this.report()?.days ?? [])
      .filter(day => day.exceptions > 0)
      .sort((a, b) => b.exceptions - a.exceptions || b.date.localeCompare(a.date))
      .map(day => ({
        date: day.date,
        dayLabel: fromApiDate(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        exceptions: day.exceptions,
        total: day.totalGateEvents,
      })),
  );

  busiestDay = computed<ReviewDay | null>(() => {
    const days = this.report()?.days ?? [];
    const busiest = days.reduce<MonthlyBreakdownDay | null>(
      (best, day) => (day.totalGateEvents > (best?.totalGateEvents ?? 0) ? day : best),
      null,
    );
    if (!busiest) return null;

    return {
      date: busiest.date,
      dayLabel: fromApiDate(busiest.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      exceptions: busiest.exceptions,
      total: busiest.totalGateEvents,
    };
  });

  /** Whole-month exception drill-down, clamped so the range never runs past today. */
  exceptionsDrilldown = computed<ExceptionsDrilldown | null>(() => {
    const month = this.monthDate();
    if (!month) return null;

    const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const to = lastOfMonth > this.today ? this.today : lastOfMonth;
    return { from: toQueryDate(month), to: toQueryDate(to) };
  });

  private cellLabel(day: MonthlyBreakdownDay, date: Date): string {
    const formatted = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const events = `${day.totalGateEvents} event${day.totalGateEvents === 1 ? '' : 's'}`;
    const exceptions = day.exceptions > 0 ? `, ${day.exceptions} exception${day.exceptions === 1 ? '' : 's'}` : '';
    return `${formatted} — ${events}${exceptions}`;
  }

  ngOnInit(): void {
    const seeded = parseQueryMonth(this.route.snapshot.queryParamMap.get('month'));
    if (seeded) this.selectedMonth.set(seeded);

    this.reload$
      .pipe(
        switchMap(month => {
          this.loading.set(true);
          this.error.set(false);
          return this.reportService.getMonthlyBreakdown(month).pipe(
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
    // The current month is sent as no `month` param so the API resolves its own gate-local month.
    this.reload$.next(this.isCurrentMonth() ? undefined : toQueryMonth(this.selectedMonth()));
  }

  onMonthSelect(date: Date): void {
    this.selectedMonth.set(startOfMonth(date));
    this.load();
  }

  resetToCurrentMonth(): void {
    if (this.isCurrentMonth()) return;
    this.selectedMonth.set(this.thisMonth);
    this.load();
  }

  retry(): void {
    this.load();
  }

  openDay(date: string): void {
    this.router.navigate(['/reports/daily-summary'], { queryParams: { date } });
  }
}
