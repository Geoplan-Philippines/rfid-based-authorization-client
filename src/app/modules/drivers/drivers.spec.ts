import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Drivers } from './drivers';

describe('Drivers', () => {
  let component: Drivers;
  let fixture: ComponentFixture<Drivers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Drivers],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compile();

    fixture = TestBed.createComponent(Drivers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});