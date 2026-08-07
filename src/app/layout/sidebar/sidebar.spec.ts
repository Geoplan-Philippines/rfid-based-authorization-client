import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LayoutService } from '../layout.service';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('positions the mobile drawer below the app header', () => {
    const layoutService = TestBed.inject(LayoutService);
    layoutService.sidebarOpen.set(true);
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('aside') as HTMLElement;
    const backdrop = fixture.nativeElement.querySelector('[data-testid="sidebar-backdrop"]') as HTMLElement;

    expect(drawer.classList).toContain('fixed');
    expect(drawer.classList).toContain('top-16');
    expect(drawer.classList).toContain('bottom-0');
    expect(drawer.classList).not.toContain('inset-y-0');
    expect(backdrop.classList).toContain('top-16');
  });
});
