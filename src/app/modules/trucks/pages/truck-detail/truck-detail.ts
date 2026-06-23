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
import { Observable, map } from 'rxjs';

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
import { TruckDetail as TruckDetailModel } from '../../types/truck.types';
import { TruckFormDialog } from '../../components/truck-form-dialog/truck-form-dialog';

@Component({
  selector: 'app-truck-detail',
  imports: [
    DatePipe,
    RouterLink,
    ButtonModule,
    TagModule,
    AvatarModule,
    ProgressSpinnerModule,
    AssignPicker,
    TruckFormDialog,
  ],
  templateUrl: './truck-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class TruckDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private truckService = inject(TruckService);
  private driverService = inject(DriverService);
  private assignmentService = inject(AssignmentService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  protected readonly resolvePhotoUrl = resolvePhotoUrl;
  protected readonly rfidTagStatusTag = rfidTagStatusTag;
  protected readonly gateResultTag = gateResultTag;
  protected readonly assignmentRoleTag = assignmentRoleTag;

  private id = signal<string | null>(null);

  detail = signal<TruckDetailModel | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  notFound = signal(false);
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
    this.notFound.set(false);
    this.truckService.getTruck(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('Failed to load truck. Please try again.');
        }
      },
    });
  }

  private reload(): void {
    const id = this.id();
    if (id) this.load(id);
  }

  openEdit(): void {
    this.editVisible.set(true);
  }

  onEdited(): void {
    this.reload();
  }

  openAssign(): void {
    this.assignVisible.set(true);
  }

  onAssign(event: { id: string; role: AssignmentRole }): void {
    const truckId = this.id();
    if (!truckId) return;
    this.busy.set(true);
    this.assignmentService.assign(truckId, event.id, event.role).subscribe({
      next: () => {
        this.busy.set(false);
        this.notifications.success('Driver assigned.');
        this.reload();
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to assign driver.');
      },
    });
  }

  onUnassign(entry: AssignedEntry): void {
    const truckId = this.id();
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
            this.reload();
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to archive truck.');
          },
        });
      },
    });
  }

  confirmRestore(): void {
    const detail = this.detail();
    if (!detail) return;
    this.confirmationService.confirm({
      header: 'Restore truck',
      message: `Restore ${detail.plateNumber}? It will reappear in the list.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Restore',
      rejectLabel: 'Cancel',
      accept: () => {
        this.busy.set(true);
        this.truckService.restore(detail.id).subscribe({
          next: () => {
            this.busy.set(false);
            this.notifications.success('Truck restored.');
            this.reload();
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to restore truck.');
          },
        });
      },
    });
  }
}
