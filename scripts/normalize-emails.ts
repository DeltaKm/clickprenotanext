import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function normalizeEmails() {
  try {
    console.log('🔄 Normalizing emails to lowercase...\n')
    
    // Get all users
    const users = await prisma.user.findMany()
    
    let updated = 0
    
    for (const user of users) {
      const normalizedEmail = user.email.toLowerCase()
      
      if (user.email !== normalizedEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: normalizedEmail }
        })
        console.log(`✅ ${user.email} → ${normalizedEmail}`)
        updated++
      }
    }
    
    if (updated === 0) {
      console.log('✅ All emails are already lowercase!')
    } else {
      console.log(`\n✅ Updated ${updated} email(s)`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

normalizeEmails()
