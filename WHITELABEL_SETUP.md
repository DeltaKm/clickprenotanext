# 🏷️ Whitelabel Configuration

## 📋 Panoramica

Il sistema ora supporta la **configurazione whitelabel** tramite variabili d'ambiente. Puoi personalizzare il nome dell'applicazione, la descrizione, il nome dell'azienda e altri dettagli del brand.

## ⚙️ Configurazione

### 1. Variabili d'Ambiente

Apri il tuo file `.env` e aggiungi queste variabili:

```bash
# Whitelabel Configuration
NEXT_PUBLIC_APP_NAME="Il Tuo Brand"
NEXT_PUBLIC_APP_DESCRIPTION="La tua descrizione personalizzata"
NEXT_PUBLIC_COMPANY_NAME="La Tua Azienda SRL"
NEXT_PUBLIC_SUPPORT_EMAIL="supporto@tuodominio.com"
```

### 2. Valori di Default

Se non specifichi le variabili, vengono usati questi valori:

| Variabile | Default |
|-----------|---------|
| `NEXT_PUBLIC_APP_NAME` | "BookingSaaS" |
| `NEXT_PUBLIC_APP_DESCRIPTION` | "Sistema di prenotazioni online" |
| `NEXT_PUBLIC_COMPANY_NAME` | "La Tua Azienda" |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | "support@example.com" |

## 🎨 Dove Viene Applicato

### 1. Homepage (`/`)
- **Header**: Nome app nel logo
- **Footer**: Copyright con nome azienda

### 2. Dashboard (`/dashboard`)
- **Sidebar**: Nome app nel logo
- **Tutte le pagine**: Branding consistente

### 3. Metadata SEO
- **Title**: Nome app nel title tag
- **Description**: Descrizione personalizzata
- **Keywords**: Keywords per SEO

### 4. Emails (Future)
- **From**: Nome azienda
- **Support**: Email di supporto

## 📝 Esempi di Configurazione

### Esempio 1: Salone di Bellezza

```bash
NEXT_PUBLIC_APP_NAME="Bellezza Booking"
NEXT_PUBLIC_APP_DESCRIPTION="Sistema di prenotazioni per saloni di bellezza"
NEXT_PUBLIC_COMPANY_NAME="Bellezza Italia SRL"
NEXT_PUBLIC_SUPPORT_EMAIL="info@bellezzabooking.it"
```

### Esempio 2: Centro Medico

```bash
NEXT_PUBLIC_APP_NAME="MediBook"
NEXT_PUBLIC_APP_DESCRIPTION="Gestione appuntamenti medici"
NEXT_PUBLIC_COMPANY_NAME="Centro Medico San Marco"
NEXT_PUBLIC_SUPPORT_EMAIL="prenotazioni@centrosanmarco.it"
```

### Esempio 3: Studio Legale

```bash
NEXT_PUBLIC_APP_NAME="LegalAppointments"
NEXT_PUBLIC_APP_DESCRIPTION="Sistema di prenotazioni per studi legali"
NEXT_PUBLIC_COMPANY_NAME="Studio Legale Rossi & Associati"
NEXT_PUBLIC_SUPPORT_EMAIL="segreteria@studiolegaleros si.it"
```

## 🔧 File di Configurazione

### `lib/whitelabel.ts`

Questo file centralizza tutta la configurazione whitelabel:

```typescript
export const whitelabel = {
  // App Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'BookingSaaS',
  appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '...',
  
  // Company Information
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || '...',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '...',
  
  // Metadata for SEO
  metadata: {
    title: '...',
    description: '...',
    keywords: '...',
  },
  
  // Footer
  footer: {
    copyright: `© ${new Date().getFullYear()} ...`,
    links: [...],
  },
}
```

### Helper Functions

```typescript
// Get full page title
import { getPageTitle } from '@/lib/whitelabel'

const title = getPageTitle('Dashboard')
// Result: "Dashboard | Il Tuo Brand"
```

## 🚀 Come Usare

### In un Componente React

```typescript
import { whitelabel } from '@/lib/whitelabel'

export default function MyComponent() {
  return (
    <div>
      <h1>{whitelabel.appName}</h1>
      <p>{whitelabel.appDescription}</p>
      <p>Contattaci: {whitelabel.supportEmail}</p>
    </div>
  )
}
```

### In Metadata (Server Component)

```typescript
import { whitelabel } from '@/lib/whitelabel'

export const metadata = {
  title: whitelabel.metadata.title,
  description: whitelabel.metadata.description,
}
```

## 🎯 Componenti Aggiornati

I seguenti componenti ora usano la configurazione whitelabel:

- ✅ `app/layout.tsx` - Metadata SEO
- ✅ `app/page.tsx` - Homepage (header + footer)
- ✅ `app/dashboard/layout.tsx` - Dashboard sidebar

## 📦 Variabili NEXT_PUBLIC

**Importante**: Le variabili devono iniziare con `NEXT_PUBLIC_` per essere accessibili nel browser.

### Perché NEXT_PUBLIC?

```bash
# ✅ CORRETTO - Accessibile nel browser
NEXT_PUBLIC_APP_NAME="MyApp"

# ❌ SBAGLIATO - Solo server-side
APP_NAME="MyApp"
```

Next.js espone solo le variabili con prefisso `NEXT_PUBLIC_` al client.

## 🔄 Applicare le Modifiche

Dopo aver modificato il `.env`:

1. **Riavvia il server**:
```bash
# Ferma il server (Ctrl+C)
npm run dev
```

2. **Verifica le modifiche**:
   - Apri `http://localhost:3000`
   - Controlla che il nome sia aggiornato
   - Verifica il footer

3. **Clear cache del browser** (se necessario):
   - Hard refresh: Ctrl+Shift+R (Win) o Cmd+Shift+R (Mac)

## 🎨 Personalizzazioni Future

### Logo Personalizzato

```typescript
// lib/whitelabel.ts
export const whitelabel = {
  // ...
  logo: process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png',
}
```

### Colori del Brand

```typescript
export const whitelabel = {
  // ...
  colors: {
    primary: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#2563eb',
    secondary: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#10b981',
  },
}
```

### Social Links

```typescript
export const whitelabel = {
  // ...
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
  },
}
```

## 🔐 Super Admin (Future)

Invece di configurare tramite `.env`, potrai gestire il whitelabel da un pannello Super Admin:

```
/super-admin/whitelabel
  - Nome App
  - Descrizione
  - Logo Upload
  - Colori Brand
  - Informazioni Azienda
  - Social Links
```

Questo salverà le configurazioni nel database invece che nel `.env`.

## ✅ Checklist Setup

- [ ] Copiato `.env.example` in `.env`
- [ ] Modificato `NEXT_PUBLIC_APP_NAME`
- [ ] Modificato `NEXT_PUBLIC_COMPANY_NAME`
- [ ] Modificato `NEXT_PUBLIC_SUPPORT_EMAIL`
- [ ] Riavviato il server
- [ ] Verificato homepage
- [ ] Verificato dashboard
- [ ] Verificato footer

## 📞 Supporto

Per domande sulla configurazione whitelabel:
- Email: {whitelabel.supportEmail}
- Documentazione: `/docs`

---

**Il tuo brand, la tua piattaforma! 🎨**
