import React, { useState } from 'react';
import initialProducts from '../data/products.json';

export default function ProductsCatalogView() {
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  // Extract unique categories
  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  // Filtered Products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Toggle in-stock status
  const toggleStock = (id) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, inStock: !p.inStock } : p
    ));
  };

  // Save new price
  const savePrice = (id) => {
    const numPrice = parseFloat(editPrice);
    if (!isNaN(numPrice) && numPrice >= 0) {
      setProducts(products.map(p => 
        p.id === id ? { ...p, price: numPrice } : p
      ));
    }
    setEditingId(null);
    setEditPrice('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Food Menu & Stock Catalog</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage Bun Maska Café menu items, update prices, and control real-time item availability.
          </p>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Internal Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          🔍
        </span>
        <input
          type="text"
          placeholder="Filter menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const isInStock = product.inStock !== false;

          return (
            <div 
              key={product.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 flex flex-col justify-between transition-all group ${
                isInStock ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Image / Thumbnail placeholder */}
                <div className="relative w-full h-36 bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-800 flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl">🍔</span>
                  )}

                  {/* Stock status overlay */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isInStock 
                        ? 'bg-emerald-500/80 text-white shadow-sm' 
                        : 'bg-rose-500/80 text-white shadow-sm'
                    }`}>
                      {isInStock ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
                  </div>
                </div>

                {/* Category tag */}
                <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                  {product.category}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white mt-0.5 group-hover:text-amber-400 transition-colors">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
                  {product.description}
                </p>
              </div>

              {/* Controls Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {/* Price Display / Edit */}
                <div>
                  {editingId === product.id ? (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-amber-400">₹</span>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-16 px-1.5 py-0.5 bg-slate-950 border border-amber-500 rounded text-xs text-white"
                        autoFocus
                      />
                      <button 
                        onClick={() => savePrice(product.id)}
                        className="text-xs text-emerald-400 font-bold hover:underline"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black text-amber-400">₹{product.price}</span>
                      <button 
                        onClick={() => {
                          setEditingId(product.id);
                          setEditPrice(product.price);
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-300"
                        title="Edit price"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>

                {/* Stock Toggle Switch */}
                <button
                  onClick={() => toggleStock(product.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    isInStock 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  {isInStock ? 'Mark Out of Stock' : 'Mark Available'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
