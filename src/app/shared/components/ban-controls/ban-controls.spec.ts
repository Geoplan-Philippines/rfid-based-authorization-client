import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BanRequest, BanState } from '../../types/ban';
import { BanControls } from './ban-controls';

const PERMANENT_BAN: BanState = {
  isPermanentlyBanned: true,
  bannedUntil: null,
  isBanned: true,
};

describe('BanControls', () => {
  let component: BanControls;
  let fixture: ComponentFixture<BanControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BanControls] }).compileComponents();

    fixture = TestBed.createComponent(BanControls);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('state', PERMANENT_BAN);
    fixture.componentRef.setInput('entityLabel', 'truck');
    fixture.componentRef.setInput('subjectLabel', 'ABC-123');
    fixture.detectChanges();
  });

  it('shows the current server ban and lift control', () => {
    expect(fixture.nativeElement.textContent).toContain('Permanent ban');
    expect(fixture.nativeElement.textContent).toContain('Banned');

    let lifted = false;
    component.liftRequested.subscribe(() => (lifted = true));
    const liftButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find(button => button.textContent?.includes('Lift ban'));

    liftButton?.click();
    expect(lifted).toBe(true);
  });

  it('emits the exact permanent-ban request body', () => {
    let request: BanRequest | undefined;
    component.banRequested.subscribe(value => (request = value));

    component['mode'].set('permanent');
    component['submit']();

    expect(request).toEqual({ isPermanent: true });
  });

  it('emits the exact timed-ban request body as a local calendar date', () => {
    let request: BanRequest | undefined;
    component.banRequested.subscribe(value => (request = value));

    component['mode'].set('timed');
    component['untilDate'].set(new Date(2026, 11, 31));
    component['submit']();

    expect(request).toEqual({ isPermanent: false, until: '2026-12-31' });
  });
});
