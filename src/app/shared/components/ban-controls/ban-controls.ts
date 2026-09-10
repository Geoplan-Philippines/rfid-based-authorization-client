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
import { startOfToday, toQueryDate } from '../../utils/date';

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
    { label: 'Until a date', value: 'timed' },
  ];
  protected readonly mode = signal<BanMode>('permanent');
  protected readonly untilDate = signal<Date | null>(null);
  protected readonly dateTouched = signal(false);
  protected readonly timedDateInvalid = computed(() => {
    if (this.mode() !== 'timed') return false;
    const date = this.untilDate();
    return !date || date.getTime() < this.today.getTime();
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;

      const state = this.state();
      untracked(() => {
        if (state.isBanned && !state.isPermanentlyBanned && state.bannedUntil) {
          const existingDate = new Date(state.bannedUntil);
          this.mode.set('timed');
          this.untilDate.set(Number.isNaN(existingDate.getTime()) ? null : existingDate);
        } else {
          this.mode.set('permanent');
          this.untilDate.set(null);
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
  }

  protected selectUntilDate(date: Date | null): void {
    this.untilDate.set(date);
    this.dateTouched.set(true);
  }

  protected cancel(): void {
    this.visible.set(false);
  }

  protected submit(): void {
    if (this.mode() === 'permanent') {
      this.banRequested.emit({ isPermanent: true });
      return;
    }

    this.dateTouched.set(true);
    const until = this.untilDate();
    if (!until || this.timedDateInvalid()) return;

    this.banRequested.emit({ isPermanent: false, until: toQueryDate(until) });
  }
}
