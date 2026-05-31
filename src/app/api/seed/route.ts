import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const PRODUCTS_DATA = [
  { category: 'grains', name: 'Basmati Rice - 1121', qualityGrade: 'A', pricePerUnit: 4500, unit: 'quintal', cropVariety: '1121 Basmati', freshness: 'Freshly harvested', isOrganic: false, pesticidesUsed: 'Neem-based only', moistureContent: '12%', shelfLife: '12 months', storageCondition: 'Cool dry place', certifications: 'FSSAI,APEDA', imageUrl: '/images/basmati-rice.jpg' },
  { category: 'grains', name: 'Wheat - Sharbati', qualityGrade: 'A', pricePerUnit: 2800, unit: 'quintal', cropVariety: 'Sharbati', freshness: '1 month old', isOrganic: false, pesticidesUsed: 'Standard', moistureContent: '10%', shelfLife: '18 months', storageCondition: 'Cool dry warehouse', certifications: 'FSSAI', imageUrl: '/images/wheat.jpg' },
  { category: 'grains', name: 'Sona Masoori Rice', qualityGrade: 'B', pricePerUnit: 3200, unit: 'quintal', cropVariety: 'Sona Masoori', freshness: '3 weeks old', isOrganic: true, pesticidesUsed: 'None', moistureContent: '11%', shelfLife: '12 months', storageCondition: 'Cool dry place', certifications: 'Organic India,FSSAI', imageUrl: '/images/sona-masoori.jpg' },
  { category: 'vegetables', name: 'Onion - Nashik Red', qualityGrade: 'A', pricePerUnit: 1200, unit: 'quintal', cropVariety: 'Nashik Red', freshness: 'Fresh', isOrganic: false, pesticidesUsed: 'Minimal', moistureContent: '85%', shelfLife: '3 months', storageCondition: 'Ventilated storage', certifications: 'FSSAI', imageUrl: '/images/onion.jpg' },
  { category: 'vegetables', name: 'Potato - Chipsona', qualityGrade: 'B', pricePerUnit: 800, unit: 'quintal', cropVariety: 'Chipsona', freshness: '1 week old', isOrganic: false, pesticidesUsed: 'Standard', moistureContent: '78%', shelfLife: '4 months', storageCondition: 'Cold storage', certifications: 'FSSAI', imageUrl: '/images/potato.jpg' },
  { category: 'vegetables', name: 'Tomato - Hybrid', qualityGrade: 'A', pricePerUnit: 2500, unit: 'quintal', cropVariety: 'Hybrid Rupali', freshness: 'Fresh', isOrganic: true, pesticidesUsed: 'None', moistureContent: '94%', shelfLife: '1 week', storageCondition: 'Refrigerated', certifications: 'Organic India', imageUrl: '/images/tomato.jpg' },
  { category: 'fruits', name: 'Alphonso Mango', qualityGrade: 'A', pricePerUnit: 8000, unit: 'quintal', cropVariety: 'Alphonso (Hapus)', freshness: 'Fresh', isOrganic: false, pesticidesUsed: 'Neem-based only', moistureContent: '82%', shelfLife: '2 weeks', storageCondition: 'Cold chain', certifications: 'FSSAI,APEDA,GI Tag', imageUrl: '/images/mango.jpg' },
  { category: 'fruits', name: 'Nagpur Orange', qualityGrade: 'A', pricePerUnit: 4500, unit: 'quintal', cropVariety: 'Nagpur Santra', freshness: 'Fresh', isOrganic: false, pesticidesUsed: 'Minimal', moistureContent: '86%', shelfLife: '3 weeks', storageCondition: 'Cool dry place', certifications: 'FSSAI,GI Tag', imageUrl: '/images/orange.jpg' },
  { category: 'fruits', name: 'Grapes - Thompson', qualityGrade: 'A', pricePerUnit: 5500, unit: 'quintal', cropVariety: 'Thompson Seedless', freshness: 'Fresh', isOrganic: false, pesticidesUsed: 'Standard', moistureContent: '80%', shelfLife: '2 weeks', storageCondition: 'Cold chain', certifications: 'FSSAI,APEDA', imageUrl: '/images/grapes.jpg' },
  { category: 'spices', name: 'Turmeric - Salem', qualityGrade: 'A', pricePerUnit: 9000, unit: 'quintal', cropVariety: 'Salem Finger', freshness: 'Dried', isOrganic: true, pesticidesUsed: 'None', moistureContent: '8%', shelfLife: '24 months', storageCondition: 'Cool dry place', certifications: 'Organic India,FSSAI,Spice Board', imageUrl: '/images/turmeric.jpg' },
  { category: 'spices', name: 'Red Chilli - Guntur', qualityGrade: 'A', pricePerUnit: 12000, unit: 'quintal', cropVariety: 'Guntur Sannam', freshness: 'Dried', isOrganic: false, pesticidesUsed: 'Minimal', moistureContent: '10%', shelfLife: '18 months', storageCondition: 'Cool dry warehouse', certifications: 'FSSAI,Spice Board', imageUrl: '/images/chilli.jpg' },
  { category: 'spices', name: 'Cardamom - Green', qualityGrade: 'A', pricePerUnit: 85000, unit: 'quintal', cropVariety: 'Elettaria Cardamomum', freshness: 'Freshly dried', isOrganic: false, pesticidesUsed: 'Neem-based only', moistureContent: '10%', shelfLife: '12 months', storageCondition: 'Airtight cool storage', certifications: 'FSSAI,Spice Board,APEDA', imageUrl: '/images/cardamom.jpg' },
  { category: 'dairy', name: 'Fresh Milk', qualityGrade: 'A', pricePerUnit: 60, unit: 'litre', cropVariety: 'Cow Milk', freshness: 'Fresh', isOrganic: true, pesticidesUsed: 'N/A', moistureContent: 'N/A', shelfLife: '3 days', storageCondition: 'Refrigerated 4°C', certifications: 'FSSAI,Organic India', imageUrl: '/images/milk.jpg' },
  { category: 'dairy', name: 'Ghee - Cow', qualityGrade: 'A', pricePerUnit: 650, unit: 'litre', cropVariety: 'A2 Cow Ghee', freshness: 'Fresh', isOrganic: true, pesticidesUsed: 'N/A', moistureContent: 'N/A', shelfLife: '12 months', storageCondition: 'Cool dry place', certifications: 'FSSAI,Organic India', imageUrl: '/images/ghee.jpg' },
  { category: 'poultry', name: 'Country Eggs', qualityGrade: 'A', pricePerUnit: 8, unit: 'kg', cropVariety: 'Desi Murga', freshness: 'Fresh', isOrganic: true, pesticidesUsed: 'N/A', moistureContent: 'N/A', shelfLife: '2 weeks', storageCondition: 'Cool dry place', certifications: 'FSSAI', imageUrl: '/images/eggs.jpg' },
  { category: 'pulses', name: 'Toor Dal', qualityGrade: 'A', pricePerUnit: 7500, unit: 'quintal', cropVariety: 'ICPL 87119', freshness: '3 months old', isOrganic: false, pesticidesUsed: 'Standard', moistureContent: '9%', shelfLife: '18 months', storageCondition: 'Cool dry warehouse', certifications: 'FSSAI', imageUrl: '/images/toor-dal.jpg' },
  { category: 'pulses', name: 'Chana Dal', qualityGrade: 'A', pricePerUnit: 6500, unit: 'quintal', cropVariety: 'Kanchan', freshness: '2 months old', isOrganic: false, pesticidesUsed: 'Standard', moistureContent: '10%', shelfLife: '18 months', storageCondition: 'Cool dry warehouse', certifications: 'FSSAI', imageUrl: '/images/chana-dal.jpg' },
  { category: 'oilseeds', name: 'Mustard Seeds', qualityGrade: 'A', pricePerUnit: 5500, unit: 'quintal', cropVariety: 'Pusa Bold', freshness: '1 month old', isOrganic: false, pesticidesUsed: 'Minimal', moistureContent: '7%', shelfLife: '12 months', storageCondition: 'Cool dry place', certifications: 'FSSAI', imageUrl: '/images/mustard.jpg' },
  { category: 'oilseeds', name: 'Groundnut', qualityGrade: 'B', pricePerUnit: 6000, unit: 'quintal', cropVariety: 'GG 20', freshness: '2 months old', isOrganic: true, pesticidesUsed: 'None', moistureContent: '8%', shelfLife: '12 months', storageCondition: 'Cool dry place', certifications: 'Organic India,FSSAI', imageUrl: '/images/groundnut.jpg' },
  { category: 'grains', name: 'Maize - Hybrid', qualityGrade: 'B', pricePerUnit: 2200, unit: 'quintal', cropVariety: 'Pioneer 30V92', freshness: '1 month old', isOrganic: false, pesticidesUsed: 'Standard', moistureContent: '13%', shelfLife: '12 months', storageCondition: 'Cool dry warehouse', certifications: 'FSSAI', imageUrl: '/images/maize.jpg' },
]

const LOCATIONS = [
  { state: 'Maharashtra', city: 'Nashik', lat: '19.9975', lng: '73.7898' },
  { state: 'Punjab', city: 'Ludhiana', lat: '30.9010', lng: '75.8573' },
  { state: 'Madhya Pradesh', city: 'Indore', lat: '22.7196', lng: '75.8577' },
  { state: 'Karnataka', city: 'Bengaluru', lat: '12.9716', lng: '77.5946' },
  { state: 'Tamil Nadu', city: 'Salem', lat: '11.6643', lng: '78.1460' },
  { state: 'Andhra Pradesh', city: 'Guntur', lat: '16.3067', lng: '80.4365' },
  { state: 'Rajasthan', city: 'Jaipur', lat: '26.9124', lng: '75.7873' },
  { state: 'Uttar Pradesh', city: 'Lucknow', lat: '26.8467', lng: '80.9462' },
  { state: 'Gujarat', city: 'Ahmedabad', lat: '23.0225', lng: '72.5714' },
  { state: 'West Bengal', city: 'Kolkata', lat: '22.5726', lng: '88.3639' },
  { state: 'Haryana', city: 'Karnal', lat: '29.6857', lng: '76.9905' },
  { state: 'Telangana', city: 'Hyderabad', lat: '17.3850', lng: '78.4867' },
]

const PRODUCER_DATA = [
  { name: 'Rajesh Farm Produce', farmName: 'Rajesh Organic Farm', farmSize: '35 acres', yearsExperience: 18, certifications: 'Organic India,FSSAI,APEDA', avgRating: 4.7 },
  { name: 'Green Harvest FPO', farmName: 'Green Harvest Collective', farmSize: '120 acres', yearsExperience: 12, certifications: 'FSSAI,Spice Board', avgRating: 4.5 },
  { name: 'Krishna Agro', farmName: 'Krishna Agro Farms', farmSize: '50 acres', yearsExperience: 22, certifications: 'FSSAI,APEDA,Organic India', avgRating: 4.8 },
  { name: 'Satyam Organic', farmName: 'Satyam Organic Estates', farmSize: '80 acres', yearsExperience: 15, certifications: 'Organic India,FSSAI', avgRating: 4.6 },
  { name: 'Punjab Grain Traders', farmName: 'Punjab Grain Farms', farmSize: '200 acres', yearsExperience: 30, certifications: 'FSSAI,APEDA,AGMARK', avgRating: 4.4 },
  { name: 'Deccan Spice Co', farmName: 'Deccan Spice Gardens', farmSize: '45 acres', yearsExperience: 14, certifications: 'Spice Board,FSSAI,APEDA', avgRating: 4.9 },
  { name: 'Ganga Dairy Farm', farmName: 'Ganga Dairy & Farm', farmSize: '30 acres', yearsExperience: 10, certifications: 'FSSAI,Organic India', avgRating: 4.3 },
  { name: 'Malwa Pulses', farmName: 'Malwa Pulses Estate', farmSize: '90 acres', yearsExperience: 20, certifications: 'FSSAI,AGMARK', avgRating: 4.5 },
  { name: 'Konkan Fruit Growers', farmName: 'Konkan Fruit Orchard', farmSize: '60 acres', yearsExperience: 16, certifications: 'FSSAI,APEDA,GI Tag', avgRating: 4.7 },
  { name: 'Marathwada Onion Co', farmName: 'Marathwada Onion Farm', farmSize: '75 acres', yearsExperience: 11, certifications: 'FSSAI,AGMARK', avgRating: 4.2 },
  { name: 'Narmada Agro', farmName: 'Narmada Agro Fields', farmSize: '55 acres', yearsExperience: 19, certifications: 'FSSAI,Organic India', avgRating: 4.6 },
  { name: 'Cauvery Farmers Co', farmName: 'Cauvery Farmers Collective', farmSize: '100 acres', yearsExperience: 25, certifications: 'FSSAI,Spice Board,APEDA', avgRating: 4.8 },
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
    // Clear existing data for fresh seed
    await db.review.deleteMany()
    await db.transportBid.deleteMany()
    await db.message.deleteMany()
    await db.shipment.deleteMany()
    await db.buyerRequirement.deleteMany()
    await db.order.deleteMany()
    await db.product.deleteMany()
    await db.platformStats.deleteMany()
    await db.user.deleteMany()

    // Create producers with farm details
    const producers = []
    for (let i = 0; i < PRODUCER_DATA.length; i++) {
      const loc = LOCATIONS[i % LOCATIONS.length]
      const pd = PRODUCER_DATA[i]
      const producer = await db.user.create({
        data: {
          email: `producer${i + 1}@agrilink.in`,
          name: pd.name.split(' ').slice(0, 2).join(' '),
          companyName: pd.name,
          role: 'producer',
          phone: `+91${9000000000 + i}`,
          state: loc.state,
          city: loc.city,
          address: `${loc.city}, ${loc.state}`,
          verificationStatus: i < 8 ? 'verified' : 'pending',
          isOnline: Math.random() > 0.3,
          farmName: pd.farmName,
          farmSize: pd.farmSize,
          farmLocation: `${pd.farmName}, ${loc.city}, ${loc.state}`,
          yearsExperience: pd.yearsExperience,
          certifications: pd.certifications,
          totalTransactions: Math.floor(Math.random() * 200 + 50),
          avgRating: pd.avgRating,
          totalReviews: Math.floor(Math.random() * 80 + 20),
          latitude: loc.lat,
          longitude: loc.lng,
        }
      })
      producers.push(producer)
    }

    // Create products with detailed crop information
    for (let i = 0; i < PRODUCTS_DATA.length; i++) {
      const p = PRODUCTS_DATA[i]
      const producer = producers[i % producers.length]
      const loc = LOCATIONS[i % LOCATIONS.length]
      const harvestDate = new Date()
      harvestDate.setDate(harvestDate.getDate() - Math.floor(Math.random() * 60 + 5))

      await db.product.create({
        data: {
          sellerId: producer.id,
          category: p.category,
          name: p.name,
          description: `Premium quality ${p.name} from ${loc.state}. Freshly harvested and graded. ${p.cropVariety} variety, ${p.isOrganic ? 'organically grown' : 'conventionally grown'}. ${p.certifications} certified.`,
          quantity: Math.floor(Math.random() * 100 + 10) * 10,
          unit: p.unit,
          pricePerUnit: p.pricePerUnit + Math.floor(Math.random() * 500 - 250),
          minOrderQty: 5,
          location: `${loc.city}, ${loc.state}`,
          state: loc.state,
          qualityGrade: p.qualityGrade,
          imageUrl: p.imageUrl,
          harvestDate,
          freshness: p.freshness,
          cropVariety: p.cropVariety,
          isOrganic: p.isOrganic,
          pesticidesUsed: p.pesticidesUsed,
          moistureContent: p.moistureContent,
          shelfLife: p.shelfLife,
          storageCondition: p.storageCondition,
          certifications: p.certifications,
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
          latitude: loc.lat,
          longitude: loc.lng,
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
          latitude: loc.lat,
          longitude: loc.lng,
        }
      })
      transporters.push(transporter)
    }

    // Create some orders and shipments with detailed logistics info
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
        const shipmentStatus = shipmentStatuses[i % shipmentStatuses.length]
        
        const expectedPickup = new Date()
        expectedPickup.setDate(expectedPickup.getDate() + Math.floor(Math.random() * 3 + 1))
        
        const shipment = await db.shipment.create({
          data: {
            orderId: order.id,
            transporterId: transporters[i % transporters.length].id,
            origin: `${originLoc.city}, ${originLoc.state}`,
            destination: `${destLoc.city}, ${destLoc.state}`,
            distance: Math.floor(Math.random() * 1500 + 200),
            status: shipmentStatus,
            vehicleType: ['truck', 'tempo', 'container'][i % 3],
            vehicleNumber: `MH${Math.floor(Math.random() * 99) + 1}AB${Math.floor(Math.random() * 9999)}`,
            driverName: `Driver ${i + 1}`,
            driverPhone: `+91${6000000000 + i}`,
            exactPickupAddress: `${producers[i % producers.length].farmName || 'Farm'}, ${originLoc.city} Industrial Area, ${originLoc.state} - ${400000 + i * 10000}`,
            exactDropAddress: `${BUYER_NAMES[i % BUYER_NAMES.length]} Warehouse, ${destLoc.city} Logistics Park, ${destLoc.state} - ${500000 + i * 10000}`,
            pickupLatitude: originLoc.lat,
            pickupLongitude: originLoc.lng,
            dropLatitude: destLoc.lat,
            dropLongitude: destLoc.lng,
            expectedPickupDate: expectedPickup,
            currentLatitude: shipmentStatus === 'in_transit' ? ((parseFloat(originLoc.lat) + parseFloat(destLoc.lat)) / 2).toString() : null,
            currentLongitude: shipmentStatus === 'in_transit' ? ((parseFloat(originLoc.lng) + parseFloat(destLoc.lng)) / 2).toString() : null,
            lastTrackingUpdate: shipmentStatus === 'in_transit' ? new Date() : null,
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
              comments: `Can deliver within ${Math.floor(Math.random() * 5 + 1)} days. Well-maintained fleet with GPS tracking.`,
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

    // Create reviews for producers
    for (let i = 0; i < 8; i++) {
      const producer = producers[i]
      const buyer = buyers[i % buyers.length]
      await db.review.create({
        data: {
          reviewerId: buyer.id,
          targetId: producer.id,
          rating: [4, 5, 5, 4, 5, 4, 5, 4][i],
          comment: [
            'Excellent quality basmati rice. Very satisfied with the produce.',
            'Prompt delivery and great communication. Highly recommended.',
            'Best turmeric quality I have found on this platform.',
            'Good quality onions, though delivery was slightly delayed.',
            'Outstanding organic produce. Will definitely order again.',
            'Reliable supplier with consistent quality.',
            'Premium mangoes, exactly as described. Trustworthy producer.',
            'Good wheat quality, fair pricing. Professional team.'
          ][i],
        }
      })
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
