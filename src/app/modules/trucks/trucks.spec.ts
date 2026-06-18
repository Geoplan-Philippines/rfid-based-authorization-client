import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Trucks } from './trucks';

describe('Trucks', () => {
  let component: Trucks;
  let fixture: ComponentFixture<Trucks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trucks],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Trucks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
