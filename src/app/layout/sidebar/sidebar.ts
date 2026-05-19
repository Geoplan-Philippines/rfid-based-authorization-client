import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';
import { NAV_SECTIONS } from './sidebar.nav';

const ITEM_BASE =
  'flex items-center gap-3 px-3 py-2 text-sm transition-colors border-l-2 cursor-pointer';
const ITEM_INACTIVE =
  'border-transparent text-body hover:bg-foreground/5 hover:text-heading';
const ITEM_ACTIVE =
  'border-primary bg-primary/10 text-primary font-medium';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Sidebar {
  protected readonly layoutService = inject(LayoutService);
  protected readonly navSections = NAV_SECTIONS;
  protected readonly itemBase = ITEM_BASE;
  protected readonly itemInactive = ITEM_INACTIVE;
  protected readonly itemActive = ITEM_ACTIVE;
}
