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
import { Observable, map } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

import { NotificationService } from '../../../../core/services/notification.service';
import { AssignmentService } from '../../../../core/services/assignment.service';
import { resolvePhotoUrl } from '../../../../core/utils/photo-url';
import {
  AssignmentRole,
  assignmentRoleTag,
  gateResultTag,
  rfidTagStatusTag,
} from '../../../../shared/ui/status-tags';
import {
  AssignCandidate,
  AssignPicker,
  AssignedEntry,
} from '../../../../shared/components/assign-picker/assign-picker';
import { TruckService } from '../../../trucks/services/truck.service';
import { DriverService } from '../../services/driver.service';
import { DriverDetail } from '../../types/driver.types';
import { DriverFormDialog } from '../driver-form-dialog/driver-form-dialog';

@Component({
  selector: 'app-driver-detail-dialog',
  imports: [
    DatePipe,
    DialogModule,
    ButtonModule,
    TagModule,
    AvatarModule,
    ProgressSpinnerModule,
    AssignPicker,
    DriverFormDialog,
  ],
  templateUrl: './driver-detail-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverDetailDialog {
  private driverService = inject(DriverService);
  private truckService = inject(TruckService);
  private assignmentService = inject(AssignmentService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

  protected readonly resolvePhotoUrl = resolvePhotoUrl;
  protected readonly rfidTagStatusTag = rfidTagStatusTag;
  protected readonly gateResultTag = gateResultTag;
  protected readonly assignmentRoleTag = assignmentRoleTag;

  driverId = input<string | null>(null);
  visible = model(false);
  changed = output<void>();

  detail = signal<DriverDetail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  busy = signal(false);

  editVisible = signal(false);
  assignVisible = signal(false);

  fullName = computed(() => {
    const driver = this.detail();
    return driver ? `${driver.firstName} ${driver.lastName}` : 'Driver';
  });

  assignedTrucks = computed<AssignedEntry[]>(() =>
    (this.detail()?.trucks ?? []).map(truck => ({
      id: truck.id,
      label: truck.plateNumber,
      sublabel: truck.model,
      role: truck.role,
      imageUrl: null,
    })),
  );

  constructor() {
    effect(() => {
      const id = this.driverId();
      if (this.visible() && id) this.load(id);
    });
  }

  /** Passed to the assign picker — fetches truck candidates by search. */
  truckCandidates = (search: string): Observable<AssignCandidate[]> =>
    this.truckService.getTrucks({ page: 1, limit: 25, search: search || undefined }).pipe(
      map(result =>
        result.data.map(truck => ({
          id: truck.id,
          label: truck.plateNumber,
          sublabel: truck.model,
          imageUrl: resolvePhotoUrl(truck.photoUrl),
          badge: truck.boundTag ? rfidTagStatusTag(truck.boundTag.status) : null,
        })),
      ),
    );

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.driverService.getDriver(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load driver. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private reload(): void {
    const id = this.driverId();
    if (id) this.load(id);
  }

  openEdit(): void {
    this.editVisible.set(true);
  }

  onEdited(): void {
    this.reload();
    this.changed.emit();
  }

  openAssign(): void {
    this.assignVisible.set(true);
  }

  onAssign(event: { id: string; role: AssignmentRole }): void {
    const driverId = this.driverId();
    if (!driverId) return;
    this.busy.set(true);
    this.assignmentService.assign(event.id, driverId, event.role).subscribe({
      next: () => {
        this.busy.set(false);
        this.notifications.success('Truck assigned.');
        this.reload();
        this.changed.emit();
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to assign truck.');
      },
    });
  }

  onUnassign(entry: AssignedEntry): void {
    const driverId = this.driverId();
    if (!driverId) return;
    this.confirmationService.confirm({
      header: 'Unassign truck',
      message: `Remove ${entry.label} from this driver?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Unassign',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.busy.set(true);
        this.assignmentService.unassign(entry.id, driverId).subscribe({
          next: () => {
            this.busy.set(false);
            this.notifications.success('Truck unassigned.');
            this.reload();
            this.changed.emit();
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to unassign truck.');
          },
        });
      },
    });
  }

  confirmArchive(): void {
    const detail = this.detail();
    if (!detail) return;
    this.confirmationService.confirm({
      header: 'Archive driver',
      message: `Archive ${detail.firstName} ${detail.lastName}? They will be hidden from the list.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Archive',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.busy.set(true);
        this.driverService.archive(detail.id).subscribe({
          next: () => {
            this.busy.set(false);
            this.notifications.success('Driver archived.');
            this.changed.emit();
            this.visible.set(false);
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to archive driver.');
          },
        });
      },
    });
  }
}
