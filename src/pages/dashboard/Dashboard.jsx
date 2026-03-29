import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { format, isPast, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending:   { bg: 'rgba(201,149,106,0.1)', text: '#A07040', label: 'Pending' },
  confirmed: { bg: 'rgba(16,185,129,0.1)', text: '#059669', label: 'Confirmed' },
  cancelled: { bg: 'rgba(224,48,112,0.1)', text: 'var(--color-pink)', label: 'Cancelled' },
  completed: { bg: 'rgba(139,84,104,0.1)', text: 'var(--color-muted)', label: 'Completed' },
}

export default function Dashboard() {
  const { user, profile, refetchProfile } = useAuth()
  const [appointments, setAppointments]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [tab, setTab]                     = useState('upcoming')
  const [editing, setEditing]             = useState(false)
  const [name,  setName]                  = useState(profile?.full_name ?? '')
  const [phone, setPhone]                 = useState(profile?.phone ?? '')
  const [saving, setSaving]               = useState(false)

  useEffect(() => {
    if (profile) { setName(profile.full_name ?? ''); setPhone(profile.phone ?? '') }
  }, [profile])

  useEffect(() => {
    if (!user) return
    supabase
      .from('appointments')
      .select('*, services(name, price, duration, icon)')
      .eq('client_id', user.id)
      .order('appointment_date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setAppointments(data)
        setLoading(false)
      })
  }, [user])

  const upcoming = appointments.filter(a =>
    !isPast(parseISO(`${a.appointment_date}T${a.appointment_time}`)) &&
    !['cancelled', 'completed'].includes(a.status)
  )
  const past = appointments.filter(a =>
    isPast(parseISO(`${a.appointment_date}T${a.appointment_time}`)) ||
    ['cancelled', 'completed'].includes(a.status)
  )

  async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) return toast.error('Could not cancel. Please try again.')
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    toast.success('Appointment cancelled.')
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, phone })
      .eq('id', user.id)
    setSaving(false)
    if (error) return toast.error('Could not save profile.')
    await refetchProfile()
    setEditing(false)
    toast.success('Profile updated!')
  }

  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>My Account</p>
            <h1 className="font-display text-4xl font-medium">
              Hi, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
            </h1>
          </div>
          <Link to="/services"
            className="px-5 py-2.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
            + Book New Style
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Appointments */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit border"
              style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
              {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past (${past.length})`]].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: tab === key ? 'var(--color-pink)' : 'transparent',
                    color: tab === key ? 'white' : 'var(--color-muted)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'white' }} />)}
              </div>
            ) : shown.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border"
                style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
                <p className="font-display text-2xl mb-2" style={{ color: 'var(--color-muted)' }}>
                  {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
                </p>
                {tab === 'upcoming' && (
                  <Link to="/services" className="text-sm font-medium" style={{ color: 'var(--color-pink)' }}>
                    Book your first style →
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {shown.map(appt => <AppointmentCard key={appt.id} appt={appt} onCancel={cancelAppointment} />)}
              </div>
            )}
          </div>

          {/* Profile sidebar */}
          <div>
            <div className="rounded-2xl p-5 border sticky top-28" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-semibold"
                  style={{ background: 'var(--color-pink-blush)', color: 'var(--color-pink-deep)' }}>
                  {(profile?.full_name?.[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{profile?.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{user?.email}</p>
                </div>
              </div>

              {editing ? (
                <form onSubmit={saveProfile} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-muted)' }}>Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-muted)' }}>Phone</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)' }} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2 rounded-full text-xs font-medium text-white"
                      style={{ background: 'var(--color-pink)' }}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
                      className="flex-1 py-2 rounded-full text-xs font-medium border"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-muted)' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3">
                  {[['Phone', profile?.phone || 'Not set'], ['Member since', profile?.created_at ? format(parseISO(profile.created_at), 'MMMM yyyy') : '—']].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{l}</p>
                      <p className="text-sm font-medium">{v}</p>
                    </div>
                  ))}
                  <button onClick={() => setEditing(true)}
                    className="mt-2 w-full py-2 rounded-full text-xs font-medium border hover:opacity-70 transition-opacity"
                    style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-dark)' }}>
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({ appt, onCancel }) {
  const st      = STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending
  const dateStr = format(parseISO(appt.appointment_date), 'EEEE, MMMM d yyyy')
  const timeStr = format(new Date(`2000-01-01T${appt.appointment_time}`), 'h:mm a')
  const canCancel = ['pending', 'confirmed'].includes(appt.status)

  return (
    <div className="rounded-2xl p-5 border flex items-start justify-between gap-4"
      style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
      <div className="flex gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: 'var(--color-pink-blush)' }}>
          {appt.services?.icon ?? '✦'}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{appt.services?.name ?? 'Service'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{dateStr} at {timeStr}</p>
          {appt.notes && <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-muted)' }}>"{appt.notes}"</p>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: st.bg, color: st.text }}>
          {st.label}
        </span>
        {canCancel && (
          <button onClick={() => onCancel(appt.id)}
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-muted)' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}