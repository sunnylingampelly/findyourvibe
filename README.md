# Find Your Vibe

A mobile-first companion discovery platform built with Laravel 11 + React/TypeScript.

## Architecture

```
findyourvibe/
├── backend/   Laravel 11 API (PHP 8.3)
└── frontend/  React 19 + TypeScript + Vite + Tailwind CSS
```

## Prerequisites

- PHP 8.3+ with extensions: pdo_mysql, mbstring, openssl, tokenizer, xml, ctype, json, bcmath, gd
- Composer 2.x
- Node.js 18+
- MySQL 8+

## Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Copy environment file (already configured for local dev)
cp .env.example .env   # skip if .env already exists

# Generate app key (already done)
php artisan key:generate

# Create the MySQL database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS findyourvibe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations and seed data
php artisan migrate --seed

# Create storage symlink
php artisan storage:link

# Start the development server
php artisan serve --port=8000
```

### Admin Credentials (from seeder)
- Email: `admin@findyourvibe.com`
- Password: `Admin@123`

### Sample User Credentials
- Password for all sample users: `Password@123`

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at: http://localhost:5173  
API proxy: requests to `/api` are forwarded to `http://localhost:8000`

## Configuration

### Database (.env in backend/)
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=findyourvibe
DB_USERNAME=root
DB_PASSWORD=
```

### CORS
Allowed origins are configured in `backend/config/cors.php`:
- http://localhost:5173
- http://localhost:3000

### File Storage
Profile photos and companion documents are stored in `backend/storage/app/public/`.
The `storage:link` command creates the public symlink.

Private companion documents (identity, selfie) are stored in `storage/app/private/companion-docs/` and served only through authenticated admin endpoints.

## Running in Production

```bash
# Backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
npm run build
# Serve the dist/ folder from your web server
```

## API Documentation

Base URL: `http://localhost:8000/api/v1`

All authenticated endpoints require: `Authorization: Bearer {token}`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout (auth required) |
| POST | /auth/forgot-password | Send reset email |
| POST | /auth/reset-password | Reset password |

### Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /discover | Get companion profiles (paginated) |
| GET | /profiles/{id} | Get single profile |
| POST | /swipes | Record a swipe |
| GET | /saved-profiles | Get saved profiles |
| POST | /saved-profiles | Save a profile |

### Connections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /connections/requests | Send connection request |
| GET | /connections/requests/received | Received requests |
| GET | /connections/requests/sent | Sent requests |
| POST | /connections/requests/{id}/accept | Accept request |
| POST | /connections/requests/{id}/decline | Decline request |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /conversations | List conversations |
| GET | /conversations/{id}/messages | Get messages |
| POST | /conversations/{id}/messages | Send message |

### Admin (requires super_admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/auth/login | Admin login |
| GET | /admin/dashboard | KPI dashboard |
| GET | /admin/users | List all users |
| PATCH | /admin/users/{id}/status | Suspend/activate user |
| GET | /admin/companion-applications | List applications |
| POST | /admin/companion-applications/{id}/approve | Approve companion |
| POST | /admin/companion-applications/{id}/reject | Reject with reason |

## Screen Routes

### User App
- `/welcome` — Landing/welcome screen
- `/register` — Registration
- `/login` — Login
- `/onboarding` — Multi-step onboarding
- `/discover` — Main discovery feed
- `/swipe` — Tinder-style swipe cards
- `/profiles/:id` — Full profile view
- `/saved` — Saved profiles
- `/connections` — Connection requests & connections
- `/messages` — Conversation list
- `/messages/:id` — Chat screen
- `/profile` — My profile
- `/profile/edit` — Edit profile
- `/companion/apply` — Become a companion

### Admin Panel
- `/admin/login` — Admin authentication
- `/admin` — Dashboard with KPIs
- `/admin/users` — User management
- `/admin/companions` — Companion applications
- `/admin/services` — Service catalogue
- `/admin/reports` — Safety reports
- `/admin/audit-logs` — Audit trail

## Design System

**Colors**: Deep Teal primary (#236B63), Warm Off-white background (#FAF9F6), Muted Peach accent (#E9B7A5)  
**Fonts**: Manrope (headings, navigation) + Inter (body, forms)  
**Mobile container**: max-width 430px, centered on desktop  
**Bottom navigation**: 5-tab fixed nav (Discover, Swipe, Connections, Messages, Profile)
