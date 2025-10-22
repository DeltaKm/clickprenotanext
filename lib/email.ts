import nodemailer from 'nodemailer'
import { prisma } from './prisma'

// Tipi per configurazione email
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  fromName: string
}

// Type guard per validare EmailConfig
function isEmailConfig(value: unknown): value is EmailConfig {
  if (!value || typeof value !== 'object') return false
  const config = value as Record<string, unknown>
  
  // Port può essere string o number, lo convertiamo
  const port = typeof config.port === 'string' ? parseInt(config.port, 10) : (typeof config.port === 'number' ? config.port : NaN)
  
  return (
    typeof config.host === 'string' &&
    (typeof config.port === 'number' || typeof config.port === 'string') &&
    typeof config.secure === 'boolean' &&
    typeof config.user === 'string' &&
    typeof config.pass === 'string' &&
    typeof config.from === 'string' &&
    typeof config.fromName === 'string' &&
    typeof port === 'number' &&
    !isNaN(port)
  )
}

// Type guard per validare EmailTemplates
function isEmailTemplates(value: unknown): value is EmailTemplates {
  if (!value || typeof value !== 'object') return false
  // EmailTemplates può essere un oggetto vuoto o contenere template opzionali
  return true
}

interface EmailTemplate {
  subject: string
  message: string
  instructions?: string
}

interface EmailTemplates {
  bookingRequest?: EmailTemplate
  bookingConfirmation?: EmailTemplate
  bookingRejection?: EmailTemplate
  ownerNotification?: EmailTemplate
  adminNotification?: EmailTemplate
}

// Template di default
const DEFAULT_TEMPLATES: EmailTemplates = {
  bookingRequest: {
    subject: 'Richiesta di prenotazione ricevuta',
    message: 'Grazie per la tua richiesta di prenotazione presso {{businessName}}. Riceverai una conferma a breve.',
  },
  bookingConfirmation: {
    subject: 'Prenotazione confermata',
    message: 'La tua prenotazione presso {{businessName}} è stata confermata!',
    instructions: 'Ti aspettiamo {{bookingDate}} alle ore {{bookingTime}}.',
  },
  bookingRejection: {
    subject: 'Prenotazione non disponibile',
    message: 'Ci dispiace, ma la prenotazione richiesta presso {{businessName}} non è disponibile.',
  },
  ownerNotification: {
    subject: 'Nuova prenotazione ricevuta',
    message: 'Hai ricevuto una nuova richiesta di prenotazione da {{customerName}}.',
  },
  adminNotification: {
    subject: 'Nuova prenotazione su {{businessName}}',
    message: 'Il business {{businessName}} ha ricevuto una nuova prenotazione.',
  },
}

// Crea transporter SMTP
function createTransporter(config: EmailConfig) {
  // Assicuriamoci che port sia un number
  const port = typeof config.port === 'string' ? parseInt(config.port, 10) : config.port
  
  return nodemailer.createTransport({
    host: config.host,
    port: port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

// Sostituisci variabili nel template
function replaceVariables(text: string, variables: Record<string, any>): string {
  let result = text
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, variables[key] || '')
  })
  return result
}

// Genera HTML email
function generateEmailHtml(template: EmailTemplate, variables: Record<string, any>): string {
  const message = replaceVariables(template.message, variables)
  const instructions = template.instructions 
    ? replaceVariables(template.instructions, variables) 
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: ${variables.businessColor || '#2563eb'};
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 15px;
        }
        .content {
          background: white;
          padding: 30px 20px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .message {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .details {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
        }
        .detail-value {
          color: #111827;
        }
        .instructions {
          background: #eff6ff;
          border-left: 4px solid ${variables.businessColor || '#2563eb'};
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .button {
          display: inline-block;
          background: ${variables.businessColor || '#2563eb'};
          color: white !important;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${variables.businessLogo ? `<img src="${variables.businessLogo}" alt="${variables.businessName}" class="logo">` : ''}
        <h1>${variables.businessName}</h1>
      </div>
      
      <div class="content">
        <p class="message">${message}</p>
        
        ${variables.bookingDetails ? `
          <div class="details">
            ${variables.serviceName ? `
              <div class="detail-row">
                <span class="detail-label">Servizio:</span>
                <span class="detail-value">${variables.serviceName}</span>
              </div>
            ` : ''}
            ${variables.bookingDate ? `
              <div class="detail-row">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${variables.bookingDate}</span>
              </div>
            ` : ''}
            ${variables.bookingTime ? `
              <div class="detail-row">
                <span class="detail-label">Ora:</span>
                <span class="detail-value">${variables.bookingTime}</span>
              </div>
            ` : ''}
            ${variables.totalPrice ? `
              <div class="detail-row">
                <span class="detail-label">Prezzo:</span>
                <span class="detail-value">${variables.totalPrice}</span>
              </div>
            ` : ''}
            ${variables.customerName ? `
              <div class="detail-row">
                <span class="detail-label">Cliente:</span>
                <span class="detail-value">${variables.customerName}</span>
              </div>
            ` : ''}
            ${variables.customerEmail ? `
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${variables.customerEmail}</span>
              </div>
            ` : ''}
            ${variables.customerPhone ? `
              <div class="detail-row">
                <span class="detail-label">Telefono:</span>
                <span class="detail-value">${variables.customerPhone}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${instructions ? `
          <div class="instructions">
            <strong>Istruzioni:</strong><br>
            ${instructions}
          </div>
        ` : ''}
        
        ${variables.dashboardUrl ? `
          <div style="text-align: center;">
            <a href="${variables.dashboardUrl}" class="button">Vai alla Dashboard</a>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>Questa email è stata inviata da ${variables.businessName}</p>
        ${variables.businessEmail ? `<p>Contatto: ${variables.businessEmail}</p>` : ''}
        ${variables.businessPhone ? `<p>Telefono: ${variables.businessPhone}</p>` : ''}
      </div>
    </body>
    </html>
  `
}

// Funzione principale per inviare email
export async function sendEmail(
  tenantId: string,
  type: keyof EmailTemplates,
  recipientEmail: string,
  variables: Record<string, any>
) {
  try {
    // Carica tenant con configurazione email
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        emailConfig: true,
        emailTemplates: true,
        brandColor: true,
        logo: true,
        businessEmail: true,
        businessPhone: true,
      },
    })

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    // Verifica configurazione SMTP
    let emailConfig: EmailConfig | null = null
    
    if (tenant.emailConfig && isEmailConfig(tenant.emailConfig)) {
      // Usa configurazione personalizzata del tenant
      emailConfig = tenant.emailConfig
    } else {
      // Cerca configurazione globale dell'Admin
      console.log(`Tenant ${tenantId} non ha config SMTP, cerco quella globale dell'Admin...`)
      
      const adminTenant = await prisma.tenant.findFirst({
        where: {
          users: {
            some: {
              role: 'ADMIN',
            },
          },
        },
        select: {
          emailConfig: true,
        },
      })
      
      if (adminTenant?.emailConfig && isEmailConfig(adminTenant.emailConfig)) {
        emailConfig = adminTenant.emailConfig
        console.log(`✅ Uso configurazione globale dell'Admin`)
      }
    }

    if (!emailConfig) {
      console.warn(`No email config for tenant ${tenantId} and no global admin config, skipping email`)
      return { success: false, error: 'No email configuration' }
    }

    // Ottieni template (custom o default)
    const customTemplates = isEmailTemplates(tenant.emailTemplates) 
      ? tenant.emailTemplates 
      : null
    const template = customTemplates?.[type] || DEFAULT_TEMPLATES[type]

    if (!template) {
      throw new Error(`Template ${type} not found`)
    }

    // Aggiungi variabili business
    const allVariables = {
      businessName: tenant.name,
      businessColor: tenant.brandColor,
      businessLogo: tenant.logo,
      businessEmail: tenant.businessEmail,
      businessPhone: tenant.businessPhone,
      bookingDetails: true,
      ...variables,
    }

    // Genera HTML
    const html = generateEmailHtml(template, allVariables)
    const subject = replaceVariables(template.subject, allVariables)

    // Crea transporter e invia
    const transporter = createTransporter(emailConfig)
    
    await transporter.sendMail({
      from: `${emailConfig.fromName} <${emailConfig.from}>`,
      to: recipientEmail,
      subject,
      html,
    })

    console.log(`✅ Email sent: ${type} to ${recipientEmail}`)
    return { success: true }
  } catch (error) {
    console.error('❌ Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Funzioni specifiche per ogni tipo di email
export async function sendBookingRequestEmail(
  tenantId: string,
  customerEmail: string,
  bookingData: {
    customerName: string
    serviceName: string
    bookingDate: string
    bookingTime: string
    totalPrice: string
  }
) {
  return sendEmail(tenantId, 'bookingRequest', customerEmail, bookingData)
}

export async function sendBookingConfirmationEmail(
  tenantId: string,
  customerEmail: string,
  bookingData: {
    customerName: string
    serviceName: string
    bookingDate: string
    bookingTime: string
    totalPrice: string
  }
) {
  return sendEmail(tenantId, 'bookingConfirmation', customerEmail, bookingData)
}

export async function sendBookingRejectionEmail(
  tenantId: string,
  customerEmail: string,
  bookingData: {
    customerName: string
    serviceName: string
    bookingDate: string
    bookingTime: string
    reason?: string
  }
) {
  return sendEmail(tenantId, 'bookingRejection', customerEmail, bookingData)
}

export async function sendOwnerNotificationEmail(
  tenantId: string,
  ownerEmail: string,
  bookingData: {
    customerName: string
    customerEmail: string
    customerPhone: string
    serviceName: string
    bookingDate: string
    bookingTime: string
    totalPrice: string
    dashboardUrl: string
  }
) {
  return sendEmail(tenantId, 'ownerNotification', ownerEmail, bookingData)
}

export async function sendAdminNotificationEmail(
  adminEmail: string,
  tenantId: string,
  bookingData: {
    businessName: string
    customerName: string
    serviceName: string
    bookingDate: string
    bookingTime: string
    totalPrice: string
  }
) {
  // Per admin usiamo configurazione globale (se esiste)
  return sendEmail(tenantId, 'adminNotification', adminEmail, bookingData)
}
