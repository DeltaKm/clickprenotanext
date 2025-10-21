import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateLicenses() {
  try {
    console.log('🔄 Migrating license packages...\n')

    // Delete all existing license packages (they have old schema)
    const deleted = await prisma.licensePackage.deleteMany({})
    console.log(`✅ Deleted ${deleted.count} old license packages`)

    console.log('\n✨ Migration complete!')
    console.log('💡 Run "npx tsx scripts/create-admin.ts" to recreate admin with new license system')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateLicenses()
