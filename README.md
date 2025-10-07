# 📅 BookingSaaS - Multi-Tenant Appointment Booking System

Sistema completo di prenotazioni multi-tenant costruito con Next.js 15, TypeScript, MongoDB e Prisma.

## 🚀 Caratteristiche

- **Multi-tenancy**: Ogni business ha il proprio spazio isolato con subdomain
- **Gestione Appuntamenti**: Calendario completo con prevenzione overbooking
- **Staff Management**: Gestione team con orari flessibili e servizi assegnati
- **Prenotazioni Online**: Wizard pubblico per clienti (senza autenticazione)
- **Dashboard Completa**: Interfaccia per Owner e Staff
- **REST API**: Endpoint con validazione Zod
- **Autenticazione JWT**: Access e refresh tokens
- **UI Moderna**: Tailwind CSS + shadcn/ui

## 🛠️ Stack Tecnologico

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB via Prisma ORM
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod
- **UI**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React

## 📋 Prerequisiti

- Node.js 18+ 
- MongoDB Atlas account (o MongoDB locale)
- npm o yarn

## 🔧 Installazione

### 1. Clona il repository

```bash
git clone <repository-url>
cd booking-nextjs
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Copia `.env.example` in `.env`:

```bash
cp .env.example .env
```

Il file `.env` è già configurato con la tua connection string MongoDB:

```env
DATABASE_URL="mongodb+srv://claudiomartinezdev_db_user:EK8VL5RlnMCoxmvJ@cluster0.plnf2eh.mongodb.net/booking-saas?retryWrites=true&w=majority"
JWT_ACCESS_SECRET="booking-saas-access-secret-2025-dev-key"
JWT_REFRESH_SECRET="booking-saas-refresh-secret-2025-dev-key"
JWT_ACCESS_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_DOMAIN="localhost:3000"
NODE_ENV="development"
```

### 4. Genera il Prisma Client

```bash
npx prisma generate
```

### 5. Sincronizza il database

```bash
npx prisma db push
```

### 6. Popola il database con dati demo

```bash
npm run prisma:seed
```

Questo creerà:
- Tenant "demo" 
- Owner: owner@demo.com / password123
- Staff: giulia@demo.com / password123
- Staff: marco@demo.com / password123
- Servizi di esempio
- Clienti e appuntamenti demo

### 7. Avvia il server di sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:3000`

## 🌐 Accesso Multi-Tenant

### Configurazione Locale

Per testare il multi-tenancy in locale, devi configurare i subdomain nel file hosts:

**Mac/Linux**: Modifica `/etc/hosts`
```bash
sudo nano /etc/hosts
```

Aggiungi:
```
127.0.0.1 demo.localhost
127.0.0.1 test.localhost
```

**Windows**: Modifica `C:\Windows\System32\drivers\etc\hosts` (come amministratore)

### Accesso

- **Homepage**: http://localhost:3000
- **Tenant Demo**: http://demo.localhost:3000
- **Login**: http://demo.localhost:3000/login
- **Booking Pubblico**: http://demo.localhost:3000/book
- **Dashboard**: http://demo.localhost:3000/dashboard

## 👥 Credenziali Demo

### Owner (Accesso completo)
- Email: `owner@demo.com`
- Password: `password123`

### Staff
- Email: `giulia@demo.com` / Password: `password123`
- Email: `marco@demo.com` / Password: `password123`

## 📁 Struttura del Progetto

```
booking-nextjs/
├── app/
│   ├── api/                    # REST API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── services/          # Services CRUD
│   │   ├── staff/             # Staff management
│   │   ├── customers/         # Customers management
│   │   └── appointments/      # Appointments CRUD
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── appointments/
│   │   ├── services/
│   │   ├── staff/
│   │   └── customers/
│   ├── book/                  # Public booking wizard
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── layout.tsx             # Root layout
├── components/
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── auth.ts                # JWT utilities
│   ├── tenant.ts              # Tenant resolver
│   ├── api-middleware.ts      # API authentication helpers
│   ├── validations.ts         # Zod schemas
│   └── utils.ts               # Utility functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── docs/
│   └── PLAN.md                # Architecture documentation
└── middleware.ts              # Next.js middleware (tenant resolution)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Registra nuovo tenant + owner
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token

### Services
- `GET /api/services` - Lista servizi (pubblico)
- `POST /api/services` - Crea servizio (Owner)

### Staff
- `GET /api/staff` - Lista staff (pubblico)
- `POST /api/staff` - Crea staff (Owner)

### Customers
- `GET /api/customers` - Lista clienti (Owner/Staff)
- `POST /api/customers` - Crea cliente (pubblico)

### Appointments
- `GET /api/appointments` - Lista appuntamenti
- `POST /api/appointments` - Crea appuntamento (pubblico)
- `PATCH /api/appointments/[id]` - Aggiorna/Riprogramma
- `DELETE /api/appointments/[id]` - Cancella

## 🔐 Autenticazione

L'API usa JWT con access e refresh tokens:

```typescript
// Headers per richieste autenticate
{
  "Authorization": "Bearer <access_token>"
}
```

I token sono salvati in localStorage nel client.

## 🎨 UI Components

Il progetto usa **shadcn/ui** per i componenti:

- Button
- Input
- Label
- Card
- Select
- Dialog (future)
- Toast (future)

## 🧪 Testing

### Unit Tests (Jest)
```bash
npm test
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

*Nota: I test sono da implementare come prossimo step*

## 📦 Build per Produzione

```bash
npm run build
npm start
```

## 🐳 Docker (Opzionale)

```bash
docker-compose up -d
```

*Nota: Il docker-compose.yml è da creare per MongoDB locale + Mailhog*

## 🔄 Workflow di Sviluppo

1. Modifica lo schema Prisma: `prisma/schema.prisma`
2. Sincronizza: `npx prisma db push`
3. Rigenera client: `npx prisma generate`
4. Riavvia dev server

## 📝 Prossimi Passi

- [ ] Implementare test Jest e Playwright
- [ ] Aggiungere export iCal
- [ ] Integrare webhook Google Calendar
- [ ] Implementare notifiche email
- [ ] Aggiungere dashboard analytics
- [ ] Implementare gestione orari staff
- [ ] Aggiungere gestione coupon UI
- [ ] Implementare ricerca avanzata

## 🤝 Contributi

Questo è un progetto MVP. Contributi e suggerimenti sono benvenuti!

## 📄 Licenza

MIT

## 🆘 Supporto

Per problemi o domande, apri una issue su GitHub.

---

**Fatto con ❤️ usando Next.js 15 e TypeScript**
