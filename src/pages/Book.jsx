import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay } from 'date-fns'

// Working days: Tue(2)–Sat(6), Sun(0) Mon(1) are off
const WORKING_DAYS = [2, 3, 4, 5, 6]
const WORK_START   = 9   // 9am
const WORK_END     = 19  // 7pm

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

const STEPS = ['Service', 'Date', 'Time', 'Details', 'Payment']

export default function Book() {
  const { user, profile } = useAuth()
  const navigate          = useNavigate()
  const [params]          = useSearchParams()
  const preselectedId     = params.get('service')

  const [step, setStep]         = useState(1)
  const [services, setServices] = useState([])
  const [service, setService]   = useState(null)
  const [date, setDate]         = useState(null)
  const [time, setTime]         = useState(null)
  const [notes, setNotes]       = useState('')
  const [bookedSlots, setBooked] = useState([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)

  // Load services
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

  // When date selected, fetch already booked slots for that date
  useEffect(() => {
    if (!date || !service) return
    supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', format(date, 'yyyy-MM-dd'))
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => {
        setBooked(data?.map(a => a.appointment_time.slice(0,5)) ?? [])
      })
  }, [date, service])

  const slots         = service ? generateSlots(service.duration) : []
  const availableSlots = slots.filter(s => !bookedSlots.includes(s.value))

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
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return <Confirmation service={service} date={date} time={time} navigate={navigate} profile={profile} />

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Page title */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>Appointment</p>
          <h1 className="font-display text-4xl font-medium">Book Your Style</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-12">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done_ = step > n
            const active = step === n
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all`}
                    style={{
                      background: done_ ? 'var(--color-pink)' : active ? 'var(--color-pink-blush)' : 'white',
                      borderColor: (done_ || active) ? 'var(--color-pink)' : 'rgba(224,48,112,0.15)',
                      color: done_ ? 'white' : active ? 'var(--color-pink)' : 'var(--color-muted)',
                    }}>
                    {done_ ? '✓' : n}
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

        {/* Step panels */}
        <div className="rounded-2xl p-6 md:p-8 border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>

          {/* Step 1 - Service */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-medium mb-6">Choose a Service</h2>
              <div className="flex flex-col gap-3">
                {services.map(svc => (
                  <button key={svc.id} onClick={() => { setService(svc); setStep(2) }}
                    className="flex items-center justify-between p-4 rounded-xl border text-left hover:border-pink transition-colors group"
                    style={{ borderColor: service?.id === svc.id ? 'var(--color-pink)' : 'rgba(224,48,112,0.12)',
                             background: service?.id === svc.id ? 'var(--color-pink-blush)' : 'transparent' }}>
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {Math.floor(svc.duration/60)}h {svc.duration%60>0 ? `${svc.duration%60}m` : ''} session
                      </p>
                    </div>
                    <span className="font-display text-lg font-semibold" style={{ color: 'var(--color-pink-deep)' }}>
                      from ${svc.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 - Date */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-medium">Pick a Date</h2>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-pink-blush)', color: 'var(--color-pink)' }}>
                  {service?.name}
                </span>
              </div>
              <Calendar
                month={calMonth}
                setMonth={setCalMonth}
                selected={date}
                onSelect={(d) => { setDate(d); setTime(null); setStep(3) }}
              />
            </div>
          )}

          {/* Step 3 - Time */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-2xl font-medium">Pick a Time</h2>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-pink-blush)', color: 'var(--color-pink)' }}>
                  {date && format(date, 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
                Each slot is {service?.duration} minutes. Select a time that works for you.
              </p>
              {availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-display text-xl mb-2" style={{ color: 'var(--color-muted)' }}>No slots available</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>This date is fully booked. Please pick another date.</p>
                  <button onClick={() => setStep(2)} className="text-sm font-medium" style={{ color: 'var(--color-pink)' }}>← Go back</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {availableSlots.map(s => (
                    <button key={s.value} onClick={() => { setTime(s.value); setStep(4) }}
                      className="py-2.5 rounded-xl text-sm font-medium border transition-all hover:border-pink"
                      style={{
                        borderColor: time === s.value ? 'var(--color-pink)' : 'rgba(224,48,112,0.12)',
                        background: time === s.value ? 'var(--color-pink-blush)' : 'transparent',
                        color: time === s.value ? 'var(--color-pink)' : 'var(--color-dark)',
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4 - Notes */}
          {step === 4 && (
            <div>
              <h2 className="font-display text-2xl font-medium mb-2">Any Details?</h2>
              <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
                Let us know about your hair length, preferred braid size, colors, or any special requests.
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                placeholder="e.g. Medium-length knotless, shoulder length, burgundy ombre..."
                className="w-full p-4 rounded-xl border text-sm outline-none resize-none focus:border-pink transition-colors"
                style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'var(--color-cream)', fontFamily: 'var(--font-body)' }}
              />
              <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Optional — you can leave this blank.</p>
              <button onClick={() => setStep(5)}
                className="mt-6 w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                Continue to Payment Info →
              </button>
            </div>
          )}

          {/* Step 5 - Review + Payment */}
          {step === 5 && (
            <div>
              <h2 className="font-display text-2xl font-medium mb-6">Review & Confirm</h2>

              {/* Summary */}
              <div className="rounded-xl p-4 mb-6 border" style={{ background: 'var(--color-cream)', borderColor: 'rgba(224,48,112,0.08)' }}>
                <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--color-muted)' }}>Booking Summary</p>
                {[
                  ['Service', service?.name],
                  ['Date', date && format(date, 'EEEE, MMMM d yyyy')],
                  ['Time', time && format(new Date(`2000-01-01T${time}`), 'h:mm a')],
                  ['Price', `from $${service?.price}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 text-sm border-b last:border-0"
                    style={{ borderColor: 'rgba(224,48,112,0.06)' }}>
                    <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Payment instructions */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">Send your deposit to confirm:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { brand: 'Zelle', color: '#6D1ED4', info: 'perfectfingers@email.com' },
                    { brand: 'Cash App', color: '#00A624', info: '$PerfectFingerBraids' },
                  ].map(p => (
                    <div key={p.brand} className="p-3 rounded-xl border" style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
                      <p className="font-display text-base font-semibold mb-1" style={{ color: p.color }}>{p.brand}</p>
                      <p className="text-xs break-all" style={{ color: 'var(--color-dark)' }}>{p.info}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  Include <strong style={{ color: 'var(--color-dark)' }}>{profile?.full_name ?? 'your name'} + {service?.name}</strong> in the memo.
                  Your booking will be pending until we confirm receipt of the deposit.
                </p>
              </div>

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
              <p className="text-center text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
                By confirming, you agree to the 24-hour cancellation policy.
              </p>
            </div>
          )}
        </div>

        {/* Back navigation */}
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="mt-4 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-muted)' }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Calendar ── */
function Calendar({ month, setMonth, selected, onSelect }) {
  const today = startOfDay(new Date())
  const days  = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = getDay(days[0]) // 0=Sun

  function isDisabled(day) {
    return isBefore(startOfDay(day), today) || !WORKING_DAYS.includes(getDay(day))
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setMonth(m => addDays(startOfMonth(m), -1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}>
          ‹
        </button>
        <span className="font-display text-lg font-medium">{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth(m => addDays(endOfMonth(m), 1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}>
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--color-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {[...Array(startPad)].map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const disabled = isDisabled(day)
          const isSelected = selected && isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          return (
            <button key={day.toISOString()}
              disabled={disabled}
              onClick={() => !disabled && onSelect(day)}
              className="aspect-square rounded-xl text-sm flex items-center justify-center transition-all"
              style={{
                background: isSelected ? 'var(--color-pink)' : isToday ? 'var(--color-pink-blush)' : 'transparent',
                color: isSelected ? 'white' : disabled ? 'rgba(139,84,104,0.3)' : 'var(--color-dark)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: isToday || isSelected ? '500' : '400',
              }}>
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
        Available: Tuesday – Saturday
      </p>
    </div>
  )
}

/* ── Confirmation ── */
function Confirmation({ service, date, time, navigate, profile }) {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6 flex items-center justify-center" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6"
          style={{ background: 'var(--color-pink-blush)' }}>
          🎉
        </div>
        <h1 className="font-display text-4xl font-medium mb-3">You're Booked!</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-muted)' }}>
          Your appointment request has been submitted. It will be confirmed once we receive your deposit.
          We'll be in touch soon, {profile?.full_name?.split(' ')[0] ?? 'there'}!
        </p>

        <div className="rounded-2xl p-6 text-left border mb-8"
          style={{ background: 'white', borderColor: 'rgba(224,48,112,0.08)' }}>
          {[
            ['Service', service?.name],
            ['Date', date && format(date, 'EEEE, MMMM d yyyy')],
            ['Time', time && format(new Date(`2000-01-01T${time}`), 'h:mm a')],
            ['Status', 'Pending deposit confirmation'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 text-sm border-b last:border-0"
              style={{ borderColor: 'rgba(224,48,112,0.06)' }}>
              <span style={{ color: 'var(--color-muted)' }}>{label}</span>
              <span className="font-medium text-right max-w-xs"
                style={{ color: label === 'Status' ? 'var(--color-gold)' : 'var(--color-dark)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="w-full py-3.5 rounded-full text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
            View My Bookings
          </button>
          <button onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-full text-sm font-medium border"
            style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-dark)' }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}