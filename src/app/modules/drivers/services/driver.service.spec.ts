import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../../environments/environment';
import { BanMutationResult } from '../../../shared/types/ban';
import { DriverService } from './driver.service';

describe('DriverService contracts', () => {
  let service: DriverService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DriverService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the server permanent-ban payload', () => {
    const result: BanMutationResult = {
      id: 'driver-1',
      isPermanentlyBanned: true,
      bannedUntil: null,
    };
    let response: BanMutationResult | undefined;

    service.ban('driver-1', { isPermanent: true }).subscribe(value => (response = value));

    const request = http.expectOne(`${environment.apiBaseUrl}/drivers/driver-1/ban`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ isPermanent: true });
    request.flush({ statusCode: 201, message: 'Created', data: result });

    expect(response).toEqual(result);
  });

  it('posts the server timed-ban payload with an inclusive calendar date', () => {
    const result: BanMutationResult = {
      id: 'driver-1',
      isPermanentlyBanned: false,
      bannedUntil: '2026-12-31T00:00:00.000Z',
    };
    let response: BanMutationResult | undefined;

    service
      .ban('driver-1', { isPermanent: false, until: '2026-12-31' })
      .subscribe(value => (response = value));

    const request = http.expectOne(`${environment.apiBaseUrl}/drivers/driver-1/ban`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ isPermanent: false, until: '2026-12-31' });
    request.flush({ statusCode: 201, message: 'Created', data: result });

    expect(response).toEqual(result);
  });

  it('posts an empty body to the server lift-ban endpoint', () => {
    const result: BanMutationResult = {
      id: 'driver-1',
      isPermanentlyBanned: false,
      bannedUntil: null,
    };
    let response: BanMutationResult | undefined;

    service.liftBan('driver-1').subscribe(value => (response = value));

    const request = http.expectOne(`${environment.apiBaseUrl}/drivers/driver-1/lift-ban`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ statusCode: 201, message: 'Created', data: result });

    expect(response).toEqual(result);
  });

  it('posts the locked driver id through the server create contract', () => {
    const payload = {
      driverId: 'DRV-00001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      licenseNumber: 'N01-23-456789',
    };
    let responseDriverId: string | undefined;

    service.create(payload).subscribe(value => (responseDriverId = value.driverId));

    const request = http.expectOne(`${environment.apiBaseUrl}/drivers`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      statusCode: 201,
      message: 'Created',
      data: {
        id: 'driver-1',
        ...payload,
        photoUrl: null,
        isArchived: false,
        createdAt: '2026-09-09T00:00:00.000Z',
        updatedAt: '2026-09-09T00:00:00.000Z',
      },
    });

    expect(responseDriverId).toBe('DRV-00001');
  });
});
