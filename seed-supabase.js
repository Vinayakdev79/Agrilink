const SUPABASE_URL = 'https://koudrogkhskoxtkpujye.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWRyb2draHNrb3h0a3B1anllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDM3ODksImV4cCI6MjA5NTc3OTc4OX0.6hIriMNxU0iZqRCfqXlJcjBQT4j8397i1MWLICiCtoM';

async function api(table, method, data, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const opts = {
    method,
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : '',
    },
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    console.error(`  ERROR ${method} ${table}:`, err);
    return null;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

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
];

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
];

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
];

const BUYER_NAMES = ['Metro Foods Pvt Ltd', 'Export India Trading', 'FreshMart Retail', 'Spice Route Exports', 'National Procurement Corp', 'Hotel Chain India', 'Relief Foods Processing', 'Tropical Exports Ltd'];
const TRANSPORTER_NAMES = ['Singh Roadways', 'Patel Transport Corp', 'South India Logistics', 'Express Freight India', 'Krishna Carriers', 'National Fleet Services'];

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function seed() {
  // Clear all tables first
  console.log('🧹 Clearing all tables...');
  for (const t of ['Review', 'TransportBid', 'Message', 'Shipment', 'BuyerRequirement', 'Order', 'Product', 'PlatformStats', 'User']) {
    await api(t, 'DELETE', null, '?id=neq.__never__');
  }
  
  // Create producers
  console.log('👨‍🌾 Creating 12 producers...');
  const producers = [];
  for (let i = 0; i < PRODUCER_DATA.length; i++) {
    const pd = PRODUCER_DATA[i];
    const loc = LOCATIONS[i % LOCATIONS.length];
    const id = uid('p');
    const result = await api('User', 'POST', {
      id, email: `producer${i+1}@agrilink.in`, name: pd.name.split(' ').slice(0,2).join(' '),
      companyName: pd.name, role: 'producer', phone: `+91${9000000000+i}`,
      state: loc.state, city: loc.city, address: `${loc.city}, ${loc.state}`,
      verificationStatus: i < 8 ? 'verified' : 'pending', isOnline: Math.random() > 0.3,
      farmName: pd.farmName, farmSize: pd.farmSize, farmLocation: `${pd.farmName}, ${loc.city}, ${loc.state}`,
      yearsExperience: pd.yearsExperience, certifications: pd.certifications,
      totalTransactions: Math.floor(Math.random()*200+50), avgRating: pd.avgRating,
      totalReviews: Math.floor(Math.random()*80+20), latitude: loc.lat, longitude: loc.lng,
    });
    if (result && result[0]) producers.push(result[0]);
  }
  console.log(`  ✅ Created ${producers.length} producers`);

  // Create products
  console.log('📦 Creating 20 products...');
  const products = [];
  for (let i = 0; i < PRODUCTS_DATA.length; i++) {
    const p = PRODUCTS_DATA[i];
    const producer = producers[i % producers.length];
    const loc = LOCATIONS[i % LOCATIONS.length];
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() - Math.floor(Math.random()*60+5));
    const id = uid('prod');
    const result = await api('Product', 'POST', {
      id, sellerId: producer.id, category: p.category, name: p.name,
      description: `Premium quality ${p.name} from ${loc.state}. ${p.cropVariety} variety, ${p.isOrganic ? 'organically grown' : 'conventionally grown'}. ${p.certifications} certified.`,
      quantity: Math.floor(Math.random()*100+10)*10, unit: p.unit,
      pricePerUnit: p.pricePerUnit + Math.floor(Math.random()*500-250), minOrderQty: 5,
      location: `${loc.city}, ${loc.state}`, state: loc.state, qualityGrade: p.qualityGrade,
      imageUrl: p.imageUrl, harvestDate: harvestDate.toISOString(), freshness: p.freshness,
      cropVariety: p.cropVariety, isOrganic: p.isOrganic, pesticidesUsed: p.pesticidesUsed,
      moistureContent: p.moistureContent, shelfLife: p.shelfLife, storageCondition: p.storageCondition,
      certifications: p.certifications, isActive: true,
    });
    if (result && result[0]) products.push(result[0]);
  }
  console.log(`  ✅ Created ${products.length} products`);

  // Create buyers
  console.log('🛒 Creating 8 buyers...');
  const buyers = [];
  for (let i = 0; i < BUYER_NAMES.length; i++) {
    const loc = LOCATIONS[(i+3) % LOCATIONS.length];
    const id = uid('b');
    const result = await api('User', 'POST', {
      id, email: `buyer${i+1}@agrilink.in`, name: BUYER_NAMES[i].split(' ').slice(0,2).join(' '),
      companyName: BUYER_NAMES[i], role: 'buyer', phone: `+91${8000000000+i}`,
      state: loc.state, city: loc.city, address: `${loc.city}, ${loc.state}`,
      verificationStatus: i < 5 ? 'verified' : 'pending', isOnline: Math.random() > 0.4,
      latitude: loc.lat, longitude: loc.lng,
    });
    if (result && result[0]) buyers.push(result[0]);
  }
  console.log(`  ✅ Created ${buyers.length} buyers`);

  // Create buyer requirements
  console.log('📋 Creating buyer requirements...');
  const reqs = [
    { productType: 'Basmati Rice', category: 'grains', quantityNeeded: 500, unit: 'quintal' },
    { productType: 'Red Chilli', category: 'spices', quantityNeeded: 200, unit: 'quintal' },
    { productType: 'Onion', category: 'vegetables', quantityNeeded: 1000, unit: 'quintal' },
    { productType: 'Alphonso Mango', category: 'fruits', quantityNeeded: 100, unit: 'quintal' },
    { productType: 'Turmeric', category: 'spices', quantityNeeded: 300, unit: 'quintal' },
    { productType: 'Wheat', category: 'grains', quantityNeeded: 2000, unit: 'quintal' },
  ];
  for (let i = 0; i < reqs.length; i++) {
    const r = reqs[i];
    const buyer = buyers[i % buyers.length];
    const loc = LOCATIONS[(i+5) % LOCATIONS.length];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Math.floor(Math.random()*30+7));
    await api('BuyerRequirement', 'POST', {
      id: uid('req'), buyerId: buyer.id, productType: r.productType, category: r.category,
      quantityNeeded: r.quantityNeeded, unit: r.unit,
      deliveryLocation: `${loc.city}, ${loc.state}`, deliveryState: loc.state,
      deadline: deadline.toISOString(),
      maxBudget: r.quantityNeeded * (3000 + Math.floor(Math.random()*5000)),
      description: `Looking for ${r.productType} - ${r.quantityNeeded} ${r.unit}. Quality grade A preferred.`,
      status: 'open',
    });
  }
  console.log(`  ✅ Created ${reqs.length} requirements`);

  // Create transporters
  console.log('🚛 Creating 6 transporters...');
  const transporters = [];
  for (let i = 0; i < TRANSPORTER_NAMES.length; i++) {
    const loc = LOCATIONS[(i+6) % LOCATIONS.length];
    const id = uid('t');
    const result = await api('User', 'POST', {
      id, email: `transport${i+1}@agrilink.in`, name: TRANSPORTER_NAMES[i].split(' ').slice(0,2).join(' '),
      companyName: TRANSPORTER_NAMES[i], role: 'transporter', phone: `+91${7000000000+i}`,
      state: loc.state, city: loc.city, address: `${loc.city}, ${loc.state}`,
      verificationStatus: i < 4 ? 'verified' : 'pending', isOnline: Math.random() > 0.3,
      latitude: loc.lat, longitude: loc.lng,
    });
    if (result && result[0]) transporters.push(result[0]);
  }
  console.log(`  ✅ Created ${transporters.length} transporters`);

  // Create orders and shipments
  console.log('📋 Creating orders and shipments...');
  const statuses = ['negotiating', 'confirmed', 'shipped', 'delivered', 'confirmed', 'shipped'];
  for (let i = 0; i < 6; i++) {
    const buyer = buyers[i % buyers.length];
    const producer = producers[i % producers.length];
    const producerProducts = products.filter(p => p.sellerId === producer.id);
    if (producerProducts.length === 0) continue;
    const product = producerProducts[0];
    const quantity = Math.floor(Math.random()*50+10);
    const totalPrice = quantity * product.pricePerUnit;
    const orderId = uid('ord');
    const orderResult = await api('Order', 'POST', {
      id: orderId, buyerId: buyer.id, sellerId: producer.id, productId: product.id,
      quantity, unitPrice: product.pricePerUnit, totalPrice, status: statuses[i],
    });
    
    if (['confirmed', 'shipped', 'delivered'].includes(statuses[i]) && orderResult && orderResult[0]) {
      const originLoc = LOCATIONS[i % LOCATIONS.length];
      const destLoc = LOCATIONS[(i+4) % LOCATIONS.length];
      const shipmentStatuses = ['pending', 'assigned', 'in_transit', 'delivered'];
      const shipmentStatus = shipmentStatuses[i % shipmentStatuses.length];
      const expectedPickup = new Date();
      expectedPickup.setDate(expectedPickup.getDate() + Math.floor(Math.random()*3+1));
      
      const shipmentId = uid('ship');
      const shipmentResult = await api('Shipment', 'POST', {
        id: shipmentId, orderId: orderResult[0].id,
        transporterId: transporters[i % transporters.length].id,
        origin: `${originLoc.city}, ${originLoc.state}`,
        destination: `${destLoc.city}, ${destLoc.state}`,
        distance: Math.floor(Math.random()*1500+200), status: shipmentStatus,
        vehicleType: ['truck', 'tempo', 'container'][i % 3],
        vehicleNumber: `MH${Math.floor(Math.random()*99)+1}AB${Math.floor(Math.random()*9999)}`,
        driverName: `Driver ${i+1}`, driverPhone: `+91${6000000000+i}`,
        exactPickupAddress: `${PRODUCER_DATA[i % PRODUCER_DATA.length]?.farmName || 'Farm'}, ${originLoc.city} Industrial Area, ${originLoc.state} - ${400000+i*10000}`,
        exactDropAddress: `${BUYER_NAMES[i % BUYER_NAMES.length]} Warehouse, ${destLoc.city} Logistics Park, ${destLoc.state} - ${500000+i*10000}`,
        pickupLatitude: originLoc.lat, pickupLongitude: originLoc.lng,
        dropLatitude: destLoc.lat, dropLongitude: destLoc.lng,
        expectedPickupDate: expectedPickup.toISOString(),
        currentLatitude: shipmentStatus === 'in_transit' ? ((parseFloat(originLoc.lat)+parseFloat(destLoc.lat))/2).toString() : null,
        currentLongitude: shipmentStatus === 'in_transit' ? ((parseFloat(originLoc.lng)+parseFloat(destLoc.lng))/2).toString() : null,
        lastTrackingUpdate: shipmentStatus === 'in_transit' ? new Date().toISOString() : null,
      });
      
      // Create transport bids
      if (shipmentResult && shipmentResult[0]) {
        for (let j = 0; j < 3; j++) {
          await api('TransportBid', 'POST', {
            id: uid('bid'), shipmentId: shipmentResult[0].id,
            transporterId: transporters[(i+j) % transporters.length].id,
            bidAmount: Math.floor(Math.random()*30000+15000),
            estimatedDays: Math.floor(Math.random()*5+1),
            vehicleType: ['truck', 'tempo', 'container'][j],
            comments: `Can deliver within ${Math.floor(Math.random()*5+1)} days. Well-maintained fleet with GPS tracking.`,
            status: j === 0 ? 'accepted' : (j === 1 ? 'pending' : 'rejected'),
          });
        }
      }
    }
  }
  console.log('  ✅ Created 6 orders with shipments and bids');

  // Create admin and demo user
  console.log('👤 Creating admin & demo users...');
  await api('User', 'POST', {
    id: uid('admin'), email: 'admin@agrilink.in', name: 'Admin',
    companyName: 'AgriLink Platform', role: 'admin', phone: '+919999999999',
    state: 'Maharashtra', city: 'Mumbai', verificationStatus: 'verified',
  });
  const demoResult = await api('User', 'POST', {
    id: uid('demo'), email: 'demo@agrilink.in', name: 'Demo User',
    companyName: 'Demo Agri Corp', role: 'buyer', phone: '+918888888888',
    state: 'Maharashtra', city: 'Mumbai', verificationStatus: 'verified',
  });

  // Create platform stats
  await api('PlatformStats', 'POST', {
    id: uid('stats'), totalUsers: 28, totalProducts: 20, totalOrders: 6,
    totalShipments: 4, totalRevenue: 2450000, activeListings: 18, verifiedUsers: 17,
  });

  // Create messages
  if (demoResult && demoResult[0]) {
    for (let i = 0; i < 3; i++) {
      await api('Message', 'POST', {
        id: uid('msg'), senderId: producers[i].id, receiverId: demoResult[0].id,
        content: [
          'Hi! I saw your requirement for Basmati Rice. We have premium 1121 variety available. Can we discuss pricing?',
          'Our fresh produce is ready for immediate dispatch. Let me know your preferred delivery schedule.',
          'I can offer a discount for bulk orders above 100 quintals. Interested?',
        ][i],
        isRead: i > 0,
      });
    }
  }

  // Create reviews
  for (let i = 0; i < 8; i++) {
    await api('Review', 'POST', {
      id: uid('rev'), reviewerId: buyers[i % buyers.length].id, targetId: producers[i].id,
      rating: [4,5,5,4,5,4,5,4][i],
      comment: [
        'Excellent quality basmati rice. Very satisfied with the produce.',
        'Prompt delivery and great communication. Highly recommended.',
        'Best turmeric quality I have found on this platform.',
        'Good quality onions, though delivery was slightly delayed.',
        'Outstanding organic produce. Will definitely order again.',
        'Reliable supplier with consistent quality.',
        'Premium mangoes, exactly as described. Trustworthy producer.',
        'Good wheat quality, fair pricing. Professional team.',
      ][i],
    });
  }

  // Verify counts
  console.log('\n📊 Verifying data...');
  for (const t of ['User', 'Product', 'Order', 'Shipment', 'TransportBid', 'Message', 'Review', 'BuyerRequirement', 'PlatformStats']) {
    const result = await api(t, 'GET', null, '?select=id&limit=1000');
    console.log(`  ${t}: ${result ? result.length : 0} records`);
  }

  console.log('\n🎉 Database seeded successfully!');
}

seed().catch(console.error);
