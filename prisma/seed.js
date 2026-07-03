const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
const connectionString = `file:${dbPath}`;
console.log('Seed script absolute connection string:', connectionString);

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up existing database tables...');
  await prisma.activityLog.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.target.deleteMany({});
  await prisma.checkIn.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.whitelist.deleteMany({});

  console.log('Seeding whitelisted system users...');
  const users = [
    { email: 'sanjay@clevercrow.in', name: 'Sanjay Kumar', role: 'admin' },
    { email: 'ashwin@clevercrow.in', name: 'Ashwin', role: 'bdm' },
    { email: 'rohit@clevercrow.in', name: 'Rohit Sharma', role: 'bdm' },
    { email: 'priya@clevercrow.in', name: 'Priya Sen', role: 'telecaller' }
  ];

  for (const u of users) {
    await prisma.whitelist.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role
      }
    });
    console.log(`- Whitelisted: ${u.email} (${u.role})`);
  }

  console.log('Seeding clients/prospects...');
  
  // 1. Bean Brew Café
  const c1 = await prisma.client.create({
    data: {
      name: 'Rohan Naik',
      phoneNumber: '+91 98221 55667',
      businessName: 'Bean Brew Café',
      address: 'Near Miramar Beach, Panaji, Goa',
      city: 'Goa',
      area: 'Panaji',
      category: 'Café',
      notes: 'Interested in website redevelopment and social media setup. Highly interested.',
      serviceDetails: 'Website Design & Instagram Grid Management',
      status: 'New Prospect',
      value: 120000,
      dealValue: 120000,
      temperature: 'Hot',
      dealOwnerEmail: 'ashwin@clevercrow.in',
      source: 'Google Maps',
      score: 85
    }
  });

  // 2. FitFlex Studio
  const c2 = await prisma.client.create({
    data: {
      name: 'Vikram Singh',
      phoneNumber: '+91 98230 44556',
      businessName: 'FitFlex Studio',
      address: 'Opposite Mapusa Market, Mapusa, Goa',
      city: 'Goa',
      area: 'Mapusa',
      category: 'Gym',
      notes: 'Wants an online booking application for personal trainers. Budget is mid-level.',
      serviceDetails: 'Booking Web Application',
      status: 'Interested',
      value: 180000,
      dealValue: 180000,
      temperature: 'Warm',
      dealOwnerEmail: 'ashwin@clevercrow.in',
      source: 'Instagram',
      score: 65
    }
  });

  // 3. La Moda Boutique
  const c3 = await prisma.client.create({
    data: {
      name: 'Sneha Deshmukh',
      phoneNumber: '+91 98232 33445',
      businessName: 'La Moda Boutique',
      address: 'Fatorda Road, Margao, Goa',
      city: 'Goa',
      area: 'Margao',
      category: 'Retail',
      notes: 'Boutique owner looking to scale online sales. Needs WhatsApp catalogue automation.',
      serviceDetails: 'E-commerce website + WA catalogue integration',
      status: 'Proposal Required',
      value: 200000,
      dealValue: 200000,
      temperature: 'Cold',
      dealOwnerEmail: 'ashwin@clevercrow.in',
      source: 'Referral',
      score: 40
    }
  });

  // 4. Spice Route Bistro
  const c4 = await prisma.client.create({
    data: {
      name: 'Chef Ashwin',
      phoneNumber: '+91 98212 99881',
      businessName: 'Spice Route Bistro',
      address: 'Anjuna Caisua Road, Anjuna, Goa',
      city: 'Goa',
      area: 'Anjuna',
      category: 'Restaurant',
      notes: 'Wants restaurant POS integration and Meta Ads to increase walk-in dining table bookings.',
      serviceDetails: 'POS + Google local search booster + Meta Ads',
      status: 'Negotiation',
      value: 250000,
      dealValue: 250000,
      temperature: 'Hot',
      dealOwnerEmail: 'ashwin@clevercrow.in',
      source: 'Google Search',
      score: 90
    }
  });

  // 5. Urban Paws
  const c5 = await prisma.client.create({
    data: {
      name: 'Aditya Hegde',
      phoneNumber: '+91 98223 88776',
      businessName: 'Urban Paws',
      address: 'Chogm Road, Porvorim, Goa',
      city: 'Goa',
      area: 'Porvorim',
      category: 'Pet Grooming',
      notes: 'Closed Won. Complete booking portal launched. Fully collected.',
      serviceDetails: 'Pet booking Web Portal + Local SEO',
      status: 'Closed Won',
      value: 150000,
      dealValue: 150000,
      advanceAmount: 50000,
      balanceAmount: 100000,
      paymentStatus: 'Fully collected',
      invoiceStatus: 'Sent',
      gstRequired: true,
      clientStartDate: new Date(),
      isConvertedClient: true,
      dealOwnerEmail: 'ashwin@clevercrow.in',
      source: 'Google Maps',
      score: 100
    }
  });

  // 6. The Skin Lab
  const c6 = await prisma.client.create({
    data: {
      name: 'Dr. Meera Alvares',
      phoneNumber: '+91 98221 22334',
      businessName: 'The Skin Lab',
      address: 'Caculo Mall Road, Panaji, Goa',
      city: 'Goa',
      area: 'Panaji',
      category: 'Skin Clinic',
      notes: 'Deal closed lost. Client felt the initial development commercials were too high.',
      serviceDetails: 'Custom CRM and patient booking system',
      status: 'Closed Lost',
      value: 300000,
      dealValue: 300000,
      lostReason: 'Price too high',
      dealOwnerEmail: 'rohit@clevercrow.in',
      source: 'Google Ads',
      score: 10
    }
  });

  console.log('Seeding today\'s pending follow-ups...');
  
  // Set dates relative to today
  const today = new Date();
  
  const f1Date = new Date(today);
  f1Date.setHours(11, 0, 0, 0); // 11:00 AM

  const f2Date = new Date(today);
  f2Date.setHours(14, 30, 0, 0); // 2:30 PM

  const f3Date = new Date(today);
  f3Date.setHours(16, 0, 0, 0); // 4:00 PM

  await prisma.followUp.create({
    data: {
      clientId: c1.id,
      date: f1Date,
      type: 'Call',
      notes: 'Call Rohan Naik to discuss reference websites he shared.',
      status: 'Pending',
      nextAction: 'Finalize website layout reference list'
    }
  });

  await prisma.followUp.create({
    data: {
      clientId: c2.id,
      date: f2Date,
      type: 'Meeting',
      notes: 'Discovery meeting at Mapusa center to gather features list.',
      status: 'Pending',
      nextAction: 'Draft and send app proposal'
    }
  });

  await prisma.followUp.create({
    data: {
      clientId: c3.id,
      date: f3Date,
      type: 'Follow-Up',
      notes: 'Follow-up regarding the proposal sent for WA automation catalogue.',
      status: 'Pending',
      nextAction: 'Negotiate project commercials'
    }
  });

  console.log('Seeding BDM targets...');
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  await prisma.target.create({
    data: {
      bdmEmail: 'ashwin@clevercrow.in',
      month: currentMonth,
      year: currentYear,
      revenueTarget: 400000,
      prospectTarget: 32,
      callTarget: 100,
      meetingTarget: 18,
      proposalTarget: 7,
      collectionTarget: 300000
    }
  });

  console.log('Seeding activity logs...');
  const logs = [
    { clientId: c1.id, userEmail: 'ashwin@clevercrow.in', action: 'Created Lead', details: 'Added Bean Brew Café as a hot prospect.' },
    { clientId: c2.id, userEmail: 'ashwin@clevercrow.in', action: 'Logged Call', details: 'Spoke to Vikram Singh. Shared basic package details via WhatsApp.' },
    { clientId: c3.id, userEmail: 'ashwin@clevercrow.in', action: 'Logged Call', details: 'Sneha asked for an e-commerce catalog demo. Sent references.' },
    { clientId: c4.id, userEmail: 'ashwin@clevercrow.in', action: 'Booked Meeting', details: 'Scheduled discovery Google Meet with Chef Ashwin.' },
    { clientId: c5.id, userEmail: 'ashwin@clevercrow.in', action: 'Completed Meeting', details: 'Completed offline review session at Porvorim site.' },
    { clientId: c5.id, userEmail: 'ashwin@clevercrow.in', action: 'Closed Won', details: 'Received advance ₹50,000 via UPI. Signed e-agreement.' }
  ];

  for (const l of logs) {
    await prisma.activityLog.create({
      data: {
        clientId: l.clientId,
        userEmail: l.userEmail,
        action: l.action,
        details: l.details
      }
    });
  }

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
