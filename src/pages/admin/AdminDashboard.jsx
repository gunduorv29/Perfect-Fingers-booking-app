import { useEffect, useState } from 'react'
import AvailabilityManager from '../../components/AvailabilityManager.jsx'
import { supabase } from '../../supabaseClient'
import { format, parseISO, isToday } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS = {
  pending:   { bg: 'rgba(201,149,106,0.1)', text: '#A07040', label: 'Pending' },
  confirmed: { bg: 'rgba(16,185,129,0.1)',  text: '#059669', label: 'Confirmed' },
  cancelled: { bg: 'rgba(224,48,112,0.1)',  text: 'var(--color-pink)', label: 'Cancelled' },
  completed: { bg: 'rgba(139,84,104,0.1)',  text: 'var(--color-muted)', label: 'Completed' },
}

const EMPTY_SVC = { name: '', description: '', price: '', duration: '', icon: '', deposit: '' }

export default function AdminDashboard() {
  const [tab, setTab]                     = useState('appointments')
  const [appointments, setAppointments]   = useState([])
  const [services, setServices]           = useState([])
  const [filter, setFilter]               = useState('all')
  const [loading, setLoading]             = useState(true)
  const [svcModal, setSvcModal]           = useState(false)
  const [svcForm, setSvcForm]             = useState(EMPTY_SVC)
  const [editingId, setEditingId]         = useState(null)
  const [saving, setSaving]               = useState(false)

  // Used for manual refreshes after save/delete actions
  async function loadAll() {
    setLoading(true)
    const [apptRes, svcRes] = await Promise.all([
      supabase.from('appointments').select('*, profiles(full_name, phone), services(name, icon)').order('appointment_date', { ascending: false }),
      supabase.from('services').select('*').order('price'),
    ])
    if (apptRes.data) setAppointments(apptRes.data)
    if (svcRes.data)  setServices(svcRes.data)
    setLoading(false)
  }

  // ✅ Fix: define async fetch inline inside the effect so setState is called
  // after an await — satisfies react-hooks/set-state-in-effect.
  // Cleanup flag prevents setState on an unmounted component.
  useEffect(() => {
    let cancelled = false
    async function fetchOnMount() {
      setLoading(true)
      const [apptRes, svcRes] = await Promise.all([
        supabase.from('appointments').select('*, profiles(full_name, phone), services(name, icon)').order('appointment_date', { ascending: false }),
        supabase.from('services').select('*').order('price'),
      ])
      if (cancelled) return
      if (apptRes.data) setAppointments(apptRes.data)
      if (svcRes.data)  setServices(svcRes.data)
      setLoading(false)
    }
    fetchOnMount()
    return () => { cancelled = true }
  }, [])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) return toast.error('Could not update status.')
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    toast.success(`Appointment marked as ${status}.`)
  }

  async function saveService(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name:        svcForm.name,
      description: svcForm.description,
      price:       parseFloat(svcForm.price),
      duration:    parseInt(svcForm.duration),
      icon:        svcForm.icon || '✦',
      deposit:     svcForm.deposit ? parseFloat(svcForm.deposit) : null,
    }
    const { error } = editingId
      ? await supabase.from('services').update(payload).eq('id', editingId)
      : await supabase.from('services').insert(payload)
    setSaving(false)
    if (error) return toast.error('Could not save service.')
    toast.success(editingId ? 'Service updated.' : 'Service added.')
    setSvcModal(false); setEditingId(null); setSvcForm(EMPTY_SVC)
    loadAll()
  }

  async function deleteService(id) {
    if (!confirm('Delete this service? This cannot be undone.')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) return toast.error('Could not delete service.')
    setServices(prev => prev.filter(s => s.id !== id))
    toast.success('Service deleted.')
  }

  function openEdit(svc) {
    setEditingId(svc.id)
    setSvcForm({ name: svc.name, description: svc.description ?? '', price: svc.price, duration: svc.duration, icon: svc.icon ?? '', deposit: svc.deposit ?? '' })
    setSvcModal(true)
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)
  const totalToday = appointments.filter(a => isToday(parseISO(a.appointment_date))).length
  const pending    = appointments.filter(a => a.status === 'pending').length
  const confirmed  = appointments.filter(a => a.status === 'confirmed').length

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>Admin</p>
          <h1 className="font-display text-4xl font-medium">Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Total Bookings', appointments.length, '📋'],
            ["Today's Appointments", totalToday, '📅'],
            ['Pending Deposits', pending, '⏳'],
            ['Confirmed', confirmed, '✅'],
          ].map(([label, value, icon]) => (
            <div key={label} className="rounded-2xl p-5 border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
              <p className="text-xl mb-1">{icon}</p>
              <p className="font-display text-3xl font-semibold" style={{ color: 'var(--color-pink)' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
{[['appointments', 'Appointments'], ['services', 'Services'], ['availability', 'Availability']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: tab === key ? 'var(--color-pink)' : 'transparent', color: tab === key ? 'white' : 'var(--color-muted)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Appointments tab */}
        {tab === 'appointments' && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize"
                  style={{
                    background: filter === f ? 'var(--color-pink)' : 'white',
                    color: filter === f ? 'white' : 'var(--color-muted)',
                    borderColor: filter === f ? 'var(--color-pink)' : 'rgba(224,48,112,0.12)',
                  }}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'white' }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
                <p className="font-display text-2xl" style={{ color: 'var(--color-muted)' }}>No appointments found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(appt => (
                  <AdminApptCard key={appt.id} appt={appt} onUpdate={updateStatus} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services tab */}
        {tab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <p className="text-sm font-medium">{services.length} services listed</p>
              <button onClick={() => { setSvcForm(EMPTY_SVC); setEditingId(null); setSvcModal(true) }}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                + Add Service
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {services.map(svc => (
                <div key={svc.id} className="rounded-2xl p-5 border flex items-start justify-between gap-4"
                  style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: 'var(--color-pink-blush)' }}>
                      {svc.icon ?? '✦'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{svc.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        ${svc.price} · {svc.duration} min
                        {svc.deposit && ` · $${svc.deposit} deposit`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(svc)}
                      className="text-xs px-3 py-1.5 rounded-full border hover:opacity-70 transition-opacity"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-dark)' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteService(svc.id)}
                      className="text-xs px-3 py-1.5 rounded-full border hover:opacity-70 transition-opacity"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-pink)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability tab */}
        {tab === 'availability' && <AvailabilityManager />}

      </div>

      {/* Service modal */}
      {svcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(24,8,16,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 border shadow-2xl"
            style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-medium">{editingId ? 'Edit Service' : 'Add Service'}</h2>
              <button onClick={() => setSvcModal(false)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70"
                style={{ borderColor: 'rgba(224,48,112,0.2)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={saveService} className="flex flex-col gap-4">
              {[
                ['name', 'Service Name *', 'Knotless Box Braids', 'text'],
                ['icon', 'Icon (emoji)', '🌿', 'text'],
                ['price', 'Starting Price ($) *', '120', 'number'],
                ['duration', 'Duration (minutes) *', '180', 'number'],
                ['deposit', 'Deposit Amount ($)', '50', 'number'],
              ].map(([field, label, placeholder, type]) => (
                <div key={field}>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>{label}</label>
                  <input
                    type={type}
                    value={svcForm[field]}
                    onChange={e => setSvcForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)' }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Description</label>
                <textarea
                  value={svcForm.description}
                  onChange={e => setSvcForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3} placeholder="Short description of the service..."
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)' }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-full text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Service'}
                </button>
                <button type="button" onClick={() => setSvcModal(false)}
                  className="flex-1 py-3 rounded-full text-sm font-medium border hover:opacity-70"
                  style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-dark)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminApptCard({ appt, onUpdate }) {
  const st      = STATUS[appt.status] ?? STATUS.pending
  const dateStr = format(parseISO(appt.appointment_date), 'MMM d, yyyy')
  const timeStr = format(new Date(`2000-01-01T${appt.appointment_time}`), 'h:mm a')
  const todayMark = isToday(parseISO(appt.appointment_date))

  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'white', borderColor: todayMark ? 'rgba(224,48,112,0.25)' : 'rgba(224,48,112,0.07)' }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          {/* ✅ Fix: flex-shrink-0 → shrink-0 */}
          <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg"
            style={{ background: 'var(--color-pink-blush)' }}>
            {appt.services?.icon ?? '✦'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">{appt.profiles?.full_name ?? 'Unknown client'}</p>
              {todayMark && <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--color-pink)' }}>Today</span>}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {appt.services?.name} · {dateStr} at {timeStr}
            </p>
            {appt.profiles?.phone && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>📞 {appt.profiles.phone}</p>
            )}
            {appt.notes && <p className="text-xs mt-1 italic" style={{ color: 'var(--color-muted)' }}>"{appt.notes}"</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: st.bg, color: st.text }}>
            {st.label}
          </span>
          {appt.status === 'pending' && (
            <button onClick={() => onUpdate(appt.id, 'confirmed')}
              className="text-xs px-3 py-1.5 rounded-full text-white hover:opacity-90"
              style={{ background: '#059669' }}>
              Confirm
            </button>
          )}
          {appt.status === 'confirmed' && (
            <button onClick={() => onUpdate(appt.id, 'completed')}
              className="text-xs px-3 py-1.5 rounded-full text-white hover:opacity-90"
              style={{ background: 'var(--color-muted)' }}>
              Mark Done
            </button>
          )}
          {['pending','confirmed'].includes(appt.status) && (
            <button onClick={() => onUpdate(appt.id, 'cancelled')}
              className="text-xs px-3 py-1.5 rounded-full border hover:opacity-70"
              style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-pink)' }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}