import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserService } from '../../services/user.service';
import {
  CreateUserPayload,
  DEFAULT_CREATE_ROLE,
  EDITABLE_ROLES,
  ROLES,
  Role,
  User,
  displayName,
} from '../../types/user.types';
import {
  UserFormValue,
  buildUpdatePayload,
  isEmptyPayload,
  roleLabel,
  userRoleTag,
} from '../../utils/user-display';
import { FieldErrors, fieldErrorsFrom, generalMessages, statusOf } from '../../utils/api-errors';
import { copyToClipboard, generatePassword } from '../../utils/password';

interface RoleOption {
  label: string;
  value: Role;
}

/** What the operator must hand over after a password was set. Shown once. */
interface Handover {
  email: string;
  password: string;
  created: boolean;
}

@Component({
  selector: 'app-user-form-dialog',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, TagModule],
  templateUrl: './user-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialog {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notifications = inject(NotificationService);
  private authService = inject(AuthService);

  visible = model(false);
  mode = input<'create' | 'edit'>('create');
  user = input<User | null>(null);

  saved = output<void>();

  protected readonly userRoleTag = userRoleTag;

  saving = signal(false);
  passwordVisible = signal(false);
  /** Field-level messages returned by the API, merged with client validation. */
  serverErrors = signal<FieldErrors>({});
  serverNotice = signal<string | null>(null);
  handover = signal<Handover | null>(null);

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: [DEFAULT_CREATE_ROLE as Role | null],
  });

  isEdit = computed(() => this.mode() === 'edit');

  /** Editing your own account: the API rejects a self role change (§8). */
  isSelf = computed(() => {
    const target = this.user();
    return !!target && target.id === this.authService.currentUserId();
  });

  /** `PATCH` can never set `SUPER_ADMIN`, so edit offers only the demotable roles (§8). */
  roleOptions = computed<RoleOption[]>(() => {
    const roles = this.isEdit() ? EDITABLE_ROLES : ROLES;
    return roles.map(role => ({ label: roleLabel(role), value: role }));
  });

  /** A super admin being edited has no valid `role` value to preselect. */
  editingSuperAdmin = computed(() => this.isEdit() && this.user()?.role === 'SUPER_ADMIN');

  roleDisabled = computed(() => this.isSelf());

  title = computed(() => {
    if (!this.isEdit()) return 'Add user';
    const target = this.user();
    return target ? `Edit ${displayName(target)}` : 'Edit user';
  });

  passwordLabel = computed(() => (this.isEdit() ? 'Reset password' : 'Password'));

  onShow(): void {
    this.passwordVisible.set(false);
    this.serverErrors.set({});
    this.serverNotice.set(null);
    this.handover.set(null);
    this.saving.set(false);

    const target = this.user();
    const editing = this.isEdit() && !!target;

    // Password is required on create; on edit it stays blank and is sent only if filled.
    this.form.controls.password.setValidators(
      editing ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)],
    );

    this.form.reset({
      firstName: editing ? (target!.firstName ?? '') : '',
      lastName: editing ? (target!.lastName ?? '') : '',
      email: editing ? target!.email : '',
      password: '',
      // A super admin cannot be re-assigned their own role here, so start empty and
      // treat "left empty" as "no role change".
      role: editing ? (target!.role === 'SUPER_ADMIN' ? null : target!.role) : DEFAULT_CREATE_ROLE,
    });

    if (this.roleDisabled()) {
      this.form.controls.role.disable({ emitEvent: false });
    } else {
      this.form.controls.role.enable({ emitEvent: false });
    }

    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
  }

  /** Server-side field errors are stale the moment the operator edits that field. */
  clearServerError(field: keyof FieldErrors): void {
    if (!this.serverErrors()[field]) return;
    this.serverErrors.update(errors => ({ ...errors, [field]: undefined }));
  }

  errorFor(field: 'firstName' | 'lastName' | 'email' | 'password' | 'role'): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;

    const control = this.form.controls[field];
    if (!control.touched || control.valid) return null;

    if (control.hasError('required')) {
      return field === 'email' ? 'Email is required.' : 'Password is required.';
    }
    if (control.hasError('email')) return 'Enter a valid email address.';
    if (control.hasError('minlength')) return 'Password must be at least 8 characters.';
    if (control.hasError('maxlength')) {
      return `${field === 'firstName' ? 'First' : 'Last'} name must be 100 characters or fewer.`;
    }
    return null;
  }

  togglePasswordVisible(): void {
    this.passwordVisible.update(visible => !visible);
  }

  generate(): void {
    this.form.controls.password.setValue(generatePassword());
    this.form.controls.password.markAsTouched();
    this.passwordVisible.set(true);
    this.clearServerError('password');
  }

  async copyPassword(value: string): Promise<void> {
    const copied = await copyToClipboard(value);
    if (copied) {
      this.notifications.success('Password copied to clipboard.', 'Copied');
    } else {
      this.notifications.error('Could not access the clipboard. Select the password and copy it manually.');
    }
  }

  submit(): void {
    if (this.saving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverErrors.set({});
    this.serverNotice.set(null);

    const raw = this.form.getRawValue();
    const value: UserFormValue = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      password: raw.password,
      role: raw.role,
    };

    const target = this.user();
    if (this.isEdit() && target) {
      this.submitEdit(value, target);
    } else {
      this.submitCreate(value);
    }
  }

  private submitCreate(value: UserFormValue): void {
    // Built explicitly: `forbidNonWhitelisted` rejects any property not in the DTO (§7).
    const payload: CreateUserPayload = {
      email: value.email.trim().toLowerCase(),
      password: value.password,
    };
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();
    if (firstName) payload.firstName = firstName;
    if (lastName) payload.lastName = lastName;
    if (value.role) payload.role = value.role;

    this.saving.set(true);
    this.userService.create(payload).subscribe({
      next: user => {
        this.saving.set(false);
        this.notifications.success('User created');
        this.saved.emit();
        this.handover.set({ email: user.email, password: value.password, created: true });
      },
      error: error => this.handleError(error, 'Failed to create user.'),
    });
  }

  private submitEdit(value: UserFormValue, target: User): void {
    const payload = buildUpdatePayload(value, target);

    // `{}` would come back as 400 "At least one user field is required" (§8).
    if (isEmptyPayload(payload)) {
      this.notifications.info('No changes to save.');
      this.visible.set(false);
      return;
    }

    this.saving.set(true);
    this.userService.update(target.id, payload).subscribe({
      next: user => {
        this.saving.set(false);
        this.notifications.success('User updated');
        this.saved.emit();

        if (payload.password) {
          this.handover.set({ email: user.email, password: payload.password, created: false });
        } else {
          this.visible.set(false);
        }
      },
      error: error => this.handleError(error, 'Failed to update user.'),
    });
  }

  private handleError(error: unknown, fallback: string): void {
    this.saving.set(false);

    const status = statusOf(error);
    const fieldErrors = fieldErrorsFrom(error);

    if (status === 409) {
      const messages = generalMessages(error);
      const message = messages[0] ?? '';

      if (message.toLowerCase().includes('email')) {
        // The email may belong to an archived account that should be restored instead (§8).
        this.serverErrors.update(errors => ({ ...errors, email: 'Email already in use' }));
        this.serverNotice.set(
          'That email is already taken. It may belong to an archived account — turn on "Show archived" in the list to find and restore it.',
        );
        this.focusEmail();
        return;
      }

      this.serverNotice.set(message || fallback);
      return;
    }

    if (Object.keys(fieldErrors).length) {
      this.serverErrors.set(fieldErrors);
      const leftovers = generalMessages(error);
      if (leftovers.length) this.serverNotice.set(leftovers.join(' '));
      return;
    }

    // 403 business rules and anything else: surface the backend's own wording.
    const messages = generalMessages(error);
    if (messages.length) {
      this.serverNotice.set(messages.join(' '));
      return;
    }

    this.notifications.fromHttpError(error, fallback);
  }

  private focusEmail(): void {
    queueMicrotask(() => document.getElementById('user-email')?.focus());
  }

  finishHandover(): void {
    this.handover.set(null);
    this.visible.set(false);
  }

  onHide(): void {
    // Closing via mask/escape while a handover is pending must not strand the state.
    this.handover.set(null);
    this.saving.set(false);
  }
}
