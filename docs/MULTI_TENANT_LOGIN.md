# Guida al Login Multi-Tenant

## Problema Risolto

Il sistema ora recupera automaticamente il tenant dall'email dell'utente. Non è più necessario specificare il tenant manualmente o usare subdomain.

## Come Funziona

### Login Automatico per Tenant

Quando inserisci email e password:
- Il sistema cerca automaticamente l'utente nel database
- Recupera il tenant associato all'email
- Non serve specificare il tenant manualmente
- Funziona sia su localhost che in produzione

**Esempio:**
- Email: `cla@cla.it` → il sistema trova automaticamente che appartiene al tenant `test-business`
- Email: `owner@demo.com` → il sistema trova automaticamente che appartiene al tenant `demo`

### 3. Utenti nel Sistema

Ecco gli utenti disponibili per tenant:

#### Tenant: `demo`
- **Owner**: `owner@demo.com` / `password123`
- **Staff**: `giulia@demo.com` / `password123`
- **Staff**: `marco@demo.com` / `password123`
- **Staff**: `staff@demo.it` / `password123`

#### Tenant: `test-business`
- **Owner**: `cla@cla.it` / (password da verificare)

#### Tenant: `test-businesss`
- **Owner**: `mario@esempio.com` / (password da verificare)

#### Tenant: `vision-tech`
- **Owner**: `clamart85hs@gmail.com` / (password da verificare)

#### Tenant: `no-licenza`
- **Owner**: `no@licenza.it` / (password da verificare)

#### Super Admin (nessun tenant specifico)
- **Super Admin**: `admin@clickprenota.com` / (password da verificare)

#### Admin System
- **Admin**: `admin@example.com` / (password da verificare)
- **Admin**: `claudiomartinezdev@gmail.com` / (password da verificare)

## Testare il Login

### Su Localhost o Produzione

1. Vai su `http://localhost:3000/login` (o il tuo dominio in produzione)
2. Inserisci email e password
3. Il sistema recupera automaticamente il tenant dall'email

**Esempi:**
- Per tenant `demo`: usa `owner@demo.com` / `password123`
- Per tenant `test-business`: usa `cla@cla.it` / (la tua password)
- Per tenant `vision-tech`: usa `clamart85hs@gmail.com` / (la tua password)

**Non serve più:**
- ❌ Specificare manualmente il tenant
- ❌ Usare subdomain specifici
- ❌ Configurare DNS per subdomain

## Codice Modificato

### File: `app/login/page.tsx`

**Modifiche principali:**
1. ✅ Rimosso il campo "Tenant" dal form
2. ✅ Rimosso `tenantSlug` dal body della richiesta
3. ✅ Semplificato il form a solo email e password

### File: `app/api/auth/login/route.ts`

**Nuova logica:**
1. ✅ Controlla prima se l'utente è SUPER_ADMIN o ADMIN (non richiede tenant)
2. ✅ Per utenti normali, cerca l'utente per email in tutti i tenant usando `findFirst()`
3. ✅ Recupera automaticamente il tenant associato all'utente
4. ✅ Verifica che l'utente e il tenant siano attivi
5. ✅ Non richiede più `tenantSlug` nel body della richiesta

## Risoluzione Problemi

### Errore 401 "Invalid credentials"

Possibili cause:
1. **Email errata**: Controlla che l'email sia corretta
2. **Password errata**: Verifica la password
3. **Utente non attivo**: L'utente potrebbe essere disattivato
4. **Tenant non attivo**: Il tenant associato all'utente potrebbe essere disattivato

### Come verificare il tenant di un utente

Esegui questo comando:
```bash
npx tsx -e "
import { prisma } from './lib/prisma';
async function check() {
  const user = await prisma.user.findFirst({
    where: { email: 'TUA_EMAIL_QUI' },
    include: { tenant: true }
  });
  console.log('Tenant:', user?.tenant?.slug);
  await prisma.\$disconnect();
}
check();
"
```

## Note Tecniche

- Il sistema usa `prisma.user.findFirst()` per cercare l'utente per email in tutti i tenant
- Include automaticamente il tenant associato usando `include: { tenant: true }`
- Gli utenti SUPER_ADMIN e ADMIN vengono gestiti separatamente e non richiedono un tenant specifico
- Ogni email è unica per tenant grazie al constraint `tenantId_email` nel database
- Il sistema è più semplice e user-friendly rispetto all'approccio basato su subdomain
