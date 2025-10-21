import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@clickprenota.com'
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!'
    const name = 'Super Administrator'

    console.log('🔐 Creating Super Admin...\n')

    // Check if super admin already exists
    const existing = await prisma.user.findFirst({
      where: { 
        email,
        role: 'SUPER_ADMIN'
      },
    })

    if (existing) {
      console.log('⚠️  Super Admin already exists!')
      console.log(`   Email: ${existing.email}`)
      console.log(`   Name: ${existing.name}`)
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash },
      })
      console.log('\n✅ Password updated!')
      
    } else {
      // Create a special tenant for super admin
      let superTenant = await prisma.tenant.findFirst({
        where: { slug: 'super-admin' },
      })

      if (!superTenant) {
        superTenant = await prisma.tenant.create({
          data: {
            slug: 'super-admin',
            name: 'Super Admin',
            isActive: true,
          },
        })
        console.log('✅ Created Super Admin tenant')
      }

      // Create super admin user
      const passwordHash = await bcrypt.hash(password, 10)
      const superAdmin = await prisma.user.create({
        data: {
          tenantId: superTenant.id,
          email,
          passwordHash,
          name,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      })

      console.log('✅ Super Admin created successfully!')
      console.log(`   Email: ${superAdmin.email}`)
      console.log(`   Name: ${superAdmin.name}`)
    }

    console.log('\n📝 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n🔗 Access: /super-admin')
    console.log('\n⚠️  IMPORTANT: Change the password after first login!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()
