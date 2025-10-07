# Multi-Tenant Booking SaaS - Architecture & Plan

## Overview
A multi-tenant appointment booking system (similar to BookingGo) built with Next.js 15, TypeScript, MongoDB, and Prisma ORM.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB via Prisma ORM
- **API**: REST API with Zod validation
- **Auth**: JWT (access + refresh tokens)
- **UI**: Tailwind CSS + shadcn/ui
- **Testing**: Jest (unit) + Playwright (e2e)
- **Linting**: ESLint + Prettier

## Multi-Tenancy Strategy

### Tenant Resolution
1. **Subdomain-based**: `{tenant}.example.com` → extract tenant slug
2. **Header fallback**: `x-tenant-id` header for API calls
3. **Middleware**: Automatically sets tenant context for all requests

### Data Isolation
- Every document includes `tenantId` field
- Composite indexes: `(tenantId, ...other fields)`
- Middleware enforces tenant context on all DB queries

## Entity Relationship Diagram (ERD)

```
Tenant (id, slug, name, domain, settings)
  ├─► User (id, tenantId, email, password, role, name)
  │     └─► Staff (id, tenantId, userId, bio, avatar, isActive)
  │           └─► WorkingHours (id, tenantId, staffId, dayOfWeek, startTime, endTime, breakStart, breakEnd)
  ├─► Service (id, tenantId, name, description, duration, price, isActive)
  │     └─► StaffService (id, tenantId, staffId, serviceId)
  ├─► Customer (id, tenantId, email, name, phone, notes)
  ├─► Appointment (id, tenantId, customerId, staffId, serviceId, startTime, endTime, status, notes, totalPrice)
  ├─► Coupon (id, tenantId, code, discountType, discountValue, validFrom, validTo, isActive)
  └─► TaxRule (id, tenantId, name, rate, isActive)
```

## User Roles
- **SuperAdmin**: Platform-wide access
- **Owner**: Full tenant access
- **Staff**: Manage own appointments
- **Customer**: Book appointments

## API Endpoints

### Auth
- `POST /api/auth/register` - Register tenant + owner
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Resources
- `GET/POST /api/services` - Services CRUD
- `GET/POST /api/staff` - Staff CRUD
- `GET /api/staff/[id]/availability` - Available slots
- `GET/POST /api/customers` - Customers CRUD
- `GET/POST /api/appointments` - Appointments CRUD
- `PATCH /api/appointments/[id]/reschedule` - Reschedule
- `DELETE /api/appointments/[id]` - Cancel

## UI Routes

### Public
- `/[tenant]/book` - Booking wizard (service → staff → time → confirm)
- `/login` - Login page
- `/register` - Register page

### Protected
- `/dashboard` - Main dashboard (agenda, calendar)
- `/dashboard/services` - Manage services
- `/dashboard/staff` - Manage staff
- `/dashboard/customers` - Manage customers
- `/dashboard/appointments` - Manage appointments

## Milestones

### Phase 1: Foundation ✓
- Project setup + TypeScript config
- Prisma schema + MongoDB connection
- Core libraries (prisma, auth, tenant)
- Middleware for tenant resolution

### Phase 2: API Layer ✓
- Auth endpoints (register, login, refresh)
- CRUD endpoints with Zod validation
- JWT middleware
- Role-based access control

### Phase 3: UI Layer ✓
- Tailwind + shadcn/ui setup
- Auth pages (login, register)
- Public booking wizard
- Dashboard layout + pages

### Phase 4: Testing & Deploy
- Jest unit tests
- Playwright e2e tests
- Docker setup
- Documentation
