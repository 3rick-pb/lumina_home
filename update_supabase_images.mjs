import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wegtielydjzrckbafbfv.supabase.co';
const supabaseAnonKey = 'sb_publishable_8eJA4C3xm-7PGjwiFN8juQ_Cj1TWxhA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const UPDATES = [
  {
    category: 'iluminacion',
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop']
  },
  {
    category: 'aromaterapia',
    image_url: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    category: 'textiles',
    image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    category: 'home office',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop']
  },
  {
    category: 'almacenamiento',
    image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200&auto=format&fit=crop']
  },
  {
    category: 'gadgets',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1200&auto=format&fit=crop']
  }
];

async function run() {
  for (const item of UPDATES) {
    const { data, error } = await supabase
      .from('products')
      .update({ image_url: item.image_url, images: item.images })
      .ilike('category', item.category)
      .select();
    console.log(`Updated ${item.category}:`, error ? error.message : `${data?.length} records updated`);
  }
}

run();
