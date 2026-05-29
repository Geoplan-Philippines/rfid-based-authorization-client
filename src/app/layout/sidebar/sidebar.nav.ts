export interface NavItem {
  label: string;
  route: string;
  icon: string;
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
      { label: 'Live Gate', route: '/gate-monitoring', icon: 'pi-sync' },
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
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Users', route: '/users', icon: 'pi-users' },
    ],
  },
];
