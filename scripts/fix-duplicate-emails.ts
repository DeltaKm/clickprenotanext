import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateEmails() {
  console.log('🔍 Cercando email duplicate...');
  
  // Trova tutti gli utenti
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  // Raggruppa per email
  const emailMap = new Map<string, any[]>();
  users.forEach(user => {
    const existing = emailMap.get(user.email) || [];
    existing.push(user);
    emailMap.set(user.email, existing);
  });
  
  // Trova duplicati
  const duplicates = Array.from(emailMap.entries()).filter(([_, users]) => users.length > 1);
  
  if (duplicates.length === 0) {
    console.log('✅ Nessun duplicato trovato!');
    return;
  }
  
  console.log(`⚠️  Trovati ${duplicates.length} email duplicate:`);
  
  for (const [email, dupeUsers] of duplicates) {
    console.log(`\n📧 Email: ${email}`);
    console.log(`   Utenti trovati: ${dupeUsers.length}`);
    
    // Mantieni il primo (più vecchio), elimina gli altri
    const [keep, ...toDelete] = dupeUsers;
    console.log(`   ✓ Mantengo: ${keep.id} (${keep.name}) - creato: ${keep.createdAt}`);
    
    for (const user of toDelete) {
      console.log(`   ✗ Elimino: ${user.id} (${user.name}) - creato: ${user.createdAt}`);
      await prisma.user.delete({ where: { id: user.id } });
    }
  }
  
  console.log('\n✅ Duplicati rimossi con successo!');
}

fixDuplicateEmails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
