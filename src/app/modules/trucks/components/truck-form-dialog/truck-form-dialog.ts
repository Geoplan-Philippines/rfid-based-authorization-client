import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { NotificationService } from '../../../../core/services/notification.service';
import { resolvePhotoUrl } from '../../../../core/utils/photo-url';
import { TruckService } from '../../services/truck.service';
import { Truck, TruckDetail } from '../../types/truck.types';

type FormTruck = Pick<Truck, 'id' | 'plateNumber' | 'model' | 'photoUrl'>;

@Component({
  selector: 'app-truck-form-dialog',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule],
  templateUrl: './truck-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruckFormDialog {
  private fb = inject(FormBuilder);
  private truckService = inject(TruckService);
  private notifications = inject(NotificationService);

  visible = model(false);
  mode = input<'create' | 'edit'>('create');
  truck = input<FormTruck | TruckDetail | null>(null);

  saved = output<void>();

  saving = signal(false);
  selectedFile = signal<File | null>(null);

  form = this.fb.nonNullable.group({
    plateNumber: ['', [Validators.required]],
    model: ['', [Validators.required]],
  });

  constructor() {
    // Reset / prefill the form whenever the dialog opens.
    effect(() => {
      if (!this.visible()) return;
      this.selectedFile.set(null);
      const truck = this.truck();
      if (this.mode() === 'edit' && truck) {
        this.form.reset({ plateNumber: truck.plateNumber, model: truck.model });
      } else {
        this.form.reset({ plateNumber: '', model: '' });
      }
    });
  }

  get title(): string {
    return this.mode() === 'edit' ? 'Edit truck' : 'New truck';
  }

  existingPhotoUrl(): string | null {
    return resolvePhotoUrl(this.truck()?.photoUrl ?? null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = {
      plateNumber: this.form.controls.plateNumber.value.trim(),
      model: this.form.controls.model.value.trim(),
    };

    const request$ =
      this.mode() === 'edit' && this.truck()
        ? this.truckService.update(this.truck()!.id, payload)
        : this.truckService.create(payload);

    request$.subscribe({
      next: truck => this.afterSave(truck.id),
      error: error => {
        this.saving.set(false);
        this.notifications.fromHttpError(error, 'Failed to save truck.');
      },
    });
  }

  private afterSave(id: string): void {
    const file = this.selectedFile();
    if (!file) {
      this.finish('Truck saved.');
      return;
    }

    this.truckService.uploadPhoto(id, file).subscribe({
      next: () => this.finish('Truck saved.'),
      error: error => {
        // Entity saved, only the photo failed — surface it but treat the save as done.
        this.saving.set(false);
        this.notifications.fromHttpError(error, 'Truck saved, but the photo upload failed.');
        this.saved.emit();
        this.visible.set(false);
      },
    });
  }

  private finish(message: string): void {
    this.saving.set(false);
    this.notifications.success(message);
    this.saved.emit();
    this.visible.set(false);
  }
}
