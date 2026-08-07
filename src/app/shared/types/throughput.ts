/** One gate-local hour of throughput. Returned by both the dashboard overview
 *  and the daily-summary report, in this exact shape. */
export interface HourlyThroughputBucket {
  /** 0–23, gate-local. */
  hour: number;
  verified: number;
  /** A manual override contributes to `total` only; it is not an exception. */
  exception: number;
  total: number;
}
