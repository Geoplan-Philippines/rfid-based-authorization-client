import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { isTypingTarget } from '../../core/utils/keyboard';
import { resolvePhotoUrl } from '../../core/utils/photo-url';
import { isFutureDate } from '../../shared/utils/date';
import { GetDriversParams, DriverService } from './services/driver.service';
import { DriverListItem } from './types/driver.types';
import { DriverFormDialog } from './components/driver-form-dialog/driver-form-dialog';

@Component({
  selector: 'app-drivers',
  imports: [
    DatePipe,
    TableModule,
    AvatarModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DriverFormDialog,
  ],
  templateUrl: './drivers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-1 overflow-hidden',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class Drivers implements OnInit {
  private driverService = inject(DriverService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private pageRequest$ = new Subject<GetDriversParams>();
  private searchInput$ = new Subject<string>();

  protected readonly resolvePhotoUrl = resolvePhotoUrl;
  protected readonly isFutureScheduled = isFutureDate;

  private searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  drivers = signal<DriverListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  search = signal('');
  includeArchived = signal(false);

  createVisible = signal(false);

  ngOnInit(): void {
    this.pageRequest$
      .pipe(
        switchMap(params => {
          this.loading.set(true);
          this.error.set(null);
          return this.driverService.getDrivers(params).pipe(
            catchError(() => {
              this.error.set('Failed to load drivers. Please try again.');
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ data, meta }) => {
        this.drivers.set(data);
        this.total.set(meta.total);
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
    this.pageRequest$.next({
      page: this.page(),
      limit: this.limit(),
      search: this.search() || undefined,
      includeArchived: this.includeArchived() || undefined,
    });
  }

  onSearchInput(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  toggleArchived(): void {
    this.includeArchived.update(value => !value);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: PaginatorState): void {
    this.page.set((event.page ?? 0) + 1);
    this.limit.set(event.rows ?? 10);
    this.load();
  }

  openDriver(id: string): void {
    this.router.navigate(['/drivers', id]);
  }

  openCreate(): void {
    this.createVisible.set(true);
  }

  reload(): void {
    this.load();
  }

  initials(driver: DriverListItem): string {
    return `${driver.firstName?.[0] ?? ''}${driver.lastName?.[0] ?? ''}`.toUpperCase();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.createVisible()) return;
    if (isTypingTarget(event.target)) return;

    if (event.key === '/') {
      event.preventDefault();
      this.searchBox()?.nativeElement.focus();
    } else if (event.key === 'n' || event.key === 'N') {
      event.preventDefault();
      this.openCreate();
    }
  }
}
