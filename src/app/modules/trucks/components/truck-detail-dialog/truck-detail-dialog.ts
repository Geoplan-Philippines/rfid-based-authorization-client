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
import { DriverService } from '../../../drivers/services/driver.service';
import { TruckService } from '../../services/truck.service';
import { TruckDetail } from '../../types/truck.types';
import { TruckFormDialog } from '../truck-form-dialog/truck-form-dialog';

@Component({
  selector: 'app-truck-detail-dialog',
  imports: [
    DatePipe,
    DialogModule,
    ButtonModule,
    TagModule,
    AvatarModule,
    ProgressSpinnerModule,
    AssignPicker,
    TruckFormDialog,
  ],
  templateUrl: './truck-detail-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruckDetailDialog {
  private truckService = inject(TruckService);
  private driverService = inject(DriverService);
  private assignmentService = inject(AssignmentService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

  protected readonly resolvePhotoUrl = resolvePhotoUrl;
  protected readonly rfidTagStatusTag = rfidTagStatusTag;
  protected readonly gateResultTag = gateResultTag;
  protected readonly assignmentRoleTag = assignmentRoleTag;

  truckId = input<string | null>(null);
  visible = model(false);
  changed = output<void>();

  detail = signal<TruckDetail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  busy = signal(false);

  editVisible = signal(false);
  assignVisible = signal(false);

  assignedDrivers = computed<AssignedEntry[]>(() =>
    (this.detail()?.drivers ?? []).map(driver => ({
      id: driver.id,
      label: driver.name,
      sublabel: driver.licenseNumber,
      role: driver.role,
      imageUrl: resolvePhotoUrl(driver.photoUrl),
    })),
  );

  constructor() {
    effect(() => {
      const id = this.truckId();
      if (this.visible() && id) this.load(id);
    });
  }

  /** Passed to the assign picker — fetches driver candidates by search. */
  driverCandidates = (search: string): Observable<AssignCandidate[]> =>
    this.driverService.getDrivers({ page: 1, limit: 25, search: search || undefined }).pipe(
      map(result =>
        result.data.map(driver => ({
          id: driver.id,
          label: `${driver.firstName} ${driver.lastName}`,
          sublabel: driver.licenseNumber,
          imageUrl: resolvePhotoUrl(driver.photoUrl),
        })),
      ),
    );

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.truckService.getTruck(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load truck. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private reload(): void {
    const id = this.truckId();
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
    const truckId = this.truckId();
    if (!truckId) return;
    this.busy.set(true);
    this.assignmentService.assign(truckId, event.id, event.role).subscribe({
      next: () => {
        this.busy.set(false);
        this.notifications.success('Driver assigned.');
        this.reload();
        this.changed.emit();
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to assign driver.');
      },
    });
  }

  onUnassign(entry: AssignedEntry): void {
    const truckId = this.truckId();
    if (!truckId) return;
    this.confirmationService.confirm({
      header: 'Unassign driver',
      message: `Remove ${entry.label} from this truck?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Unassign',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.busy.set(true);
        this.assignmentService.unassign(truckId, entry.id).subscribe({
          next: () => {
            this.busy.set(false);
            this.notifications.success('Driver unassigned.');
            this.reload();
            this.changed.emit();
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to unassign driver.');
          },
        });
      },
    });
  }

  confirmArchive(): void {
    const detail = this.detail();
    if (!detail) return;
    this.confirmationService.confirm({
      header: 'Archive truck',
      message: `Archive ${detail.plateNumber}? It will be hidden from the list.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Archive',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.busy.set(true);
        this.truckService.archive(detail.id).subscribe({
          next: () => {
            this.busy.set(false);
            this.notifications.success('Truck archived.');
            this.changed.emit();
            this.visible.set(false);
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to archive truck.');
          },
        });
      },
    });
  }
}
