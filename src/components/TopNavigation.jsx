import { Link, NavLink } from 'react-router-dom'

export default function TopNavigation({ items = [], brand = 'Bun Maska Café', cartCount = 0 }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white shadow-lg shadow-orange-200">
            B
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-orange-500">Fresh taste</p>
            <p className="text-lg font-black text-slate-900">{brand}</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-2 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'text-slate-700 hover:bg-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            aria-label={`Cart with ${cartCount} items`}
            className="relative rounded-full border border-slate-200 p-3 text-lg transition hover:border-orange-300 hover:bg-orange-50"
          >
            <span aria-hidden="true">🛒</span>
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link to="/product" className="rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600">
            Order Now
          </Link>
        </div>
      </nav>
    </header>
  )
}
