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
import { TruckService } from '../../../trucks/services/truck.service';
import { DriverService } from '../../services/driver.service';
import { DriverDetail as DriverDetailModel } from '../../types/driver.types';
import { DriverFormDialog } from '../../components/driver-form-dialog/driver-form-dialog';

@Component({
  selector: 'app-driver-detail',
  imports: [
    DatePipe,
    RouterLink,
    ButtonModule,
    TagModule,
    AvatarModule,
    ProgressSpinnerModule,
    AssignPicker,
    DriverFormDialog,
  ],
  templateUrl: './driver-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class DriverDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private driverService = inject(DriverService);
  private truckService = inject(TruckService);
  private assignmentService = inject(AssignmentService);
  private notifications = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  protected readonly resolvePhotoUrl = resolvePhotoUrl;
  protected readonly rfidTagStatusTag = rfidTagStatusTag;
  protected readonly gateResultTag = gateResultTag;
  protected readonly assignmentRoleTag = assignmentRoleTag;

  private id = signal<string | null>(null);

  detail = signal<DriverDetailModel | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  notFound = signal(false);
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
    this.notFound.set(false);
    this.driverService.getDriver(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('Failed to load driver. Please try again.');
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
    const driverId = this.id();
    if (!driverId) return;
    this.busy.set(true);
    this.assignmentService.assign(event.id, driverId, event.role).subscribe({
      next: () => {
        this.busy.set(false);
        this.notifications.success('Truck assigned.');
        this.reload();
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to assign truck.');
      },
    });
  }

  onUnassign(entry: AssignedEntry): void {
    const driverId = this.id();
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
            this.reload();
          },
          error: error => {
            this.busy.set(false);
            this.notifications.fromHttpError(error, 'Failed to archive driver.');
          },
        });
      },
    });
  }

  confirmRestore(): void {
    const detail = this.detail();
    if (!detail) return;
    this.busy.set(true);
    this.driverService.restore(detail.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.notifications.success('Driver restored.');
        this.reload();
      },
      error: error => {
        this.busy.set(false);
        this.notifications.fromHttpError(error, 'Failed to restore driver.');
      },
    });
  }
}
