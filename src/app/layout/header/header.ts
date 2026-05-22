import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  protected authService = inject(AuthService);
  protected layoutService = inject(LayoutService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
