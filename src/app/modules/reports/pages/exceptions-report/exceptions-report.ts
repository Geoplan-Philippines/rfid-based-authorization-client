import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { GetExceptionsParams, ReportService } from '../../services/report.service';
import { ExceptionReportItem, ExceptionResult, ExceptionsMeta } from '../../types/report.types';
import { DateRange, ReportRangePicker } from '../../components/report-range-picker/report-range-picker';
import { TagSeverity, gateResultTag, rfidTagStatusTag } from '../../../../shared/ui/status-tags';
import { parseQueryDate, toQueryDate } from '../../../../shared/utils/date';

type ResultFilter = ExceptionResult | 'ALL';

/** Chip order, matching the API's ExceptionResult union. */
const EXCEPTION_RESULT_ORDER: readonly ExceptionResult[] = [
  'UNKNOWN_TAG',
  'FACE_MISMATCH',
  'PLATE_MISMATCH',
  'DENIED',
  'ERROR',
];

interface ResultChip {
  value: ResultFilter;
  label: string;
  severity: TagSeverity;
  count: number;
}

/**
 * Unknown tags, face/plate mismatches, denials and errors over a date range.
 *
 * Every filter is server-side: the result chips, the search box, and the date
 * range all re-request rather than filtering the loaded page. `meta.resultCounts`
 * deliberately ignores the selected result, so every chip keeps its count while
 * one is active and the breakdown never collapses to the thing you picked.
 */
@Component({
  selector: 'app-exceptions-report',
  imports: [
    DatePipe,
    RouterLink,
    TableModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ReportRangePicker,
  ],
  templateUrl: './exceptions-report.html',
  styleUrl: './exceptions-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class ExceptionsReport implements OnInit {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private pageRequest$ = new Subject<GetExceptionsParams>();
  private searchInput$ = new Subject<string>();

  protected readonly resultTag = gateResultTag;
  protected readonly rfidTagStatusTag = rfidTagStatusTag;

  items = signal<ExceptionReportItem[]>([]);
  meta = signal<ExceptionsMeta | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  page = signal(1);
  limit = signal(10);
  search = signal('');
  selectedResult = signal<ResultFilter>('ALL');

  /** Null until the first response: the API owns the default 7-day window. Re-synced to
   *  `meta.period` on every load, so the picker never disagrees with the table. */
  range = signal<DateRange | null>(null);

  resultChips = computed<ResultChip[]>(() => {
    const counts = this.meta()?.resultCounts;
    const allCount = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0;

    return [
      { value: 'ALL', label: 'All', severity: 'secondary', count: allCount },
      ...EXCEPTION_RESULT_ORDER.map<ResultChip>(result => {
        const tag = this.resultTag(result);
        return { value: result, label: tag.label, severity: tag.severity, count: counts?.[result] ?? 0 };
      }),
    ];
  });

  hasFilters = computed(() => this.selectedResult() !== 'ALL' || this.search().length > 0);

  ngOnInit(): void {
    const from = parseQueryDate(this.route.snapshot.queryParamMap.get('from'));
    const to = parseQueryDate(this.route.snapshot.queryParamMap.get('to'));
    if (from && to) this.range.set({ from, to });

    this.pageRequest$
      .pipe(
        // catchError on the inner observable so one failed load never kills the stream.
        switchMap(params => {
          this.loading.set(true);
          this.error.set(null);
          return this.reportService.getExceptions(params).pipe(
            catchError(() => {
              this.error.set('Failed to load the exceptions report. Please try again.');
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ data, meta }) => {
        this.items.set(data);
        this.meta.set(meta);

        const periodFrom = parseQueryDate(meta.period.from);
        const periodTo = parseQueryDate(meta.period.to);
        if (periodFrom && periodTo) this.range.set({ from: periodFrom, to: periodTo });

        this.loading.set(false);
      });

    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => {
        this.search.set(term);
        this.resetToFirstPage();
      });

    this.load();
  }

  private load(): void {
    const range = this.range();
    const result = this.selectedResult();

    this.pageRequest$.next({
      page: this.page(),
      limit: this.limit(),
      from: range ? toQueryDate(range.from) : undefined,
      to: range ? toQueryDate(range.to) : undefined,
      result: result === 'ALL' ? undefined : result,
      search: this.search() || undefined,
    });
  }

  onSearchInput(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  selectResult(value: ResultFilter): void {
    if (this.selectedResult() === value) return;
    this.selectedResult.set(value);
    this.resetToFirstPage();
  }

  onRangeChange(range: DateRange): void {
    this.range.set(range);
    this.resetToFirstPage();
  }

  clearFilters(): void {
    if (!this.hasFilters()) return;
    this.selectedResult.set('ALL');
    // The input is value-bound to `search`, so clearing the signal clears the box
    // without pushing through the debounced stream — one request, not two.
    this.search.set('');
    this.resetToFirstPage();
  }

  onPageChange(event: PaginatorState): void {
    this.page.set((event.page ?? 0) + 1);
    this.limit.set(event.rows ?? 10);
    this.load();
  }

  private resetToFirstPage(): void {
    this.page.set(1);
    this.load();
  }

  retry(): void {
    this.load();
  }

  openTransaction(id: string): void {
    this.router.navigate(['/transactions', id]);
  }
}
