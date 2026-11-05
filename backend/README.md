# Find Your Vibe – Laravel Backend

## Prerequisites
- PHP 8.3+
- Composer 2+
- MySQL 8+

## Setup

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Configure .env: set DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Create storage link
php artisan storage:link

# Start development server
php artisan serve --port=8000
```

## Default Credentials

**Super Admin:**
- Email: admin@findyourvibe.com
- Password: Admin@123

**Sample Users:**
- Email: priya@example.com (and others)
- Password: Password@123

## API Base URL
http://localhost:8000/api/v1

## Authentication
All protected routes require: `Authorization: Bearer {token}`

Admin routes additionally require the `super_admin` role.
