import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TagModule } from 'primeng/tag';

import { GATE_EVENT_RESULT_ORDER, gateResultTag } from '../../../../shared/ui/status-tags';
import { formatPassTime } from '../../../../shared/utils/format';
import { DeltaDisplay, deltaDisplay } from '../../../../shared/utils/delta';
import { ReportSummary } from '../../types/report.types';

/** `YYYY-MM-DD` bounds the Exceptions report is opened with. */
export interface ExceptionsDrilldown {
  from: string;
  to: string;
}

interface SummaryDeltas {
  totalGateEvents: DeltaDisplay;
  verified: DeltaDisplay;
  exceptions: DeltaDisplay;
  manualOverrides: DeltaDisplay;
}

/**
 * Renders a `ReportSummary` as the standard KPI row + result breakdown.
 * Shared across Daily Summary, Monthly Breakdown, and Peak Hours — the three
 * endpoints that return this exact shape.
 *
 * Deltas come from `summary.previous`. A `null` baseline means no gate event
 * exists before this period at all, which is emphatically not "no change": the
 * panel says so rather than rendering a misleading zero.
 */
@Component({
  selector: 'app-report-summary-panel',
  imports: [RouterLink, TagModule],
  templateUrl: './report-summary-panel.html',
  styleUrl: './report-summary-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportSummaryPanel {
  summary = input.required<ReportSummary>();
  exceptionsDrilldown = input<ExceptionsDrilldown | null>(null);
  /** Names the baseline period, e.g. "yesterday" — read straight into the comparison line. */
  comparisonLabel = input('the previous period');

  protected readonly resultOrder = GATE_EVENT_RESULT_ORDER;
  protected readonly resultTag = gateResultTag;

  protected readonly passTime = computed(() => formatPassTime(this.summary().avgPassTime));

  protected readonly canReviewExceptions = computed(
    () => this.summary().exceptions > 0 && this.exceptionsDrilldown() !== null,
  );

  protected readonly deltas = computed<SummaryDeltas | null>(() => {
    const summary = this.summary();
    const previous = summary.previous;
    if (!previous) return null;

    return {
      totalGateEvents: deltaDisplay(summary.totalGateEvents - previous.totalGateEvents),
      verified: deltaDisplay(summary.verified - previous.verified),
      exceptions: deltaDisplay(summary.exceptions - previous.exceptions),
      manualOverrides: deltaDisplay(summary.manualOverrides - previous.manualOverrides),
    };
  });

  /** Screen-reader text for a delta chip; the visual chip is an arrow plus a number. */
  protected deltaLabel(delta: DeltaDisplay, noun: string): string {
    if (delta.direction === 'flat') return `No change in ${noun} vs ${this.comparisonLabel()}`;
    return `${delta.magnitude} ${noun} vs ${this.comparisonLabel()}`;
  }
}
