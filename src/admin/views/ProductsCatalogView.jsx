import { useEffect, useState } from 'react'
import { getLocalCatalog, loadCatalog, updateCatalogProduct, uploadCatalogProductImage } from '../../services/productCatalog'

const emptyDraft = { title: '', description: '', price: '', image: '' }

export default function ProductsCatalogView({ onProductsChange }) {
  const [products, setProducts] = useState(getLocalCatalog)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSlug, setEditingSlug] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [savingSlug, setSavingSlug] = useState(null)
  const [uploadingSlug, setUploadingSlug] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    loadCatalog().then((catalog) => {
      setProducts(catalog)
      onProductsChange?.(catalog)
    })
  }, [onProductsChange])

  const categories = ['ALL', ...new Set(products.map((product) => product.category))]
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase()
    return (selectedCategory === 'ALL' || product.category === selectedCategory)
      && (!query || product.title.toLowerCase().includes(query) || product.description.toLowerCase().includes(query))
  })

  const beginEdit = (product) => {
    setEditingSlug(product.slug)
    setDraft({ title: product.title, description: product.description, price: String(product.variants?.[0]?.price ?? 0), image: product.variants?.[0]?.image || product.image || '' })
    setNotice('')
  }

  const save = async (product, changes) => {
    const primaryPrice = Number(changes.price ?? product.variants?.[0]?.price)
    if (!Number.isFinite(primaryPrice) || primaryPrice < 0) {
      setNotice('Enter a valid price of zero or more.')
      return
    }
    const nextProduct = {
      ...product,
      ...changes,
      variants: product.variants.map((variant, index) => index === 0 ? { ...variant, price: primaryPrice, image: changes.image || variant.image, gallery: [changes.image || variant.image, ...(variant.gallery || []).filter((image) => image !== variant.image)].filter(Boolean) } : variant),
    }
    setSavingSlug(product.slug)
    try {
      const saved = await updateCatalogProduct(nextProduct)
      setProducts((current) => {
        const next = current.map((item) => item.slug === product.slug ? saved : item)
        onProductsChange?.(next)
        return next
      })
      setEditingSlug(null)
      setNotice('Saved to the server. Customer menu now uses these details.')
    } catch (error) {
      setNotice(`Not saved to server: ${error.message}`)
    } finally {
      setSavingSlug(null)
    }
  }

  const toggleStock = (product) => save(product, { inStock: product.inStock === false })

  const handleImageUpload = async (product, file) => {
    if (!file) return
    setUploadingSlug(product.slug)
    setNotice('')
    try {
      const { imageUrl } = await uploadCatalogProductImage(product.slug, file)
      setDraft((current) => ({ ...current, image: imageUrl }))
      setNotice('Image uploaded. Click Save to publish it to customers.')
    } catch (error) {
      setNotice(`Image not uploaded: ${error.message}`)
    } finally {
      setUploadingSlug(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Food Menu & Stock Catalog</h2>
          <p className="mt-0.5 text-xs text-slate-400">All {products.length} customer menu products. Edit what customers see and control availability.</p>
        </div>
        <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${selectedCategory === category ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'}`}>{category}</button>)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Filter menu items..." className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none" /></div>
        {notice && <p className={`text-xs ${notice.startsWith('Not saved') || notice.startsWith('Image not') ? 'text-rose-400' : 'text-emerald-400'}`}>{notice}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const isInStock = product.inStock !== false
          const isEditing = editingSlug === product.slug
          const isSaving = savingSlug === product.slug
          const image = product.variants?.[0]?.image || product.image
          return <div key={product.slug} className={`flex flex-col justify-between rounded-2xl border bg-slate-900/90 p-4 ${isInStock ? 'border-slate-800' : 'border-slate-800/50 opacity-65'}`}>
            <div>
              <div className="relative mb-3 flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950">{image ? <img src={image} alt={product.title} className="h-full w-full object-cover" /> : <span className="text-4xl">🍔</span>}<span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${isInStock ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}>{isInStock ? 'AVAILABLE' : 'OUT OF STOCK'}</span></div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{product.category}</p>
              {isEditing ? <div className="mt-2 space-y-2"><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-label="Product name" className="w-full rounded border border-amber-500 bg-slate-950 px-2 py-1 text-sm font-bold text-white" /><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} aria-label="Product description" rows="3" className="w-full rounded border border-amber-500 bg-slate-950 px-2 py-1 text-xs text-white" /><label className="block cursor-pointer rounded border border-dashed border-slate-600 px-2 py-2 text-center text-xs text-slate-300 hover:border-amber-400"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploadingSlug === product.slug} onChange={(event) => handleImageUpload(product, event.target.files?.[0])} />{uploadingSlug === product.slug ? 'Uploading image…' : 'Upload product image (max 2 MB)'}</label>{draft.image && <img src={draft.image} alt="New product preview" className="h-20 w-full rounded object-cover" />}</div> : <><h3 className="mt-0.5 text-sm font-bold text-white">{product.title}</h3><p className="mt-1 min-h-[32px] text-xs text-slate-400">{product.description}</p></>}
            </div>
            <div className="mt-4 border-t border-slate-800/80 pt-3">
              {isEditing ? <div className="flex items-center gap-2"><span className="text-amber-400">₹</span><input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} aria-label="Product price" className="w-20 rounded border border-amber-500 bg-slate-950 px-2 py-1 text-xs text-white" /><button disabled={isSaving} onClick={() => save(product, draft)} className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-slate-950 disabled:opacity-50">{isSaving ? 'Saving…' : 'Save'}</button><button onClick={() => setEditingSlug(null)} className="text-xs text-slate-400">Cancel</button></div> : <div className="flex items-center justify-between gap-2"><span className="text-base font-black text-amber-400">₹{Number(product.variants?.[0]?.price ?? 0).toFixed(2)}</span><button onClick={() => beginEdit(product)} className="text-xs text-slate-300 hover:text-amber-400">Edit details</button></div>}
              <button disabled={isSaving} onClick={() => toggleStock(product)} className={`mt-3 w-full rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${isInStock ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>{isSaving ? 'Saving…' : isInStock ? 'Mark Out of Stock' : 'Mark Available'}</button>
            </div>
          </div>
        })}
      </div>
    </div>
  )
}
