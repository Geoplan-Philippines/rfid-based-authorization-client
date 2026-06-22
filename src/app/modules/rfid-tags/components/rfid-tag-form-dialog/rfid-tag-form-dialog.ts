import {
  ChangeDetectionStrategy,
  Component,
  effect,
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

import { NotificationService } from '../../../../core/services/notification.service';
import { RfidTagStatus } from '../../../../shared/ui/status-tags';
import { TruckService } from '../../../trucks/services/truck.service';
import { RfidTagService } from '../../services/rfid-tags.service';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-rfid-tag-form-dialog',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './rfid-tag-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfidTagFormDialog {
  private fb = inject(FormBuilder);
  private rfidTagService = inject(RfidTagService);
  private truckService = inject(TruckService);
  private notifications = inject(NotificationService);

  visible = model(false);
  saved = output<void>();

  saving = signal(false);
  loadingTrucks = signal(false);
  truckOptions = signal<SelectOption<string>[]>([]);

  readonly statusOptions: SelectOption<RfidTagStatus>[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Lost', value: 'LOST' },
    { label: 'Blocked', value: 'BLOCKED' },
  ];

  form = this.fb.nonNullable.group({
    epcId: ['', [Validators.required, Validators.maxLength(64)]],
    assignedTruckId: ['', [Validators.required]],
    status: ['ACTIVE' as RfidTagStatus, [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      this.form.reset({ epcId: '', assignedTruckId: '', status: 'ACTIVE' });
      this.loadAvailableTrucks();
    });
  }

  private loadAvailableTrucks(): void {
    this.loadingTrucks.set(true);
    this.truckService.getUntaggedTrucks().subscribe({
      next: trucks => {
        this.truckOptions.set(
          trucks.map(truck => ({ label: `${truck.plateNumber} · ${truck.model}`, value: truck.id })),
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
    this.rfidTagService
      .create({
        epcId: this.form.controls.epcId.value.trim(),
        assignedTruckId: this.form.controls.assignedTruckId.value,
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
