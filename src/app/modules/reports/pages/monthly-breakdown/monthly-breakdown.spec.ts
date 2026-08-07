import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { MonthlyBreakdown } from './monthly-breakdown';

describe('MonthlyBreakdown', () => {
  let component: MonthlyBreakdown;
  let fixture: ComponentFixture<MonthlyBreakdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyBreakdown],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyBreakdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
