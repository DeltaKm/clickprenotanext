import { PrismaClient } from '@prisma/client';
import { sendBookingConfirmationEmail, sendOwnerNotificationEmail } from '../lib/email';

const prisma = new PrismaClient();

async function testEmail() {
  console.log('🧪 Test Sistema Email\n');

  // 1. Trova un tenant con configurazione email
  console.log('📋 Cercando tenant con configurazione email...');
  const tenant = await prisma.tenant.findFirst({
    where: {
      emailConfig: { not: null }
    },
    include: {
      users: {
        where: { role: { in: ['OWNER', 'ADMIN'] } },
        take: 1
      }
    }
  });

  if (!tenant) {
    console.log('\n❌ Nessun tenant trovato con configurazione email!');
    console.log('\n💡 Per configurare l\'email di un tenant:');
    console.log('   1. Accedi come Admin');
    console.log('   2. Vai alla sezione Tenants');
    console.log('   3. Configura SMTP per un tenant\n');
    return;
  }

  console.log(`✅ Tenant trovato: ${tenant.name} (${tenant.slug})`);
  
  // Mostra configurazione email (nascondendo password)
  if (tenant.emailConfig && typeof tenant.emailConfig === 'object') {
    const config = tenant.emailConfig as any;
    console.log('\n📧 Configurazione SMTP:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Secure: ${config.secure}`);
    console.log(`   User: ${config.user}`);
    console.log(`   From: ${config.from}`);
    console.log(`   From Name: ${config.fromName}`);
  }

  // 2. Chiedi email destinatario
  console.log('\n📬 A quale email vuoi inviare il test?');
  console.log('   (Premi CTRL+C per annullare)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const testEmail = await new Promise<string>((resolve) => {
    rl.question('\n👉 Email destinatario: ', (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!testEmail || !testEmail.includes('@')) {
    console.log('\n❌ Email non valida!');
    return;
  }

  console.log(`\n📤 Invio email di test a: ${testEmail}`);

  // 3. Prepara dati di test
  const bookingData = {
    customerName: 'Mario Rossi (TEST)',
    customerEmail: testEmail,
    customerPhone: '+39 333 1234567',
    serviceName: 'Taglio Capelli (TEST)',
    bookingDate: new Date().toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    bookingTime: '14:30',
    totalPrice: '€ 25,00',
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
  };

  // 4. Invia email di conferma al cliente
  console.log('\n📧 Invio email di conferma prenotazione...');
  const result1 = await sendBookingConfirmationEmail(
    tenant.id,
    testEmail,
    bookingData
  );

  if (result1.success) {
    console.log('✅ Email di conferma inviata con successo!');
  } else {
    console.log(`❌ Errore invio email di conferma: ${result1.error}`);
  }

  // 5. Invia email di notifica al proprietario (se esiste)
  if (tenant.users.length > 0 && tenant.users[0].email) {
    console.log('\n📧 Invio email di notifica al proprietario...');
    const result2 = await sendOwnerNotificationEmail(
      tenant.id,
      tenant.users[0].email,
      bookingData
    );

    if (result2.success) {
      console.log('✅ Email di notifica inviata con successo!');
    } else {
      console.log(`❌ Errore invio email di notifica: ${result2.error}`);
    }
  }

  console.log('\n✅ Test completato!');
  console.log('\n💡 Controlla la casella email per verificare la ricezione.');
  console.log('   Se non ricevi nulla, controlla:');
  console.log('   - Cartella SPAM');
  console.log('   - Configurazione SMTP corretta');
  console.log('   - Credenziali SMTP valide\n');
}

testEmail()
  .catch((error) => {
    console.error('\n❌ Errore durante il test:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
