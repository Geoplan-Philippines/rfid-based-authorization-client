import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { Drivers } from './drivers';
import { DriverListItem } from './types/driver.types';

describe('Drivers', () => {
  let component: Drivers;
  let fixture: ComponentFixture<Drivers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Drivers],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Drivers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the current server ban in the registry', () => {
    const bannedDriver: DriverListItem = {
      id: 'driver-1',
      driverId: 'DRV-00001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      licenseNumber: 'N01-23-456789',
      photoUrl: null,
      isArchived: false,
      isPermanentlyBanned: true,
      bannedUntil: null,
      isBanned: true,
      trucksCount: 0,
      trucks: [],
      events30d: 0,
      lastEventAt: null,
      createdAt: '2026-09-01T00:00:00.000Z',
    };
    component.drivers.set([bannedDriver]);
    component.loading.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Banned');
    expect(fixture.nativeElement.textContent).toContain('Permanent');
  });

  it('opens the clickable row without a trailing accordion control', () => {
    const driver: DriverListItem = {
      id: 'driver-1',
      driverId: 'DRV-00001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      licenseNumber: 'N01-23-456789',
      photoUrl: null,
      isArchived: false,
      isPermanentlyBanned: false,
      bannedUntil: null,
      isBanned: false,
      trucksCount: 0,
      trucks: [],
      events30d: 0,
      lastEventAt: null,
      createdAt: '2026-09-01T00:00:00.000Z',
    };
    const openDriver = vi.spyOn(component, 'openDriver').mockImplementation(() => {});
    component.drivers.set([driver]);
    component.loading.set(false);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement | null;
    expect(row).not.toBeNull();
    expect(row?.querySelector('.pi-chevron-right')).toBeNull();
    expect(row?.tabIndex).toBe(0);

    row?.click();
    expect(openDriver).toHaveBeenCalledWith('driver-1');

    openDriver.mockClear();
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(openDriver).toHaveBeenCalledWith('driver-1');
  });
});
