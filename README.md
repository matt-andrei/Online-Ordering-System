# Online Ordering System for La-Plaza Pharmacy

A comprehensive pharmacy management system built with React and Django

**Features**

- Admin and Pharmacy Staff Dashboard
- User Management
- Order Management
- Product Management
- Inventory Management
- Reports Management
- Product Catalog

## Default Admin Credentials

- Username: admin
- Password: admin

## Default Customer Credentials

- Username: samplecustomer
- Password: cust

## Default Staff Credentials

- Username: sampleStaff
- Password: staff

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd proj_backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:

   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Run migrations:

   ```bash
   python manage.py migrate
   ```

6. Create a superuser:

   ```bash
   python manage.py createsuperuser
   ```

7. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd myProject
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Accessing the System

1. Backend API: http://127.0.0.1:8000
2. Frontend Application: http://localhost:3000

### Backend Development

- API endpoints are documented in the Django REST Framework interface
- API documentation available at http://127.0.0.1:8000/api/

### Frontend Development

- React components are organized in the `src/components` directory
- Context providers are in the `src/context` directory
- API calls are made using Axios
