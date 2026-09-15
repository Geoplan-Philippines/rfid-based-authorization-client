/** Frontend mirror of the backend reports contract (docs/frontend-reports-ux-handoff.md). */

import { PaginationMeta } from '../../../core/types/api-response.types';
import { GateEventResult, RfidTagStatus } from '../../../shared/ui/status-tags';
import { HourlyThroughputBucket } from '../../../shared/types/throughput';

export interface AvgPassTime {
  milliseconds: number | null;
  sampleSize: number;
}

export type ResultCounts = Record<GateEventResult, number>;

/** The figures for one period. Monthly day rows use this shape directly — they carry no baseline. */
export interface ReportMetrics {
  totalGateEvents: number;
  verified: number;
  exceptions: number;
  manualOverrides: number;
  openEvents: number;
  /** 0–100, one decimal. */
  verificationRate: number;
  avgPassTime: AvgPassTime;
  /** Always all seven GateEventResult keys, including zeroes. */
  resultCounts: ResultCounts;
}

/** The immediately preceding period, for KPI comparisons. Deltas are computed client-side. */
export interface PreviousReportSummary {
  totalGateEvents: number;
  verified: number;
  exceptions: number;
  manualOverrides: number;
  verificationRate: number;
}

export interface ReportSummary extends ReportMetrics {
  /**
   * `null` means no gate event exists before the selected period at all — i.e. no
   * earlier history, which is not the same as a zero-filled previous period
   * (history exists, but nothing happened in it).
   */
  previous: PreviousReportSummary | null;
}

export interface DailySummaryData {
  /** YYYY-MM-DD actually reported. */
  date: string;
  /** Ready-to-render page title, e.g. "Daily Gate Summary — Tuesday, July 14, 2026". */
  title: string;
  generatedAt: string;
  /** `previous` is the previous calendar day. */
  summary: ReportSummary;
  /** Exactly 24 rows, ascending by hour. */
  hourlyThroughput: HourlyThroughputBucket[];
}

export interface MonthlyBreakdownDay extends ReportMetrics {
  date: string;
}

export interface MonthlyBreakdownData {
  /** YYYY-MM actually reported. */
  month: string;
  generatedAt: string;
  /** `previous` is the previous calendar month. */
  summary: ReportSummary;
  /** Ascending, one entry per calendar day including zero-event days. */
  days: MonthlyBreakdownDay[];
}

export type ExceptionResult = 'UNKNOWN_TAG' | 'UNAUTHORIZED' | 'EXPRESSWAY_TAG' | 'FACE_MISMATCH' | 'PLATE_MISMATCH' | 'DENIED' | 'ERROR';

export interface ExceptionReportItem {
  /** Also the id for GET /transactions/:id. */
  id: string;
  eventCode: string;
  occurredAt: string;
  result: ExceptionResult;
  /** Backend-built display explanation. */
  reason: string;
  plateRead: string | null;
  rfidTag: { epcId: string; status: RfidTagStatus | null } | null;
  truck: { id: string; plateNumber: string; model: string | null } | null;
  driver: { id: string; firstName: string; lastName: string } | null;
  verification: {
    rfidMatched: boolean;
    plateMatched: boolean | null;
    faceMatched: boolean | null;
    plateConfidence: number | null;
    faceConfidence: number | null;
    verifiedAt: string;
  } | null;
  barrierOpenedAt: string | null;
  isOpen: boolean;
}

export interface ExceptionsMeta extends PaginationMeta {
  period: { from: string; to: string };
  /**
   * All five exception keys, always. Respects the date range and search but
   * ignores the selected result, so every chip stays informative while one is active.
   */
  resultCounts: Record<ExceptionResult, number>;
  /** Matching exceptions with no BARRIER_OPENED entry. Ignores the selected result, like `resultCounts`. */
  openCount: number;
}

export interface ExceptionsListResult {
  data: ExceptionReportItem[];
  meta: ExceptionsMeta;
}

export interface PeakHourBucket {
  /** 0–23, gate/server local time. */
  hour: number;
  /** e.g. "8 AM–9 AM". */
  label: string;
  totalGateEvents: number;
  verified: number;
  exceptions: number;
  manualOverrides: number;
}

export interface PeakHoursData {
  period: { from: string; to: string };
  generatedAt: string;
  /** `previous` is the preceding window of equal length. */
  summary: ReportSummary;
  /** Exactly 24 rows, sorted 0 through 23. */
  hours: PeakHourBucket[];
  /** All tied highest-volume hours; empty when no events exist. */
  peakHours: PeakHourBucket[];
}
