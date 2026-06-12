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
      'Prefer': method === 'PATCH' ? 'return=representation' : method === 'POST' ? 'return=representation' : '',
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

const IMAGE_MAP = {
  'Basmati Rice': '/images/basmati-rice.jpg',
  'Wheat': '/images/wheat.jpg',
  'Sona Masoori Rice': '/images/sona-masoori.jpg',
  'Onion': '/images/onion.jpg',
  'Potato': '/images/potato.jpg',
  'Tomato': '/images/tomato.jpg',
  'Mango': '/images/mango.jpg',
  'Orange': '/images/orange.jpg',
  'Grapes': '/images/grapes.jpg',
  'Turmeric': '/images/turmeric.jpg',
  'Chilli': '/images/chilli.jpg',
  'Cardamom': '/images/cardamom.jpg',
  'Milk': '/images/milk.jpg',
  'Ghee': '/images/ghee.jpg',
  'Eggs': '/images/eggs.jpg',
  'Toor Dal': '/images/toor-dal.jpg',
  'Chana Dal': '/images/chana-dal.jpg',
  'Mustard': '/images/mustard.jpg',
  'Groundnut': '/images/groundnut.jpg',
  'Maize': '/images/maize.jpg',
};

async function main() {
  console.log('📦 Updating product image URLs...');
  
  // Fetch all products
  const products = await api('Product', 'GET', null, '?select=id,name,imageUrl&limit=100');
  if (!products) {
    console.error('Failed to fetch products');
    return;
  }

  let updated = 0;
  for (const product of products) {
    // Find matching image
    let imageUrl = null;
    for (const [key, value] of Object.entries(IMAGE_MAP)) {
      if (product.name && product.name.includes(key)) {
        imageUrl = value;
        break;
      }
    }

    if (imageUrl && product.imageUrl !== imageUrl) {
      const result = await api('Product', 'PATCH', { imageUrl }, `?id=eq.${product.id}`);
      if (result) {
        console.log(`  ✅ Updated: ${product.name} -> ${imageUrl}`);
        updated++;
      }
    }
  }
  
  console.log(`\n🎉 Updated ${updated} product images`);
}

main().catch(console.error);
