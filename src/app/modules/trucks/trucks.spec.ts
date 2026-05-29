import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Trucks } from './trucks';

describe('Trucks', () => {
  let component: Trucks;
  let fixture: ComponentFixture<Trucks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trucks],
    }).compile();

    fixture = TestBed.createComponent(Trucks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});