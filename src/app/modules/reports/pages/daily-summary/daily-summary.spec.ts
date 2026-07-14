import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DailySummary } from './daily-summary';

describe('DailySummary', () => {
  let component: DailySummary;
  let fixture: ComponentFixture<DailySummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailySummary],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DailySummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
