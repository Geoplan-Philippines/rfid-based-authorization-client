import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditLogService } from '../../../audit-logs/services/audit-log.service';
import { shortId } from '../../../audit-logs/utils/audit-log-display';
import { UserService } from '../../services/user.service';
import { MAX_PAGE_SIZE, User, displayName, userInitials } from '../../types/user.types';
import { accountStatusTag, userRoleTag } from '../../utils/user-display';
import { ActivityEntry, toActivityEntry } from '../../utils/user-activity';
import { UserFormDialog } from '../../components/user-form-dialog/user-form-dialog';

const ACTIVITY_PAGE_SIZE = 10;

@Component({
  selector: 'app-user-detail',
  imports: [
    DatePipe,
    RouterLink,
    ButtonModule,
    TagModule,
    AvatarModule,
    ProgressSpinnerModule,
    UserFormDialog,
  ],
  templateUrl: './user-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class UserDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private auditLogService = inject(AuditLogService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  protected readonly userRoleTag = userRoleTag;
  protected readonly accountStatusTag = accountStatusTag;
  protected readonly displayName = displayName;
  protected readonly userInitials = userInitials;
  protected readonly shortId = shortId;

  private id = signal<string | null>(null);

  user = signal<User | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  notFound = signal(false);
  busy = signal(false);

  editVisible = signal(false);

  activity = signal<ActivityEntry[]>([]);
  activityLoading = signal(true);
  activityTotal = signal(0);
  private activityPage = signal(1);

  /** Resolves actor ids to names. Safe here: this screen is already SUPER_ADMIN-only (§10). */
  private actors = signal<Map<string, User>>(new Map());

  isSelf = computed(() => {
    const target = this.user();
    return !!target && target.id === this.authService.currentUserId();
  });

  hasMoreActivity = computed(() => this.activity().length < this.activityTotal());

  ngOnInit(): void {
    // Actor names are the same set whichever account is open — fetched once, not per id.
    this.loadActors();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      this.id.set(id);
      if (id) {
        this.load(id);
      } else {
        this.loading.set(false);
        this.notFound.set(true);
      }
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    this.userService.getById(id).subscribe({
      next: user => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set(this.notifications.messageFromHttpError(err, 'Failed to load this account.'));
        }
      },
    });

    this.activityPage.set(1);
    this.activity.set([]);
    this.loadActivity(id, 1);
  }

  private loadActivity(id: string, page: number): void {
    this.activityLoading.set(true);
    this.auditLogService
      .getAuditLogs({ page, limit: ACTIVITY_PAGE_SIZE, entityType: 'User', entityId: id })
      .subscribe({
        next: ({ data, meta }) => {
          const entries = data.map(toActivityEntry);
          this.activity.update(current => (page === 1 ? entries : [...current, ...entries]));
          this.activityTotal.set(meta.total);
          this.activityLoading.set(false);
        },
        error: () => {
          // Non-fatal: the account itself still renders without its history.
          this.activityLoading.set(false);
        },
      });
  }

  loadMoreActivity(): void {
    const id = this.id();
    if (!id || this.activityLoading()) return;
    const next = this.activityPage() + 1;
    this.activityPage.set(next);
    this.loadActivity(id, next);
  }

  private loadActors(): void {
    this.userService
      .list({ page: 1, limit: MAX_PAGE_SIZE, includeArchived: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => this.actors.set(new Map(data.map(user => [user.id, user]))),
        error: () => {
          /* keep the short-id fallback */
        },
      });
  }

  /** An actor beyond the first page of accounts falls back to a short id. */
  actorName(actorId: string | null): string {
    if (!actorId) return 'System';
    const actor = this.actors().get(actorId);
    return actor ? displayName(actor) : shortId(actorId);
  }

  private reload(): void {
    const id = this.id();
    if (id) this.load(id);
  }

  openEdit(): void {
    this.editVisible.set(true);
  }

  onSaved(): void {
    this.reload();
  }

  confirmArchive(): void {
    const target = this.user();
    if (!target) return;
    const name = displayName(target);

    this.confirmationService.confirm({
      header: 'Archive user',
      message: `Archive ${name}? They will no longer be able to sign in. You can restore this account later.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Archive',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.busy.set(true);
        this.userService.archive(target.id).subscribe({
          next: () => {
            this.busy.set(false);
            this.notifications.success(`${name} archived.`);
            this.reload();
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to archive user.');
          },
        });
      },
    });
  }

  confirmRestore(): void {
    const target = this.user();
    if (!target) return;
    const name = displayName(target);

    this.confirmationService.confirm({
      header: 'Restore user',
      message: `Restore ${name}? They will be able to sign in again with their existing password.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Restore',
      rejectLabel: 'Cancel',
      accept: () => {
        this.busy.set(true);
        this.userService.unarchive(target.id).subscribe({
          next: () => {
            this.busy.set(false);
            this.notifications.success(`${name} restored.`);
            this.reload();
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to restore user.');
          },
        });
      },
    });
  }
}
