import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

import { TruckService } from './services/truck.service';
import { Truck } from './types/truck.types';

@Component({
  selector: 'app-trucks',
  imports: [TableModule, AvatarModule, ProgressSpinnerModule, PaginatorModule],
  templateUrl: './trucks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Trucks implements OnInit {
  private truckService = inject(TruckService);
  private destroyRef = inject(DestroyRef);

  trucks = signal<Truck[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  limit = signal(10);

  ngOnInit(): void {
    this.loadTrucks();
  }
 
  onPageChange(event: PaginatorState) {
    console.log('Paginator event:', event);
    
    this.page.set((event.page ?? 0) + 1);
    this.limit.set(event.rows ?? 10);

    this.loadTrucks();
  }

  plateInitials(truck: Truck): string {
    return truck.plateNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  }
  
  private loadTrucks(): void {
    this.loading.set(true);
    this.error.set(null);
    this.truckService.getTrucks(this.page(), this.limit()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ data, meta }) => {
        this.trucks.set(data);
        this.total.set(meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load trucks. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
 