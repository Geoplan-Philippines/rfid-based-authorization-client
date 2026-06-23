import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../core/auth/auth.service';

interface ErrorMessage {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail: string;
}

@Component({
  selector: 'app-auth',
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessages = signal<ErrorMessage[]>([]);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessages.set([]);

    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Security Auditor Note:
        // Proper handling of tokens (e.g., storing in HttpOnly cookies instead of localStorage)
        // is recommended to mitigate XSS attacks.
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Security Auditor Note:
        // Do not expose verbose error details to the user to prevent enumeration attacks.
        this.errorMessages.set([
          { severity: 'error', summary: 'Error', detail: 'Invalid credentials or server error.' }
        ]);
        console.error('Login failed', err);
      }
    });
  }
}
