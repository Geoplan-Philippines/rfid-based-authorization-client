import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateRange, ReportRangePicker } from './report-range-picker';

const DAY_MS = 86_400_000;

/** Whole days spanned, inclusive at both ends — a same-day range spans 1. */
function inclusiveDays(range: DateRange): number {
  return Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS) + 1;
}

describe('ReportRangePicker', () => {
  let component: ReportRangePicker;
  let fixture: ComponentFixture<ReportRangePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportRangePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportRangePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits inclusive ranges ending today for each preset', () => {
    const emitted: DateRange[] = [];
    component.rangeChange.subscribe(range => emitted.push(range));

    component['selectPreset']('today');
    component['selectPreset']('last7');
    component['selectPreset']('last30');

    expect(emitted.map(inclusiveDays)).toEqual([1, 7, 30]);
    expect(emitted.every(range => range.to.getTime() === component.today.getTime())).toBe(true);
  });

  it('highlights the preset matching the current range, and none for a custom range', () => {
    const sevenDaysAgo = new Date(component.today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    fixture.componentRef.setInput('range', { from: sevenDaysAgo, to: component.today });
    expect(component['activePreset']()).toBe('last7');

    const custom = new Date(component.today);
    custom.setDate(custom.getDate() - 3);
    fixture.componentRef.setInput('range', { from: custom, to: component.today });
    expect(component['activePreset']()).toBeNull();
  });

  it('ignores a half-picked calendar range', () => {
    const emitted: DateRange[] = [];
    component.rangeChange.subscribe(range => emitted.push(range));

    component['onCalendarSelect']([component.today, null]);

    expect(emitted).toEqual([]);
  });
});
