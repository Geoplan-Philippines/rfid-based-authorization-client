import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { DriverService } from './services/driver.service';
import { Driver } from './types/driver.types';

@Component({
  selector: 'app-drivers',
  imports: [TableModule, AvatarModule, ProgressSpinnerModule],
  templateUrl: './drivers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Drivers implements OnInit {
  private driverService = inject(DriverService);

  drivers = signal<Driver[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.driverService.getDrivers().subscribe({
      next: (data) => {
        this.drivers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load drivers. Please try again.');
        this.loading.set(false);
      },
    });
  }

  initials(driver: Driver): string {
    return `${driver.firstName?.[0] ?? ''}${driver.lastName?.[0] ?? ''}`.toUpperCase();
  }
}