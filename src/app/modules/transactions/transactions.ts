import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
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

import { GetTransactionsParams, TransactionService } from './services/transaction.service';
import { GateEventResult, TransactionListItem, TransactionResultCounts, TransactionStreamEvent } from './types/transaction.types';
import { TagSeverity, resultTag, tagStatusTag } from './utils/transaction-display';

type ResultFilter = GateEventResult | 'ALL';

/** Order of the result filter chips (after the leading "All" chip). */
const RESULT_FILTER_ORDER: GateEventResult[] = [
  'VERIFIED',
  'UNAUTHORIZED',
  'EXPRESSWAY_TAG',
  'FACE_MISMATCH',
  'PLATE_MISMATCH',
  'MANUAL_OVERRIDE',
  'DENIED',
  'ERROR',
];

interface ResultChip {
  value: ResultFilter;
  label: string;
  severity: TagSeverity;
  count: number;
}

@Component({
  selector: 'app-transactions',
  imports: [
    DatePipe,
    TableModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 overflow-hidden' },
})
export class Transactions implements OnInit {
  private transactionService = inject(TransactionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private pageRequest$ = new Subject<GetTransactionsParams>();
  private searchInput$ = new Subject<string>();

  protected readonly resultTag = resultTag;
  protected readonly tagStatusTag = tagStatusTag;

  transactions = signal<TransactionListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  counts = signal<TransactionResultCounts | null>(null);
  search = signal('');
  selectedResult = signal<ResultFilter>('ALL');

  resultChips = computed<ResultChip[]>(() => {
    const counts = this.counts();
    const allCount = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0;

    return [
      { value: 'ALL', label: 'All', severity: 'secondary', count: allCount },
      ...RESULT_FILTER_ORDER.map<ResultChip>(result => {
        const tag = resultTag(result);
        return {
          value: result,
          label: tag.label,
          severity: tag.severity,
          count: counts?.[result] ?? 0,
        };
      }),
    ];
  });

  ngOnInit(): void {
    this.pageRequest$
      .pipe(
        // catchError lives on the inner observable so a request failure never terminates
        // the outer pageRequest$ stream — subsequent loads keep working.
        switchMap(params => {
          this.loading.set(true);
          this.error.set(null);
          return this.transactionService.getTransactions(params).pipe(
            catchError(() => {
              this.error.set('Failed to load transactions. Please try again.');
              this.loading.set(false);
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ data, meta }) => {
        this.transactions.set(data);
        this.total.set(meta.total);
        this.counts.set(meta.counts);
        this.loading.set(false);
      });

    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => {
        this.search.set(term);
        this.page.set(1);
        this.load();
      });

    // Realtime updates: subscribe to server-sent EventStream (GEO-101)
    this.transactionService
      .getTransactionStream()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.handleStreamEvent(event);
      });

    this.load();
  }

  private handleStreamEvent(event: TransactionStreamEvent): void {
    const tx = event.data;
    if (!tx || !tx.id) return;

    if (event.type === 'transaction.created') {
      this.handleTransactionCreated(tx);
    } else if (event.type === 'transaction.updated') {
      this.handleTransactionUpdated(tx);
    } else {
      const exists = this.transactions().some(t => t.id === tx.id);
      if (exists) {
        this.handleTransactionUpdated(tx);
      } else {
        this.handleTransactionCreated(tx);
      }
    }
  }

  private handleTransactionCreated(newTx: TransactionListItem): void {
    // 1. Update live result counts
    const currentCounts = this.counts();
    if (currentCounts && newTx.result in currentCounts) {
      this.counts.set({
        ...currentCounts,
        [newTx.result]: (currentCounts[newTx.result] ?? 0) + 1,
      });
    }

    // 2. Check if newTx matches current result filter
    const activeResult = this.selectedResult();
    if (activeResult !== 'ALL' && activeResult !== newTx.result) {
      return;
    }

    // 3. Check if newTx matches search filter
    const term = this.search().trim().toLowerCase();
    if (term) {
      const matches =
        newTx.eventCode.toLowerCase().includes(term) ||
        (newTx.plateRead?.toLowerCase().includes(term) ?? false) ||
        (newTx.rfidTag?.epcId.toLowerCase().includes(term) ?? false) ||
        (newTx.truck?.plateNumber.toLowerCase().includes(term) ?? false);
      if (!matches) return;
    }

    // 4. Update the list if on page 1
    if (this.page() === 1) {
      this.loading.set(false);
      const currentList = this.transactions();
      const existingIndex = currentList.findIndex(t => t.id === newTx.id);

      if (existingIndex >= 0) {
        const updated = [...currentList];
        updated[existingIndex] = newTx;
        this.transactions.set(updated);
      } else {
        const updated = [newTx, ...currentList];
        if (updated.length > this.limit()) {
          updated.pop();
        }
        this.transactions.set(updated);
        this.total.update(n => n + 1);
      }
    } else {
      this.total.update(n => n + 1);
    }
  }

  private handleTransactionUpdated(updatedTx: TransactionListItem): void {
    const currentList = this.transactions();
    const index = currentList.findIndex(t => t.id === updatedTx.id);
    if (index >= 0) {
      const oldTx = currentList[index];
      if (oldTx.result !== updatedTx.result) {
        const currentCounts = this.counts();
        if (currentCounts) {
          const updatedCounts = { ...currentCounts };
          if (updatedCounts[oldTx.result] !== undefined) {
            updatedCounts[oldTx.result] = Math.max(0, updatedCounts[oldTx.result] - 1);
          }
          if (updatedCounts[updatedTx.result] !== undefined) {
            updatedCounts[updatedTx.result] = (updatedCounts[updatedTx.result] ?? 0) + 1;
          }
          this.counts.set(updatedCounts);
        }
      }

      const activeResult = this.selectedResult();
      if (activeResult !== 'ALL' && activeResult !== updatedTx.result) {
        this.transactions.set(currentList.filter(t => t.id !== updatedTx.id));
        this.total.update(n => Math.max(0, n - 1));
      } else {
        const updated = [...currentList];
        updated[index] = updatedTx;
        this.transactions.set(updated);
      }
    }
  }

  private load(): void {
    const result = this.selectedResult();
    this.pageRequest$.next({
      page: this.page(),
      limit: this.limit(),
      search: this.search() || undefined,
      result: result === 'ALL' ? undefined : result,
    });
  }

  onSearchInput(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  selectResult(value: ResultFilter): void {
    if (this.selectedResult() === value) return;
    this.selectedResult.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: PaginatorState): void {
    this.page.set((event.page ?? 0) + 1);
    this.limit.set(event.rows ?? 10);
    this.load();
  }

  openTransaction(id: string): void {
    this.router.navigate(['/transactions', id]);
  }
}
