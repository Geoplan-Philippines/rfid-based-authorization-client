export interface NavItem {
  label: string;
  route: string;
  icon: string;
  /** When true, the item is shown but disabled with a "Coming soon" badge. */
  comingSoon?: boolean;
  /**
   * When true, the item is hidden unless the signed-in user is a `SUPER_ADMIN`.
   * Rendering it for anyone else would send them to a screen of 403s.
   */
  superAdminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Dashboard', route: '/dashboard', icon: 'pi-chart-bar' },
      { label: 'Live Gate', route: '/gate-monitoring', icon: 'pi-sync', comingSoon: true },
      { label: 'Transactions', route: '/transactions', icon: 'pi-receipt' },
      { label: 'CCTV Feeds', route: '/cctv', icon: 'pi-video' },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { label: 'Audit Logs', route: '/audit', icon: 'pi-history' },
      { label: 'Reports', route: '/reports', icon: 'pi-file-pdf' },
    ],
  },
  {
    title: 'Registry',
    items: [
      { label: 'Drivers', route: '/drivers', icon: 'pi-id-card' },
      { label: 'Trucks', route: '/trucks', icon: 'pi-truck' },
      { label: 'RFID Tags', route: '/rfid-tags', icon: 'pi-tags' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Users', route: '/users', icon: 'pi-users', superAdminOnly: true },
    ],
  },
];
