export default function ProfilePage() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-3xl font-bold text-white">Profile</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-5">
          <p className="text-sm text-slate-400">Name</p>
          <p className="mt-2 text-xl font-semibold text-white">Maya Reynolds</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-5">
          <p className="text-sm text-slate-400">Role</p>
          <p className="mt-2 text-xl font-semibold text-white">Cafe Manager</p>
        </div>
      </div>
    </div>
  )
}
