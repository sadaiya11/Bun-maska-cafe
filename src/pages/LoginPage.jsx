export default function LoginPage({ onLogin }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-sky-950/30 backdrop-blur-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
            Bun Maska Cafe
          </span>
          <h1 className="mt-5 text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to manage your cafe dashboard.</p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              defaultValue="admin@bunmaska.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              defaultValue="123456"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
