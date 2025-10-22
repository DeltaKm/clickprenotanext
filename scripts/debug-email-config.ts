import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugEmailConfig() {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'test-mail' },
      select: {
        name: true,
        emailConfig: true,
      },
    })

    if (tenant) {
      console.log('Tenant:', tenant.name)
      console.log('Email Config:', JSON.stringify(tenant.emailConfig, null, 2))
      
      if (tenant.emailConfig) {
        const config = tenant.emailConfig as any
        console.log('\nTipi dei campi:')
        console.log('- host:', typeof config.host, '→', config.host)
        console.log('- port:', typeof config.port, '→', config.port)
        console.log('- secure:', typeof config.secure, '→', config.secure)
        console.log('- user:', typeof config.user, '→', config.user)
        console.log('- pass:', typeof config.pass, '→', config.pass)
        console.log('- from:', typeof config.from, '→', config.from)
        console.log('- fromName:', typeof config.fromName, '→', config.fromName)
      }
    }
  } catch (error) {
    console.error('Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugEmailConfig()
