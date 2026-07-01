const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({ url: process.env.DATABASE_URL });

const clients = [
  {
    id: "c1-uuid-00001",
    name: "Thomas Anderson",
    phoneNumber: "+1 (555) 019-9283",
    businessName: "Acme Global Solutions",
    address: "One Market Plaza, San Francisco, CA 94105",
    notes: "Client requested comprehensive cloud migration assessment. Deal signed and active.",
    serviceDetails: "Enterprise Cloud Strategy & Consulting",
    status: "active",
    value: 18500.0,
    currency: "USD"
  },
  {
    id: "c2-uuid-00002",
    name: "Rajesh Sharma",
    phoneNumber: "+91 98765 43210",
    businessName: "Kestrel Digital Ventures",
    address: "Block C, Connaught Place, New Delhi, DL 110001",
    notes: "Successfully deployed full-scale Salesforce CRM. Project delivered on time.",
    serviceDetails: "Salesforce Customization & Implementation",
    status: "completed",
    value: 350000.0,
    currency: "INR"
  },
  {
    id: "c3-uuid-00003",
    name: "Sarah Jenkins",
    phoneNumber: "+44 20 7946 0958",
    businessName: "Horizon Digital Media",
    address: "42 London Wall, London, EC2M 5TB",
    notes: "Initial discovery call completed. Pitch deck sent. Awaiting feedback.",
    serviceDetails: "Content Marketing Campaign & SEO Strategy",
    status: "lead",
    value: 9200.0,
    currency: "GBP"
  },
  {
    id: "c4-uuid-00004",
    name: "Anjali Gupta",
    phoneNumber: "+91 87654 32109",
    businessName: "Apex Logistics Systems",
    address: "Sector 62, Noida, UP 201301",
    notes: "Ongoing backend system integration. Weekly standups scheduled.",
    serviceDetails: "Supply Chain Software Modernization",
    status: "active",
    value: 480000.0,
    currency: "INR"
  },
  {
    id: "c5-uuid-00005",
    name: "Michael Vance",
    phoneNumber: "+1 (555) 012-3456",
    businessName: "Nighthawk Security Labs",
    address: "500 Austin Avenue, Austin, TX 78701",
    notes: "Completed compliance audit. Client paused further consulting contract.",
    serviceDetails: "PCI-DSS Compliance Auditing & Pen Testing",
    status: "inactive",
    value: 15000.0,
    currency: "USD"
  }
];

const logs = [
  { id: "log-1", clientId: "c1-uuid-00001", userEmail: "sanjay@clevercrow.in", action: "Created Client", details: "Created client record under Acme Global Solutions." },
  { id: "log-2", clientId: "c1-uuid-00001", userEmail: "sanjay@clevercrow.in", action: "Updated Status", details: "Moved status to Active after agreement signature." },
  { id: "log-3", clientId: "c2-uuid-00002", userEmail: "sanjaykumar@gmail.com", action: "Created Client", details: "Imported prospect Rajesh Sharma." },
  { id: "log-4", clientId: "c2-uuid-00002", userEmail: "sanjaykumar@gmail.com", action: "Updated Status", details: "Marked client as Completed after successful product delivery." },
  { id: "log-5", clientId: "c3-uuid-00003", userEmail: "clevercrowstrategies@gmail.com", action: "Created Client", details: "Registered lead Sarah Jenkins." },
  { id: "log-6", clientId: "c4-uuid-00004", userEmail: "sanjay@clevercrow.in", action: "Created Client", details: "Added Rajesh's logistics team lead Anjali." },
  { id: "log-7", clientId: "c5-uuid-00005", userEmail: "admin@clevercrowstrategies.com", action: "Created Client", details: "Created audit file for Nighthawk Security." }
];

async function main() {
  console.log("Cleaning up old clients and activity logs...");
  await client.execute("DELETE FROM ActivityLog");
  await client.execute("DELETE FROM Client");
  
  console.log("Seeding fake clients...");
  for (const c of clients) {
    await client.execute({
      sql: `INSERT INTO Client (id, name, phoneNumber, businessName, address, notes, serviceDetails, status, value, currency, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [c.id, c.name, c.phoneNumber, c.businessName, c.address, c.notes, c.serviceDetails, c.status, c.value, c.currency]
    });
    console.log(`- Seeded client: ${c.businessName}`);
  }

  console.log("Seeding activity logs...");
  for (const l of logs) {
    await client.execute({
      sql: `INSERT INTO ActivityLog (id, clientId, userEmail, action, details, createdAt) 
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [l.id, l.clientId, l.userEmail, l.action, l.details]
    });
    console.log(`- Seeded activity log: ${l.action}`);
  }

  console.log("\n🚀 Done! 5 realistic clients and histories seeded to Turso!");
  process.exit(0);
}

main().catch(console.error);
