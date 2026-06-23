import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NotificationService } from '../../core/services/notification.service';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  /** Terse "shape of the data" line shown above the call-to-action. */
  meta: string;
  /** PrimeIcons class, e.g. `pi-chart-bar`. */
  icon: string;
}

interface PeriodOption {
  label: string;
  value: 'today' | 'week' | 'month';
}

/**
 * Reports catalog — a browse-first hub where each card maps to exactly one
 * purpose. Custom is the escape hatch, not the front door. Presentational for
 * now: cards select but generation/export endpoints are not wired yet.
 */
@Component({
  selector: 'app-reports',
  imports: [
    FormsModule,
    ButtonModule,
    TagModule,
    SelectButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Reports {
  private notifications = inject(NotificationService);

  /** Default reporting window — flows into whichever report the user opens. */
  readonly periodOptions: PeriodOption[] = [
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
  ];
  period = signal<PeriodOption['value']>('week');

  /** Free-text catalog filter — matches title and description. */
  query = signal('');

  /** Operational core — built and ready to generate. */
  private readonly core: readonly ReportCard[] = [
    {
      id: 'daily-summary',
      title: 'Daily Summary',
      description: 'Everything that happened on one day — volume, verified vs exceptions, hourly throughput, top trucks.',
      meta: 'one day · single date picker',
      icon: 'pi-chart-bar',
    },
    {
      id: 'monthly-breakdown',
      title: 'Monthly Breakdown',
      description: 'Calendar heatmap of events per day across a month. Pick a day to drill into its Daily Summary.',
      meta: 'one month · 28–31 day buckets',
      icon: 'pi-calendar',
    },
    {
      id: 'exceptions-report',
      title: 'Exceptions Report',
      description: 'Unknown tags, face mismatches, plate mismatches and denials — with snapshot evidence and resolutions.',
      meta: 'filter by result · date range',
      icon: 'pi-exclamation-triangle',
    },
  ];

  /** Suggested — recognised needs we can build on request. */
  private readonly suggested: readonly ReportCard[] = [
    {
      id: 'peak-hours',
      title: 'Peak-Hours Analysis',
      description: 'Hour-of-day histogram across the period — find your real rush windows.',
      meta: 'staffing decisions',
      icon: 'pi-clock',
    },
    {
      id: 'override-audit',
      title: 'Override Audit',
      description: 'Every manual barrier-open with reason, operator, and the event it overrode.',
      meta: 'compliance review',
      icon: 'pi-shield',
    },
  ];

  coreReports = computed(() => this.filter(this.core));
  suggestedReports = computed(() => this.filter(this.suggested));
  hasResults = computed(() => this.coreReports().length + this.suggestedReports().length > 0);

  private filter(cards: readonly ReportCard[]): ReportCard[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return [...cards];
    return cards.filter(c => `${c.title} ${c.description}`.toLowerCase().includes(q));
  }

  onSearchInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  // TODO: route to the report view (/reports/:id) once generation is wired.
  openReport(report: ReportCard): void {
    this.notifications.info('Report generation is coming soon.', report.title);
  }

  // TODO: open the custom-report builder once the backend supports it.
  requestReport(report: ReportCard): void {
    this.notifications.info("Thanks — we've noted your interest.", report.title);
  }
}
