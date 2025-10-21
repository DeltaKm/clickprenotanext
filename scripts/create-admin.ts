import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com'
    const password = process.env.ADMIN_PASSWORD || 'Admin123!'
    const name = 'Admin User'
    const totalLicenses = parseInt(process.env.ADMIN_LICENSES || '10')
    const licenseMonths = parseInt(process.env.ADMIN_LICENSE_MONTHS || '12')

    console.log('🔐 Creating Admin...\n')

    // Check if admin already exists
    const existing = await prisma.user.findFirst({
      where: { 
        email,
        role: 'ADMIN'
      },
      include: {
        licensePackages: true,
      },
    })

    if (existing) {
      console.log('⚠️  Admin already exists!')
      console.log(`   Email: ${existing.email}`)
      console.log(`   Name: ${existing.name}`)
      
      const totalLics = existing.licensePackages.reduce((sum, pkg) => sum + pkg.quantity, 0)
      const usedLics = existing.licensePackages.reduce((sum, pkg) => sum + pkg.used, 0)
      console.log(`   Total Licenses: ${totalLics} (${usedLics} used)`)
      console.log(`   Packages: ${existing.licensePackages.length}`)
      
      // Update password and add new license package
      const passwordHash = await bcrypt.hash(password, 10)
      
      await prisma.user.update({
        where: { id: existing.id },
        data: { 
          passwordHash,
          licensePackages: {
            create: {
              quantity: totalLicenses,
              used: 0,
              durationMonths: licenseMonths,
            },
          },
        },
      })
      console.log('\n✅ Password updated and new license package added!')
      
    } else {
      // Find or create admin tenant
      let adminTenant = await prisma.tenant.findFirst({
        where: { slug: 'admin-system' },
      })

      if (!adminTenant) {
        adminTenant = await prisma.tenant.create({
          data: {
            slug: 'admin-system',
            name: 'Admin System',
            isActive: true,
          },
        })
        console.log('✅ Created Admin tenant')
      }

      // Create admin user with first license package
      const passwordHash = await bcrypt.hash(password, 10)
      
      const admin = await prisma.user.create({
        data: {
          tenantId: adminTenant.id,
          email,
          passwordHash,
          name,
          role: 'ADMIN',
          isActive: true,
          licensePackages: {
            create: {
              quantity: totalLicenses,
              used: 0,
              durationMonths: licenseMonths,
            },
          },
        },
        include: {
          licensePackages: true,
        },
      })

      console.log('✅ Admin created successfully!')
      console.log(`   Email: ${admin.email}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Total Licenses: ${totalLicenses}`)
      console.log(`   Duration: ${licenseMonths} months`)
    }

    console.log('\n📝 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n🔗 Access: /admin')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
