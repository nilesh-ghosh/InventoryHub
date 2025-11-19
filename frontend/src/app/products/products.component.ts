import { Component, OnInit, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { DatePipe } from '@angular/common';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category_id: number;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatPaginatorModule,
    MatSortModule,
    DatePipe
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'price', 'category_name', 'image', 'created_at', 'updated_at', 'actions'];
  products: Product[] = [];
  isLoading = false;
  isEditing = false;
  currentProduct: Product | null = null;
  categories: Category[] = [];
  searchQuery = '';
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSize = 5;
  pageIndex = 0;
  totalProducts = 0;
  selectedCreateImageFile: File | undefined = undefined;
  selectedCreateImageName = '';
  selectedEditImageFile: File | undefined = undefined;
  selectedEditImageName = '';
  selectedBulkFile: File | undefined = undefined;
  selectedBulkFileName = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('bulkFileInput') bulkFileInput!: ElementRef;

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
    this.loadProducts();
  }


  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    if (this.pageSize !== event.pageSize) {
      this.pageSize = event.pageSize;
      this.pageIndex = 0;
    }
    this.loadProducts();
  }

  loadCategories(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Category[]>('http://localhost:3000/api/categories', { headers })
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  loadProducts(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    let url = 'http://localhost:3000/api/products';
    const params: string[] = [];

    if (this.searchQuery) {
      params.push(`search=${encodeURIComponent(this.searchQuery)}`);
    }
    if (this.sortBy) {
      params.push(`sortBy=${encodeURIComponent(this.sortBy)}&sortOrder=${encodeURIComponent(this.sortOrder)}`);
    }
    // Add pagination params
    params.push(`page=${this.pageIndex + 1}`);
    params.push(`limit=${this.pageSize}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

   console.debug('Requesting products:', url);

    this.http.get<any>(url, { headers })
      .subscribe({
        next: (res) => {
          const products: Product[] = Array.isArray(res) ? res : (res && Array.isArray(res.products)) ? res.products : [];

          if (!Array.isArray(products)) {
            console.warn('Unexpected products response shape:', res);
            this.products = [];
            this.isLoading = false;
            return;
          }

          products.forEach(product => {
            const category = this.categories.find(c => c.id === product.category_id);
            if (category) {
              product.category_name = category.name;
            }
          });

          this.products = products;
          // Update paginator info from backend response
          if (res && res.pagination) {
            this.totalProducts = res.pagination.total;
            this.pageSize = res.pagination.limit;
            this.pageIndex = res.pagination.page - 1;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.snackBar.open('Error loading products', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  createProduct(name: string, price: number, categoryId: number, imageFile?: File): void {
    if (!name.trim() || !price || !categoryId) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price.toString());
  // Backend expects `categoryId` in the body (see backend/routes/products.js)
  formData.append('categoryId', categoryId.toString());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    this.http.post<Product>('http://localhost:3000/api/products', formData, { headers })
      .subscribe({
        next: (product) => {
          this.snackBar.open('Product created successfully', 'Close', { duration: 3000 });
          this.loadProducts();
          // clear selected create image
          this.selectedCreateImageFile = undefined;
          this.selectedCreateImageName = '';
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.snackBar.open('Error creating product', 'Close', { duration: 3000 });
        }
      });
  }

  updateProduct(product: Product, name: string, price: number, categoryId: number, imageFile?: File): void {
    if (!name.trim() || !price || !categoryId) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price.toString());
  // Backend expects `categoryId` in the body
  formData.append('categoryId', categoryId.toString());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    this.http.put(`http://localhost:3000/api/products/${product.id}`, formData, { headers })
      .subscribe({
        next: () => {
          this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
          this.loadProducts();
          this.cancelEdit();
          // clear selected edit image
          this.selectedEditImageFile = undefined;
          this.selectedEditImageName = '';
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.snackBar.open('Error updating product', 'Close', { duration: 3000 });
        }
      });
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.delete(`http://localhost:3000/api/products/${product.id}`, { headers })
        .subscribe({
          next: () => {
            this.snackBar.open('Product deleted successfully', 'Close', { duration: 3000 });
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.snackBar.open('Error deleting product', 'Close', { duration: 3000 });
          }
        });
    }
  }

  onSearchChange(): void {
    // When searching, reset to first page
    this.pageIndex = 0;
    this.loadProducts();
  }

  onSortChange(): void {
    // When sort changes, reset to first page
    this.pageIndex = 0;
    this.loadProducts();
  }
  

  startEdit(product: Product): void {
    this.isEditing = true;
    this.currentProduct = { ...product };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.currentProduct = null;
  }

  onFileSelected(event: any): File | null {
    const file = event.target.files[0];
    return file || null;
  }

  // Handlers for the create/edit file inputs
  onCreateImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : undefined;
    this.selectedCreateImageFile = file;
    this.selectedCreateImageName = file ? file.name : '';
  }

  onEditImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : undefined;
    this.selectedEditImageFile = file;
    this.selectedEditImageName = file ? file.name : '';
  }

  getObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }

  onBulkFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : undefined;
    this.selectedBulkFile = file;
    this.selectedBulkFileName = file ? file.name : '';
  }
  getImageUrl(product: Product): string | null {
    if (!product || !product.image) return null;
    const img = product.image as string;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('/')) {
      return `http://localhost:3000${img}`;
    }
    
    return `http://localhost:3000/${img}`;
  }

  bulkUploadProducts(): void {
    if (!this.selectedBulkFile) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const formData = new FormData();
    formData.append('file', this.selectedBulkFile);

    this.http.post<any>('http://localhost:3000/api/upload/bulk-products', formData, { headers })
      .subscribe({
        next: (response) => {
          this.snackBar.open(`Bulk upload completed: ${response.processed} products processed`, 'Close', { duration: 5000 });
          this.loadProducts();
          this.selectedBulkFile = undefined;
          this.selectedBulkFileName = '';
        },
        error: (error) => {
          console.error('Bulk upload error:', error);
          this.snackBar.open('Bulk upload failed', 'Close', { duration: 3000 });
        }
      });
  }

  downloadReport(format: 'csv' | 'xlsx'): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get(`http://localhost:3000/api/reports/products?format=${format}`, {
      headers,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_report.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.snackBar.open(`Report downloaded as ${format.toUpperCase()}`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Download report error:', error);
        this.snackBar.open('Failed to download report', 'Close', { duration: 3000 });
      }
    });
  }

  triggerFileInput(): void {
    this.bulkFileInput.nativeElement.click();
  }

}
