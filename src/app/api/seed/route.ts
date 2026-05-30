import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const PRODUCTS_DATA = [
  { category: 'grains', name: 'Basmati Rice - 1121', qualityGrade: 'A', pricePerUnit: 4500, unit: 'quintal' },
  { category: 'grains', name: 'Wheat - Sharbati', qualityGrade: 'A', pricePerUnit: 2800, unit: 'quintal' },
  { category: 'grains', name: 'Sona Masoori Rice', qualityGrade: 'B', pricePerUnit: 3200, unit: 'quintal' },
  { category: 'vegetables', name: 'Onion - Nashik Red', qualityGrade: 'A', pricePerUnit: 1200, unit: 'quintal' },
  { category: 'vegetables', name: 'Potato - Aloo', qualityGrade: 'B', pricePerUnit: 800, unit: 'quintal' },
  { category: 'vegetables', name: 'Tomato - Hybrid', qualityGrade: 'A', pricePerUnit: 2500, unit: 'quintal' },
  { category: 'fruits', name: 'Alphonso Mango', qualityGrade: 'A', pricePerUnit: 8000, unit: 'quintal' },
  { category: 'fruits', name: 'Nagpur Orange', qualityGrade: 'A', pricePerUnit: 4500, unit: 'quintal' },
  { category: 'fruits', name: 'Grapes - Thompson', qualityGrade: 'A', pricePerUnit: 5500, unit: 'quintal' },
  { category: 'spices', name: 'Turmeric - Salem', qualityGrade: 'A', pricePerUnit: 9000, unit: 'quintal' },
  { category: 'spices', name: 'Red Chilli - Guntur', qualityGrade: 'A', pricePerUnit: 12000, unit: 'quintal' },
  { category: 'spices', name: 'Cardamom - Green', qualityGrade: 'A', pricePerUnit: 85000, unit: 'quintal' },
  { category: 'dairy', name: 'Fresh Milk', qualityGrade: 'A', pricePerUnit: 60, unit: 'litre' },
  { category: 'dairy', name: 'Ghee - Cow', qualityGrade: 'A', pricePerUnit: 650, unit: 'litre' },
  { category: 'poultry', name: 'Country Eggs', qualityGrade: 'A', pricePerUnit: 8, unit: 'kg' },
  { category: 'pulses', name: 'Toor Dal', qualityGrade: 'A', pricePerUnit: 7500, unit: 'quintal' },
  { category: 'pulses', name: 'Chana Dal', qualityGrade: 'A', pricePerUnit: 6500, unit: 'quintal' },
  { category: 'oilseeds', name: 'Mustard Seeds', qualityGrade: 'A', pricePerUnit: 5500, unit: 'quintal' },
  { category: 'oilseeds', name: 'Groundnut', qualityGrade: 'B', pricePerUnit: 6000, unit: 'quintal' },
  { category: 'grains', name: 'Maize - Hybrid', qualityGrade: 'B', pricePerUnit: 2200, unit: 'quintal' },
]

const LOCATIONS = [
  { state: 'Maharashtra', city: 'Nashik' },
  { state: 'Punjab', city: 'Ludhiana' },
  { state: 'Madhya Pradesh', city: 'Indore' },
  { state: 'Karnataka', city: 'Bengaluru' },
  { state: 'Tamil Nadu', city: 'Salem' },
  { state: 'Andhra Pradesh', city: 'Guntur' },
  { state: 'Rajasthan', city: 'Jaipur' },
  { state: 'Uttar Pradesh', city: 'Lucknow' },
  { state: 'Gujarat', city: 'Ahmedabad' },
  { state: 'West Bengal', city: 'Kolkata' },
  { state: 'Haryana', city: 'Karnal' },
  { state: 'Telangana', city: 'Hyderabad' },
]

const PRODUCER_NAMES = [
  'Rajesh Farm Produce', 'Green Harvest FPO', 'Krishna Agro', 'Satyam Organic',
  'Punjab Grain Traders', 'Deccan Spice Co', 'Ganga Dairy Farm', 'Malwa Pulses',
  'Konkan Fruit Growers', 'Marathwada Onion Co', 'Narmada Agro', 'Cauvery Farmers Co'
]

const BUYER_NAMES = [
  'Metro Foods Pvt Ltd', 'Export India Trading', 'FreshMart Retail', 
  'Spice Route Exports', 'National Procurement Corp', 'Hotel Chain India',
  'Relief Foods Processing', 'Tropical Exports Ltd'
]

const TRANSPORTER_NAMES = [
  'Singh Roadways', 'Patel Transport Corp', 'South India Logistics',
  'Express Freight India', 'Krishna Carriers', 'National Fleet Services'
]

export async function GET() {
  try {
    // Check if already seeded
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ message: 'Database already seeded', count: existingUsers })
    }

    // Create producers
    const producers = []
    for (let i = 0; i < PRODUCER_NAMES.length; i++) {
      const loc = LOCATIONS[i % LOCATIONS.length]
      const producer = await db.user.create({
        data: {
          email: `producer${i + 1}@agrilink.in`,
          name: PRODUCER_NAMES[i].split(' ').slice(0, 2).join(' '),
          companyName: PRODUCER_NAMES[i],
          role: 'producer',
          phone: `+91${9000000000 + i}`,
          state: loc.state,
          city: loc.city,
          address: `${loc.city}, ${loc.state}`,
          verificationStatus: i < 8 ? 'verified' : 'pending',
          isOnline: Math.random() > 0.3,
        }
      })
      producers.push(producer)
    }

    // Create products
    for (let i = 0; i < PRODUCTS_DATA.length; i++) {
      const p = PRODUCTS_DATA[i]
      const producer = producers[i % producers.length]
      const loc = LOCATIONS[i % LOCATIONS.length]
      await db.product.create({
        data: {
          sellerId: producer.id,
          category: p.category,
          name: p.name,
          description: `Premium quality ${p.name} from ${loc.state}. Freshly harvested and graded.`,
          quantity: Math.floor(Math.random() * 100 + 10) * 10,
          unit: p.unit,
          pricePerUnit: p.pricePerUnit + Math.floor(Math.random() * 500 - 250),
          minOrderQty: 5,
          location: `${loc.city}, ${loc.state}`,
          state: loc.state,
          qualityGrade: p.qualityGrade,
          isActive: true,
        }
      })
    }

    // Create buyers
    const buyers = []
    for (let i = 0; i < BUYER_NAMES.length; i++) {
      const loc = LOCATIONS[(i + 3) % LOCATIONS.length]
      const buyer = await db.user.create({
        data: {
          email: `buyer${i + 1}@agrilink.in`,
          name: BUYER_NAMES[i].split(' ').slice(0, 2).join(' '),
          companyName: BUYER_NAMES[i],
          role: 'buyer',
          phone: `+91${8000000000 + i}`,
          state: loc.state,
          city: loc.city,
          address: `${loc.city}, ${loc.state}`,
          verificationStatus: i < 5 ? 'verified' : 'pending',
          isOnline: Math.random() > 0.4,
        }
      })
      buyers.push(buyer)
    }

    // Create buyer requirements
    const requirementData = [
      { productType: 'Basmati Rice', category: 'grains', quantityNeeded: 500, unit: 'quintal' },
      { productType: 'Red Chilli', category: 'spices', quantityNeeded: 200, unit: 'quintal' },
      { productType: 'Onion', category: 'vegetables', quantityNeeded: 1000, unit: 'quintal' },
      { productType: 'Alphonso Mango', category: 'fruits', quantityNeeded: 100, unit: 'quintal' },
      { productType: 'Turmeric', category: 'spices', quantityNeeded: 300, unit: 'quintal' },
      { productType: 'Wheat', category: 'grains', quantityNeeded: 2000, unit: 'quintal' },
    ]

    for (let i = 0; i < requirementData.length; i++) {
      const r = requirementData[i]
      const buyer = buyers[i % buyers.length]
      const loc = LOCATIONS[(i + 5) % LOCATIONS.length]
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 30 + 7))
      
      await db.buyerRequirement.create({
        data: {
          buyerId: buyer.id,
          productType: r.productType,
          category: r.category,
          quantityNeeded: r.quantityNeeded,
          unit: r.unit,
          deliveryLocation: `${loc.city}, ${loc.state}`,
          deliveryState: loc.state,
          deadline,
          maxBudget: r.quantityNeeded * (3000 + Math.floor(Math.random() * 5000)),
          description: `Looking for ${r.productType} - ${r.quantityNeeded} ${r.unit}. Quality grade A preferred.`,
          status: 'open',
        }
      })
    }

    // Create transporters
    const transporters = []
    for (let i = 0; i < TRANSPORTER_NAMES.length; i++) {
      const loc = LOCATIONS[(i + 6) % LOCATIONS.length]
      const transporter = await db.user.create({
        data: {
          email: `transport${i + 1}@agrilink.in`,
          name: TRANSPORTER_NAMES[i].split(' ').slice(0, 2).join(' '),
          companyName: TRANSPORTER_NAMES[i],
          role: 'transporter',
          phone: `+91${7000000000 + i}`,
          state: loc.state,
          city: loc.city,
          address: `${loc.city}, ${loc.state}`,
          verificationStatus: i < 4 ? 'verified' : 'pending',
          isOnline: Math.random() > 0.3,
        }
      })
      transporters.push(transporter)
    }

    // Create some orders and shipments
    for (let i = 0; i < 6; i++) {
      const buyer = buyers[i % buyers.length]
      const producer = producers[i % producers.length]
      const allProducts = await db.product.findMany({ where: { sellerId: producer.id } })
      if (allProducts.length === 0) continue
      
      const product = allProducts[0]
      const quantity = Math.floor(Math.random() * 50 + 10)
      const totalPrice = quantity * product.pricePerUnit
      
      const statuses = ['negotiating', 'confirmed', 'shipped', 'delivered', 'confirmed', 'shipped']
      
      const order = await db.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: producer.id,
          productId: product.id,
          quantity,
          unitPrice: product.pricePerUnit,
          totalPrice,
          status: statuses[i],
        }
      })

      // Create shipment for confirmed/shipped/delivered orders
      if (['confirmed', 'shipped', 'delivered'].includes(statuses[i])) {
        const originLoc = LOCATIONS[i % LOCATIONS.length]
        const destLoc = LOCATIONS[(i + 4) % LOCATIONS.length]
        const shipmentStatuses = ['pending', 'assigned', 'in_transit', 'delivered']
        const shipment = await db.shipment.create({
          data: {
            orderId: order.id,
            transporterId: transporters[i % transporters.length].id,
            origin: `${originLoc.city}, ${originLoc.state}`,
            destination: `${destLoc.city}, ${destLoc.state}`,
            distance: Math.floor(Math.random() * 1500 + 200),
            status: shipmentStatuses[i % shipmentStatuses.length],
            vehicleType: ['truck', 'tempo', 'container'][i % 3],
            vehicleNumber: `MH${Math.floor(Math.random() * 99) + 1}AB${Math.floor(Math.random() * 9999)}`,
            driverName: `Driver ${i + 1}`,
            driverPhone: `+91${6000000000 + i}`,
          }
        })

        // Create transport bids
        for (let j = 0; j < 3; j++) {
          await db.transportBid.create({
            data: {
              shipmentId: shipment.id,
              transporterId: transporters[(i + j) % transporters.length].id,
              bidAmount: Math.floor(Math.random() * 30000 + 15000),
              estimatedDays: Math.floor(Math.random() * 5 + 1),
              vehicleType: ['truck', 'tempo', 'container'][j],
              comments: `Can deliver within ${Math.floor(Math.random() * 5 + 1)} days`,
              status: j === 0 ? 'accepted' : (j === 1 ? 'pending' : 'rejected'),
            }
          })
        }
      }
    }

    // Create admin
    await db.user.create({
      data: {
        email: 'admin@agrilink.in',
        name: 'Admin',
        companyName: 'AgriLink Platform',
        role: 'admin',
        phone: '+919999999999',
        state: 'Maharashtra',
        city: 'Mumbai',
        verificationStatus: 'verified',
      }
    })

    // Create demo user for easy login
    await db.user.create({
      data: {
        email: 'demo@agrilink.in',
        name: 'Demo User',
        companyName: 'Demo Agri Corp',
        role: 'buyer',
        phone: '+918888888888',
        state: 'Maharashtra',
        city: 'Mumbai',
        verificationStatus: 'verified',
      }
    })

    // Create platform stats
    await db.platformStats.create({
      data: {
        totalUsers: 28,
        totalProducts: 20,
        totalOrders: 6,
        totalShipments: 4,
        totalRevenue: 2450000,
        activeListings: 18,
        verifiedUsers: 17,
      }
    })

    // Create some messages
    const demoUser = await db.user.findFirst({ where: { email: 'demo@agrilink.in' } })
    if (demoUser) {
      for (let i = 0; i < 3; i++) {
        const producer = producers[i]
        await db.message.create({
          data: {
            senderId: producer.id,
            receiverId: demoUser.id,
            content: [
              'Hi! I saw your requirement for Basmati Rice. We have premium 1121 variety available. Can we discuss pricing?',
              'Our fresh produce is ready for immediate dispatch. Let me know your preferred delivery schedule.',
              'I can offer a discount for bulk orders above 100 quintals. Interested?'
            ][i],
            isRead: i > 0,
          }
        })
      }
    }

    return NextResponse.json({ 
      message: 'Database seeded successfully',
      producers: producers.length,
      products: PRODUCTS_DATA.length,
      buyers: buyers.length,
      transporters: transporters.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
