import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../layout.service';
import { NAV_SECTIONS, NavSection } from './sidebar.nav';

const ITEM_BASE =
  'flex items-center gap-3 px-3 py-2 text-sm transition-colors border-l-2 cursor-pointer';
const ITEM_INACTIVE =
  'border-transparent text-body hover:bg-foreground/5 hover:text-heading';
const ITEM_ACTIVE =
  'border-primary bg-primary/10 text-primary font-medium';
const ITEM_DISABLED =
  'border-transparent text-body/40 cursor-not-allowed select-none';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Sidebar {
  protected readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);

  /** Role-gated items are dropped, and a section left empty disappears with them. */
  protected readonly navSections = computed<NavSection[]>(() => {
    const isSuperAdmin = this.authService.isSuperAdmin();

    return NAV_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(item => !item.superAdminOnly || isSuperAdmin),
    })).filter(section => section.items.length > 0);
  });

  protected readonly itemBase = ITEM_BASE;
  protected readonly itemInactive = ITEM_INACTIVE;
  protected readonly itemActive = ITEM_ACTIVE;
  protected readonly itemDisabled = ITEM_DISABLED;
}
