import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../core/auth/auth.service';
import { displayName, userInitials } from '../../core/types/user.types';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, ButtonModule, AvatarModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);

  // Both name parts are nullable, so these go through the shared helpers rather
  // than interpolating directly — otherwise a nameless account renders "null null".
  protected displayName = computed(() => {
    const user = this.authService.currentUser();
    return user ? displayName(user) : null;
  });

  protected initials = computed(() => {
    const user = this.authService.currentUser();
    return user ? userInitials(user) : '?';
  });

  protected toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
