import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap } from 'rxjs';

import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

import { TransactionService } from '../../services/transaction.service';
import { SnapshotType, TimelineEventType, TransactionDetail as TransactionDetailModel } from '../../types/transaction.types';
import { DisplayTag, resultTag, snapshotLabel, tagStatusTag, timelineLabel } from '../../utils/transaction-display';

type SnapshotFilter = 'ALL' | SnapshotType;
type StepState = 'done' | 'failed' | 'pending';

interface PipelineStep {
  type: TimelineEventType;
  label: string;
  icon: string;
  state: StepState;
  occurredAt: string | null;
  message: string | null;
  /** Colour of the connector to the next step (null on the last step). */
  connectorColor: string | null;
}

/** Canonical gate pipeline — always rendered in this fixed order; unreached stages are greyed out. */
const PIPELINE_STEPS: { type: TimelineEventType; icon: string }[] = [
  { type: 'RFID_SCANNED', icon: 'pi-wifi' },
  { type: 'TAG_VALIDATED', icon: 'pi-verified' },
  { type: 'PLATE_CAPTURED', icon: 'pi-camera' },
  { type: 'PLATE_MATCHED', icon: 'pi-car' },
  { type: 'FACE_CAPTURED', icon: 'pi-image' },
  { type: 'FACE_MATCHED', icon: 'pi-user' },
  { type: 'BARRIER_OPENED', icon: 'pi-unlock' },
];

@Component({
  selector: 'app-transaction-detail',
  imports: [DatePipe, RouterLink, TagModule, ProgressBarModule, ProgressSpinnerModule, ButtonModule],
  templateUrl: './transaction-detail.html',
  styleUrl: './transaction-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class TransactionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private transactionService = inject(TransactionService);
  private destroyRef = inject(DestroyRef);

  protected readonly resultTag = resultTag;
  protected readonly tagStatusTag = tagStatusTag;
  protected readonly snapshotLabel = snapshotLabel;
  protected readonly snapshotFilters: readonly SnapshotFilter[] = ['ALL', 'FACE', 'PLATE', 'WIDE'];

  transaction = signal<TransactionDetailModel | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  notFound = signal(false);
  snapshotFilter = signal<SnapshotFilter>('ALL');

  filteredSnapshots = computed(() => {
    const tx = this.transaction();
    if (!tx) return [];
    const filter = this.snapshotFilter();
    return filter === 'ALL' ? tx.snapshots : tx.snapshots.filter(s => s.type === filter);
  });

  /** The fixed pipeline with each stage's state derived from the recorded timeline. */
  steps = computed<PipelineStep[]>(() => {
    const tx = this.transaction();
    if (!tx) return [];

    // Each type is expected at most once; if the backend emits duplicates (retries),
    // keep the first occurrence deterministically rather than relying on Map last-wins.
    const byType = new Map<TimelineEventType, (typeof tx.timeline)[number]>();
    for (const event of tx.timeline) {
      if (!byType.has(event.type)) byType.set(event.type, event);
    }
    const reached = (type: TimelineEventType): boolean => byType.has(type);

    const stateFor = (type: TimelineEventType): StepState => {
      if (byType.has(type)) return 'done';
      // A match/validate stage missing while its capture ran means it failed (vs simply not reached).
      switch (type) {
        case 'TAG_VALIDATED':
          return reached('RFID_SCANNED') ? 'failed' : 'pending';
        case 'PLATE_MATCHED':
          return reached('PLATE_CAPTURED') ? 'failed' : 'pending';
        case 'FACE_MATCHED':
          return reached('FACE_CAPTURED') ? 'failed' : 'pending';
        default:
          return 'pending';
      }
    };

    const built = PIPELINE_STEPS.map(step => {
      const event = byType.get(step.type) ?? null;
      return {
        type: step.type,
        icon: step.icon,
        label: timelineLabel(step.type),
        state: stateFor(step.type),
        occurredAt: event?.occurredAt ?? null,
        message: event?.message ?? null,
      };
    });

    return built.map((step, i) => ({
      ...step,
      connectorColor: i < built.length - 1 ? this.edgeColor(step.state, built[i + 1].state) : null,
    }));
  });

  /** Total elapsed time across recorded stages, formatted as seconds. */
  totalDuration = computed<string | null>(() => {
    const tx = this.transaction();
    if (!tx || tx.timeline.length < 2) return null;
    const times = tx.timeline.map(event => new Date(event.occurredAt).getTime());
    const ms = Math.max(...times) - Math.min(...times);
    if (!Number.isFinite(ms)) return null;
    return `${(ms / 1000).toFixed(3)}s`;
  });

  overrideNote = computed<string | null>(() => {
    const tx = this.transaction();
    const event = tx?.timeline.find(e => e.type === 'MANUAL_OVERRIDE');
    return event?.message ?? null;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        // catchError lives on the inner observable so a load failure never terminates the
        // outer paramMap stream — navigating to another :id keeps working after an error.
        switchMap(params => {
          this.loading.set(true);
          this.error.set(null);
          this.notFound.set(false);
          const id = params.get('id');
          if (!id) {
            this.loading.set(false);
            this.notFound.set(true);
            return EMPTY;
          }
          return this.transactionService.getTransactionById(id).pipe(
            catchError((err: HttpErrorResponse) => {
              this.loading.set(false);
              if (err.status === 404) {
                this.notFound.set(true);
              } else {
                this.error.set('Failed to load transaction. Please try again.');
              }
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(tx => {
        this.transaction.set(tx);
        this.loading.set(false);
      });
  }

  setSnapshotFilter(filter: SnapshotFilter): void {
    this.snapshotFilter.set(filter);
  }

  matchTag(value: boolean | null): DisplayTag {
    if (value === true) return { label: 'Matched', severity: 'success' };
    if (value === false) return { label: 'No match', severity: 'danger' };
    return { label: 'Pending', severity: 'secondary' };
  }

  stepCircleColor(state: StepState): string {
    if (state === 'done') return 'var(--success)';
    if (state === 'failed') return 'var(--destructive)';
    return 'var(--border)';
  }

  stepIconClass(step: PipelineStep): string {
    return step.state === 'failed' ? 'pi pi-times' : `pi ${step.icon}`;
  }

  stepIconColor(state: StepState): string {
    return state === 'pending' ? 'var(--text-body)' : '#ffffff';
  }

  confidencePct(value: number | null): number {
    return value === null ? 0 : Math.round(value * 100);
  }

  fileName(url: string): string {
    return url.split('/').pop() || url;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  /** Connector colour: grey if the next stage was never reached, else green (or red out of a failed stage). */
  private edgeColor(fromState: StepState, toState: StepState): string {
    if (toState === 'pending') return 'var(--border)';
    return fromState === 'failed' ? 'var(--destructive)' : 'var(--success)';
  }
}
