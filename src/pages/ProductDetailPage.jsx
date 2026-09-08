import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductGallery from '../components/ProductGallery'
import QuantitySelector from '../components/QuantitySelector'
import SEO from '../components/SEO'
import { getLocalCatalog, loadCatalog } from '../services/productCatalog'
import { useCart } from '../context/useCart'

const formatPrice = (price) => `₹${Number(price).toFixed(2)}`

export default function ProductDetailPage() {
  const { slug } = useParams()
  const [products, setProducts] = useState(getLocalCatalog)
  useEffect(() => { loadCatalog().then(setProducts) }, [])
  const product = products.find((item) => item.slug === slug)
  const navigate = useNavigate()
  const { addItem } = useCart()

  const initialVariant = product?.variants?.[0] ?? { size: 'small', label: 'Small', price: 0, image: '', gallery: [] }
  const [selectedSizeState, setSelectedSize] = useState(initialVariant.size)
  const [quantity, setQuantity] = useState(1)
  const selectedSize = product?.variants?.some((variant) => variant.size === selectedSizeState)
    ? selectedSizeState
    : initialVariant.size

  const selectedVariant = product?.variants?.find((variant) => variant.size === selectedSize) ?? initialVariant

  const relatedProducts = products.filter((item) => item.slug !== product?.slug && item.inStock !== false).slice(0, 3)

  if (!product) {
    return (
      <div className="rounded-[2rem] bg-white p-10 text-center">
        <SEO title="Product Not Found | Bun Maska Café" noindex={true} />
        <h1 className="text-3xl font-black">Product not found</h1>
        <Link to="/product" className="mt-5 inline-block rounded-full bg-orange-500 px-6 py-3 font-bold text-white">Back to products</Link>
      </div>
    )
  }

  if (product.inStock === false) {
    return (
      <div className="rounded-[2rem] bg-white p-10 text-center">
        <h1 className="text-3xl font-black">Currently unavailable</h1>
        <p className="mt-3 text-slate-600">This item is temporarily out of stock. Please choose another item from our menu.</p>
        <Link to="/product" className="mt-5 inline-block rounded-full bg-orange-500 px-6 py-3 font-bold text-white">Back to products</Link>
      </div>
    )
  }

  const productJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      image: selectedVariant.gallery ?? [selectedVariant.image],
      description: product.description,
      category: product.category,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: selectedVariant.price,
        availability: 'https://schema.org/InStock',
        url: `https://bunmaskacafe.com/product/${product.slug}`,
        seller: {
          '@type': 'Organization',
          name: 'Bun Maska Café',
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://bunmaskacafe.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Menu',
          item: 'https://bunmaskacafe.com/product',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.title,
          item: `https://bunmaskacafe.com/product/${product.slug}`,
        },
      ],
    },
  ]

  return (
    <div className="space-y-10 pb-10 text-slate-800">
      <SEO
        title={`${product.title} | Bun Maska Café Menu`}
        description={`${product.description} Order ${product.title} fresh online from Bun Maska Café.`}
        keywords={`${product.title}, ${product.category}, buy ${product.title}, bun maska cafe menu`}
        ogImage={selectedVariant.image}
        canonical={`https://bunmaskacafe.com/product/${product.slug}`}
        jsonLd={productJsonLd}
      />
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-orange-600">Home</Link>
        <span>›</span>
        <Link to="/product" className="hover:text-orange-600">Menu</Link>
        <span>›</span>
        <span className="font-semibold text-slate-800">{product.title}</span>
      </nav>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm shadow-slate-200 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ProductGallery images={selectedVariant.gallery ?? [selectedVariant.image]} />

          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">{product.category}</p>
            <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">{product.title}</h1>

            <div className="mt-5 flex items-center gap-4">
              <span className="text-3xl font-black text-orange-600">{formatPrice(selectedVariant.price)}</span>
            </div>

            <p className="mt-5 text-base leading-7 text-slate-600">{product.description}</p>

            <div className="mt-8 space-y-5">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Size</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants?.map((variant) => (
                    <button
                      key={variant.size}
                      type="button"
                      onClick={() => setSelectedSize(variant.size)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selectedSize === variant.size
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <QuantitySelector value={quantity} onChange={setQuantity} />
                <button
                  onClick={() => { addItem(product, selectedVariant, quantity); navigate('/cart') }}
                  className="rounded-full bg-orange-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  Add to cart
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <span>
                  <strong className="text-slate-900">SKU:</strong> N/A
                </span>
                <span>
                  <strong className="text-slate-900">Category:</strong> {product.category}
                </span>
                <span>
                  <strong className="text-slate-900">Tags:</strong> {product.tag}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm shadow-slate-200 md:p-8">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          <button className="text-orange-600">Description</button>
          <button className="hover:text-slate-800">Additional Info</button>
          <button className="hover:text-slate-800">Reviews (0)</button>
        </div>

        <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
          <p>
            Soluta, impedit, saepe. Unde minima distinctio officiis amet temporibus, consequuntur
            dolorem dicta reprehenderit doloremque voluptate voluptas molestiae et pariatur soluta,
            nemo eos molestias beatae excepturi deleniti.
          </p>
          <p>
            Ea hic perferendis ut possimus. Culpa corrupti unde fugit doloremque omnis aliquam nam,
            velit, cupiditate quis reiciendis provident dolorum adipisci accusamus. Cum debitis,
            ipsum est ipsam vitae vel, quam in sint reprehenderit ducimus repudiandae ab et.
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm shadow-slate-200 md:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-black text-slate-900">Related products</h2>
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            View all
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {relatedProducts.map((item) => {
            const previewVariant = item.variants?.[0] ?? { image: '', price: 0 }

            return (
              <article key={item.slug} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              <img src={previewVariant.image} alt={item.title} className="h-56 w-full object-cover" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  <span className="text-lg font-black text-orange-600">{formatPrice(previewVariant.price)}</span>
                </div>
                <Link to={`/product/${item.slug}`} className="mt-5 inline-block rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600">View product</Link>
              </div>
            </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
