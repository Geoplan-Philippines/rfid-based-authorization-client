import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PeakHours } from './peak-hours';

describe('PeakHours', () => {
  let component: PeakHours;
  let fixture: ComponentFixture<PeakHours>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeakHours],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PeakHours);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
