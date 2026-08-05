import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Auth } from './auth';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should identify the product as Eagle Cement Gate Authorization', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('img[alt="Eagle Cement"]')).toBeTruthy();
    expect(compiled.querySelector('.product-name')?.textContent).toContain('Gate Authorization');
  });
});
