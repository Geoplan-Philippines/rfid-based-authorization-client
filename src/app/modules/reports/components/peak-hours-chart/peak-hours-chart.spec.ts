import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeakHoursChart } from './peak-hours-chart';
import { PeakHourBucket } from '../../types/report.types';

function bucket(hour: number, total: number): PeakHourBucket {
  return {
    hour,
    label: `${hour}:00–${hour + 1}:00`,
    totalGateEvents: total,
    verified: total,
    exceptions: 0,
    manualOverrides: 0,
  };
}

const MOCK_BUCKETS: PeakHourBucket[] = Array.from({ length: 24 }, (_, hour) => bucket(hour, hour === 8 ? 12 : 0));

describe('PeakHoursChart', () => {
  let component: PeakHoursChart;
  let fixture: ComponentFixture<PeakHoursChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeakHoursChart],
    }).compileComponents();

    fixture = TestBed.createComponent(PeakHoursChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('buckets', MOCK_BUCKETS);
    fixture.componentRef.setInput('peakHours', [MOCK_BUCKETS[8]]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
