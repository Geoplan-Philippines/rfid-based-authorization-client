import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { TransactionDetail } from './transaction-detail';

describe('TransactionDetail', () => {
  let component: TransactionDetail;
  let fixture: ComponentFixture<TransactionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionDetail],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
