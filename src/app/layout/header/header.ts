import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-header',
  imports: [ButtonModule, AvatarModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);

  protected displayName = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    const full = `${user.firstName} ${user.lastName}`.trim();
    return full || user.email;
  });

  protected initials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '?';
    const first = user.firstName?.trim()?.[0] ?? '';
    const last = user.lastName?.trim()?.[0] ?? '';
    return (first + last).toUpperCase() || (user.email?.[0]?.toUpperCase() ?? '?');
  });

  protected toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
