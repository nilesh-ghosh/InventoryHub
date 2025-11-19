import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UsersCreateDialogComponent } from './users-create-dialog.component';
import { UsersEditDialogComponent } from './users-edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    UsersCreateDialogComponent,
    UsersEditDialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['id', 'email', 'created_at', 'updated_at', 'actions'];
  dataSource = new MatTableDataSource<User>();
  isLoading = false;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
    , private cd: ChangeDetectorRef
  ) {}

  goToDashboard(): void {
    window.location.href = '/dashboard';
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UsersCreateDialogComponent, {
      width: '420px'
    });

    ref.afterClosed().subscribe((created: boolean) => {
      if (created) this.loadUsers();
    });
  }

  openEditDialog(user: any): void {
    const ref = this.dialog.open(UsersEditDialogComponent, {
      width: '420px',
      data: { id: user.id, email: user.email }
    });

    ref.afterClosed().subscribe((updated: boolean) => {
      if (updated) this.loadUsers();
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<User[]>('http://localhost:3000/api/users', { headers })
      .subscribe({
        next: (users) => {
          this.dataSource.data = users;
          this.isLoading = false;
          // In case the app is using zoneless or change detection was missed,
          // ensure the view is updated.
          try { this.cd.detectChanges(); } catch (e) { /* noop */ }
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
          this.isLoading = false;
          try { this.cd.detectChanges(); } catch (e) { /* noop */ }
        }
      });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.delete(`http://localhost:3000/api/users/${user.id}`, { headers })
        .subscribe({
          next: () => {
            this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
          }
        });
    }
  }
}
