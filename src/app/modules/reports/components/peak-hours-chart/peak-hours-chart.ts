import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';

import { PeakHourBucket } from '../../types/report.types';

interface ColumnView {
  hour: number;
  /** Axis tick label; empty when this hour's tick is suppressed. */
  axisLabel: string;
  hourLabel: string;
  verified: number;
  manualOverrides: number;
  exceptions: number;
  total: number;
  verifiedPct: number;
  overridePct: number;
  exceptionPct: number;
  isPeak: boolean;
  tooltip: string;
}

/**
 * Stacked column chart of gate passes per gate-local hour (00–23) across the
 * selected date range. Same visual language as the Dashboard's hourly
 * throughput chart, with a peak-hour marker layered on top. Purely
 * presentational — a text summary and an sr-only data table carry the same
 * information for assistive tech.
 */
@Component({
  selector: 'app-peak-hours-chart',
  imports: [TooltipModule],
  templateUrl: './peak-hours-chart.html',
  styleUrl: './peak-hours-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeakHoursChart {
  buckets = input.required<PeakHourBucket[]>();
  peakHours = input<PeakHourBucket[]>([]);

  protected readonly hasActivity = computed(() => this.buckets().some((b) => b.totalGateEvents > 0));

  protected readonly hasOverrides = computed(() => this.buckets().some((b) => b.manualOverrides > 0));

  protected readonly columns = computed<ColumnView[]>(() => {
    const buckets = this.buckets();
    const peakHourSet = new Set(this.peakHours().map((p) => p.hour));
    const max = Math.max(1, ...buckets.map((b) => b.totalGateEvents));

    return buckets.map((b) => {
      const hh = String(b.hour).padStart(2, '0');
      const parts = [
        `${b.totalGateEvents} total`,
        `${b.verified} verified`,
        `${b.exceptions} exception${b.exceptions === 1 ? '' : 's'}`,
      ];
      if (b.manualOverrides > 0) parts.push(`${b.manualOverrides} override${b.manualOverrides === 1 ? '' : 's'}`);

      return {
        hour: b.hour,
        axisLabel: b.hour % 3 === 0 ? hh : '',
        hourLabel: b.label,
        verified: b.verified,
        manualOverrides: b.manualOverrides,
        exceptions: b.exceptions,
        total: b.totalGateEvents,
        verifiedPct: (b.verified / max) * 100,
        overridePct: (b.manualOverrides / max) * 100,
        exceptionPct: (b.exceptions / max) * 100,
        isPeak: peakHourSet.has(b.hour),
        tooltip: `${b.label} — ${parts.join(' · ')}${peakHourSet.has(b.hour) ? ' · peak' : ''}`,
      };
    });
  });

  protected readonly summary = computed(() => {
    const buckets = this.buckets();
    const totals = buckets.reduce(
      (acc, b) => {
        acc.total += b.totalGateEvents;
        acc.verified += b.verified;
        acc.exceptions += b.exceptions;
        return acc;
      },
      { total: 0, verified: 0, exceptions: 0 },
    );

    if (totals.total === 0) return 'No gate activity recorded for this period.';

    const peaks = this.peakHours();
    const peakLabel = peaks.length ? peaks.map((p) => p.label).join(', ') : 'none';
    return `Hourly gate throughput: ${totals.total} passes, ${totals.verified} verified, ${totals.exceptions} exceptions. Peak hour${peaks.length === 1 ? '' : 's'}: ${peakLabel}.`;
  });
}
