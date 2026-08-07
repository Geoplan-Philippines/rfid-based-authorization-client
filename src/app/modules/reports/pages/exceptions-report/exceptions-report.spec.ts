import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ExceptionsReport } from './exceptions-report';

describe('ExceptionsReport', () => {
  let component: ExceptionsReport;
  let fixture: ComponentFixture<ExceptionsReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExceptionsReport],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExceptionsReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
