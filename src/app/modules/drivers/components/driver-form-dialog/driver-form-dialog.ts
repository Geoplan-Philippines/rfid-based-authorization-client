import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { NotificationService } from '../../../../core/services/notification.service';
import { DriverService } from '../../services/driver.service';
import { Driver, DriverDetail } from '../../types/driver.types';

type FormDriver = Pick<Driver, 'id' | 'firstName' | 'lastName' | 'licenseNumber' | 'photoUrl'>;
const DRIVER_ID_PATTERN = /^DRV-(?!00000)\d{5}$/;
type FacePhotoAngle = 'FRONT' | 'DOWN' | 'LEFT' | 'RIGHT';

interface FacePhotoRequirement {
  readonly angle: FacePhotoAngle;
  readonly label: string;
  readonly instruction: string;
  readonly icon: string;
}

const FACE_PHOTO_REQUIREMENTS = [
  {
    angle: 'FRONT',
    label: 'Front view',
    instruction: 'Face the camera directly with eyes open.',
    icon: 'pi-user',
  },
  {
    angle: 'DOWN',
    label: 'Looking down',
    instruction: 'Lower the chin and look slightly down.',
    icon: 'pi-arrow-down',
  },
  {
    angle: 'LEFT',
    label: 'Turned left',
    instruction: "Turn the driver's head slightly to the left.",
    icon: 'pi-arrow-left',
  },
  {
    angle: 'RIGHT',
    label: 'Turned right',
    instruction: "Turn the driver's head slightly to the right.",
    icon: 'pi-arrow-right',
  },
] as const satisfies readonly FacePhotoRequirement[];

function emptyFacePhotoRecord<T>(value: T): Record<FacePhotoAngle, T> {
  return { FRONT: value, DOWN: value, LEFT: value, RIGHT: value };
}

@Component({
  selector: 'app-driver-form-dialog',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule],
  templateUrl: './driver-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly driverService = inject(DriverService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = model(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly driver = input<FormDriver | DriverDetail | null>(null);

  readonly saved = output<void>();
  readonly saving = signal(false);

  readonly facePhotoRequirements = FACE_PHOTO_REQUIREMENTS;
  readonly facePhotosTouched = signal(false);
  readonly facePhotoFiles = signal<Record<FacePhotoAngle, File | null>>(
    emptyFacePhotoRecord<File | null>(null),
  );
  readonly facePhotoPreviews = signal<Record<FacePhotoAngle, string | null>>(
    emptyFacePhotoRecord<string | null>(null),
  );
  readonly selectedFacePhotoCount = computed(() =>
    FACE_PHOTO_REQUIREMENTS.filter(photo => this.facePhotoFiles()[photo.angle] !== null).length,
  );
  readonly missingFacePhotoCount = computed(
    () => FACE_PHOTO_REQUIREMENTS.length - this.selectedFacePhotoCount(),
  );
  readonly facePhotosComplete = computed(() => this.missingFacePhotoCount() === 0);

  private readonly facePhotoInputs = viewChildren<ElementRef<HTMLInputElement>>('facePhotoInput');

  readonly form = this.fb.nonNullable.group({
    driverId: ['', [Validators.required, Validators.pattern(DRIVER_ID_PATTERN)]],
    firstName: ['', [Validators.required, Validators.pattern(/\S/)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/)]],
    licenseNumber: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;

      const driver = this.driver();
      const mode = this.mode();
      untracked(() => this.resetFacePhotos());

      if (mode === 'edit' && driver) {
        this.form.controls.driverId.disable({ emitEvent: false });
        this.form.reset({
          driverId: '',
          firstName: driver.firstName,
          lastName: driver.lastName,
          licenseNumber: driver.licenseNumber,
        });
      } else {
        this.form.controls.driverId.enable({ emitEvent: false });
        this.form.reset({ driverId: '', firstName: '', lastName: '', licenseNumber: '' });
      }
    });

    this.destroyRef.onDestroy(() => this.revokePreviewUrls(this.facePhotoPreviews()));
  }

  get title(): string {
    return this.mode() === 'edit' ? 'Edit driver' : 'New driver';
  }

  facePhotoFile(angle: FacePhotoAngle): File | null {
    return this.facePhotoFiles()[angle];
  }

  facePhotoPreview(angle: FacePhotoAngle): string | null {
    return this.facePhotoPreviews()[angle];
  }

  facePhotoMissing(angle: FacePhotoAngle): boolean {
    return this.facePhotosTouched() && this.facePhotoFile(angle) === null;
  }

  onFacePhotoSelected(angle: FacePhotoAngle, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (file.type && !file.type.startsWith('image/')) {
      input.value = '';
      const currentPreview = this.facePhotoPreviews()[angle];
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      this.facePhotoFiles.update(files => ({ ...files, [angle]: null }));
      this.facePhotoPreviews.update(previews => ({ ...previews, [angle]: null }));
      this.notifications.error('Choose an image file for face registration.');
      return;
    }

    const currentPreview = this.facePhotoPreviews()[angle];
    if (currentPreview) URL.revokeObjectURL(currentPreview);

    this.facePhotoFiles.update(files => ({ ...files, [angle]: file }));
    this.facePhotoPreviews.update(previews => ({
      ...previews,
      [angle]: URL.createObjectURL(file),
    }));
  }

  removeFacePhoto(angle: FacePhotoAngle, input: HTMLInputElement): void {
    input.value = '';
    const currentPreview = this.facePhotoPreviews()[angle];
    if (currentPreview) URL.revokeObjectURL(currentPreview);

    this.facePhotoFiles.update(files => ({ ...files, [angle]: null }));
    this.facePhotoPreviews.update(previews => ({ ...previews, [angle]: null }));
  }

  formatFileSize(file: File): string {
    if (file.size < 1024 * 1024) {
      return Math.max(1, Math.round(file.size / 1024)) + ' KB';
    }
    return (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  resetFacePhotos(): void {
    this.revokePreviewUrls(untracked(this.facePhotoPreviews));
    this.facePhotoInputs().forEach(input => (input.nativeElement.value = ''));
    this.facePhotoFiles.set(emptyFacePhotoRecord<File | null>(null));
    this.facePhotoPreviews.set(emptyFacePhotoRecord<string | null>(null));
    this.facePhotosTouched.set(false);
  }

  cancel(): void {
    this.resetFacePhotos();
    this.visible.set(false);
  }

  submit(): void {
    const facePhotosInvalid = !this.facePhotosComplete();
    if (this.form.invalid || facePhotosInvalid) {
      this.form.markAllAsTouched();
      if (facePhotosInvalid) this.facePhotosTouched.set(true);
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
        : this.driverService.create({
            driverId: this.form.controls.driverId.value.trim(),
            ...payload,
          });

    request$.subscribe({
      next: () => this.finish('Driver saved.'),
      error: error => {
        this.saving.set(false);
        this.notifications.fromHttpError(error, 'Failed to save driver.');
      },
    });
  }

  private finish(message: string): void {
    this.saving.set(false);
    this.resetFacePhotos();
    this.notifications.success(message);
    this.saved.emit();
    this.visible.set(false);
  }

  private revokePreviewUrls(previews: Record<FacePhotoAngle, string | null>): void {
    Object.values(previews).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
  }
}
