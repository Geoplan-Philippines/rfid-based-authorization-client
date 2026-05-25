import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { User } from '../../core/auth/auth.service';
import { UserService } from '../../core/users/user.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

const ROLE_SEVERITY: Record<string, TagSeverity> = {
  admin: 'danger',
  manager: 'warn',
  operator: 'info',
  viewer: 'secondary',
};

@Component({
  selector: 'app-users',
  imports: [TableModule, TagModule, AvatarModule, ProgressSpinnerModule],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class Users implements OnInit {
  private userService = inject(UserService);

  readonly loadingRows = [{}];

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users. Please try again.');
        this.loading.set(false);
      },
    });
  }

  initials(user: User): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  roleSeverity(role: string): TagSeverity {
    return ROLE_SEVERITY[role.toLowerCase()] ?? 'secondary';
  }
}
