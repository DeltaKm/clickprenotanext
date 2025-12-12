import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    // List all users
    const users = await prisma.user.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`\n📋 Found ${users.length} users:\n`)
    
    for (const user of users) {
      console.log(`Email: ${user.email}`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Active: ${user.isActive ? '✅' : '❌'}`)
      console.log(`  Tenant: ${user.tenant?.slug || 'N/A'} (Active: ${user.tenant?.isActive ? '✅' : '❌'})`)
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
