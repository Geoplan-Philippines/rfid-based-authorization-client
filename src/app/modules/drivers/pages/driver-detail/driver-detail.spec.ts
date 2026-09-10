import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';

import { DriverService } from '../../services/driver.service';
import { DriverDetail as DriverDetailModel } from '../../types/driver.types';
import { DriverDetail } from './driver-detail';

const BANNED_DRIVER: DriverDetailModel = {
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
  trucks: [],
  events30d: 0,
  denials30d: 0,
  lastEventAt: null,
  lastResult: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  recentGateEvents: [],
};

describe('DriverDetail ban controls', () => {
  let component: DriverDetail;
  let fixture: ComponentFixture<DriverDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverDetail],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        ConfirmationService,
        MessageService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.detail.set(BANNED_DRIVER);
    component.loading.set(false);
    component.notFound.set(false);
    fixture.detectChanges();
  });

  it('shows the current driver ban and both available controls', () => {
    expect(fixture.nativeElement.textContent).toContain('Permanent ban');
    expect(fixture.nativeElement.textContent).toContain('Lift ban');
    expect(fixture.nativeElement.textContent).toContain('Change ban');
  });

  it('shows the current server driver id', () => {
    expect(fixture.nativeElement.textContent).toContain('DRV-00001');
    expect(fixture.nativeElement.textContent).not.toContain('driver-1');
  });

  it('applies a timed ban from the driver controls', () => {
    const driverService = TestBed.inject(DriverService);
    const ban = vi.spyOn(driverService, 'ban').mockReturnValue(
      of({
        id: 'driver-1',
        isPermanentlyBanned: false,
        bannedUntil: '2026-12-31T00:00:00.000Z',
      }),
    );
    component.banVisible.set(true);

    component.onBanRequested({ isPermanent: false, until: '2026-12-31' });

    expect(ban).toHaveBeenCalledWith('driver-1', { isPermanent: false, until: '2026-12-31' });
    expect(component.banVisible()).toBe(false);
  });

  it('lifts the current driver ban from the driver controls', () => {
    const driverService = TestBed.inject(DriverService);
    const liftBan = vi.spyOn(driverService, 'liftBan').mockReturnValue(
      of({
        id: 'driver-1',
        isPermanentlyBanned: false,
        bannedUntil: null,
      }),
    );
    const confirmationService = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmationService, 'confirm').mockImplementation(confirmation => {
      confirmation.accept?.();
      return confirmationService;
    });

    component.confirmLiftBan();

    expect(liftBan).toHaveBeenCalledWith('driver-1');
  });
});
