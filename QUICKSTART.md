# 🚀 Quick Start Guide

## ✅ Setup Completato

Il progetto è stato configurato con successo! Tutti i componenti sono pronti all'uso.

## 📦 Cosa è stato creato

### Backend
- ✅ Prisma schema MongoDB con multi-tenancy
- ✅ Database popolato con dati demo
- ✅ REST API complete con validazione Zod
- ✅ Autenticazione JWT (access + refresh tokens)
- ✅ Middleware per risoluzione tenant da subdomain

### Frontend
- ✅ Homepage landing page
- ✅ Pagine auth (login/register)
- ✅ Dashboard completa per Owner/Staff
- ✅ Wizard di prenotazione pubblico
- ✅ UI moderna con Tailwind + shadcn/ui

## 🎯 Avvio Rapido

### 1. Avvia il server di sviluppo

```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

### 2. Accedi al tenant demo

Per testare il multi-tenancy, configura il file hosts:

**Mac/Linux:**
```bash
sudo nano /etc/hosts
```

Aggiungi:
```
127.0.0.1 demo.localhost
```

**Windows:**
Modifica `C:\Windows\System32\drivers\etc\hosts` come amministratore

### 3. Accedi con le credenziali demo

**Owner (accesso completo):**
- URL: http://demo.localhost:3000/login
- Email: `owner@demo.com`
- Password: `password123`

**Staff:**
- Email: `giulia@demo.com` / Password: `password123`
- Email: `marco@demo.com` / Password: `password123`

## 🔗 URL Principali

| Pagina | URL | Descrizione |
|--------|-----|-------------|
| Homepage | http://localhost:3000 | Landing page pubblica |
| Login | http://demo.localhost:3000/login | Pagina di login |
| Register | http://localhost:3000/register | Registrazione nuovo tenant |
| Booking | http://demo.localhost:3000/book | Wizard prenotazione pubblico |
| Dashboard | http://demo.localhost:3000/dashboard | Dashboard principale |
| Appuntamenti | http://demo.localhost:3000/dashboard/appointments | Gestione appuntamenti |
| Servizi | http://demo.localhost:3000/dashboard/services | Gestione servizi |
| Staff | http://demo.localhost:3000/dashboard/staff | Gestione staff |
| Clienti | http://demo.localhost:3000/dashboard/customers | Gestione clienti |

## 🧪 Test del Sistema

### Test Booking Flow (Pubblico)

1. Vai su http://demo.localhost:3000/book
2. Seleziona un servizio (es. "Taglio Capelli")
3. Scegli un operatore (Giulia o Marco)
4. Seleziona data e ora
5. Inserisci i tuoi dati
6. Conferma la prenotazione

### Test Dashboard (Owner)

1. Login come owner@demo.com
2. Visualizza dashboard con statistiche
3. Vai su "Appuntamenti" per vedere le prenotazioni
4. Crea un nuovo servizio
5. Aggiungi un nuovo membro dello staff

## 📊 Dati Demo Precaricati

Il database è stato popolato con:
- **1 Tenant**: "Demo Salon & Spa" (slug: demo)
- **3 Utenti**: 1 Owner + 2 Staff
- **4 Servizi**: Taglio, Colorazione, Massaggio, Trattamento Viso
- **2 Clienti**: Con dati di esempio
- **2 Appuntamenti**: Uno domani, uno la prossima settimana
- **1 Coupon**: "WELCOME10" (10% sconto)
- **Orari di lavoro**: Lun-Ven 9:00-18:00 per tutto lo staff

## 🛠️ Comandi Utili

```bash
# Sviluppo
npm run dev                 # Avvia dev server
npm run build              # Build produzione
npm run start              # Avvia build produzione

# Database
npx prisma generate        # Genera Prisma Client
npx prisma db push         # Sincronizza schema con DB
npm run prisma:seed        # Popola DB con dati demo
npx prisma studio          # Apri Prisma Studio (GUI)

# Linting & Formatting
npm run lint               # Esegui ESLint
npm run format             # Formatta codice con Prettier

# Testing (da implementare)
npm test                   # Unit tests
npm run test:e2e           # E2E tests
```

## 🔧 Troubleshooting

### Il subdomain non funziona
- Verifica che il file hosts sia stato modificato correttamente
- Riavvia il browser dopo aver modificato hosts
- Usa `demo.localhost:3000` (con la porta)

### Errori di connessione MongoDB
- Verifica che la connection string in `.env` sia corretta
- Controlla che MongoDB Atlas sia accessibile
- Verifica le whitelist IP su MongoDB Atlas

### Errori di build
```bash
# Pulisci e reinstalla
rm -rf node_modules .next
npm install
npx prisma generate
npm run build
```

## 📚 Prossimi Passi

1. **Personalizza il tenant demo**: Modifica servizi, staff e orari
2. **Crea un nuovo tenant**: Usa la pagina di registrazione
3. **Testa il booking flow**: Prenota appuntamenti come cliente
4. **Esplora le API**: Vedi `/docs/PLAN.md` per la documentazione API
5. **Aggiungi funzionalità**: Consulta il README per idee di sviluppo

## 🎉 Tutto Pronto!

Il tuo sistema di prenotazioni multi-tenant è completamente funzionante.
Buon sviluppo! 🚀
