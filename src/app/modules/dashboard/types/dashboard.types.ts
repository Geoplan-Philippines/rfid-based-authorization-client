/** Frontend mirror of the backend dashboard contract (context/dashboard). */

import { GateEventResult } from '../../../shared/ui/status-tags';

export interface TrucksTodayCard {
  value: number;
  /** Change against the previous day's total passes. */
  deltaVsYesterday: number;
}

export interface VerifiedCard {
  value: number;
  /** Clean passes as a share of total (0–100, one decimal). */
  rate: number;
}

export interface ExceptionsCard {
  value: number;
}

export interface AvgPassTimeCard {
  /** Mean RFID→barrier duration; null when no pass completed. */
  milliseconds: number | null;
  sampleSize: number;
}

export interface DashboardCards {
  trucksToday: TrucksTodayCard;
  verified: VerifiedCard;
  exceptions: ExceptionsCard;
  avgPassTime: AvgPassTimeCard;
}

export interface HourlyThroughputBucket {
  /** 0–23, gate-local. */
  hour: number;
  verified: number;
  exception: number;
  total: number;
}

export interface NeedsReviewItem {
  id: string;
  eventCode: string;
  /** ISO timestamp (Date serialised over JSON). */
  occurredAt: string;
  result: GateEventResult;
}

export interface DashboardOverview {
  /** YYYY-MM-DD window the data covers (gate-local). */
  date: string;
  /** ISO timestamp the snapshot was generated. */
  generatedAt: string;
  cards: DashboardCards;
  hourlyThroughput: HourlyThroughputBucket[];
  needsReview: {
    /** Total exceptions in the window (may exceed items.length). */
    open: number;
    items: NeedsReviewItem[];
  };
}
