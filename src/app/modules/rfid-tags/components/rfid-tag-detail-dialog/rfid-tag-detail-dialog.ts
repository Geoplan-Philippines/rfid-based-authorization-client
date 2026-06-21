import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

import { NotificationService } from '../../../../core/services/notification.service';
import { RfidTagStatus, gateResultTag, rfidTagStatusTag } from '../../../../shared/ui/status-tags';
import { TruckService } from '../../../trucks/services/truck.service';
import { RfidTagService } from '../../services/rfid-tags.service';
import { RfidTagDetail } from '../../types/rfid-tags.types';

interface StatusAction {
  status: RfidTagStatus;
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
  { status: 'LOST', label: 'Mark lost', icon: 'pi pi-question-circle', destructive: false },
  { status: 'BLOCKED', label: 'Block', icon: 'pi pi-ban', destructive: true },
  { status: 'RETIRED', label: 'Permanent retire', icon: 'pi pi-trash', destructive: true },
];

@Component({
  selector: 'app-rfid-tag-detail-dialog',
  imports: [
    DatePipe,
    FormsModule,
    DialogModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './rfid-tag-detail-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfidTagDetailDialog {
  private rfidTagService = inject(RfidTagService);
  private truckService = inject(TruckService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

  protected readonly rfidTagStatusTag = rfidTagStatusTag;
  protected readonly gateResultTag = gateResultTag;

  tagId = input<string | null>(null);
  visible = model(false);
  changed = output<void>();

  detail = signal<RfidTagDetail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  busy = signal(false);
  reason = signal('');

  rebindVisible = signal(false);
  rebindTruckId = signal<string | null>(null);
  loadingTrucks = signal(false);
  rebindOptions = signal<SelectOption<string>[]>([]);

  availableActions = computed<StatusAction[]>(() => {
    const current = this.detail()?.status;
    return STATUS_ACTIONS.filter(action => action.status !== current);
  });

  constructor() {
    effect(() => {
      const id = this.tagId();
      if (this.visible() && id) this.load(id);
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.reason.set('');
    this.rfidTagService.getTag(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load RFID tag. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private reload(): void {
    const id = this.tagId();
    if (id) this.load(id);
  }

  onReasonInput(event: Event): void {
    this.reason.set((event.target as HTMLInputElement).value);
  }

  changeStatus(action: StatusAction): void {
    if (action.destructive) {
      this.confirmationService.confirm({
        header: action.label,
        message: `Change tag status to ${rfidTagStatusTag(action.status).label}?`,
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

  private applyStatus(status: RfidTagStatus): void {
    const id = this.tagId();
    if (!id) return;
    this.busy.set(true);
    this.rfidTagService.updateStatus(id, status, this.reason().trim() || undefined).subscribe({
      next: detail => {
        this.busy.set(false);
        this.detail.set(detail);
        this.reason.set('');
        this.notifications.success('Tag status updated.');
        this.changed.emit();
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to update status.');
      },
    });
  }

  openRebind(): void {
    this.rebindTruckId.set(null);
    this.rebindVisible.set(true);
    this.loadingTrucks.set(true);
    const currentTruckId = this.detail()?.assignedTruck?.id;
    this.truckService.getTrucks({ page: 1, limit: 100 }).subscribe({
      next: result => {
        this.rebindOptions.set(
          result.data
            .filter(truck => !truck.boundTag && truck.id !== currentTruckId)
            .map(truck => ({ label: `${truck.plateNumber} · ${truck.model}`, value: truck.id })),
        );
        this.loadingTrucks.set(false);
      },
      error: () => {
        this.rebindOptions.set([]);
        this.loadingTrucks.set(false);
      },
    });
  }

  confirmRebind(): void {
    const id = this.tagId();
    const truckId = this.rebindTruckId();
    if (!id || !truckId) return;
    this.busy.set(true);
    this.rfidTagService.rebind(id, truckId).subscribe({
      next: detail => {
        this.busy.set(false);
        this.detail.set(detail);
        this.rebindVisible.set(false);
        this.notifications.success('Tag re-bound to new truck.');
        this.changed.emit();
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to re-bind tag.');
      },
    });
  }
}
