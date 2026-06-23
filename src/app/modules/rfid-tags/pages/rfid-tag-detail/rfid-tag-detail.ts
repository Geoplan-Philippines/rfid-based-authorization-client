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
import { FormsModule } from '@angular/forms';
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
import { RfidTagStatus, gateResultTag, rfidTagStatusTag } from '../../../../shared/ui/status-tags';
import { TruckService } from '../../../trucks/services/truck.service';
import { RfidTagService } from '../../services/rfid-tags.service';
import { RfidTagDetail as RfidTagDetailModel } from '../../types/rfid-tags.types';

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
  selector: 'app-rfid-tag-detail',
  imports: [
    DatePipe,
    RouterLink,
    FormsModule,
    DialogModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './rfid-tag-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class RfidTagDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private rfidTagService = inject(RfidTagService);
  private truckService = inject(TruckService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  protected readonly rfidTagStatusTag = rfidTagStatusTag;
  protected readonly gateResultTag = gateResultTag;

  private id = signal<string | null>(null);

  detail = signal<RfidTagDetailModel | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  notFound = signal(false);
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
    this.rfidTagService.getTag(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('Failed to load RFID tag. Please try again.');
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
    const id = this.id();
    if (!id) return;
    this.busy.set(true);
    this.rfidTagService.updateStatus(id, status, this.reason().trim() || undefined).subscribe({
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

  openRebind(): void {
    this.rebindTruckId.set(null);
    this.rebindVisible.set(true);
    this.loadingTrucks.set(true);
    const currentTruckId = this.detail()?.assignedTruck?.id;
    this.truckService.getUntaggedTrucks().subscribe({
      next: trucks => {
        this.rebindOptions.set(
          trucks
            .filter(truck => truck.id !== currentTruckId)
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
    const id = this.id();
    const truckId = this.rebindTruckId();
    if (!id || !truckId) return;
    this.busy.set(true);
    this.rfidTagService.rebind(id, truckId).subscribe({
      next: detail => {
        this.busy.set(false);
        this.detail.set(detail);
        this.rebindVisible.set(false);
        this.notifications.success('Tag re-bound to new truck.');
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to re-bind tag.');
      },
    });
  }
}
