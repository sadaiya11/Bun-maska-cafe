import { useEffect, useState } from 'react'

const slides = [
  {
    title: 'Fresh taste, made to order.',
    subtitle: 'Chef-crafted wraps, biryanis, grills, and family combos served fresh every day.',
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1500&q=80',
    badge: 'Hot Picks',
  },
  {
    title: 'Big flavors, amazing value.',
    subtitle: 'Savor our signature deals, all-day combos, and comforting meals for every mood.',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1500&q=80',
    badge: 'Weekend Deal',
  },
  {
    title: 'Your favorite cafe, delivered fast.',
    subtitle: 'Order online for quick delivery, pickup, and a warm dine-in experience.',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1500&q=80',
    badge: 'Fast Delivery',
  },
]

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const slide = slides[activeSlide]

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-orange-200/30">
      <div className="absolute inset-0">
        <img src={slide.image} alt={slide.title} className="h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent" />
      </div>

      <div className="relative z-10 grid min-h-[520px] items-center px-6 py-10 md:px-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-xl">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-200 backdrop-blur-sm">
            {slide.badge}
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight text-white md:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-lg text-base text-slate-200 md:text-lg">{slide.subtitle}</p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
              Order Online
            </button>
            <button className="rounded-full border border-white/40 bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              View Menu
            </button>
          </div>
        </div>

        <div className="hidden justify-end lg:flex">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-200">Open now</p>
            <div className="mt-6 space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <span>Delivery</span>
                <span className="font-bold text-orange-300">12 min</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <span>Pickup</span>
                <span className="font-bold text-orange-300">25 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Address</span>
                <span className="text-right text-sm text-slate-200">Andheri West</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActiveSlide(index)}
            className={`h-3 rounded-full transition ${
              index === activeSlide ? 'w-10 bg-orange-500' : 'w-3 bg-white/60 hover:bg-white'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
