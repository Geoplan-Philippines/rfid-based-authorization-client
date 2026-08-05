import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Transactions } from './transactions';

describe('Transactions', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps transaction values on one line inside the table scroll container', () => {
    component.loading.set(false);
    component.transactions.set([
      {
        id: 'tx-1',
        eventCode: 'GATE-20260613-0004',
        occurredAt: '2026-06-13T08:29:15.000Z',
        result: 'MANUAL_OVERRIDE',
        rfidTag: {
          epcId: 'E2003412016C012345678901',
          status: 'ACTIVE',
        },
        plateRead: 'NAX-518',
        plateMismatch: true,
        truck: {
          plateNumber: 'UJF-472',
          model: 'Mater',
        },
        truckInRegistry: true,
        driver: {
          firstName: 'Ramon',
          lastName: 'Reyes',
        },
        isOpen: false,
      },
    ]);
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    const scrollContainer = table.parentElement;

    expect(table.classList).toContain('min-w-max');
    expect(table.classList).toContain('whitespace-nowrap');
    expect(scrollContainer?.style.overflow).toBe('auto');
  });
});
