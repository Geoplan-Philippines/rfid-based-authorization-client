import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';

import { isSameDay, startOfToday } from '../../../../shared/utils/date';

export interface DateRange {
  from: Date;
  to: Date;
}

type PresetValue = 'today' | 'last7' | 'last30' | 'month';

interface PresetOption {
  label: string;
  value: PresetValue;
}

/**
 * Date-range control for the range-based reports. Presets carry the common
 * monitoring windows in one click; the calendar stays for the occasional
 * arbitrary range. The preset buttons deselect themselves when the range no
 * longer matches one, so the control never lies about what is being shown.
 */
@Component({
  selector: 'app-report-range-picker',
  imports: [FormsModule, SelectButtonModule, DatePickerModule],
  templateUrl: './report-range-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportRangePicker {
  range = input<DateRange | null>(null);
  rangeChange = output<DateRange>();

  /** Gate-local midnight today — the calendar ceiling and every preset's anchor. */
  readonly today = startOfToday();

  readonly presetOptions: PresetOption[] = [
    { label: 'Today', value: 'today' },
    { label: '7 days', value: 'last7' },
    { label: '30 days', value: 'last30' },
    { label: 'This month', value: 'month' },
  ];

  /** The preset matching the current range, or null when the range is custom. */
  protected readonly activePreset = computed<PresetValue | null>(() => {
    const range = this.range();
    if (!range) return null;

    const match = this.presetOptions.find(option => {
      const preset = this.presetRange(option.value);
      return isSameDay(preset.from, range.from) && isSameDay(preset.to, range.to);
    });
    return match?.value ?? null;
  });

  /** PrimeNG's range datepicker binds to a `(Date | null)[]`. */
  protected readonly calendarDates = computed<(Date | null)[] | null>(() => {
    const range = this.range();
    return range ? [range.from, range.to] : null;
  });

  private presetRange(preset: PresetValue): DateRange {
    const to = this.today;

    switch (preset) {
      case 'today':
        return { from: to, to };
      case 'last7': {
        const from = new Date(to);
        from.setDate(from.getDate() - 6);
        return { from, to };
      }
      case 'last30': {
        const from = new Date(to);
        from.setDate(from.getDate() - 29);
        return { from, to };
      }
      case 'month':
        return { from: new Date(to.getFullYear(), to.getMonth(), 1), to };
    }
  }

  protected selectPreset(preset: PresetValue): void {
    this.rangeChange.emit(this.presetRange(preset));
  }

  protected onCalendarSelect(dates: (Date | null)[] | null): void {
    const [from, to] = dates ?? [];
    // PrimeNG emits after the first click of a range; wait for both ends.
    if (!from || !to) return;
    this.rangeChange.emit({ from, to });
  }
}
