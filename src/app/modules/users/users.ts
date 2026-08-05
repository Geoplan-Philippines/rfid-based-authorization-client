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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs';

import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { isTypingTarget } from '../../core/utils/keyboard';
import { UserService } from './services/user.service';
import {
  ListUsersParams,
  MAX_PAGE_SIZE,
  ROLES,
  Role,
  User,
  displayName,
  userInitials,
} from './types/user.types';
import { accountStatusTag, roleLabel, userRoleTag } from './utils/user-display';
import { UserFormDialog } from './components/user-form-dialog/user-form-dialog';

interface RoleFilterOption {
  label: string;
  value: Role | null;
}

/** The filter state that round-trips through the query string. */
interface ListState {
  page: number;
  limit: number;
  search: string;
  role: Role | null;
  includeArchived: boolean;
}

const DEFAULT_LIMIT = 10;
const PAGE_SIZE_OPTIONS = [10, 25, MAX_PAGE_SIZE];

function isRole(value: string | null): value is Role {
  return !!value && (ROLES as readonly string[]).includes(value);
}

function stateKey(state: ListState): string {
  return [state.page, state.limit, state.search, state.role ?? '', state.includeArchived].join('|');
}

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    AvatarModule,
    TagModule,
    ButtonModule,
    SelectModule,
    TooltipModule,
    ProgressSpinnerModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    UserFormDialog,
  ],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-1 overflow-hidden',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class Users implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private searchInput$ = new Subject<string>();
  private searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  protected readonly userRoleTag = userRoleTag;
  protected readonly accountStatusTag = accountStatusTag;
  protected readonly displayName = displayName;
  protected readonly userInitials = userInitials;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  busyId = signal<string | null>(null);

  total = signal(0);
  page = signal(1);
  limit = signal(DEFAULT_LIMIT);
  search = signal('');
  role = signal<Role | null>(null);
  includeArchived = signal(false);

  formVisible = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  editing = signal<User | null>(null);

  readonly roleOptions: RoleFilterOption[] = [
    { label: 'All roles', value: null },
    ...ROLES.map(role => ({ label: roleLabel(role), value: role })),
  ];

  currentUserId = computed(() => this.authService.currentUserId());

  hasFilters = computed(() => !!this.search() || !!this.role() || this.includeArchived());

  /** `lastPage` is 0 when nothing matches — never render "Page 1 of 0" (§6.2). */
  lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  subtitle = computed(() => {
    const total = this.total();
    const noun = total === 1 ? 'account' : 'accounts';
    return this.hasFilters() ? `${total} ${noun} match` : `${total} ${noun}`;
  });

  ngOnInit(): void {
    // The query string is the source of truth: it seeds the first load, survives a
    // refresh or a shared link, and makes browser back/forward work on filters (§9.1).
    this.route.queryParamMap
      .pipe(
        map(params => this.readState(params)),
        distinctUntilChanged((a, b) => stateKey(a) === stateKey(b)),
        tap(state => this.applyState(state)),
        switchMap(state => {
          this.loading.set(true);
          this.error.set(null);
          return this.userService.list(this.toParams(state)).pipe(
            catchError(() => {
              this.error.set('Failed to load users. Please try again.');
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ data, meta }) => {
        this.users.set(data);
        this.total.set(meta.total);
        this.loading.set(false);
      });

    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.patchQuery({ search: term || null, page: null }));
  }

  private readState(params: ParamMap): ListState {
    const page = Number(params.get('page'));
    const limit = Number(params.get('limit'));
    const role = params.get('role');

    return {
      page: Number.isInteger(page) && page >= 1 ? page : 1,
      limit: PAGE_SIZE_OPTIONS.includes(limit) ? limit : DEFAULT_LIMIT,
      search: params.get('search')?.trim() ?? '',
      role: isRole(role) ? role : null,
      includeArchived: params.get('includeArchived') === 'true',
    };
  }

  private applyState(state: ListState): void {
    this.page.set(state.page);
    this.limit.set(state.limit);
    this.search.set(state.search);
    this.role.set(state.role);
    this.includeArchived.set(state.includeArchived);
  }

  private toParams(state: ListState): ListUsersParams {
    return {
      page: state.page,
      limit: state.limit,
      search: state.search || undefined,
      role: state.role ?? undefined,
      includeArchived: state.includeArchived || undefined,
    };
  }

  /**
   * Writes filters to the URL; the subscription above turns that into a request.
   * `null` drops a param so a default never shows up in the link. `replaceUrl` keeps
   * keystrokes and page steps out of the history stack.
   */
  private patchQuery(changes: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSearchInput(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  // Any filter change resets to page 1 — otherwise a narrower result set can leave
  // you on an out-of-range page with an empty table (§9.1).
  onRoleChange(value: Role | null): void {
    this.patchQuery({ role: value, page: null });
  }

  toggleArchived(): void {
    this.patchQuery({ includeArchived: this.includeArchived() ? null : 'true', page: null });
  }

  onPageChange(event: PaginatorState): void {
    const page = (event.page ?? 0) + 1;
    const rows = event.rows ?? DEFAULT_LIMIT;
    this.patchQuery({
      page: page > 1 ? page : null,
      limit: rows === DEFAULT_LIMIT ? null : rows,
    });
  }

  clearFilters(): void {
    const box = this.searchBox()?.nativeElement;
    if (box) box.value = '';
    this.patchQuery({ search: null, role: null, includeArchived: null, page: null });
  }

  openUser(id: string): void {
    this.router.navigate(['/users', id]);
  }

  openCreate(): void {
    this.editing.set(null);
    this.formMode.set('create');
    this.formVisible.set(true);
  }

  openEdit(user: User): void {
    this.editing.set(user);
    this.formMode.set('edit');
    this.formVisible.set(true);
  }

  /** The API blocks archiving yourself; the button is disabled before it can be clicked (§8). */
  isSelf(user: User): boolean {
    return user.id === this.currentUserId();
  }

  confirmArchive(user: User): void {
    const name = displayName(user);
    this.confirmationService.confirm({
      header: 'Archive user',
      message: `Archive ${name}? They will no longer be able to sign in. You can restore this account later.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Archive',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.busyId.set(user.id);
        this.userService.archive(user.id).subscribe({
          next: () => {
            this.busyId.set(null);
            this.notifications.success(`${name} archived.`);
            this.reload();
          },
          error: error => {
            this.busyId.set(null);
            this.notifications.fromHttpError(error, 'Failed to archive user.');
          },
        });
      },
    });
  }

  confirmRestore(user: User): void {
    const name = displayName(user);
    this.confirmationService.confirm({
      header: 'Restore user',
      message: `Restore ${name}? They will be able to sign in again with their existing password.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Restore',
      rejectLabel: 'Cancel',
      accept: () => {
        this.busyId.set(user.id);
        this.userService.unarchive(user.id).subscribe({
          next: () => {
            this.busyId.set(null);
            this.notifications.success(`${name} restored.`);
            this.reload();
          },
          error: error => {
            this.busyId.set(null);
            this.notifications.fromHttpError(error, 'Failed to restore user.');
          },
        });
      },
    });
  }

  /** Re-issues the current query. The URL is unchanged, so it is requested directly. */
  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.userService
      .list(this.toParams({
        page: this.page(),
        limit: this.limit(),
        search: this.search(),
        role: this.role(),
        includeArchived: this.includeArchived(),
      }))
      .subscribe({
        next: ({ data, meta }) => {
          // Archiving the last row of a page strands you on an out-of-range page;
          // step back to the first one rather than showing an empty table.
          if (!data.length && meta.total > 0 && this.page() > 1) {
            this.patchQuery({ page: null });
            return;
          }
          this.users.set(data);
          this.total.set(meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load users. Please try again.');
          this.loading.set(false);
        },
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.formVisible()) return;
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
