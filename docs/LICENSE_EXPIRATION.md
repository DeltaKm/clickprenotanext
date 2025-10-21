# Sistema di Gestione Scadenza Licenze

## Panoramica

Il sistema ora gestisce automaticamente la scadenza delle licenze per i tenant business, mostrando avvisi appropriati e limitando le funzionalità quando necessario.

### Tipi di Account

1. **Account Demo** (slug: `demo`, `super-admin`, `admin-system`)
   - Nessuna scadenza (`expiresAt = null`)
   - Funzionalità complete sempre disponibili
   - Per testing e amministrazione

2. **Account Business con Licenza**
   - Ha una data di scadenza (`expiresAt = data futura`)
   - Funzionalità complete fino alla scadenza
   - Avvisi quando mancano ≤30 giorni

3. **Account Business Senza Licenza**
   - Nessuna licenza mai assegnata (`expiresAt = null`)
   - **Considerato SCADUTO** - funzionalità limitate
   - Richiede acquisto licenza

4. **Account Business con Licenza Scaduta**
   - Licenza scaduta (`expiresAt = data passata`)
   - Funzionalità limitate
   - Richiede rinnovo licenza

## Componenti Implementati

### 1. Hook: `useLicenseStatus`
**File**: `lib/hooks/useLicenseStatus.ts`

Hook React che recupera lo stato della licenza del tenant corrente.

**Ritorna:**
```typescript
{
  isExpired: boolean        // true se la licenza è scaduta
  expiresAt: Date | null    // data di scadenza (null per account demo)
  daysRemaining: number | null  // giorni rimanenti
  isDemo: boolean           // true per account demo senza scadenza
}
```

### 2. API Endpoint: `/api/tenant/license-status`
**File**: `app/api/tenant/license-status/route.ts`

Endpoint GET che ritorna lo stato della licenza del tenant autenticato.

**Logica:**
- Verifica autenticazione
- Recupera `expiresAt` dal tenant
- Calcola se è scaduto e giorni rimanenti
- Identifica account demo (senza `expiresAt`)

### 3. Componente: `LicenseBanner`
**File**: `components/LicenseBanner.tsx`

Banner visivo che mostra lo stato della licenza con diversi stili:

#### Stati del Banner:

**🟢 Account Demo**
- Colore: Blu
- Messaggio: "Account Demo - senza scadenza"
- Quando: `isDemo === true` (slug in ['demo', 'super-admin', 'admin-system'])

**🟢 Licenza Attiva (>30 giorni)**
- Colore: Verde
- Messaggio: "Licenza attiva fino al [data]"
- Quando: `!isExpired && daysRemaining > 30`

**🟡 Licenza in Scadenza (≤30 giorni)**
- Colore: Giallo
- Messaggio: "Licenza in scadenza tra X giorni"
- Quando: `!isExpired && daysRemaining <= 30`

**🔴 Nessuna Licenza Attiva**
- Colore: Rosso
- Messaggio: "Questo account non ha una licenza attiva"
- Pulsante: "Contatta l'Amministratore"
- Quando: `isExpired === true && expiresAt === null`

**🔴 Licenza Scaduta**
- Colore: Rosso
- Messaggio: "Licenza scaduta il [data]"
- Pulsante: "Contatta l'Amministratore"
- Quando: `isExpired === true && expiresAt !== null`

### 4. Componente: `ProtectedAction`
**File**: `components/ProtectedAction.tsx`

Wrapper che disabilita azioni quando la licenza è scaduta.

**Utilizzo:**
```tsx
<ProtectedAction licenseStatus={licenseStatus}>
  <Button>Nuovo Appuntamento</Button>
</ProtectedAction>
```

**Comportamento:**
- Se licenza attiva: mostra il children normalmente
- Se licenza scaduta: mostra versione disabilitata con tooltip

## Funzionalità Limitate con Licenza Scaduta

Quando la licenza è scaduta (`isExpired === true`):

### ✅ Permesso (Sola Lettura)
- Visualizzare dashboard
- Visualizzare appuntamenti esistenti
- Visualizzare clienti esistenti
- Visualizzare servizi
- Visualizzare staff
- Visualizzare statistiche

### ❌ Bloccato (Richiede Licenza Attiva)
- Creare nuovi appuntamenti
- Creare nuovi clienti
- Modificare appuntamenti
- Modificare clienti
- Creare/modificare servizi
- Creare/modificare staff
- Modificare impostazioni

## Implementazione nelle Pagine

### Dashboard
**File**: `app/dashboard/page.tsx`

```tsx
import { useLicenseStatus } from '@/lib/hooks/useLicenseStatus'
import { LicenseBanner } from '@/components/LicenseBanner'

const { licenseStatus, loading } = useLicenseStatus()

// Nel render:
{!loading && <LicenseBanner licenseStatus={licenseStatus} />}
```

### Pagine con Azioni Protette
**Esempio**: `app/dashboard/appointments/page.tsx`

```tsx
import { useLicenseStatus } from '@/lib/hooks/useLicenseStatus'
import { ProtectedAction } from '@/components/ProtectedAction'

const { licenseStatus } = useLicenseStatus()

// Proteggere pulsante "Nuovo Appuntamento":
<ProtectedAction licenseStatus={licenseStatus}>
  <Button onClick={handleCreate}>
    Nuovo Appuntamento
  </Button>
</ProtectedAction>
```

## Pagine da Proteggere

### 1. Appuntamenti (`/dashboard/appointments`)
- ✅ Pulsante "Nuovo Appuntamento"
- ✅ Pulsante "Modifica" su ogni appuntamento
- ✅ Cambio stato appuntamento

### 2. Clienti (`/dashboard/customers`)
- ✅ Pulsante "Nuovo Cliente"
- ✅ Pulsante "Modifica" su ogni cliente
- ✅ Pulsante "Elimina"

### 3. Servizi (`/dashboard/services`)
- ✅ Pulsante "Nuovo Servizio"
- ✅ Pulsante "Modifica"
- ✅ Pulsante "Elimina"

### 4. Staff (`/dashboard/staff`)
- ✅ Pulsante "Nuovo Membro"
- ✅ Pulsante "Modifica"
- ✅ Pulsante "Elimina"

### 5. Impostazioni
- ✅ Tutti i form di modifica

## Protezione Lato Server

**IMPORTANTE**: Oltre alla protezione UI, implementare anche controlli lato server.

### API Protette

#### 1. POST `/api/appointments` - Creazione Appuntamenti Pubblici
**File**: `app/api/appointments/route.ts`

Controlla la licenza prima di accettare prenotazioni pubbliche:

```typescript
// Check license expiration (except for demo tenants)
const demoTenants = ['demo', 'super-admin', 'admin-system']
const isDemo = demoTenants.includes(tenant.slug)
const isExpired = isDemo 
  ? false 
  : !tenant.expiresAt || new Date(tenant.expiresAt) < now

if (isExpired) {
  return NextResponse.json(
    { error: 'Le prenotazioni non sono al momento disponibili.' },
    { status: 403 }
  )
}
```

#### 2. GET `/api/tenant/public-status` - Stato Pubblico Tenant
**File**: `app/api/tenant/public-status/route.ts`

Endpoint pubblico per verificare se il tenant accetta prenotazioni:

```typescript
return NextResponse.json({
  acceptsBookings: tenant.isActive && !isExpired,
  tenantName: tenant.name,
  message: acceptsBookings 
    ? null 
    : 'Le prenotazioni non sono al momento disponibili.'
})
```

### Form Pubblico di Prenotazione

**File**: `app/book/page.tsx`

Il form pubblico `/book` verifica lo stato della licenza all'avvio:

- Se licenza scaduta: mostra messaggio di errore prominente
- Nasconde tutti gli step di prenotazione
- Suggerisce di contattare direttamente il fornitore

**Messaggio mostrato:**
```
🔴 Prenotazioni Non Disponibili

Le prenotazioni non sono al momento disponibili. 
Contatta il fornitore del servizio.

Per informazioni, contatta direttamente il fornitore del servizio.
```

## Testing

### Test Account Demo
```
Email: owner@demo.com
Password: password123
Risultato: Banner blu "Account Demo"
```

### Test Licenza Attiva
```
1. Creare tenant con expiresAt futuro (>30 giorni)
2. Login con utente del tenant
3. Risultato: Banner verde con data scadenza
```

### Test Licenza in Scadenza
```
1. Creare tenant con expiresAt tra 1-30 giorni
2. Login con utente del tenant
3. Risultato: Banner giallo con avviso
```

### Test Licenza Scaduta
```
1. Creare tenant con expiresAt passato
2. Login con utente del tenant
3. Risultato: Banner rosso + pulsanti disabilitati
```

## Prossimi Passi

1. ✅ Implementato hook e API
2. ✅ Implementato banner visivo
3. ✅ Implementato componente protezione
4. ⏳ Applicare protezione a tutte le pagine
5. ⏳ Aggiungere protezione lato server
6. ⏳ Testing completo

## Note Tecniche

- Il controllo della scadenza avviene sia client-side (UX) che server-side (sicurezza)
- Gli account demo (`expiresAt === null`) non hanno mai limitazioni
- I giorni rimanenti vengono arrotondati per eccesso
- Il banner si aggiorna automaticamente quando cambia lo stato della licenza
