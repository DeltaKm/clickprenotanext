# Link di Prenotazione Specifici per Tenant

## Problema Risolto

Ogni tenant ora ha un link di prenotazione univoco che identifica correttamente il business.

## Soluzione Implementata

### Formato del Link

#### Sviluppo (Localhost)
```
http://localhost:3000/book?tenant=test-businesss
http://localhost:3000/book?tenant=demo
http://localhost:3000/book?tenant=vision-tech
```

#### Produzione (con dominio)
```
https://test-businesss.clickprenota.com/book
https://demo.clickprenota.com/book
https://vision-tech.clickprenota.com/book
```

### Come Funziona

1. **Dashboard** (`/dashboard/page.tsx`)
   - Chiama `/api/tenant/info` per ottenere lo slug del tenant
   - Genera il link con query parameter per localhost
   - Genera il link con subdomain per produzione
   - Mostra il link nel widget "Link di Prenotazione Pubblico"

2. **Pagina Booking Link** (`/dashboard/booking-link/page.tsx`)
   - Stessa logica del dashboard
   - Genera anche il QR code con il link corretto
   - Include il tenant nel link

3. **Form Pubblico** (`/book/page.tsx`)
   - Legge il tenant dal query parameter `?tenant=xxx`
   - Se non presente, usa 'demo' come default
   - Invia l'header `x-tenant-slug` in tutte le chiamate API
   - Carica servizi, staff e customization del tenant corretto

### API Endpoint Nuovi

#### GET `/api/tenant/info`
**File**: `app/api/tenant/info/route.ts`

Ritorna le informazioni del tenant autenticato:
```json
{
  "tenant": {
    "id": "...",
    "slug": "test-businesss",
    "name": "Salone Mario",
    "domain": null,
    "brandColor": "#2563eb",
    "logo": "",
    "welcomeMessage": "Benvenuto!",
    "expiresAt": null,
    "isActive": true
  }
}
```

### Modifiche ai File

#### 1. Dashboard (`app/dashboard/page.tsx`)
```typescript
// Chiama API per ottenere tenant
const response = await fetch('/api/tenant/info', {
  headers: { 'Authorization': `Bearer ${token}` }
})

const tenantSlug = data.tenant.slug

// Genera link appropriato
if (host.includes('localhost')) {
  setBookingLink(`${protocol}//${host}/book?tenant=${tenantSlug}`)
} else {
  setBookingLink(`${protocol}//${tenantSlug}.${baseDomain}/book`)
}
```

#### 2. Form Pubblico (`app/book/page.tsx`)
```typescript
// Legge tenant da URL
const params = new URLSearchParams(window.location.search)
const tenant = params.get('tenant') || 'demo'

// Include header in tutte le chiamate
const response = await fetch('/api/services?isActive=true', {
  headers: { 'x-tenant-slug': tenant }
})
```

### Flusso Completo

```
1. Utente business fa login (mario@esempio.com)
   ↓
2. Va su Dashboard
   ↓
3. Sistema chiama /api/tenant/info
   ↓
4. Riceve slug: "test-businesss"
   ↓
5. Genera link: http://localhost:3000/book?tenant=test-businesss
   ↓
6. Utente copia e condivide il link
   ↓
7. Cliente apre il link
   ↓
8. Form legge ?tenant=test-businesss
   ↓
9. Carica servizi/staff di "test-businesss"
   ↓
10. Cliente prenota per il business corretto ✅
```

### Vantaggi

✅ **Univoco**: Ogni tenant ha il suo link  
✅ **Funziona su localhost**: Usa query parameter  
✅ **Pronto per produzione**: Usa subdomain  
✅ **QR Code corretto**: Include il tenant  
✅ **Isolamento dati**: Ogni link mostra solo i dati del proprio tenant  

### Testing

#### Test 1: Link Demo
```bash
# Login come owner@demo.com
# Dashboard mostra: http://localhost:3000/book?tenant=demo
# Apri il link → Vedi servizi del tenant demo
```

#### Test 2: Link Business
```bash
# Login come mario@esempio.com
# Dashboard mostra: http://localhost:3000/book?tenant=test-businesss
# Apri il link → Vedi servizi di "Salone Mario"
```

#### Test 3: Link Senza Tenant
```bash
# Apri: http://localhost:3000/book (senza ?tenant=)
# Fallback a 'demo' → Vedi servizi del tenant demo
```

### Produzione con Subdomain

Per usare i subdomain in produzione:

1. **Configurare DNS**:
   ```
   *.clickprenota.com → IP del server
   ```

2. **Variabile ambiente**:
   ```env
   NEXT_PUBLIC_BASE_DOMAIN=clickprenota.com
   ```

3. **Link generati**:
   ```
   https://test-businesss.clickprenota.com/book
   https://vision-tech.clickprenota.com/book
   ```

### Note Tecniche

- Il sistema usa `x-tenant-slug` header per identificare il tenant nelle API pubbliche
- `getTenantContext()` in `lib/api-middleware.ts` legge questo header
- Fallback a 'demo' se nessun tenant specificato
- Il QR code viene generato con il link completo incluso il tenant
