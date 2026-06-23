import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { isTypingTarget } from '../../core/utils/keyboard';
import { RfidTagStatus, TagSeverity, gateResultTag, rfidTagStatusTag } from '../../shared/ui/status-tags';
import { GetRfidTagsParams, RfidTagService } from './services/rfid-tags.service';
import { RfidTagListItem, RfidTagStatusCounts } from './types/rfid-tags.types';
import { RfidTagFormDialog } from './components/rfid-tag-form-dialog/rfid-tag-form-dialog';

type StatusFilter = RfidTagStatus | 'ALL';

const STATUS_ORDER: RfidTagStatus[] = ['ACTIVE', 'INACTIVE', 'LOST', 'BLOCKED', 'RETIRED'];

interface StatusChip {
  value: StatusFilter;
  label: string;
  severity: TagSeverity;
  count: number;
}

interface StatCard {
  label: string;
  count: number;
}

@Component({
  selector: 'app-rfid-tags',
  imports: [
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    RfidTagFormDialog,
  ],
  templateUrl: './rfid-tags.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-1 overflow-hidden',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class RfidTags implements OnInit {
  private rfidTagService = inject(RfidTagService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private pageRequest$ = new Subject<GetRfidTagsParams>();
  private searchInput$ = new Subject<string>();

  protected readonly rfidTagStatusTag = rfidTagStatusTag;
  protected readonly gateResultTag = gateResultTag;

  private searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  tags = signal<RfidTagListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  search = signal('');
  selectedStatus = signal<StatusFilter>('ALL');
  counts = signal<RfidTagStatusCounts | null>(null);

  registerVisible = signal(false);

  statCards = computed<StatCard[]>(() => {
    const counts = this.counts();
    return [
      { label: 'Total', count: counts?.total ?? 0 },
      ...STATUS_ORDER.map(status => ({
        label: rfidTagStatusTag(status).label,
        count: counts?.[status] ?? 0,
      })),
    ];
  });

  statusChips = computed<StatusChip[]>(() => {
    const counts = this.counts();
    return [
      { value: 'ALL', label: 'All', severity: 'secondary', count: counts?.total ?? 0 },
      ...STATUS_ORDER.map<StatusChip>(status => {
        const tag = rfidTagStatusTag(status);
        return { value: status, label: tag.label, severity: tag.severity, count: counts?.[status] ?? 0 };
      }),
    ];
  });

  ngOnInit(): void {
    this.pageRequest$
      .pipe(
        switchMap(params => {
          this.loading.set(true);
          this.error.set(null);
          return this.rfidTagService.getTags(params).pipe(
            catchError(() => {
              this.error.set('Failed to load RFID tags. Please try again.');
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ data, meta }) => {
        this.tags.set(data);
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

    this.load();
  }

  private load(): void {
    const status = this.selectedStatus();
    this.pageRequest$.next({
      page: this.page(),
      limit: this.limit(),
      search: this.search() || undefined,
      status: status === 'ALL' ? undefined : status,
    });
  }

  onSearchInput(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  selectStatus(value: StatusFilter): void {
    if (this.selectedStatus() === value) return;
    this.selectedStatus.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: PaginatorState): void {
    this.page.set((event.page ?? 0) + 1);
    this.limit.set(event.rows ?? 10);
    this.load();
  }

  openTag(id: string): void {
    this.router.navigate(['/rfid-tags', id]);
  }

  openRegister(): void {
    this.registerVisible.set(true);
  }

  reload(): void {
    this.load();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.registerVisible()) return;
    if (isTypingTarget(event.target)) return;

    if (event.key === '/') {
      event.preventDefault();
      this.searchBox()?.nativeElement.focus();
    } else if (event.key === 'n' || event.key === 'N') {
      event.preventDefault();
      this.openRegister();
    }
  }
}
