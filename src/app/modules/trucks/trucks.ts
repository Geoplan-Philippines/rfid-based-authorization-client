import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TruckService } from './services/truck.service';
import { Truck } from './types/truck.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-trucks',
  imports: [TableModule, AvatarModule, ProgressSpinnerModule],
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

  ngOnInit(): void {
    this.truckService.getTrucks().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.trucks.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load trucks. Please try again.');
        this.loading.set(false);
      },
    });
  }

  plateInitials(truck: Truck): string {
    return truck.plateNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  }
}