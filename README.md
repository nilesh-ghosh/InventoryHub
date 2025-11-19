 InventoryHub

InventoryHub is a full-stack web application for managing inventory, including users, categories, and products. It features user authentication, CRUD operations, bulk uploads, report generation, and a responsive dashboard.

 Table of Contents
- [Project Overview](project-overview)
- [Architecture](architecture)
- [Workflow](workflow)
- [Setup Instructions](setup-instructions)
- [Running the Application](running-the-application)
- [Improvements](improvements)

 Project Overview
InventoryHub allows administrators to manage users, product categories, and products in an inventory system. Key features include:
- User authentication (login/register)
- CRUD operations for users, categories, and products
- Bulk product upload via CSV/Excel
- Report generation (CSV/XLSX downloads)
- Pagination, search, and sorting for products
- Image upload for products
- Responsive Angular frontend with Material UI

 Architecture
The application is built with a client-server architecture:

 Backend
- Technology: Node.js with Express.js
- Database: MySQL
- Responsibilities:
  - API endpoints for authentication, users, categories, products, uploads, and reports
  - JWT-based authentication
  - File upload handling (multer)
  - Data validation and business logic
  - Serving static files (uploaded images)

 Frontend
- Technology: Angular with Angular Material
- Responsibilities:
  - User interface for login, dashboard, and management pages
  - HTTP client for API communication
  - Form handling, validation, and user interactions
  - Routing between pages

 Database
- Technology: MySQL
- Schema: Defined in `database/schema.sql`
- Tables: users, categories, products

 Workflow
1. Authentication: Users log in via the frontend, which sends credentials to the backend. JWT tokens are issued for session management.
2. Dashboard: After login, users see cards for Users, Categories, and Products. Clicking navigates to respective management pages.
3. Management Pages:
   - Users: Create, edit, delete users.
   - Categories: Create, edit, delete categories.
   - Products: Create, edit, delete products; bulk upload; search/sort; download reports.
4. Data Flow: Frontend makes HTTP requests to backend APIs, which query/update the database and return responses.
5. File Handling: Images are uploaded to the backend and stored in `backend/uploads/`. Reports are generated and downloaded.

 Setup Instructions
 Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MySQL (for database)

 Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd InventoryHub
   ```

2. Set up the backend:
   ```
   cd backend
   npm install
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

4. Set up the database:
   - Run the schema script:
     ```
     MySQL database/inventory.db < database/schema.sql
     ```
   - Or use the provided setup if available.

 Running the Application
1. Start the backend server:
   ```
   cd backend
   npm start
   ```
   - Server runs on http://localhost:3000

2. Start the frontend:
   ```
   cd frontend
   ng serve
   ```
   - Frontend runs on http://localhost:4200

3. Open http://localhost:4200 in your browser and log in.

 Testing
- Use Postman collection (`postman_collection.json`) for API testing.
- Sample data: `sample_products.csv` for bulk upload.

 Improvements
Since this project was built quickly, here are areas for enhancement:

 Security
- Implement password hashing (currently plain text in DB).
- Add input sanitization and validation.
- Use HTTPS in production.
- Implement rate limiting and CORS properly.

 Performance
- Add caching for frequent queries.
- Optimize database queries with indexes.
- Implement lazy loading for images.
- Use pagination for all lists to handle large datasets.

 User Experience
- Add loading indicators for all async operations.
- Implement error handling with user-friendly messages.
- Add confirmation dialogs for destructive actions.
- Improve mobile responsiveness.

This documentation provides a foundation; expand as needed for future development.
