import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './users-create-dialog.component.html',
  styleUrls: ['./users-create-dialog.component.css']
})
export class UsersCreateDialogComponent {
  form: any;

  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<UsersCreateDialogComponent>
  ) {
    // initialize form using injected FormBuilder to avoid using `this.fb` in field initializer order
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.isSubmitting = true;
    const payload = this.form.value;

    this.http.post('http://localhost:3000/api/auth/register', payload)
      .subscribe({
        next: () => {
          this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
          this.isSubmitting = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Create user error:', err);
          const msg = err.error?.error || 'Failed to create user';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
          this.isSubmitting = false;
        }
      });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
