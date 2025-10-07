import { PrismaClient, UserRole, AppointmentStatus, DiscountType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      slug: 'demo',
      name: 'Demo Salon & Spa',
      domain: 'demo.localhost:3000',
      isActive: true,
      settings: {
        timezone: 'Europe/Rome',
        currency: 'EUR',
        bookingBuffer: 15, // minutes
      },
    },
  })

  console.log('✅ Created tenant:', tenant.slug)

  // Create owner user
  const ownerPassword = await bcrypt.hash('password123', 10)
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'owner@demo.com',
      passwordHash: ownerPassword,
      name: 'Mario Rossi',
      role: UserRole.OWNER,
      isActive: true,
    },
  })

  console.log('✅ Created owner:', owner.email)

  // Create staff users
  const staffPassword = await bcrypt.hash('password123', 10)
  
  const staff1User = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'giulia@demo.com',
      passwordHash: staffPassword,
      name: 'Giulia Bianchi',
      role: UserRole.STAFF,
      isActive: true,
    },
  })

  const staff1 = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      userId: staff1User.id,
      bio: 'Esperta in taglio e colore con 10 anni di esperienza',
      isActive: true,
    },
  })

  const staff2User = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'marco@demo.com',
      passwordHash: staffPassword,
      name: 'Marco Verdi',
      role: UserRole.STAFF,
      isActive: true,
    },
  })

  const staff2 = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      userId: staff2User.id,
      bio: 'Specializzato in trattamenti spa e massaggi',
      isActive: true,
    },
  })

  console.log('✅ Created staff:', staff1User.name, staff2User.name)

  // Create working hours for staff (Monday to Friday, 9:00-18:00)
  for (let day = 1; day <= 5; day++) {
    await prisma.workingHours.create({
      data: {
        tenantId: tenant.id,
        staffId: staff1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        isActive: true,
      },
    })

    await prisma.workingHours.create({
      data: {
        tenantId: tenant.id,
        staffId: staff2.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '19:00',
        breakStart: '13:30',
        breakEnd: '14:30',
        isActive: true,
      },
    })
  }

  console.log('✅ Created working hours')

  // Create services
  const haircut = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'Taglio Capelli',
      description: 'Taglio professionale con consulenza stile',
      duration: 45,
      price: 35.00,
      currency: 'EUR',
      isActive: true,
    },
  })

  const coloring = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'Colorazione',
      description: 'Colorazione completa con prodotti professionali',
      duration: 120,
      price: 80.00,
      currency: 'EUR',
      isActive: true,
    },
  })

  const massage = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'Massaggio Rilassante',
      description: 'Massaggio completo per rilassare corpo e mente',
      duration: 60,
      price: 60.00,
      currency: 'EUR',
      isActive: true,
    },
  })

  const facial = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'Trattamento Viso',
      description: 'Pulizia viso profonda con maschera',
      duration: 75,
      price: 55.00,
      currency: 'EUR',
      isActive: true,
    },
  })

  console.log('✅ Created services')

  // Link services to staff
  await prisma.staffService.createMany({
    data: [
      { tenantId: tenant.id, staffId: staff1.id, serviceId: haircut.id },
      { tenantId: tenant.id, staffId: staff1.id, serviceId: coloring.id },
      { tenantId: tenant.id, staffId: staff2.id, serviceId: massage.id },
      { tenantId: tenant.id, staffId: staff2.id, serviceId: facial.id },
    ],
  })

  console.log('✅ Linked services to staff')

  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      email: 'anna.ferrari@example.com',
      name: 'Anna Ferrari',
      phone: '+39 333 1234567',
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      email: 'luca.romano@example.com',
      name: 'Luca Romano',
      phone: '+39 333 7654321',
    },
  })

  console.log('✅ Created customers')

  // Create sample appointments
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      customerId: customer1.id,
      staffId: staff1.id,
      serviceId: haircut.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + haircut.duration * 60000),
      status: AppointmentStatus.CONFIRMED,
      totalPrice: haircut.price,
      notes: 'Cliente preferisce taglio corto',
    },
  })

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(14, 0, 0, 0)

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      customerId: customer2.id,
      staffId: staff2.id,
      serviceId: massage.id,
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + massage.duration * 60000),
      status: AppointmentStatus.PENDING,
      totalPrice: massage.price,
    },
  })

  console.log('✅ Created appointments')

  // Create coupon
  const validFrom = new Date()
  const validTo = new Date()
  validTo.setMonth(validTo.getMonth() + 3)

  await prisma.coupon.create({
    data: {
      tenantId: tenant.id,
      code: 'WELCOME10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom,
      validTo,
      maxUses: 100,
      usedCount: 0,
      isActive: true,
    },
  })

  console.log('✅ Created coupon')

  // Create tax rule
  await prisma.taxRule.create({
    data: {
      tenantId: tenant.id,
      name: 'IVA Standard',
      rate: 22,
      isActive: true,
    },
  })

  console.log('✅ Created tax rule')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📝 Demo credentials:')
  console.log('   Owner: owner@demo.com / password123')
  console.log('   Staff: giulia@demo.com / password123')
  console.log('   Staff: marco@demo.com / password123')
  console.log('\n🌐 Tenant: demo')
  console.log('   Access at: http://demo.localhost:3000')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
