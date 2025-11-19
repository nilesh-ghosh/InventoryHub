import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    DatePipe
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})

export class CategoriesComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'created_at', 'updated_at', 'actions'];
  dataSource = new MatTableDataSource<Category>();
  isLoading = false;
  isEditing = false;
  currentCategory: Category | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  goToDashboard(): void {
    window.location.href = '/dashboard';
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Category[]>('http://localhost:3000/api/categories', { headers })
      .subscribe({
        next: (categories) => {
          this.dataSource.data = categories;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.snackBar.open('Error loading categories', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  createCategory(name: string): void {
    if (!name.trim()) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<Category>('http://localhost:3000/api/categories', { name }, { headers })
      .subscribe({
        next: (category) => {
          this.snackBar.open('Category created successfully', 'Close', { duration: 3000 });
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.snackBar.open('Error creating category', 'Close', { duration: 3000 });
        }
      });
  }

  updateCategory(category: Category, name: string): void {
    if (!name.trim()) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put(`http://localhost:3000/api/categories/${category.id}`, { name }, { headers })
      .subscribe({
        next: () => {
          this.snackBar.open('Category updated successfully', 'Close', { duration: 3000 });
          this.loadCategories();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.snackBar.open('Error updating category', 'Close', { duration: 3000 });
        }
      });
  }

  deleteCategory(category: Category): void {
    if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.delete(`http://localhost:3000/api/categories/${category.id}`, { headers })
        .subscribe({
          next: () => {
            this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
            this.loadCategories();
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.snackBar.open('Error deleting category', 'Close', { duration: 3000 });
          }
        });
    }
  }

  startEdit(category: Category): void {
    this.isEditing = true;
    this.currentCategory = { ...category };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.currentCategory = null;
  }
}
