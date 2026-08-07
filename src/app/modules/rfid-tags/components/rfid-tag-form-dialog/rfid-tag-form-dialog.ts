import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { NotificationService } from '../../../../core/services/notification.service';
import { RfidTagStatus, rfidTagStatusTag } from '../../../../shared/ui/status-tags';
import { truckLabel } from '../../../../shared/utils/truck-label';
import { TruckService } from '../../../trucks/services/truck.service';
import { RfidTagService } from '../../services/rfid-tags.service';

interface SelectOption<T> {
  label: string;
  value: T;
}

interface TruckOption extends SelectOption<string> {
  plateNumber: string;
  model: string | null;
}

@Component({
  selector: 'app-rfid-tag-form-dialog',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, TagModule],
  templateUrl: './rfid-tag-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfidTagFormDialog {
  private fb = inject(FormBuilder);
  private rfidTagService = inject(RfidTagService);
  private truckService = inject(TruckService);
  private notifications = inject(NotificationService);

  protected readonly rfidTagStatusTag = rfidTagStatusTag;

  visible = model(false);
  saved = output<void>();

  saving = signal(false);
  loadingTrucks = signal(false);
  truckOptions = signal<TruckOption[]>([]);

  readonly statusOptions: SelectOption<RfidTagStatus>[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Lost', value: 'LOST' },
    { label: 'Blocked', value: 'BLOCKED' },
  ];

  // Only the EPC is mandatory: a tag may be registered as unbound spare stock and bound to a
  // truck later, and not every physical tag carries a printed serial number.
  form = this.fb.nonNullable.group({
    epcId: ['', [Validators.required, Validators.maxLength(64)]],
    serialNo: ['', [Validators.maxLength(64)]],
    assignedTruckId: [''],
    status: ['ACTIVE' as RfidTagStatus, [Validators.required]],
  });

  /**
   * Reset and (re)load on the dialog's own show event rather than reacting to the
   * `visible` signal. The select panels render with `appendTo="body"`, so reacting
   * to `visible` is fragile: any stray toggle would wipe a half-filled form.
   */
  onShow(): void {
    this.form.reset({ epcId: '', serialNo: '', assignedTruckId: '', status: 'ACTIVE' });
    this.loadAvailableTrucks();
  }

  private loadAvailableTrucks(): void {
    this.loadingTrucks.set(true);
    this.truckService.getUntaggedTrucks().subscribe({
      next: trucks => {
        this.truckOptions.set(
          trucks.map(truck => ({
            label: truckLabel(truck.plateNumber, truck.model),
            value: truck.id,
            plateNumber: truck.plateNumber,
            model: truck.model,
          })),
        );
        this.loadingTrucks.set(false);
      },
      error: error => {
        this.truckOptions.set([]);
        this.loadingTrucks.set(false);
        this.notifications.fromHttpError(error, 'Failed to load available trucks.');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    // Omit the blank optionals rather than sending '' — the API rejects empty strings here.
    const serialNo = this.form.controls.serialNo.value.trim();
    const assignedTruckId = this.form.controls.assignedTruckId.value;

    this.rfidTagService
      .create({
        epcId: this.form.controls.epcId.value.trim().toUpperCase(),
        ...(serialNo ? { serialNo } : {}),
        ...(assignedTruckId ? { assignedTruckId } : {}),
        status: this.form.controls.status.value,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('RFID tag registered.');
          this.saved.emit();
          this.visible.set(false);
        },
        error: error => {
          this.saving.set(false);
          this.notifications.fromHttpError(error, 'Failed to register RFID tag.');
        },
      });
  }
}
