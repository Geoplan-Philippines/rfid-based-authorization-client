import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { Trucks } from './trucks';
import { TruckListItem } from './types/truck.types';

describe('Trucks', () => {
  let component: Trucks;
  let fixture: ComponentFixture<Trucks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trucks],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Trucks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the current server ban in the registry', () => {
    const bannedTruck: TruckListItem = {
      id: 'truck-1',
      plateNumber: 'ABC-123',
      model: 'Volvo FH',
      photoUrl: null,
      isArchived: false,
      isPermanentlyBanned: true,
      bannedUntil: null,
      isBanned: true,
      drivers: [],
      driversCount: 0,
      boundTag: null,
      events30d: 0,
      lastEventAt: null,
    };
    component.trucks.set([bannedTruck]);
    component.loading.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Banned');
    expect(fixture.nativeElement.textContent).toContain('Permanent');
  });
});
