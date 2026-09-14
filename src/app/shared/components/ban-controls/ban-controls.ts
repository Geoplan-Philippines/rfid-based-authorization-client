import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';

import { BanRequest, BanState } from '../../types/ban';
import { parseQueryDate, startOfToday, toQueryDate } from '../../utils/date';

type BanMode = 'permanent' | 'timed';

interface BanModeOption {
  label: string;
  value: BanMode;
}

@Component({
  selector: 'app-ban-controls',
  imports: [FormsModule, DatePipe, ButtonModule, DatePickerModule, DialogModule, SelectButtonModule, TagModule],
  templateUrl: './ban-controls.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BanControls {
  readonly visible = model(false);
  readonly state = input.required<BanState>();
  readonly entityLabel = input.required<'truck' | 'driver'>();
  readonly subjectLabel = input.required<string>();
  readonly busy = input(false);

  readonly banRequested = output<BanRequest>();
  readonly liftRequested = output<void>();

  protected readonly today = startOfToday();
  protected readonly modeOptions: BanModeOption[] = [
    { label: 'Permanent', value: 'permanent' },
    { label: 'Timed ban', value: 'timed' },
  ];
  protected readonly mode = signal<BanMode>('permanent');
  protected readonly fromDate = signal<Date | null>(null);
  protected readonly toDate = signal<Date | null>(null);
  protected readonly dateTouched = signal(false);

  /** Backward-compatible alias for toDate */
  get untilDate() {
    return this.toDate;
  }

  protected readonly isFutureBan = computed(() => {
    const state = this.state();
    if (state.isBanned || state.isPermanentlyBanned || !state.bannedFrom || !state.bannedUntil) {
      return false;
    }
    const from = parseQueryDate(state.bannedFrom);
    return from !== null && from.getTime() > this.today.getTime();
  });

  protected readonly fromDateInvalid = computed(() => {
    if (this.mode() !== 'timed') return false;
    return !this.fromDate();
  });

  protected readonly toDateInvalid = computed(() => {
    if (this.mode() !== 'timed') return false;
    const to = this.toDate();
    return !to || to.getTime() < this.today.getTime();
  });

  protected readonly dateRangeInvalid = computed(() => {
    if (this.mode() !== 'timed') return false;
    const from = this.fromDate();
    const to = this.toDate();
    if (!from || !to) return false;
    return from.getTime() > to.getTime();
  });

  protected readonly timedDateInvalid = computed(() => {
    if (this.mode() !== 'timed') return false;
    return this.fromDateInvalid() || this.toDateInvalid() || this.dateRangeInvalid();
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;

      const state = this.state();
      untracked(() => {
        if (!state.isPermanentlyBanned && (state.isBanned || this.isFutureBan())) {
          this.mode.set('timed');
          const existingFrom = state.bannedFrom ? parseQueryDate(state.bannedFrom) : this.today;
          const existingTo = state.bannedUntil ? parseQueryDate(state.bannedUntil) : null;
          this.fromDate.set(existingFrom);
          this.toDate.set(existingTo);
        } else if (state.isPermanentlyBanned) {
          this.mode.set('permanent');
          this.fromDate.set(this.today);
          this.toDate.set(null);
        } else {
          this.mode.set('permanent');
          this.fromDate.set(this.today);
          this.toDate.set(null);
        }
        this.dateTouched.set(false);
      });
    });
  }

  protected openDialog(): void {
    this.visible.set(true);
  }

  protected selectMode(mode: BanMode): void {
    this.mode.set(mode);
    this.dateTouched.set(false);
    if (mode === 'timed' && !this.fromDate()) {
      this.fromDate.set(this.today);
    }
  }

  protected selectFromDate(date: Date | null): void {
    this.fromDate.set(date);
    this.dateTouched.set(true);
  }

  protected selectToDate(date: Date | null): void {
    this.toDate.set(date);
    this.dateTouched.set(true);
  }

  protected selectUntilDate(date: Date | null): void {
    this.selectToDate(date);
  }

  protected cancel(): void {
    this.visible.set(false);
  }

  protected submit(): void {
    if (this.mode() === 'permanent') {
      this.banRequested.emit({ permanent: true });
      return;
    }

    this.dateTouched.set(true);
    const from = this.fromDate();
    const to = this.toDate();
    if (!from || !to || this.timedDateInvalid()) return;

    this.banRequested.emit({
      permanent: false,
      from: toQueryDate(from),
      to: toQueryDate(to),
    });
  }
}
