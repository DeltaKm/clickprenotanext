import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword() {
  try {
    const email = 'owner@demo.com'
    const newPassword = 'password123'
    
    console.log(`🔄 Resetting password for ${email}...`)
    
    // Find user
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true }
    })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log(`✅ Found user: ${user.email} (${user.role}) - Tenant: ${user.tenant.slug}`)
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })
    
    console.log(`✅ Password updated successfully!`)
    console.log(`\n📝 Login credentials:`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()
