export default function InfoPage({ title, description }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 shadow-xl shadow-slate-950/30">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Cafe</p>
      <h1 className="mt-4 text-4xl font-bold text-white">{title}</h1>
      <p className="mt-4 max-w-xl text-lg text-slate-300">{description}</p>
    </div>
  )
}
