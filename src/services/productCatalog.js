import fallbackProducts from '../data/products.json'
import { getProducts, saveProduct, uploadProductImage } from './api'

const STORAGE_KEY = 'bun_maska_product_catalog'

const cloneProducts = (products) => products.map((product) => ({
  ...product,
  variants: (product.variants || []).map((variant) => ({ ...variant, gallery: [...(variant.gallery || [])] })),
}))

export function mergeCatalogProducts(savedProducts = []) {
  const savedBySlug = new Map(savedProducts.map((product) => [product.slug, product]))

  return cloneProducts(fallbackProducts).map((product) => {
    const saved = savedBySlug.get(product.slug)
    if (!saved) return { ...product, inStock: product.inStock !== false }

    const variants = Array.isArray(saved.variants) && saved.variants.length
      ? saved.variants
      : product.variants.map((variant, index) => index === 0 && Number.isFinite(Number(saved.price))
        ? { ...variant, price: Number(saved.price) }
        : variant)

    return {
      ...product,
      ...saved,
      title: saved.title || product.title,
      description: saved.description || product.description,
      image: saved.image || product.image,
      variants,
      inStock: saved.inStock !== false,
    }
  })
}

function getStoredProducts() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function storeProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export function getLocalCatalog() {
  return mergeCatalogProducts(getStoredProducts())
}

export async function loadCatalog() {
  const localProducts = getStoredProducts()
  try {
    const remoteProducts = await getProducts()
    // Server values win for products that have been saved, while local data
    // keeps the catalog usable if a newly edited record has not synced yet.
    const remoteSlugs = new Set(remoteProducts.map((product) => product.slug))
    return mergeCatalogProducts([...localProducts.filter((product) => !remoteSlugs.has(product.slug)), ...remoteProducts])
  } catch (error) {
    console.warn('Product API unavailable; showing the local catalog:', error.message)
    return mergeCatalogProducts(localProducts)
  }
}

export async function updateCatalogProduct(product) {
  const normalized = {
    ...product,
    inStock: product.inStock !== false,
    price: Number(product.variants?.[0]?.price || 0),
    image: product.variants?.[0]?.image || product.image || '',
  }
  const stored = getStoredProducts().filter((item) => item.slug !== normalized.slug)
  storeProducts([...stored, normalized])

  const saved = await saveProduct(normalized)
  if (!saved?.slug) throw new Error('The server did not return the saved product.')

  const latestStored = getStoredProducts().filter((item) => item.slug !== saved.slug)
  storeProducts([...latestStored, { ...normalized, ...saved }])
  return mergeCatalogProducts([{ ...normalized, ...saved }]).find((item) => item.slug === product.slug)
}

export async function uploadCatalogProductImage(slug, file) {
  return uploadProductImage(slug, file)
}
