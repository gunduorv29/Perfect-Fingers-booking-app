import { useEffect, useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { format, parseISO, isToday, subDays } from 'date-fns'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

const STATUS = {
  pending:   { bg: 'rgba(201,149,106,0.1)', text: '#A07040', label: 'Pending' },
  confirmed: { bg: 'rgba(16,185,129,0.1)',  text: '#059669', label: 'Confirmed' },
  cancelled: { bg: 'rgba(224,48,112,0.1)',  text: 'var(--color-pink)', label: 'Cancelled' },
  completed: { bg: 'rgba(139,84,104,0.1)',  text: 'var(--color-muted)', label: 'Completed' },
}

const EMPTY_FORM = { name: '', description: '', icon: '✦', price: '', duration: '', deposit: '' }

// ─── Service Modal ────────────────────────────────────────────────────────────
function ServiceModal({ initial, onSave, onClose, isSaving }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const isEdit = !!initial?.id

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Service name is required.')
    // ✅ NaN-safe payload — empty string → 0 (or null for optional deposit)
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim(),
      icon:        form.icon.trim() || '✦',
      price:       parseFloat(form.price)    || 0,
      duration:    parseInt(form.duration)   || 0,
      deposit:     form.deposit !== '' ? (parseFloat(form.deposit) || 0) : null,
    }
    onSave({ id: initial?.id, payload })
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-pink-300"
  const inputStyle = { borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)', background: 'var(--color-cream)' }
  const labelClass = "block text-xs font-medium mb-1.5 uppercase tracking-wider"
  const labelStyle = { color: 'var(--color-muted)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(30,10,20,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden"
        style={{ background: 'white', borderColor: 'rgba(224,48,112,0.1)' }}>

        {/* Modal Header */}
        <div className="px-7 pt-7 pb-5 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
          <div>
            <p className="text-xs tracking-widest uppercase font-medium mb-1" style={{ color: 'var(--color-pink)' }}>
              {isEdit ? 'Edit Service' : 'New Service'}
            </p>
            <h2 className="font-display text-2xl font-medium">{isEdit ? form.name : 'Add a Service'}</h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full border flex items-center justify-center text-lg hover:opacity-70 transition-opacity"
            style={{ borderColor: 'rgba(224,48,112,0.15)', color: 'var(--color-muted)' }}>
            ×
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {/* Icon */}
            <div className="col-span-1">
              <label className={labelClass} style={labelStyle}>Icon</label>
              <input value={form.icon} onChange={set('icon')} maxLength={2}
                className={inputClass} style={{ ...inputStyle, textAlign: 'center', fontSize: '1.4rem' }} />
            </div>
            {/* Name */}
            <div className="col-span-3">
              <label className={labelClass} style={labelStyle}>Service Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Box Braids"
                className={inputClass} style={inputStyle} required />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass} style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={set('description')}
              placeholder="Short description shown to clients…"
              rows={3} className={inputClass} style={{ ...inputStyle, resize: 'none' }} />
          </div>

          {/* Price / Duration / Deposit */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Price ($) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')}
                placeholder="0.00" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Duration (min) *</label>
              <input type="number" min="0" step="15" value={form.duration} onChange={set('duration')}
                placeholder="60" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Deposit ($)</label>
              <input type="number" min="0" step="0.01" value={form.deposit} onChange={set('deposit')}
                placeholder="Optional" className={inputClass} style={inputStyle} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-full text-sm font-medium border transition-colors hover:opacity-70"
              style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 py-3 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Services Tab ─────────────────────────────────────────────────────────────
function ServicesManager() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null) // null | EMPTY_FORM | service object

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('price')
      if (error) throw error
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      if (id) {
        const { error } = await supabase.from('services').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('services').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: (_, { id }) => {
      toast.success(id ? 'Service updated.' : 'Service created.')
      queryClient.invalidateQueries({ queryKey: ['admin-services'] })
      setModal(null)
    },
    onError: (err) => toast.error(err.message || 'Could not save service.')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Service deleted.')
      queryClient.invalidateQueries({ queryKey: ['admin-services'] })
    },
    onError: () => toast.error('Could not delete service.')
  })

  function handleDelete(svc) {
    if (!window.confirm(`Delete "${svc.name}"? This cannot be undone.`)) return
    deleteMutation.mutate(svc.id)
  }

  function formatDuration(mins) {
    if (!mins) return '—'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
  }

  return (
    <>
      {modal && (
        <ServiceModal
          initial={modal === 'new' ? null : modal}
          onSave={(args) => saveMutation.mutate(args)}
          onClose={() => setModal(null)}
          isSaving={saveMutation.isPending}
        />
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
        {/* Header bar */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
          <p className="text-sm font-medium text-gray-700">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </p>
          <button onClick={() => setModal('new')}
            className="px-5 py-2 rounded-full text-xs font-medium text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
            <span className="text-base leading-none">+</span> Add Service
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse bg-gray-50" />)}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">✦</p>
              <p className="font-display text-lg font-medium mb-1">No services yet</p>
              <p className="text-sm text-gray-400 mb-6">Add your first service to let clients start booking.</p>
              <button onClick={() => setModal('new')}
                className="px-6 py-2.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                Add First Service
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {services.map(svc => (
                <div key={svc.id}
                  className="group rounded-2xl border p-5 flex flex-col justify-between hover:shadow-md transition-all hover:border-pink-200"
                  style={{ borderColor: 'rgba(224,48,112,0.08)', background: 'var(--color-cream)' }}>

                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: 'white', border: '1px solid rgba(224,48,112,0.08)' }}>
                        {svc.icon ?? '✦'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 leading-tight">{svc.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                          {formatDuration(svc.duration)}
                          {svc.deposit ? ` • $${svc.deposit} deposit` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="font-display font-semibold text-lg shrink-0" style={{ color: 'var(--color-pink-deep)' }}>
                      ${svc.price}
                    </p>
                  </div>

                  {svc.description && (
                    <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                      {svc.description}
                    </p>
                  )}

                  {/* Actions — revealed on hover */}
                  <div className="flex gap-2 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ borderColor: 'rgba(224,48,112,0.08)' }}>
                    <button onClick={() => setModal(svc)}
                      className="flex-1 py-2 rounded-full text-xs font-medium border hover:bg-white transition-colors"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-pink-deep)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(svc)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 py-2 rounded-full text-xs font-medium border hover:bg-pink-50 transition-colors disabled:opacity-50"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-pink)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const [mainTab, setMainTab] = useState('appointments') // 'appointments' | 'services'
  const [filter, setFilter]   = useState('all')

  // Fetch Appointments
  const { data: appointments = [], isLoading: apptsLoading } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, profiles(full_name, phone), services(name, icon, price)')
        .order('appointment_date', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // Real-time Subscription
  useEffect(() => {
    const channel = supabase.channel('realtime-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => {
        queryClient.invalidateQueries({ queryKey: ['admin-appointments'] })
        if (payload.eventType === 'INSERT') toast.success('New booking just arrived!', { icon: '🔔' })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  // Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
      return { id, status }
    },
    onSuccess: (data) => {
      toast.success(`Marked as ${data.status}`)
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] })
    }
  })

  // Analytics
  const revenueData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse()
    return last7Days.map(date => {
      const dayAppts = appointments.filter(a => a.appointment_date === date && a.status === 'completed')
      const total = dayAppts.reduce((sum, a) => sum + (a.services?.price || 0), 0)
      return { date: format(new Date(date), 'MMM dd'), revenue: total }
    })
  }, [appointments])

  const filtered   = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)
  const pending    = appointments.filter(a => a.status === 'pending').length
  const todayCount = appointments.filter(a => isToday(parseISO(a.appointment_date))).length

  return (
    <div className="min-h-screen pt-28 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs tracking-widest uppercase font-medium" style={{ color: 'var(--color-pink)' }}>Admin Center</p>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Live
              </span>
            </div>
            <h1 className="font-display text-4xl font-medium">Dashboard</h1>
          </div>
        </div>

        {/* Analytics Row — always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            {[
              ['Today', todayCount, '📅', 'Appointments'],
              ['Pending', pending, '⏳', 'Deposits'],
            ].map(([label, value, icon, sub]) => (
              <div key={label} className="rounded-2xl p-6 border bg-white shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                  <span className="text-xl">{icon}</span>
                </div>
                <p className="font-display text-4xl font-semibold mb-1" style={{ color: 'var(--color-pink-deep)' }}>{value}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-6 border bg-white shadow-sm lg:col-span-2 flex flex-col" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-sm text-gray-700">7-Day Revenue (Completed)</h3>
              <p className="font-display font-semibold text-lg text-green-600">
                ${revenueData.reduce((acc, curr) => acc + curr.revenue, 0)}
              </p>
            </div>
            <div className="flex-1 min-h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-pink)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-pink)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--color-pink-deep)', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-pink)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Tab Toggle */}
        <div className="flex gap-2 mb-6 p-1.5 w-fit rounded-2xl border bg-white/60 backdrop-blur-md shadow-sm" style={{ borderColor: 'rgba(224,48,112,0.08)' }}>
          {[['appointments', '📅 Appointments'], ['services', '✦ Services']].map(([key, label]) => (
            <button key={key} onClick={() => setMainTab(key)}
              className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${mainTab === key ? 'shadow-sm' : 'hover:opacity-70'}`}
              style={{
                background: mainTab === key ? 'white' : 'transparent',
                color: mainTab === key ? 'var(--color-pink-deep)' : 'var(--color-muted)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Appointments Tab ── */}
        {mainTab === 'appointments' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
            <div className="p-4 border-b flex gap-2 overflow-x-auto" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-full text-xs font-medium border transition-all capitalize whitespace-nowrap"
                  style={{
                    background:  filter === f ? 'var(--color-pink)' : 'transparent',
                    color:       filter === f ? 'white' : 'var(--color-muted)',
                    borderColor: filter === f ? 'var(--color-pink)' : 'rgba(224,48,112,0.12)',
                  }}>
                  {f}
                </button>
              ))}
            </div>

            <div className="p-4">
              {apptsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse bg-gray-50" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No appointments found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(appt => {
                    const st = STATUS[appt.status] || STATUS.pending
                    return (
                      <div key={appt.id}
                        className="group p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-pink-300 hover:shadow-sm bg-white"
                        style={{ borderColor: 'rgba(224,48,112,0.1)' }}>

                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-pink-50 shrink-0">
                            {appt.services?.icon ?? '✦'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900">{appt.profiles?.full_name ?? 'Unknown client'}</p>
                              {isToday(parseISO(appt.appointment_date)) && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold uppercase tracking-wide">Today</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {appt.services?.name} • {format(parseISO(appt.appointment_date), 'MMM d')} at {format(new Date(`2000-01-01T${appt.appointment_time}`), 'h:mm a')}
                            </p>
                            {appt.notes && <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">"{appt.notes}"</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: st.bg, color: st.text }}>
                            {st.label}
                          </span>
                          {appt.status === 'pending' && (
                            <button onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'confirmed' })}
                              className="text-xs px-4 py-1.5 rounded-full text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm">
                              Confirm
                            </button>
                          )}
                          {appt.status === 'confirmed' && (
                            <button onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'completed' })}
                              className="text-xs px-4 py-1.5 rounded-full text-gray-700 bg-gray-100 border hover:bg-gray-200 transition-colors">
                              Mark Done
                            </button>
                          )}
                          {['pending', 'confirmed'].includes(appt.status) && (
                            <button onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'cancelled' })}
                              className="text-xs px-3 py-1.5 rounded-full text-pink-600 hover:bg-pink-50 transition-colors opacity-0 group-hover:opacity-100">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Services Tab ── */}
        {mainTab === 'services' && <ServicesManager />}

      </div>
    </div>
  )
}