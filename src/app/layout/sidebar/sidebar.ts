import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../layout.service';
import { NAV_SECTIONS, NavSection } from './sidebar.nav';
import { ScrollArea } from '../../shared/ui/scroll-area/scroll-area';

const ITEM_BASE =
  'flex items-center gap-3 px-3 py-2 text-sm transition-colors border-l-2 cursor-pointer';
const ITEM_INACTIVE =
  'border-transparent text-body hover:bg-foreground/5 hover:text-heading';
const ITEM_ACTIVE =
  'border-primary bg-primary/10 text-primary font-medium';
const ITEM_DISABLED =
  'border-transparent text-body/40 cursor-not-allowed select-none';

const COLLAPSED_SECTIONS_KEY = 'eagle-cement.sidebar.collapsedSections';

function loadCollapsedSections(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLAPSED_SECTIONS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-sidebar',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, ScrollArea],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);

  /** Titles of collapsible sections currently collapsed; persisted across reloads. */
  private readonly collapsedTitles = signal<readonly string[]>(loadCollapsedSections());
  protected readonly collapsedSections = computed(() => {
    const collapsibleTitles = new Set(NAV_SECTIONS.filter(s => s.collapsible).map(s => s.title));
    return new Set(this.collapsedTitles().filter(title => collapsibleTitles.has(title)));
  });

  protected toggleSection(title: string): void {
    const next = new Set(this.collapsedTitles());
    if (next.has(title)) {
      next.delete(title);
    } else {
      next.add(title);
    }
    const titles = [...next];
    this.collapsedTitles.set(titles);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(titles));
    }
  }

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
