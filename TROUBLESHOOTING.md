# 🔧 Troubleshooting Guide

## Problemi Comuni e Soluzioni

### 1. ❌ "Tenant not specified" al Login

**Problema**: Quando fai login da `localhost:3000` ricevi errore "Tenant not specified"

**Soluzione**: ✅ **RISOLTO** - Il sistema ora usa automaticamente il tenant "demo" come fallback

**Alternative**:
- Usa il subdomain: `http://demo.localhost:3000/login`
- Configura `/etc/hosts` (vedi sotto)

---

### 2. ❌ Errore 400 nella Creazione Servizi

**Problema**: POST /api/services ritorna 400

**Causa**: Il sistema non riesce a identificare il tenant

**Soluzione**: ✅ **RISOLTO** - Aggiunto fallback automatico al tenant "demo"

**Verifica**:
```bash
# Controlla i log del server
# Dovresti vedere il tenant ID nelle query Prisma
```

---

### 3. ❌ Form di Prenotazione Vuoto

**Problema**: La pagina `/book` non mostra servizi

**Causa Possibile**:
- Nessun servizio creato nel database
- Servizi non attivi
- Problema di connessione al database

**Soluzione**:

1. **Verifica che ci siano servizi**:
```bash
# Apri Prisma Studio
npx prisma studio

# Vai su "services" e verifica:
# - Ci sono record?
# - isActive = true?
# - tenantId corrisponde al tuo tenant?
```

2. **Crea servizi dalla dashboard**:
   - Login come owner
   - Vai su "Servizi"
   - Clicca "Nuovo Servizio"
   - Compila e salva

3. **Ripopola il database**:
```bash
npm run prisma:seed
```

---

### 4. 🌐 Subdomain non Funziona

**Problema**: `demo.localhost:3000` non funziona

**Soluzione**:

**Mac/Linux**:
```bash
sudo nano /etc/hosts

# Aggiungi:
127.0.0.1 demo.localhost
127.0.0.1 test.localhost

# Salva (Ctrl+O, Enter, Ctrl+X)
```

**Windows**:
```
1. Apri Notepad come Amministratore
2. Apri: C:\Windows\System32\drivers\etc\hosts
3. Aggiungi:
   127.0.0.1 demo.localhost
4. Salva
```

**Verifica**:
```bash
ping demo.localhost
# Dovrebbe rispondere da 127.0.0.1
```

---

### 5. 🔌 Errore di Connessione MongoDB

**Problema**: "Error connecting to database"

**Verifica**:
1. Connection string corretta in `.env`
2. MongoDB Atlas accessibile
3. IP whitelisted su MongoDB Atlas

**Soluzione**:
```bash
# Test connessione
npx prisma db push

# Se fallisce, verifica:
# 1. .env ha DATABASE_URL corretto
# 2. MongoDB Atlas è online
# 3. Network access configurato
```

---

### 6. 📦 Errori di Build

**Problema**: `npm run build` fallisce

**Soluzione**:
```bash
# Pulisci e reinstalla
rm -rf node_modules .next
npm install
npx prisma generate
npm run build
```

---

### 7. 🔄 Prisma Client Non Aggiornato

**Problema**: Errori tipo "Property 'brandColor' does not exist"

**Soluzione**:
```bash
# Rigenera Prisma Client
npx prisma generate

# Sincronizza DB
npx prisma db push
```

---

### 8. 🎨 Personalizzazione Non Salva

**Problema**: Le modifiche ai colori/logo non vengono salvate

**Verifica**:
1. Sei loggato come Owner?
2. Il token è valido?

**Debug**:
```javascript
// Apri Console Browser (F12)
// Verifica errori nella chiamata API
// Controlla che localStorage abbia 'accessToken'
console.log(localStorage.getItem('accessToken'))
```

---

### 9. 📊 Analytics Non Mostra Dati

**Problema**: Statistiche mostrano tutti 0

**Causa**: Nessun appuntamento nel periodo (ultimi 30 giorni)

**Soluzione**:
- Crea appuntamenti di test
- Le analytics si aggiornano automaticamente
- Basate su dati reali delle prenotazioni

---

### 10. 🚫 "Forbidden" o "Unauthorized"

**Problema**: Errore 403 o 401 sulle API

**Causa**: Token scaduto o ruolo insufficiente

**Soluzione**:
```bash
# 1. Fai logout e login di nuovo
# 2. Verifica il ruolo utente
# 3. Controlla che il token sia valido

# Token scade dopo 15 minuti (access token)
# Usa refresh token per rinnovare
```

---

## 🔍 Debug Utilities

### Verifica Stato Sistema

```bash
# 1. Database connesso?
npx prisma db push

# 2. Servizi disponibili?
npx prisma studio
# Vai su "services" e verifica

# 3. Tenant esistente?
# In Prisma Studio, vai su "tenants"
# Verifica che esista tenant con slug "demo"

# 4. Server in esecuzione?
npm run dev
# Dovrebbe mostrare: ✓ Ready in XXXms
```

### Log Utili

```javascript
// Nel browser (F12 Console)

// 1. Verifica token
console.log('Token:', localStorage.getItem('accessToken'))

// 2. Verifica user
console.log('User:', JSON.parse(localStorage.getItem('user')))

// 3. Test API manualmente
fetch('/api/services?isActive=true')
  .then(r => r.json())
  .then(console.log)
```

---

## 🆘 Ripristino Completo

Se tutto è rotto, ripristina da zero:

```bash
# 1. Ferma il server (Ctrl+C)

# 2. Pulisci tutto
rm -rf node_modules .next

# 3. Reinstalla
npm install

# 4. Rigenera Prisma
npx prisma generate
npx prisma db push

# 5. Ripopola database
npm run prisma:seed

# 6. Riavvia
npm run dev

# 7. Test
# Vai su: http://localhost:3000/login
# Login: owner@demo.com / password123
```

---

## 📞 Checklist Rapida

Prima di chiedere aiuto, verifica:

- [ ] Server in esecuzione (`npm run dev`)
- [ ] Database connesso (test con `npx prisma studio`)
- [ ] Tenant "demo" esiste nel database
- [ ] Servizi creati e attivi
- [ ] Token valido (fai logout/login)
- [ ] Console browser senza errori (F12)
- [ ] Network tab mostra chiamate API (F12 → Network)

---

## 🎯 Test Rapido Funzionalità

```bash
# 1. Test Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"password123"}'

# 2. Test Servizi (sostituisci TOKEN)
curl http://localhost:3000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test Staff
curl http://localhost:3000/api/staff \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Se il problema persiste, controlla i log del server nel terminale dove hai eseguito `npm run dev`**
