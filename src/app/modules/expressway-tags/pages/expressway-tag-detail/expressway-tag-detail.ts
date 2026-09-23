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
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

import { NotificationService } from '../../../../core/services/notification.service';
import { ExpresswayTagStatus, expresswayTagStatusTag } from '../../../../shared/ui/status-tags';
import { truckLabel } from '../../../../shared/utils/truck-label';
import { TruckService } from '../../../trucks/services/truck.service';
import { ExpresswayTagsService } from '../../services/expressway-tags.service';
import { ExpresswayTagDetail as ExpresswayTagDetailModel } from '../../types/expressway-tags.types';

interface StatusAction {
  status: ExpresswayTagStatus;
  label: string;
  icon: string;
  destructive: boolean;
}

interface SelectOption<T> {
  label: string;
  value: T;
}

const STATUS_ACTIONS: StatusAction[] = [
  { status: 'ACTIVE', label: 'Re-activate', icon: 'pi pi-check-circle', destructive: false },
  { status: 'INACTIVE', label: 'Set inactive', icon: 'pi pi-pause', destructive: false },
  { status: 'BLOCKED', label: 'Block', icon: 'pi pi-ban', destructive: true },
];

@Component({
  selector: 'app-expressway-tag-detail',
  imports: [
    DatePipe,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './expressway-tag-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class ExpresswayTagDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private tagsService = inject(ExpresswayTagsService);
  private truckService = inject(TruckService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly expresswayTagStatusTag = expresswayTagStatusTag;
  protected readonly truckLabel = truckLabel;

  private id = signal<string | null>(null);

  detail = signal<ExpresswayTagDetailModel | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  notFound = signal(false);
  busy = signal(false);
  reason = signal('');

  editVisible = signal(false);
  loadingTrucks = signal(false);
  truckOptions = signal<SelectOption<string>[]>([]);

  form = this.fb.nonNullable.group({
    label: ['', [Validators.maxLength(128)]],
    assignedTruckId: [''],
  });

  availableActions = computed<StatusAction[]>(() => {
    const current = this.detail()?.status;
    return STATUS_ACTIONS.filter(action => action.status !== current);
  });

  ngOnInit(): void {
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
    this.reason.set('');
    this.tagsService.getTag(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('Failed to load expressway tag. Please try again.');
        }
      },
    });
  }

  onReasonInput(event: Event): void {
    this.reason.set((event.target as HTMLInputElement).value);
  }

  changeStatus(action: StatusAction): void {
    if (action.destructive) {
      this.confirmationService.confirm({
        header: action.label,
        message: `Change tag status to ${expresswayTagStatusTag(action.status).label}?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: action.label,
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => this.applyStatus(action.status),
      });
    } else {
      this.applyStatus(action.status);
    }
  }

  private applyStatus(status: ExpresswayTagStatus): void {
    const id = this.id();
    if (!id) return;
    this.busy.set(true);
    this.tagsService.updateStatus(id, status, this.reason().trim() || undefined).subscribe({
      next: detail => {
        this.busy.set(false);
        this.detail.set(detail);
        this.reason.set('');
        this.notifications.success('Tag status updated.');
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to update status.');
      },
    });
  }

  openEdit(): void {
    const tag = this.detail();
    if (!tag) return;
    this.form.reset({
      label: tag.label || '',
      assignedTruckId: tag.truck?.id || '',
    });
    this.editVisible.set(true);
    this.loadingTrucks.set(true);
    const currentTruckId = tag.truck?.id;
    this.truckService.getUntaggedTrucks().subscribe({
      next: trucks => {
        const options = trucks
          .filter(truck => truck.id !== currentTruckId)
          .map(truck => ({ label: truckLabel(truck.plateNumber, truck.model), value: truck.id }));
        if (tag.truck) {
           options.unshift({ label: truckLabel(tag.truck.plateNumber, tag.truck.model), value: tag.truck.id });
        }
        this.truckOptions.set(options);
        this.loadingTrucks.set(false);
      },
      error: () => {
        this.truckOptions.set([]);
        this.loadingTrucks.set(false);
      },
    });
  }

  confirmEdit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.id();
    if (!id) return;

    this.busy.set(true);
    const label = this.form.controls.label.value.trim();
    const assignedTruckId = this.form.controls.assignedTruckId.value;

    this.tagsService.update(id, {
      ...(label !== undefined ? { label: label || undefined } : {}),
      truckId: assignedTruckId || undefined,
    }).subscribe({
      next: detail => {
        this.busy.set(false);
        this.detail.set(detail);
        this.editVisible.set(false);
        this.notifications.success('Tag updated.');
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to update tag.');
      },
    });
  }
}
