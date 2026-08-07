import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Eagle Cement product lockup', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('img[alt="Eagle Cement"]')).toBeTruthy();
    expect(compiled.querySelector('.product-name')?.textContent).toContain('Gate Authorization');
  });
});
