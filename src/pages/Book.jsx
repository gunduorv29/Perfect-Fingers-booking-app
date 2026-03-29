import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  format, addDays, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay
} from 'date-fns'

const WORKING_DAYS = [2, 3, 4, 5, 6]
const WORK_START   = 9
const WORK_END     = 19

function generateSlots(durationMinutes) {
  const slots = []
  let cur = WORK_START * 60
  const end = WORK_END * 60
  while (cur + durationMinutes <= end) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    const label = format(new Date(2000, 0, 1, h, m), 'h:mm a')
    slots.push({ value: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, label })
    cur += durationMinutes < 90 ? 30 : 60
  }
  return slots
}

const STEPS = ['Service', 'Date', 'Time', 'Your Info', 'Details', 'Review']

export default function Book() {
  const { user, profile } = useAuth()
  const navigate          = useNavigate()
  const [params]          = useSearchParams()
  const preselectedId     = params.get('service')

  const [step, setStep]             = useState(1)
  const [services, setServices]     = useState([])
  const [service, setService]       = useState(null)
  const [date, setDate]             = useState(null)
  const [time, setTime]             = useState(null)
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [notes, setNotes]           = useState('')
  const [bookedSlots, setBooked]    = useState([])
  const [blockedDates, setBlocked]  = useState([])
  const [calMonth, setCalMonth]     = useState(new Date())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    if (profile) { setFullName(profile.full_name ?? ''); setPhone(profile.phone ?? '') }
    if (user) setEmail(user.email ?? '')
  }, [profile, user])

  useEffect(() => {
    supabase.from('services').select('*').order('price').then(({ data }) => {
      if (data) {
        setServices(data)
        if (preselectedId) {
          const found = data.find(s => s.id === preselectedId)
          if (found) { setService(found); setStep(2) }
        }
      }
    })
  }, [preselectedId])

  useEffect(() => {
    const from = format(startOfMonth(calMonth), 'yyyy-MM-dd')
    const to   = format(endOfMonth(calMonth),   'yyyy-MM-dd')
    supabase
      .from('blocked_dates')
      .select('date')
      .gte('date', from)
      .lte('date', to)
      .then(({ data }) => { setBlocked(data?.map(b => b.date) ?? []) })
  }, [calMonth])

  useEffect(() => {
    if (!date || !service) return
    supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', format(date, 'yyyy-MM-dd'))
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => { setBooked(data?.map(a => a.appointment_time.slice(0, 5)) ?? []) })
  }, [date, service])

  const slots          = service ? generateSlots(service.duration) : []
  const availableSlots = slots.filter(s => !bookedSlots.includes(s.value))

  async function saveProfile() {
    if (!fullName || !email) { toast.error('Name and email are required.'); return false }
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
      if (error) throw error
      return true
    } catch { toast.error('Could not save profile.'); return false }
  }

  async function handleSubmit() {
    if (!service || !date || !time) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('appointments').insert({
        client_id:        user.id,
        service_id:       service.id,
        appointment_date: format(date, 'yyyy-MM-dd'),
        appointment_time: time,
        notes,
        status:           'pending',
      })
      if (error) throw error
      setDone(true)
    } catch (err) {
      toast.error('Could not submit booking. Please try again.')
      console.error(err)
    } finally { setSubmitting(false) }
  }

  if (done) return <Confirmation service={service} date={date} time={time} navigate={navigate} profile={profile} />

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>Appointment</p>
          <h1 className="font-display text-4xl font-medium">Book Your Style</h1>
        </div>

        <div className="flex items-center mb-12">
          {STEPS.map((label, i) => {
            const n = i + 1; const isDone = step > n; const active = step === n
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all"
                    style={{
                      background: isDone ? 'var(--color-pink)' : active ? 'var(--color-pink-blush)' : 'white',
                      borderColor: (isDone || active) ? 'var(--color-pink)' : 'rgba(224,48,112,0.15)',
                      color: isDone ? 'white' : active ? 'var(--color-pink)' : 'var(--color-muted)',
                    }}>
                    {isDone ? '✓' : n}
                  </div>
                  <span className="text-xs hidden sm:block" style={{ color: active ? 'var(--color-pink)' : 'var(--color-muted)' }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2" style={{ background: step > n ? 'var(--color-pink)' : 'rgba(224,48,112,0.15)' }} />
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl p-6 md:p-8 border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>

          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-medium mb-6">Choose a Service</h2>
              <div className="flex flex-col gap-3">
                {services.map(svc => (
                  <button key={svc.id} onClick={() => { setService(svc); setStep(2) }}
                    className="flex items-center justify-between p-4 rounded-xl border text-left transition-colors"
                    style={{ borderColor: service?.id === svc.id ? 'var(--color-pink)' : 'rgba(224,48,112,0.12)', background: service?.id === svc.id ? 'var(--color-pink-blush)' : 'transparent' }}>
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {Math.floor(svc.duration/60)}h{svc.duration%60>0?` ${svc.duration%60}m`:''} · from ${svc.price}{svc.deposit ? ` · $${svc.deposit} deposit` : ''}
                      </p>
                    </div>
                    <span className="text-lg">{svc.icon ?? '✦'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-medium">Pick a Date</h2>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-pink-blush)', color: 'var(--color-pink)' }}>{service?.name}</span>
              </div>
              <Calendar month={calMonth} setMonth={setCalMonth} selected={date} blockedDates={blockedDates}
                onSelect={d => { setDate(d); setTime(null); setStep(3) }} />
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-2xl font-medium">Pick a Time</h2>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-pink-blush)', color: 'var(--color-pink)' }}>
                  {date && format(date, 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>Each slot is {service?.duration} minutes.</p>
              {availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-display text-xl mb-2" style={{ color: 'var(--color-muted)' }}>No slots available</p>
                  <button onClick={() => setStep(2)} className="text-sm font-medium" style={{ color: 'var(--color-pink)' }}>← Pick another date</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {availableSlots.map(s => (
                    <button key={s.value} onClick={() => { setTime(s.value); setStep(4) }}
                      className="py-2.5 rounded-xl text-sm font-medium border transition-all"
                      style={{ borderColor: time===s.value?'var(--color-pink)':'rgba(224,48,112,0.12)', background: time===s.value?'var(--color-pink-blush)':'transparent', color: time===s.value?'var(--color-pink)':'var(--color-dark)' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display text-2xl font-medium mb-2">Your Information</h2>
              <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>Confirm or update your details for this booking.</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Full Name *', value: fullName, set: setFullName, type: 'text',  placeholder: 'Jane Doe' },
                  { label: 'Email *',     value: email,    set: setEmail,    type: 'email', placeholder: 'you@email.com' },
                  { label: 'Phone',       value: phone,    set: setPhone,    type: 'tel',   placeholder: '(555) 000-0000' },
                ].map(({ label, value, set, type, placeholder }) => (
                  <div key={label}>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>{label}</label>
                    <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'var(--color-cream)', fontFamily: 'var(--font-body)' }} />
                  </div>
                ))}
              </div>
              <button onClick={async () => { const ok = await saveProfile(); if (ok) setStep(5) }}
                className="mt-6 w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                Save & Continue →
              </button>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display text-2xl font-medium mb-2">Hair Details</h2>
              <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>Optional but very helpful — length, texture, braid size, colors, special requests.</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5}
                placeholder="e.g. Medium 4C hair, small knotless to shoulder, #4 with burgundy highlights..."
                className="w-full p-4 rounded-xl border text-sm outline-none resize-none transition-colors"
                style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'var(--color-cream)', fontFamily: 'var(--font-body)' }} />
              <button onClick={() => setStep(6)}
                className="mt-6 w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                Continue to Review →
              </button>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="font-display text-2xl font-medium mb-6">Review & Confirm</h2>
              <div className="rounded-xl p-4 mb-4 border" style={{ background: 'var(--color-cream)', borderColor: 'rgba(224,48,112,0.08)' }}>
                <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--color-muted)' }}>Booking</p>
                {[['Service',service?.name],['Date',date&&format(date,'EEEE, MMMM d yyyy')],['Time',time&&format(new Date(`2000-01-01T${time}`),'h:mm a')],['Price',`from $${service?.price}`]].map(([l,v]) => (
                  <div key={l} className="flex justify-between py-1.5 text-sm border-b last:border-0" style={{ borderColor: 'rgba(224,48,112,0.06)' }}>
                    <span style={{ color: 'var(--color-muted)' }}>{l}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4 mb-4 border" style={{ background: 'var(--color-cream)', borderColor: 'rgba(224,48,112,0.08)' }}>
                <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--color-muted)' }}>Client</p>
                {[['Name',fullName],['Email',email],['Phone',phone||'—']].map(([l,v]) => (
                  <div key={l} className="flex justify-between py-1.5 text-sm border-b last:border-0" style={{ borderColor: 'rgba(224,48,112,0.06)' }}>
                    <span style={{ color: 'var(--color-muted)' }}>{l}</span><span className="font-medium truncate max-w-xs">{v}</span>
                  </div>
                ))}
              </div>
              {notes && (
                <div className="rounded-xl p-4 mb-4 border" style={{ background: 'var(--color-cream)', borderColor: 'rgba(224,48,112,0.08)' }}>
                  <p className="text-xs uppercase tracking-widest mb-2 font-medium" style={{ color: 'var(--color-muted)' }}>Notes</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-dark)' }}>{notes}</p>
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">Send deposit {service?.deposit?`($${service.deposit})`:''} to confirm:</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[{brand:'Zelle',color:'#6D1ED4',info:'perfectfingers@email.com'},{brand:'Cash App',color:'#00A624',info:'$PerfectFingerBraids',link:'https://cash.app/$PerfectFingerBraids'}].map(p => (
                    <div key={p.brand} className="p-3 rounded-xl border" style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
                      <p className="font-display text-base font-semibold mb-1" style={{ color: p.color }}>{p.brand}</p>
                      <p className="text-xs break-all mb-2" style={{ color: 'var(--color-dark)' }}>{p.info}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => { navigator.clipboard.writeText(p.info); toast.success('Copied!') }}
                          className="flex-1 text-xs py-1.5 rounded-full border" style={{ borderColor: 'rgba(224,48,112,0.15)', color: 'var(--color-dark)' }}>Copy</button>
                        {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-xs py-1.5 rounded-full border text-center" style={{ borderColor: 'rgba(224,48,112,0.15)', color: 'var(--color-dark)' }}>Open</a>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  Include <strong style={{ color: 'var(--color-dark)' }}>{fullName} — {service?.name}</strong> in the memo.
                  Booking is pending until deposit is received. 24hr cancellation policy applies.
                </p>
              </div>
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                {submitting ? 'Submitting...' : 'Confirm & Submit Booking'}
              </button>
              <p className="text-center text-xs mt-3" style={{ color: 'var(--color-muted)' }}>By submitting you agree to the deposit and cancellation terms.</p>
            </div>
          )}
        </div>

        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="mt-4 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--color-muted)' }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

function Calendar({ month, setMonth, selected, onSelect, blockedDates = [] }) {
  const today    = startOfDay(new Date())
  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = getDay(days[0])

  function isDisabled(day) {
    return isBefore(startOfDay(day), today) || !WORKING_DAYS.includes(getDay(day)) || blockedDates.includes(format(day,'yyyy-MM-dd'))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setMonth(m => addDays(startOfMonth(m),-1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}>‹</button>
        <span className="font-display text-lg font-medium">{format(month,'MMMM yyyy')}</span>
        <button onClick={() => setMonth(m => addDays(endOfMonth(m),1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}>›</button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--color-muted)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[...Array(startPad)].map((_,i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const disabled   = isDisabled(day)
          const isBlocked  = blockedDates.includes(format(day,'yyyy-MM-dd'))
          const isSelected = selected && isSameDay(day,selected)
          const isTodayDay = isSameDay(day,today)
          return (
            <button key={day.toISOString()} disabled={disabled} onClick={() => !disabled && onSelect(day)}
              className="aspect-square rounded-xl text-sm flex items-center justify-center transition-all"
              title={isBlocked ? 'Unavailable' : ''}
              style={{
                background: isSelected ? 'var(--color-pink)' : isTodayDay ? 'var(--color-pink-blush)' : 'transparent',
                color: isSelected ? 'white' : disabled ? 'rgba(139,84,104,0.25)' : 'var(--color-dark)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: isTodayDay || isSelected ? '500' : '400',
                textDecoration: isBlocked ? 'line-through' : 'none',
              }}>
              {format(day,'d')}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
        <span>Available: Tue – Sat</span>
        <span className="flex items-center gap-1"><span style={{ textDecoration:'line-through' }}>15</span> = Unavailable</span>
      </div>
    </div>
  )
}

function Confirmation({ service, date, time, navigate, profile }) {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6 flex items-center justify-center" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6" style={{ background: 'var(--color-pink-blush)' }}>🎉</div>
        <h1 className="font-display text-4xl font-medium mb-3">You're Booked!</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-muted)' }}>
          Your appointment request has been submitted. We'll confirm once your deposit is received.
          See you soon, {profile?.full_name?.split(' ')[0] ?? 'there'}!
        </p>
        <div className="rounded-2xl p-6 text-left border mb-8" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.08)' }}>
          {[['Service',service?.name],['Date',date&&format(date,'EEEE, MMMM d yyyy')],['Time',time&&format(new Date(`2000-01-01T${time}`),'h:mm a')],['Status','Pending deposit confirmation']].map(([l,v]) => (
            <div key={l} className="flex justify-between py-2 text-sm border-b last:border-0" style={{ borderColor: 'rgba(224,48,112,0.06)' }}>
              <span style={{ color: 'var(--color-muted)' }}>{l}</span>
              <span className="font-medium text-right max-w-xs" style={{ color: l==='Status'?'var(--color-gold)':'var(--color-dark)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/dashboard')} className="w-full py-3.5 rounded-full text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>View My Bookings</button>
          <button onClick={() => navigate('/')} className="w-full py-3.5 rounded-full text-sm font-medium border"
            style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-dark)' }}>Back to Home</button>
        </div>
      </div>
    </div>
  )
}