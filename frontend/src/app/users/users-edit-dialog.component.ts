import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-edit-dialog',
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
  templateUrl: './users-edit-dialog.component.html',
  styleUrls: ['./users-edit-dialog.component.css']
})
export class UsersEditDialogComponent {
  form: any;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<UsersEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      email: [data?.email || '', [Validators.required, Validators.email]],
      password: ['', []]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.isSubmitting = true;
    const payload: any = { email: this.form.value.email };
    if (this.form.value.password) payload.password = this.form.value.password;

    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    this.http.put(`http://localhost:3000/api/users/${this.data.id}`, payload, { headers })
      .subscribe({
        next: () => {
          this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
          this.isSubmitting = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Update user error:', err);
          const msg = err.error?.error || 'Failed to update user';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
          this.isSubmitting = false;
        }
      });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
