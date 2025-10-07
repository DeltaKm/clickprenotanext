# 🔐 Miglioramenti Autenticazione

## ✅ Modifiche Implementate

### 1. Token di Accesso Esteso a 24 Ore

**Prima**: Token scadeva dopo 15 minuti
**Ora**: Token valido per 24 ore

#### File Modificati:
- `.env.example` - Aggiornato `JWT_ACCESS_EXPIRES_IN="24h"`
- `README.md` - Documentazione aggiornata

#### Come Applicare:
Modifica il tuo file `.env` locale:
```bash
JWT_ACCESS_EXPIRES_IN="24h"
```

### 2. Auto-Logout su Token Scaduto

Implementato sistema automatico che:
- ✅ Controlla validità del token ogni 5 minuti
- ✅ Decodifica JWT per verificare scadenza
- ✅ Logout automatico se token scaduto
- ✅ Intercetta errori 401 e fa logout automatico
- ✅ Redirect automatico a `/login`

#### Nuovo File:
- `lib/useAuth.ts` - Hook e interceptor per gestione auth

#### Funzionalità:

**1. useAuthCheck()**
Hook React che:
- Verifica presenza token
- Decodifica JWT e controlla scadenza
- Logout automatico se scaduto
- Check ogni 5 minuti

**2. setupAuthInterceptor()**
Interceptor fetch che:
- Intercetta tutte le chiamate API
- Rileva errori 401 Unauthorized
- Logout automatico e redirect a login
- Esclude endpoint `/api/auth/login` e `/api/auth/register`

### 3. Integrazione nella Dashboard

Il layout della dashboard ora:
- ✅ Usa `useAuthCheck()` per monitoraggio continuo
- ✅ Setup `setupAuthInterceptor()` all'avvio
- ✅ Gestione automatica della sessione

## 🎯 Come Funziona

### Scenario 1: Token Valido
```
User apre dashboard → useAuthCheck verifica token → Token valido → Dashboard carica
```

### Scenario 2: Token Scaduto (Check Periodico)
```
User nella dashboard → Check ogni 5 min → Token scaduto → Logout automatico → Redirect a /login
```

### Scenario 3: API Ritorna 401
```
User fa azione → API call → 401 Unauthorized → Interceptor cattura → Logout → Redirect a /login
```

### Scenario 4: Token Mancante
```
User tenta accesso → No token in localStorage → Redirect immediato a /login
```

## 🔍 Verifica Token JWT

Il sistema decodifica il JWT per estrarre l'expiration time:

```javascript
const payload = JSON.parse(atob(token.split('.')[1]))
const expiresAt = payload.exp * 1000 // Timestamp in ms
const now = Date.now()

if (now >= expiresAt) {
  // Token scaduto, logout
}
```

## 📊 Durata Token

| Token | Durata | Scopo |
|-------|--------|-------|
| Access Token | **24 ore** | Autenticazione API |
| Refresh Token | 7 giorni | Rinnovo access token (future) |

## 🚀 Vantaggi

### Prima:
- ❌ Token scadeva dopo 15 minuti
- ❌ Errori 401 senza gestione
- ❌ User doveva fare logout manuale
- ❌ Esperienza utente frustrante

### Ora:
- ✅ Token valido 24 ore
- ✅ Logout automatico su scadenza
- ✅ Gestione errori 401 globale
- ✅ Esperienza utente fluida
- ✅ Sicurezza mantenuta

## 🔧 Configurazione

### Modifica Durata Token

Nel file `.env`:

```bash
# 1 ora
JWT_ACCESS_EXPIRES_IN="1h"

# 12 ore
JWT_ACCESS_EXPIRES_IN="12h"

# 24 ore (consigliato)
JWT_ACCESS_EXPIRES_IN="24h"

# 7 giorni (non consigliato per access token)
JWT_ACCESS_EXPIRES_IN="7d"
```

### Modifica Frequenza Check

In `lib/useAuth.ts`:

```typescript
// Check ogni 5 minuti (default)
const interval = setInterval(checkAuth, 5 * 60 * 1000)

// Check ogni 10 minuti
const interval = setInterval(checkAuth, 10 * 60 * 1000)

// Check ogni 1 minuto (più frequente)
const interval = setInterval(checkAuth, 1 * 60 * 1000)
```

## 🧪 Test del Sistema

### Test 1: Token Valido
1. Fai login
2. Naviga nella dashboard
3. Verifica che tutto funzioni normalmente

### Test 2: Token Scaduto (Simulazione)
1. Fai login
2. Apri DevTools (F12) → Console
3. Esegui:
```javascript
// Imposta token scaduto
localStorage.setItem('accessToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MzAwMDAwMDB9.invalid')
```
4. Ricarica pagina
5. Dovresti essere reindirizzato a `/login`

### Test 3: Errore 401
1. Fai login
2. Dopo 24 ore, prova a salvare qualcosa
3. API ritorna 401
4. Dovresti essere reindirizzato a `/login`

## 📝 Log e Debug

Il sistema logga eventi importanti:

```javascript
// Token scaduto
console.log('Token expired, logging out...')

// Errore 401
console.log('401 Unauthorized, logging out...')

// Token invalido
console.error('Invalid token:', error)
```

Apri DevTools → Console per vedere i log.

## 🔒 Sicurezza

### Cosa Viene Pulito al Logout:
- ✅ `localStorage.accessToken`
- ✅ `localStorage.refreshToken`
- ✅ `localStorage.user`

### Endpoint Esclusi dall'Interceptor:
- `/api/auth/login` - Permette login
- `/api/auth/register` - Permette registrazione

## 🚧 Future Implementazioni

### Refresh Token Automatico
Invece di logout, rinnovare automaticamente il token:

```typescript
// Quando token sta per scadere
if (expiresAt - now < 5 * 60 * 1000) { // 5 min prima
  // Chiama /api/auth/refresh
  // Ottieni nuovo access token
  // Continua sessione
}
```

### Remember Me
Opzione per estendere sessione:

```typescript
// Se "Remember Me" checked
JWT_ACCESS_EXPIRES_IN="30d"
```

### Session Timeout Warning
Avviso prima dello scadere:

```typescript
// 5 minuti prima della scadenza
showWarning("La tua sessione sta per scadere. Vuoi continuare?")
```

## ✨ Risultato

Ora hai un sistema di autenticazione robusto che:
1. ✅ Token valido 24 ore
2. ✅ Logout automatico su scadenza
3. ✅ Gestione errori 401 globale
4. ✅ Esperienza utente migliorata
5. ✅ Sicurezza mantenuta

---

**Per applicare le modifiche, riavvia il server e fai logout/login!** 🚀
