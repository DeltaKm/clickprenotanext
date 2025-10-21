import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n')

    // Check tenants
    const tenants = await prisma.tenant.findMany()
    console.log('📊 Tenants:', tenants.length)
    tenants.forEach(t => console.log(`  - ${t.slug}: ${t.name}`))

    // Check users
    const users = await prisma.user.findMany({
      include: { tenant: true }
    })
    console.log('\n👥 Users:', users.length)
    users.forEach(u => console.log(`  - ${u.email} (${u.role}) - Tenant: ${u.tenant.slug}`))

    // Check services
    const services = await prisma.service.count()
    console.log('\n🛠️  Services:', services)

    // Check staff
    const staff = await prisma.staff.count()
    console.log('👨‍💼 Staff:', staff)

    // Check appointments
    const appointments = await prisma.appointment.count()
    console.log('📅 Appointments:', appointments)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
