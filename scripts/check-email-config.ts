import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkEmailConfig() {
  try {
    console.log('🔍 Controllo configurazioni email...\n')

    // Trova tutti i tenant
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        emailConfig: true,
        users: {
          where: { role: 'OWNER' },
          select: { email: true, name: true },
        },
      },
    })

    for (const tenant of tenants) {
      console.log(`\n📦 Tenant: ${tenant.name} (${tenant.slug})`)
      console.log(`   Owner: ${tenant.users[0]?.name} (${tenant.users[0]?.email})`)
      
      if (tenant.emailConfig) {
        const config = tenant.emailConfig as any
        console.log(`    Ha configurazione SMTP:`)
        console.log(`      Host: ${config.host}`)
        console.log(`      Port: ${config.port}`)
        console.log(`      User: ${config.user}`)
        console.log(`      From: ${config.from}`)
        console.log(`      From Name: ${config.fromName}`)
      } else {
        console.log(`     Nessuna configurazione SMTP personalizzata`)
        console.log(`     Userà la configurazione globale dell'Admin (se presente)`)
      }
    }

    console.log('\nControllo completato!')
  } catch (error) {
    console.error(' Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmailConfig()
