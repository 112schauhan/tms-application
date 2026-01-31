import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // ===== CLEAR EXISTING DATA =====
  await prisma.trackingEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.dimensions.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // ===== CREATE USERS =====
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tms.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'employee@tms.com',
      password: employeePassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  console.log('✅ Users created:', { admin: admin.email, employee: employee.email });

  // ===== CREATE LOCATIONS =====
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        latitude: 40.7128,
        longitude: -74.006,
      },
    }),
    prisma.location.create({
      data: {
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postalCode: '90001',
        latitude: 34.0522,
        longitude: -118.2437,
      },
    }),
    prisma.location.create({
      data: {
        address: '789 Elm Rd',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        postalCode: '60601',
        latitude: 41.8781,
        longitude: -87.6298,
      },
    }),
    prisma.location.create({
      data: {
        address: '321 Pine St',
        city: 'Houston',
        state: 'TX',
        country: 'USA',
        postalCode: '77001',
        latitude: 29.7604,
        longitude: -95.3698,
      },
    }),
  ]);

  console.log('✅ Locations created:', locations.length);

  // ===== CREATE DIMENSIONS =====
  const dimensions = await Promise.all([
    ...Array.from({ length: 20 }, (_, i) =>
      prisma.dimensions.create({
        data: {
          length: 20 + i * 5,
          width: 15 + i * 3,
          height: 10 + i * 2,
        },
      })
    ),
  ]);

  console.log('✅ Dimensions created:', dimensions.length);

  // ===== CREATE SHIPMENTS =====
  const shipments = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const statuses: any[] = [
        'PENDING',
        'IN_TRANSIT',
        'DELIVERED',
        'ON_HOLD',
        'CANCELLED',
      ];
      const carriers = ['FedEx', 'UPS', 'DHL', 'Amazon Logistics', 'USPS'];
      const companies = [
        'Acme Corp',
        'Tech Solutions',
        'Global Traders',
        'Express Logistics',
        'Prime Imports',
      ];

      return prisma.shipment.create({
        data: {
          trackingNumber: `TMS5JKXYZ${String(i + 1).padStart(3, '0')}EFGH${i}`,
          shipperName: companies[i % companies.length],
          shipperPhone: `+1-${200 + i}-555-${1000 + i}`,
          shipperEmail: `shipper${i}@company.com`,
          consigneeName: `Receiver ${i + 1}`,
          consigneePhone: `+1-${300 + i}-555-${2000 + i}`,
          consigneeEmail: `receiver${i}@company.com`,
          pickupLocationId: locations[i % locations.length].id,
          deliveryLocationId: locations[(i + 1) % locations.length].id,
          carrierName: carriers[i % carriers.length],
          carrierPhone: `+1-${400 + i}-555-${3000 + i}`,
          weight: 5 + (i % 50),
          dimensionsId: dimensions[i % dimensions.length].id,
          rate: 100 + i * 10 + Math.random() * 50,
          currency: 'USD',
          status: statuses[i % statuses.length],
          isFlagged: i % 7 === 0,
          flagReason: i % 7 === 0 ? 'Delayed delivery suspected' : null,
          pickupDate: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
          estimatedDelivery: new Date(
            Date.now() + (10 + i) * 24 * 60 * 60 * 1000
          ),
          actualDelivery:
            i % 3 === 0
              ? new Date(Date.now() - (5 - (i % 5)) * 24 * 60 * 60 * 1000)
              : null,
          notes: `Sample shipment ${i + 1}`,
          createdById: i % 2 === 0 ? admin.id : employee.id,
          updatedById: i % 2 === 0 ? admin.id : employee.id,
        },
      });
    })
  );

  console.log('✅ Shipments created:', shipments.length);

  // ===== CREATE TRACKING EVENTS =====
  let trackingEventCount = 0;
  for (const shipment of shipments) {
    const statuses = ['Picked up', 'In transit', 'Out for delivery', 'Delivered'];
    const eventCount = Math.min(3 + Math.floor(Math.random() * 2), 4);

    for (let j = 0; j < eventCount; j++) {
      await prisma.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: statuses[j],
          timestamp: new Date(
            shipment.pickupDate!.getTime() + j * 24 * 60 * 60 * 1000
          ),
          locationId: locations[Math.floor(Math.random() * locations.length)].id,
          description: `Status update: ${statuses[j]}`,
        },
      });
      trackingEventCount++;
    }
  }

  console.log('✅ Tracking events created:', trackingEventCount);

  console.log('🎉 Database seeding completed!');
  console.log(`
📊 Summary:
   - Users: 2 (admin + employee)
   - Shipments: 20
   - Locations: 4
   - Dimensions: 20
   - Tracking Events: ${trackingEventCount}
   - Test Credentials:
     * Admin: admin@tms.com / admin123
     * Employee: employee@tms.com / employee123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
