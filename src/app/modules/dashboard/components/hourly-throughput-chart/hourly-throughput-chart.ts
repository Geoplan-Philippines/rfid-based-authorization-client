import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';

import { HourlyThroughputBucket } from '../../types/dashboard.types';

interface ColumnView {
  hour: number;
  /** Axis tick label; empty when this hour's tick is suppressed. */
  axisLabel: string;
  hourLabel: string;
  verified: number;
  exception: number;
  override: number;
  total: number;
  verifiedPct: number;
  overridePct: number;
  exceptionPct: number;
  tooltip: string;
}

/**
 * Stacked column chart of gate passes per gate-local hour (00–23). Each column
 * splits into verified (slate), manual-override (muted) and exception (red, on
 * top) so anomalies sit at eye level. Purely presentational — a text summary
 * and an sr-only data table carry the same information for assistive tech.
 */
@Component({
  selector: 'app-hourly-throughput-chart',
  imports: [TooltipModule],
  templateUrl: './hourly-throughput-chart.html',
  styleUrl: './hourly-throughput-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HourlyThroughputChart {
  buckets = input.required<HourlyThroughputBucket[]>();

  protected readonly hasActivity = computed(() => this.buckets().some((b) => b.total > 0));

  protected readonly hasOverrides = computed(() =>
    this.buckets().some((b) => b.total - b.verified - b.exception > 0),
  );

  protected readonly columns = computed<ColumnView[]>(() => {
    const buckets = this.buckets();
    const max = Math.max(1, ...buckets.map((b) => b.total));

    return buckets.map((b) => {
      const override = Math.max(0, b.total - b.verified - b.exception);
      const hh = String(b.hour).padStart(2, '0');
      const parts = [`${b.total} total`, `${b.verified} verified`, `${b.exception} exception`];
      if (override > 0) parts.push(`${override} override`);

      return {
        hour: b.hour,
        axisLabel: b.hour % 3 === 0 ? hh : '',
        hourLabel: `${hh}:00`,
        verified: b.verified,
        exception: b.exception,
        override,
        total: b.total,
        verifiedPct: (b.verified / max) * 100,
        overridePct: (override / max) * 100,
        exceptionPct: (b.exception / max) * 100,
        tooltip: `${hh}:00 — ${parts.join(' · ')}`,
      };
    });
  });

  protected readonly summary = computed(() => {
    const totals = this.buckets().reduce(
      (acc, b) => {
        acc.total += b.total;
        acc.verified += b.verified;
        acc.exception += b.exception;
        if (b.total > acc.peakTotal) {
          acc.peakTotal = b.total;
          acc.peakHour = b.hour;
        }
        return acc;
      },
      { total: 0, verified: 0, exception: 0, peakTotal: 0, peakHour: 0 },
    );

    if (totals.total === 0) return 'No gate activity recorded for this day.';

    const peak = String(totals.peakHour).padStart(2, '0');
    return `Hourly gate throughput: ${totals.total} passes, ${totals.verified} verified, ${totals.exception} exceptions. Busiest hour ${peak}:00 with ${totals.peakTotal} passes.`;
  });
}
