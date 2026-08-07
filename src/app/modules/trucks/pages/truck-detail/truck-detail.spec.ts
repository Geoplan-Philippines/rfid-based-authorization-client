import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';

import { TruckDetail as TruckDetailModel } from '../../types/truck.types';
import { TruckDetail } from './truck-detail';

const ARCHIVED_TRUCK_WITH_ACTIVE_TAG: TruckDetailModel = {
  id: 'truck-1',
  plateNumber: 'UJF-472',
  model: 'Mater',
  photoUrl: null,
  isArchived: true,
  status: 'ARCHIVED',
  drivers: [],
  boundTag: {
    epcId: 'E2003412016C012345678901',
    status: 'ACTIVE',
  },
  events30d: 0,
  lastEventAt: null,
  lastResult: null,
  recentGateEvents: [],
  createdAt: '2026-06-13T08:29:15.000Z',
};

describe('TruckDetail', () => {
  let component: TruckDetail;
  let fixture: ComponentFixture<TruckDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TruckDetail],
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

    fixture = TestBed.createComponent(TruckDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('distinguishes an archived truck from its still-active RFID credential', () => {
    component.detail.set(ARCHIVED_TRUCK_WITH_ACTIVE_TAG);
    component.loading.set(false);
    component.notFound.set(false);
    fixture.detectChanges();

    const tagLabels = Array.from(
      fixture.nativeElement.querySelectorAll('.p-tag-label') as NodeListOf<HTMLElement>,
      element => element.textContent?.trim(),
    );

    expect(tagLabels).toContain('Archived');
    expect(tagLabels).toContain('Tag: Active');
    expect(tagLabels).not.toContain('Active');
    expect(fixture.nativeElement.textContent).toContain('Tag still active');
    expect(fixture.nativeElement.textContent).toContain('can still open the gate');
  });
});
