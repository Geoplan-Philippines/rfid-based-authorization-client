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
import { DriverService } from '../../services/driver.service';
import { Driver, DriverDetail } from '../../types/driver.types';

type FormDriver = Pick<Driver, 'id' | 'firstName' | 'lastName' | 'licenseNumber' | 'photoUrl'>;

@Component({
  selector: 'app-driver-form-dialog',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule],
  templateUrl: './driver-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverFormDialog {
  private fb = inject(FormBuilder);
  private driverService = inject(DriverService);
  private notifications = inject(NotificationService);

  visible = model(false);
  mode = input<'create' | 'edit'>('create');
  driver = input<FormDriver | DriverDetail | null>(null);

  saved = output<void>();

  saving = signal(false);
  selectedFile = signal<File | null>(null);

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    licenseNumber: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      this.selectedFile.set(null);
      const driver = this.driver();
      if (this.mode() === 'edit' && driver) {
        this.form.reset({
          firstName: driver.firstName,
          lastName: driver.lastName,
          licenseNumber: driver.licenseNumber,
        });
      } else {
        this.form.reset({ firstName: '', lastName: '', licenseNumber: '' });
      }
    });
  }

  get title(): string {
    return this.mode() === 'edit' ? 'Edit driver' : 'New driver';
  }

  existingPhotoUrl(): string | null {
    return resolvePhotoUrl(this.driver()?.photoUrl ?? null);
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
      firstName: this.form.controls.firstName.value.trim(),
      lastName: this.form.controls.lastName.value.trim(),
      licenseNumber: this.form.controls.licenseNumber.value.trim(),
    };

    const request$ =
      this.mode() === 'edit' && this.driver()
        ? this.driverService.update(this.driver()!.id, payload)
        : this.driverService.create(payload);

    request$.subscribe({
      next: driver => this.afterSave(driver.id),
      error: error => {
        this.saving.set(false);
        this.notifications.fromHttpError(error, 'Failed to save driver.');
      },
    });
  }

  private afterSave(id: string): void {
    const file = this.selectedFile();
    if (!file) {
      this.finish('Driver saved.');
      return;
    }

    this.driverService.uploadPhoto(id, file).subscribe({
      next: () => this.finish('Driver saved.'),
      error: error => {
        this.saving.set(false);
        this.notifications.fromHttpError(error, 'Driver saved, but the photo upload failed.');
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
