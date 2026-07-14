import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ReportSummaryPanel } from './report-summary-panel';
import { ReportSummary } from '../../types/report.types';

const MOCK_SUMMARY: ReportSummary = {
  totalGateEvents: 10,
  verified: 8,
  exceptions: 2,
  manualOverrides: 0,
  openEvents: 1,
  verificationRate: 80,
  avgPassTime: { milliseconds: 1600, sampleSize: 7 },
  resultCounts: {
    VERIFIED: 8,
    UNKNOWN_TAG: 1,
    FACE_MISMATCH: 0,
    PLATE_MISMATCH: 0,
    MANUAL_OVERRIDE: 0,
    DENIED: 1,
    ERROR: 0,
  },
  previous: {
    totalGateEvents: 12,
    verified: 11,
    exceptions: 1,
    manualOverrides: 0,
    verificationRate: 91.7,
  },
};

describe('ReportSummaryPanel', () => {
  let component: ReportSummaryPanel;
  let fixture: ComponentFixture<ReportSummaryPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportSummaryPanel],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSummaryPanel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', MOCK_SUMMARY);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('derives signed deltas against the previous period', () => {
    const deltas = component['deltas']();

    expect(deltas?.totalGateEvents.magnitude).toBe('−2');
    expect(deltas?.totalGateEvents.direction).toBe('down');
    // A rising exception count is the one delta the panel colours.
    expect(deltas?.exceptions.magnitude).toBe('+1');
    expect(deltas?.exceptions.direction).toBe('up');
  });

  it('renders no deltas when there is no earlier history', () => {
    fixture.componentRef.setInput('summary', { ...MOCK_SUMMARY, previous: null });
    fixture.detectChanges();

    expect(component['deltas']()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No earlier data to compare');
  });
});
