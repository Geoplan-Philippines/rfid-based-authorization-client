import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { NotificationService } from '../../../../core/services/notification.service';
import { ExpresswayTagStatus, expresswayTagStatusTag } from '../../../../shared/ui/status-tags';
import { truckLabel } from '../../../../shared/utils/truck-label';
import { TruckService } from '../../../trucks/services/truck.service';
import { ExpresswayTagsService } from '../../services/expressway-tags.service';

interface SelectOption<T> {
  label: string;
  value: T;
}

export interface MatchedTruck {
  id: string;
  plateNumber: string;
  model: string | null;
}

@Component({
  selector: 'app-expressway-tag-form-dialog',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './expressway-tag-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpresswayTagFormDialog implements OnInit {
  private fb = inject(FormBuilder);
  private tagsService = inject(ExpresswayTagsService);
  private truckService = inject(TruckService);
  private notifications = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected readonly expresswayTagStatusTag = expresswayTagStatusTag;
  protected readonly truckLabel = truckLabel;

  visible = model(false);
  saved = output<void>();

  // Optional pre-filled EPC ID & Plate (e.g. from transaction detail)
  prefilledEpcId = input<string | null>(null);
  prefilledPlateNumber = input<string | null>(null);

  saving = signal(false);

  // Plate search & connect state
  searchQuery = signal<string>('');
  searching = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  searchResults = signal<MatchedTruck[]>([]);
  selectedTruck = signal<MatchedTruck | null>(null);
  isRegisteringNewTruck = signal<boolean>(false);

  private searchSubject$ = new Subject<string>();

  readonly statusOptions: SelectOption<ExpresswayTagStatus>[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Blocked', value: 'BLOCKED' },
  ];

  form = this.fb.nonNullable.group({
    epcId: ['', [Validators.required, Validators.maxLength(64)]],
    label: ['', [Validators.maxLength(128)]],
    status: ['ACTIVE' as ExpresswayTagStatus, [Validators.required]],
    newPlateNumber: ['', [Validators.maxLength(32)]],
    newModel: ['', [Validators.maxLength(64)]],
  });

  ngOnInit(): void {
    this.searchSubject$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(term => {
          const cleanTerm = term.trim();
          if (!cleanTerm) {
            this.searching.set(false);
            this.hasSearched.set(false);
            this.searchResults.set([]);
            return of(null);
          }
          this.searching.set(true);
          return this.truckService.getTrucks({ search: cleanTerm, limit: 5, page: 1 }).pipe(
            catchError(() => {
              this.searching.set(false);
              this.searchResults.set([]);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: res => {
          this.searching.set(false);
          this.hasSearched.set(true);
          if (res && res.data) {
            this.searchResults.set(
              res.data.map(t => ({
                id: t.id,
                plateNumber: t.plateNumber,
                model: t.model,
              })),
            );
          } else {
            this.searchResults.set([]);
          }
        },
        error: () => {
          this.searching.set(false);
          this.searchResults.set([]);
        },
      });
  }

  onShow(): void {
    const defaultEpc = this.prefilledEpcId() || '';
    const defaultPlate = this.prefilledPlateNumber() || '';

    this.form.reset({
      epcId: defaultEpc,
      label: '',
      status: 'ACTIVE',
      newPlateNumber: defaultPlate,
      newModel: '',
    });

    this.selectedTruck.set(null);
    this.isRegisteringNewTruck.set(false);
    this.hasSearched.set(false);
    this.searchResults.set([]);
    this.searchQuery.set(defaultPlate);

    if (defaultPlate) {
      this.onSearchInput(defaultPlate);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    const clean = value.trim();
    if (!clean) {
      this.searching.set(false);
      this.hasSearched.set(false);
      this.searchResults.set([]);
    } else {
      this.searching.set(true);
    }
    this.searchSubject$.next(value);
  }

  connectTruck(truck: MatchedTruck): void {
    this.selectedTruck.set(truck);
    this.isRegisteringNewTruck.set(false);
    this.form.controls.newPlateNumber.setValue('');
    this.form.controls.newModel.setValue('');
  }

  disconnectTruck(): void {
    this.selectedTruck.set(null);
    this.isRegisteringNewTruck.set(false);
  }

  startRegisterTruck(prefillPlate?: string): void {
    this.selectedTruck.set(null);
    this.isRegisteringNewTruck.set(true);
    const plate = (prefillPlate || this.searchQuery()).trim().toUpperCase();
    this.form.controls.newPlateNumber.setValue(plate);
  }

  cancelRegisterTruck(): void {
    this.isRegisteringNewTruck.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const epcId = this.form.controls.epcId.value.trim().toUpperCase();
    const label = this.form.controls.label.value.trim();
    const status = this.form.controls.status.value;

    if (this.isRegisteringNewTruck()) {
      const plateNumber = this.form.controls.newPlateNumber.value.trim().toUpperCase();
      if (!plateNumber) {
        this.notifications.error('Please enter a plate number for the new truck.');
        return;
      }
      const model = this.form.controls.newModel.value.trim();

      this.saving.set(true);
      this.truckService.create({ plateNumber, ...(model ? { model } : {}) }).subscribe({
        next: createdTruck => {
          this.createTag(epcId, label, createdTruck.id, status);
        },
        error: error => {
          this.saving.set(false);
          this.notifications.fromHttpError(error, 'Failed to create truck.');
        },
      });
    } else {
      const truckId = this.selectedTruck()?.id;
      this.saving.set(true);
      this.createTag(epcId, label, truckId, status);
    }
  }

  private createTag(epcId: string, label: string, truckId: string | undefined, status: ExpresswayTagStatus): void {
    this.tagsService
      .create({
        epcId,
        ...(label ? { label } : {}),
        ...(truckId ? { truckId } : {}),
        status,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('Expressway tag registered.');
          this.saved.emit();
          this.visible.set(false);
        },
        error: error => {
          this.saving.set(false);
          this.notifications.fromHttpError(error, 'Failed to register expressway tag.');
        },
      });
  }
}
