import prisma from '../lib/prisma.js'

async function main() {
  console.log('🌱 Seeding initial products to Supabase PostgreSQL database...')

  const sampleProducts = [
    {
      slug: 'mango-special-menu',
      title: 'Mango Special Menu',
      category: 'Main Dishes',
      tag: 'Chef Pick',
      description: 'Fresh seasonal fruit, creamy texture, and a perfect café finish.',
      price: 18.0,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    },
    {
      slug: 'signature-chicken-shawarma',
      title: 'Signature Chicken Shawarma',
      category: 'Main Dishes',
      tag: 'Bestseller',
      description: 'Slow-roasted spiced chicken, garlic toum, pickles, and warm flatbread.',
      price: 16.0,
      image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=900&q=80',
    },
    {
      slug: 'classic-cheesecake',
      title: 'Classic New York Cheesecake',
      category: 'Desserts',
      tag: 'Must Try',
      description: 'Rich baked cheesecake with graham cracker crust and berry compote.',
      price: 12.0,
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80',
    },
  ]

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    })
  }

  console.log('✅ Supabase Database Seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
