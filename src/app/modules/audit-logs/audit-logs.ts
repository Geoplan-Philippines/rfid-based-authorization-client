import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { UserService } from '../users/services/user.service';
import { User } from '../users/types/user.types';
import { AuditLogService, GetAuditLogsParams } from './services/audit-log.service';
import { AuditLog } from './types/audit-log.types';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  actionSeverity,
  auditStatusTag,
  describeMetadata,
  entityMeta,
  humanizeAction,
  shortId,
} from './utils/audit-log-display';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-audit-logs',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
    ButtonModule,
    SelectModule,
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class AuditLogs implements OnInit {
  private auditLogService = inject(AuditLogService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  private pageRequest$ = new Subject<GetAuditLogsParams>();

  // Exposed to the template.
  protected readonly actionSeverity = actionSeverity;
  protected readonly auditStatusTag = auditStatusTag;
  protected readonly humanizeAction = humanizeAction;
  protected readonly entityMeta = entityMeta;
  protected readonly describeMetadata = describeMetadata;
  protected readonly shortId = shortId;

  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  limit = signal(10);

  selectedAction = signal<string | null>(null);
  selectedEntityType = signal<string | null>(null);
  selectedActorId = signal<string | null>(null);

  /** Resolves actor ids to names; empty until /users loads (id fallback meanwhile). */
  private actors = signal<Map<string, User>>(new Map());

  readonly actionOptions: SelectOption[] = AUDIT_ACTIONS.map(action => ({
    label: humanizeAction(action),
    value: action,
  }));
  readonly entityTypeOptions: SelectOption[] = AUDIT_ENTITY_TYPES.map(type => ({
    label: entityMeta(type).label,
    value: type,
  }));
  actorOptions = computed<SelectOption[]>(() =>
    [...this.actors().values()]
      .map(user => ({
        label: `${user.firstName} ${user.lastName}`.trim() || user.email,
        value: user.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );

  hasFilters = computed(() => !!(this.selectedAction() || this.selectedEntityType() || this.selectedActorId()));

  ngOnInit(): void {
    this.pageRequest$
      .pipe(
        // catchError on the inner observable so one failed load never kills the stream.
        switchMap(params => {
          this.loading.set(true);
          this.error.set(null);
          return this.auditLogService.getAuditLogs(params).pipe(
            catchError(() => {
              this.error.set('Failed to load audit logs. Please try again.');
              this.loading.set(false);
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ data, meta }) => {
        this.logs.set(data);
        this.total.set(meta.total);
        this.loading.set(false);
      });

    // Resolve actor ids to names. Non-fatal: the table falls back to short ids.
    this.userService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => this.actors.set(new Map(users.map(user => [user.id, user]))),
        error: () => {
          /* keep the short-id fallback */
        },
      });

    this.load();
  }

  private load(): void {
    this.pageRequest$.next({
      page: this.page(),
      limit: this.limit(),
      action: this.selectedAction() ?? undefined,
      entityType: this.selectedEntityType() ?? undefined,
      actorId: this.selectedActorId() ?? undefined,
    });
  }

  actor(actorId: string | null): User | null {
    if (!actorId) return null;
    return this.actors().get(actorId) ?? null;
  }

  onActionChange(value: string | null): void {
    this.selectedAction.set(value);
    this.resetToFirstPage();
  }

  onEntityTypeChange(value: string | null): void {
    this.selectedEntityType.set(value);
    this.resetToFirstPage();
  }

  onActorChange(value: string | null): void {
    this.selectedActorId.set(value);
    this.resetToFirstPage();
  }

  clearFilters(): void {
    if (!this.hasFilters()) return;
    this.selectedAction.set(null);
    this.selectedEntityType.set(null);
    this.selectedActorId.set(null);
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
}
