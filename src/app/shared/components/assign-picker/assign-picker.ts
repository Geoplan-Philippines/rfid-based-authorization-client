import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AssignmentRole, DisplayTag, assignmentRoleTag } from '../../ui/status-tags';

export interface AssignCandidate {
  id: string;
  label: string;
  sublabel?: string | null;
  badge?: DisplayTag | null;
  imageUrl?: string | null;
}

export interface AssignedEntry {
  id: string;
  label: string;
  sublabel?: string | null;
  role: AssignmentRole;
  imageUrl?: string | null;
}

/**
 * Reusable assign picker — works both ways (assign drivers to a truck, or trucks
 * to a driver). Assignment happens one-by-one: clicking a candidate emits a single
 * `assign`; the parent performs the call and refreshes `assigned`.
 */
@Component({
  selector: 'app-assign-picker',
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    AvatarModule,
    TagModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './assign-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignPicker {
  private destroyRef = inject(DestroyRef);
  private search$ = new Subject<string>();

  protected readonly roleTag = assignmentRoleTag;

  visible = model(false);
  header = input.required<string>();
  subheader = input('');
  candidateLabel = input('Available');
  assignedLabel = input('Assigned');
  emptyCandidatesText = input('No matches.');
  assigned = input.required<AssignedEntry[]>();
  loadCandidates = input.required<(search: string) => Observable<AssignCandidate[]>>();
  roleSelectable = input(true);
  busy = input(false);

  assign = output<{ id: string; role: AssignmentRole }>();
  unassign = output<AssignedEntry>();

  candidates = signal<AssignCandidate[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedRole = signal<AssignmentRole>('RELIEF');

  private assignedIds = computed(() => new Set(this.assigned().map(entry => entry.id)));
  availableCandidates = computed(() => this.candidates().filter(c => !this.assignedIds().has(c.id)));

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          this.loading.set(true);
          return this.loadCandidates()(term);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: candidates => {
          this.candidates.set(candidates);
          this.loading.set(false);
        },
        error: () => {
          this.candidates.set([]);
          this.loading.set(false);
        },
      });

    // Load (or reset) the candidate list each time the dialog opens.
    effect(() => {
      if (this.visible()) {
        this.searchTerm.set('');
        this.search$.next('');
      }
    });
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm.set(term);
    this.search$.next(term.trim());
  }

  onAssign(candidate: AssignCandidate): void {
    if (this.busy()) return;
    this.assign.emit({ id: candidate.id, role: this.selectedRole() });
  }

  onUnassign(entry: AssignedEntry): void {
    if (this.busy()) return;
    this.unassign.emit(entry);
  }

  setRole(role: AssignmentRole): void {
    this.selectedRole.set(role);
  }

  initials(label: string): string {
    return label
      .split(/\s+/)
      .map(part => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
