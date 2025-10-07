# 🚀 Deploy su Vercel - Guida Completa

## 📋 Prerequisiti

- ✅ Account Vercel (gratuito)
- ✅ Repository GitHub con il codice
- ✅ Database MongoDB Atlas configurato
- ✅ Build locale funzionante (`npm run build`)

## 🔧 Configurazione Prisma per Vercel

### 1. File Configurati

✅ **`vercel.json`** - Configurazione Vercel
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["fra1"]
}
```

✅ **`package.json`** - Script aggiornati
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 2. Perché Serve?

- **`postinstall`**: Genera Prisma Client dopo `npm install`
- **`build`**: Genera Prisma Client prima del build Next.js
- **`vercel.json`**: Specifica la regione e i comandi custom

## 📝 Variabili d'Ambiente su Vercel

### Step 1: Vai su Vercel Dashboard

1. Importa il repository GitHub
2. Vai su **Settings** → **Environment Variables**

### Step 2: Aggiungi Tutte le Variabili

#### Database
```bash
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/booking-saas?retryWrites=true&w=majority
```

#### JWT Secrets
```bash
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

#### App Config
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_BASE_DOMAIN=your-app.vercel.app
```

#### Whitelabel
```bash
NEXT_PUBLIC_APP_NAME=Il Tuo Brand
NEXT_PUBLIC_APP_DESCRIPTION=Sistema di prenotazioni online
NEXT_PUBLIC_COMPANY_NAME=La Tua Azienda SRL
NEXT_PUBLIC_SUPPORT_EMAIL=supporto@tuodominio.com
```

#### Node Environment
```bash
NODE_ENV=production
```

### Step 3: Scope delle Variabili

Per ogni variabile, seleziona:
- ✅ **Production**
- ✅ **Preview** (opzionale)
- ✅ **Development** (opzionale)

## 🚀 Deploy Steps

### 1. Push su GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Importa su Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Clicca **"Add New Project"**
3. Seleziona il repository GitHub
4. Clicca **"Import"**

### 3. Configura il Progetto

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (default)
- **Build Command**: `prisma generate && next build` (già in package.json)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 4. Aggiungi Environment Variables

Copia tutte le variabili dal tuo `.env` locale (vedi sopra)

### 5. Deploy!

Clicca **"Deploy"** e aspetta 2-3 minuti

## ✅ Verifica Post-Deploy

### 1. Controlla Build Logs

Se il deploy fallisce, controlla i log:
- Cerca errori di Prisma
- Verifica che `prisma generate` sia eseguito
- Controlla le variabili d'ambiente

### 2. Test Funzionalità

1. **Homepage**: `https://your-app.vercel.app`
2. **Login**: `https://your-app.vercel.app/login`
3. **API Health**: `https://your-app.vercel.app/api/services`

### 3. Test Database

```bash
# Prova a fare login con le credenziali demo
Email: owner@demo.com
Password: password123
```

Se non funziona, devi popolare il database:

```bash
# Locale, puntando al DB di produzione
DATABASE_URL="mongodb+srv://..." npm run prisma:seed
```

## 🔒 Sicurezza

### 1. Genera Nuovi JWT Secrets

**NON usare quelli di sviluppo in produzione!**

```bash
# Genera secrets sicuri
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Esegui 2 volte per `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`

### 2. Whitelist IP MongoDB Atlas

1. Vai su MongoDB Atlas
2. **Network Access** → **Add IP Address**
3. Aggiungi: `0.0.0.0/0` (permette Vercel)
   - ⚠️ In produzione, usa IP specifici se possibile

### 3. HTTPS

Vercel fornisce HTTPS automaticamente ✅

## 🌍 Custom Domain (Opzionale)

### 1. Aggiungi Dominio su Vercel

1. **Settings** → **Domains**
2. Aggiungi il tuo dominio: `tuodominio.com`

### 2. Configura DNS

Aggiungi questi record DNS:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Aggiorna Environment Variables

```bash
NEXT_PUBLIC_APP_URL=https://tuodominio.com
NEXT_PUBLIC_BASE_DOMAIN=tuodominio.com
```

## 🐛 Troubleshooting

### Errore: "Prisma Client not found"

**Soluzione**:
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Errore: "Cannot connect to database"

**Verifica**:
1. `DATABASE_URL` corretta su Vercel
2. MongoDB Atlas IP whitelist include `0.0.0.0/0`
3. Database esiste e ha dati

### Errore: "Module not found"

**Soluzione**:
```bash
# Verifica che tutte le dipendenze siano in dependencies (non devDependencies)
npm install --save @prisma/client prisma
```

### Build Timeout

Se il build supera i 45 secondi (limite Vercel free):

**Soluzione**:
1. Riduci dipendenze non necessarie
2. Usa Vercel Pro (build più lunghi)
3. Ottimizza Prisma schema

## 📊 Monitoring

### 1. Vercel Analytics

Abilita su: **Settings** → **Analytics**

### 2. Logs

Visualizza logs in tempo reale:
- **Deployments** → Seleziona deploy → **View Function Logs**

### 3. Performance

Monitora:
- Response time
- Error rate
- Build time

## 🔄 Aggiornamenti

### Deploy Automatico

Ogni push su `main` triggera un deploy automatico ✅

### Preview Deployments

Ogni PR crea un preview deployment automatico

### Rollback

Se qualcosa va storto:
1. **Deployments** → Trova deploy precedente
2. Clicca **"..."** → **"Promote to Production"**

## 📝 Checklist Deploy

- [ ] `vercel.json` creato
- [ ] `postinstall` script in `package.json`
- [ ] Build locale funzionante (`npm run build`)
- [ ] Codice pushato su GitHub
- [ ] Progetto importato su Vercel
- [ ] Tutte le variabili d'ambiente aggiunte
- [ ] JWT secrets generati (nuovi, non quelli di dev)
- [ ] MongoDB Atlas IP whitelist configurato
- [ ] Database popolato con dati iniziali
- [ ] Deploy completato con successo
- [ ] Homepage funzionante
- [ ] Login funzionante
- [ ] API funzionanti

## 🎉 Deploy Completato!

Il tuo BookingSaaS è ora live su Vercel! 🚀

### Link Utili

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Docs Vercel + Prisma**: https://vercel.com/guides/nextjs-prisma-postgres
- **MongoDB Atlas**: https://cloud.mongodb.com

---

**Buon deploy! 🎊**
