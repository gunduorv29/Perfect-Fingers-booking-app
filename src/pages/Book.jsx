import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  format, addMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay, addWeeks
} from 'date-fns'

// ── Constants ──────────────────────────────────────────────────────────────
const WORKING_DAYS   = [2, 3, 4, 5, 6]   // Tue–Sat
const WORK_START     = 9                  // 9 AM
const WORK_END       = 19                 // 7 PM

// Add-ons mirror the HK system; update labels/prices to match PFB's actual offerings
const ADD_ONS = [
  { id: 'crankly_ends', label: 'Crankly Ends',  priceAddon: 20, durationAddon: 0,  note: '+ $20.00' },
  { id: 'human_hair',   label: 'Human Hair',     priceAddon: 50, durationAddon: 30, note: '+ 30 min @ $50.00' },
]

const RECURRING_FREQS = ['Weekly', 'Biweekly', 'Every 3 weeks', 'Monthly']

// Shown instantly while Supabase loads / if the table is empty during dev
const PLACEHOLDER_SERVICES = [
  { id: 'p1', name: 'Knotless Box Braids',     description: 'Lightweight, tension-free knotless braids that start with your natural hair. Beginner-friendly and long-lasting.',          duration: 180, price: 120, deposit: 40,  icon: '🌿' },
  { id: 'p2', name: 'Classic Box Braids',       description: 'Timeless and versatile box braids with extensions in your choice of length, size, and color.',                             duration: 180, price: 100, deposit: 35,  icon: '✦'  },
  { id: 'p3', name: 'Goddess Braids',           description: 'Bohemian braids with curly ends for a romantic, goddess-inspired look perfect for any occasion.',                          duration: 240, price: 140, deposit: 50,  icon: '🌸' },
  { id: 'p4', name: 'Feed-In Braids',           description: 'Natural-looking cornrows with gradually added extension hair for a seamless, scalp-friendly protective style.',            duration: 150, price: 80,  deposit: 30,  icon: '⬡'  },
  { id: 'p5', name: 'Stitch Braids',            description: 'Cornrows with a distinct stitched parting pattern. Clean graphic lines that make a bold statement.',                       duration: 150, price: 90,  deposit: 30,  icon: '🔶' },
  { id: 'p6', name: 'Passion Twists',           description: 'Lightweight bohemian twists with wavy hair for a textured, effortless look with incredible bounce.',                      duration: 240, price: 150, deposit: 50,  icon: '🌀' },
  { id: 'p7', name: 'Senegalese Twists',        description: 'Silky rope-like twists using Kanekalon hair. Smooth finish with maximum length and flexibility.',                          duration: 210, price: 130, deposit: 45,  icon: '🪢' },
  { id: 'p8', name: 'Cornrows (Straight Back)', description: 'Classic straight-back cornrows, clean and sleek. A simple, low-maintenance protective style staple.',                     duration: 90,  price: 60,  deposit: 20,  icon: '⬟' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function generateSlots(durationMinutes) {
  const slots = []
  let cur = WORK_START * 60
  const end = WORK_END * 60
  while (cur + durationMinutes <= end) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    slots.push({
      value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      label: format(new Date(2000, 0, 1, h, m), 'h:mm a'),
    })
    cur += durationMinutes < 90 ? 30 : 60
  }
  return slots
}

function fmtDuration(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Book() {
  const { user, profile } = useAuth()
  const navigate           = useNavigate()
  const [params]           = useSearchParams()
  const preselectedId      = params.get('service')

  // View: 'home' = accordion | 'information' = checkout form
  const [view, setView]           = useState('home')

  // Services & accordion
  const [services, setServices]       = useState([])
  const [loadingServices, setLoading] = useState(true)
  const [svcError, setSvcError]       = useState(false)
  const [openId, setOpenId]           = useState(preselectedId ?? null)

  // Booking selections
  const [selectedSvc, setSvc]     = useState(null)
  const [calMonth, setCalMonth]   = useState(new Date())
  const [selectedDate, setDate]   = useState(null)
  const [selectedTime, setTime]   = useState(null)
  const [addOns, setAddOns]       = useState({})  // { [addOnId]: boolean }

  // Availability data
  const [blockedDates, setBlocked]  = useState([])
  const [bookedSlots,  setBooked]   = useState([])

  // Recurring
  const [recurringModal, setRecModal]     = useState(false)
  const [recurringFreq,  setRecFreq]      = useState('Weekly')
  const [recurringCount, setRecCount]     = useState('4')
  const [isRecurring,    setIsRecurring]  = useState(false)

  // Info form
  const [fullName,    setFullName]   = useState('')
  const [email,       setEmail]      = useState('')
  const [phone,       setPhone]      = useState('')
  const [notes,       setNotes]      = useState('')
  const [submitting,  setSubmitting] = useState(false)
  const [done,        setDone]       = useState(false)

  // ── Prefill from auth profile ────────────────────────────────────────────
  useEffect(() => {
    if (profile) { setFullName(profile.full_name ?? ''); setPhone(profile.phone ?? '') }
    if (user)    setEmail(user.email ?? '')
  }, [profile, user])

  // ── Load services ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setSvcError(false)
    supabase.from('services').select('*').order('price').then(({ data, error }) => {
      setLoading(false)
      if (error || !data || data.length === 0) {
        // Fall back to placeholders so the page is never empty
        if (error) setSvcError(true)
        setServices(PLACEHOLDER_SERVICES)
        if (preselectedId) {
          const found = PLACEHOLDER_SERVICES.find(s => s.id === preselectedId)
          if (found) { setOpenId(preselectedId); setSvc(found) }
        }
        return
      }
      setServices(data)
      if (preselectedId) {
        const found = data.find(s => s.id === preselectedId)
        if (found) { setOpenId(preselectedId); setSvc(found) }
      }
    })
  }, [preselectedId])

  // ── Load blocked dates whenever month changes ────────────────────────────
  useEffect(() => {
    const from = format(startOfMonth(calMonth), 'yyyy-MM-dd')
    const to   = format(endOfMonth(calMonth),   'yyyy-MM-dd')
    supabase.from('blocked_dates').select('date').gte('date', from).lte('date', to)
      .then(({ data }) => setBlocked(data?.map(b => b.date) ?? []))
  }, [calMonth])

  // ── Load booked slots whenever date or service changes ───────────────────
  useEffect(() => {
    if (!selectedDate || !selectedSvc) return
    supabase.from('appointments').select('appointment_time')
      .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => setBooked(data?.map(a => a.appointment_time.slice(0, 5)) ?? []))
  }, [selectedDate, selectedSvc])

  // ── Computed effective duration/price (with add-ons) ─────────────────────
  function getEffective() {
    if (!selectedSvc) return { duration: 0, price: 0 }
    let duration = selectedSvc.duration
    let price    = Number(selectedSvc.price)
    ADD_ONS.forEach(ao => {
      if (addOns[ao.id]) { duration += ao.durationAddon; price += ao.priceAddon }
    })
    return { duration, price }
  }

  // ── Accordion toggle ─────────────────────────────────────────────────────
  function toggleOpen(svc) {
    if (openId === svc.id) {
      setOpenId(null); setSvc(null); setDate(null); setTime(null); setAddOns({})
    } else {
      setOpenId(svc.id); setSvc(svc); setDate(null); setTime(null)
      setAddOns({}); setCalMonth(new Date())
    }
  }

  // ── Add-on toggle (clears time since duration may change) ────────────────
  function toggleAddOn(id) {
    setAddOns(prev => ({ ...prev, [id]: !prev[id] }))
    setTime(null)
  }

  // ── Booking action handlers ───────────────────────────────────────────────
  function requireAuth() {
    if (!user) { toast.error('Please log in to book an appointment.'); navigate('/login'); return false }
    return true
  }

  function handleBookSingle() {
    if (!requireAuth()) return
    setIsRecurring(false); setView('information'); window.scrollTo(0, 0)
  }

  function handleBookRecurring() {
    if (!requireAuth()) return
    setRecModal(true)
  }

  function confirmRecurring() {
    setIsRecurring(true); setRecModal(false); setView('information'); window.scrollTo(0, 0)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedSvc || !selectedDate || !selectedTime || !fullName || !email) {
      toast.error('Please fill in all required fields.'); return
    }
    setSubmitting(true)

    // Build notes string
    const addOnLabels = ADD_ONS.filter(ao => addOns[ao.id]).map(ao => ao.label)
    let notesStr = ''
    if (addOnLabels.length)  notesStr += `Add-ons: ${addOnLabels.join(', ')}\n`
    if (isRecurring)         notesStr += `Recurring: ${recurringFreq} × ${recurringCount} sessions\n`
    if (notes.trim())        notesStr += notes.trim()

    try {
      if (isRecurring) {
        // Create one appointment row per session
        const records = []
        let d = selectedDate
        for (let i = 0; i < parseInt(recurringCount); i++) {
          records.push({
            client_id:        user.id,
            service_id:       selectedSvc.id,
            appointment_date: format(d, 'yyyy-MM-dd'),
            appointment_time: selectedTime,
            notes:            (notesStr + (i > 0 ? ` (Session ${i + 1}/${recurringCount})` : '')).trim(),
            status:           'pending',
          })
          if      (recurringFreq === 'Weekly')       d = addWeeks(d, 1)
          else if (recurringFreq === 'Biweekly')     d = addWeeks(d, 2)
          else if (recurringFreq === 'Every 3 weeks') d = addWeeks(d, 3)
          else if (recurringFreq === 'Monthly')      d = addMonths(d, 1)
        }
        const { error } = await supabase.from('appointments').insert(records)
        if (error) throw error
      } else {
        const { error } = await supabase.from('appointments').insert({
          client_id:        user.id,
          service_id:       selectedSvc.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          notes:            notesStr.trim(),
          status:           'pending',
        })
        if (error) throw error
      }

      // Update profile name/phone if changed
      if (user) {
        await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
      }

      setDone(true)
    } catch (err) {
      toast.error('Could not submit booking. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const { duration: effDuration, price: effPrice } = getEffective()
  const allSlots       = selectedSvc ? generateSlots(effDuration) : []
  const availableSlots = allSlots.filter(s => !bookedSlots.includes(s.value))

  // ── Render: Confirmation ──────────────────────────────────────────────────
  if (done) return (
    <Confirmation
      service={selectedSvc} date={selectedDate} time={selectedTime}
      isRecurring={isRecurring} recurringCount={recurringCount} recurringFreq={recurringFreq}
      navigate={navigate} profile={profile}
    />
  )

  return (
    <div className="min-h-screen pt-24 pb-24" style={{ background: 'var(--color-cream)' }}>

      {/* ── HOME VIEW: Accordion ─────────────────────────────────────────── */}
      {view === 'home' && (
        <div className="max-w-3xl mx-auto px-6">

          {/* Header */}
          <div className="mb-14">
            <p className="text-xs tracking-widest uppercase font-medium mb-3" style={{ color: 'var(--color-pink)' }}>
              <i className="far fa-calendar-minus mr-2 text-xs" />
              Appointment
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-medium leading-tight">
              Select Your Service
            </h1>
            <p className="text-sm mt-3 max-w-sm" style={{ color: 'var(--color-muted)' }}>
              Choose a style, pick your date and time, then continue to confirm.
            </p>
          </div>

          {/* Loading spinner — only while first fetch is in flight */}
          {loadingServices && (
            <div className="flex items-center gap-3 py-10" style={{ color: 'var(--color-muted)' }}>
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
                style={{ borderColor: 'var(--color-pink-pale)', borderTopColor: 'var(--color-pink)' }}
              />
              <span className="text-sm">Loading services…</span>
            </div>
          )}

          {/* DB connection warning — placeholders are shown so page stays usable */}
          {svcError && !loadingServices && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-xs leading-relaxed"
              style={{ background: 'rgba(201,149,106,0.07)', border: '1px solid rgba(201,149,106,0.18)', color: 'var(--color-muted)' }}
            >
              <span className="text-sm mt-0.5">⚠️</span>
              <p>
                Could not reach the database — showing sample services. Add{' '}
                <code className="px-1 rounded text-xs" style={{ background: 'rgba(0,0,0,0.06)' }}>VITE_SUPABASE_URL</code> and{' '}
                <code className="px-1 rounded text-xs" style={{ background: 'rgba(0,0,0,0.06)' }}>VITE_SUPABASE_ANON_KEY</code>{' '}
                to your <code className="px-1 rounded text-xs" style={{ background: 'rgba(0,0,0,0.06)' }}>.env</code> file, then run the seed SQL.
              </p>
            </div>
          )}

          {/* Accordion List */}
          <div style={{ borderTop: '1px solid rgba(224,48,112,0.1)' }}>

            {services.map(svc => {
              const isOpen = openId === svc.id

              return (
                <div
                  key={svc.id}
                  style={{ borderBottom: '1px solid rgba(224,48,112,0.1)' }}
                >
                  {/* ── Row Header ── */}
                  <div
                    className="group flex justify-between items-center py-6 cursor-pointer"
                    onClick={() => toggleOpen(svc)}
                  >
                    <div className="flex items-center gap-3">
                      {svc.icon && (
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                          style={{ background: isOpen ? 'var(--color-pink)' : 'var(--color-pink-blush)' }}
                        >
                          {svc.icon}
                        </span>
                      )}
                      <span
                        className="font-display font-bold text-lg md:text-xl transition-colors"
                        style={{ color: isOpen ? 'var(--color-pink)' : 'var(--color-dark)' }}
                      >
                        {svc.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs hidden sm:block" style={{ color: 'var(--color-muted)' }}>
                        from ${svc.price}
                      </span>
                      <span
                        className="text-[10px] font-bold tracking-[0.2em] transition-colors"
                        style={{ color: isOpen ? 'var(--color-pink)' : 'var(--color-muted)' }}
                      >
                        {isOpen ? 'CLOSE' : 'SELECT'}
                      </span>
                    </div>
                  </div>

                  {/* ── Expanded Content ── */}
                  {isOpen && (
                    <div className="pb-14 pt-2 px-1">

                      {/* Appointment summary */}
                      <div className="mb-10">
                        <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--color-muted)' }}>
                          Appointment
                        </p>
                        <h3 className="font-display font-bold text-2xl md:text-3xl mb-2">{svc.name}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                          {fmtDuration(effDuration)} @ ${effPrice.toFixed(2)}
                          {svc.deposit ? (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-pink-blush)', color: 'var(--color-pink)' }}>
                              ${svc.deposit} deposit
                            </span>
                          ) : null}
                        </p>
                        {svc.description && (
                          <p className="text-xs mt-2.5 italic max-w-sm" style={{ color: 'var(--color-muted)' }}>
                            {svc.description}
                          </p>
                        )}
                      </div>

                      {/* ── Add-ons ── */}
                      <div className="mb-12">
                        <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: 'var(--color-muted)' }}>
                          Add to Appointment
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {ADD_ONS.map(ao => (
                            <label key={ao.id} className="flex items-start gap-4 cursor-pointer group" onClick={e => e.preventDefault()}>
                              {/* Custom checkbox */}
                              <div
                                className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                                style={{
                                  borderColor:  addOns[ao.id] ? 'var(--color-pink)' : 'rgba(224,48,112,0.3)',
                                  background:   addOns[ao.id] ? 'var(--color-pink)' : 'transparent',
                                }}
                                onClick={() => toggleAddOn(ao.id)}
                              >
                                {addOns[ao.id] && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <div onClick={() => toggleAddOn(ao.id)}>
                                <span
                                  className="block font-display font-bold text-base transition-colors group-hover:text-pink"
                                  style={{ color: addOns[ao.id] ? 'var(--color-pink)' : 'var(--color-dark)' }}
                                >
                                  {ao.label}
                                </span>
                                <span className="block text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                  {ao.note}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* ── Calendar + Time side by side ── */}
                      <div
                        className="flex flex-col md:flex-row gap-10 pt-10"
                        style={{ borderTop: '1px solid rgba(224,48,112,0.08)' }}
                      >
                        {/* Calendar */}
                        <div className="w-full md:w-[45%]">
                          <InlineCalendar
                            month={calMonth}
                            setMonth={setCalMonth}
                            selected={selectedDate}
                            blockedDates={blockedDates}
                            onSelect={d => { setDate(d); setTime(null) }}
                          />
                        </div>

                        {/* Time Slots */}
                        <div className="w-full md:w-[55%]">
                          {!selectedDate ? (
                            <div
                              className="h-full min-h-40 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed gap-2"
                              style={{ borderColor: 'rgba(224,48,112,0.15)' }}
                            >
                              <span className="text-2xl">📅</span>
                              <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
                                Select a date to see<br />available times
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h5 className="font-display font-bold text-base mb-1">
                                {format(selectedDate, 'EEEE, MMMM d')}
                              </h5>
                              <p className="text-[9px] font-bold tracking-[0.1em] uppercase mb-6" style={{ color: 'var(--color-muted)' }}>
                                {fmtDuration(effDuration)} slots · Tue–Sat
                              </p>

                              {availableSlots.length === 0 ? (
                                <div
                                  className="p-5 rounded-2xl text-center border"
                                  style={{ background: 'rgba(224,48,112,0.03)', borderColor: 'rgba(224,48,112,0.1)' }}
                                >
                                  <p className="font-display font-medium mb-2">No slots available</p>
                                  <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                                    This date is fully booked.
                                  </p>
                                  <button
                                    className="text-xs font-medium hover:opacity-70 transition-opacity"
                                    style={{ color: 'var(--color-pink)' }}
                                    onClick={() => setDate(null)}
                                  >
                                    ← Pick another date
                                  </button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-2">
                                  {availableSlots.map(slot => (
                                    <button
                                      key={slot.value}
                                      onClick={() => setTime(slot.value === selectedTime ? null : slot.value)}
                                      className="py-3 text-[11px] font-bold border rounded-xl transition-all hover:opacity-80"
                                      style={{
                                        borderColor: selectedTime === slot.value ? 'var(--color-pink)' : 'rgba(224,48,112,0.18)',
                                        background:  selectedTime === slot.value ? 'var(--color-pink)' : 'transparent',
                                        color:       selectedTime === slot.value ? 'white' : 'var(--color-dark)',
                                        boxShadow:   selectedTime === slot.value ? '0 4px 12px rgba(224,48,112,0.25)' : 'none',
                                      }}
                                    >
                                      {slot.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Action Bar (appears after time is selected) ── */}
                      {selectedTime && (
                        <div
                          className="mt-10 pt-8"
                          style={{ borderTop: '1px solid rgba(224,48,112,0.08)' }}
                        >
                          {/* Selection summary */}
                          <div
                            className="flex items-center gap-3 p-4 rounded-xl mb-6"
                            style={{ background: 'var(--color-pink-blush)', border: '1px solid rgba(224,48,112,0.12)' }}
                          >
                            <span className="text-xl">✦</span>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')} at{' '}
                                <strong style={{ color: 'var(--color-pink)' }}>
                                  {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                                </strong>
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                {svc.name} · {fmtDuration(effDuration)} · ${effPrice.toFixed(2)}
                                {Object.keys(addOns).filter(k => addOns[k]).length > 0 && (
                                  <span> · {ADD_ONS.filter(ao => addOns[ao.id]).map(ao => ao.label).join(', ')}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={handleBookSingle}
                              className="flex-1 py-4 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', boxShadow: '0 8px 24px rgba(224,48,112,0.3)' }}
                            >
                              Book This Appointment →
                            </button>
                            <button
                              onClick={handleBookRecurring}
                              className="flex-1 py-4 rounded-full text-sm font-medium border hover:opacity-70 transition-opacity"
                              style={{ borderColor: 'rgba(224,48,112,0.25)', color: 'var(--color-dark)' }}
                            >
                              ↻ Set as Recurring
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer link */}
          {services.length > 0 && (
            <div className="mt-10 pb-4">
              <button
                className="text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-60 transition-opacity"
                style={{ color: 'var(--color-muted)' }}
                onClick={() => navigate('/services')}
              >
                View All Services & Pricing →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── INFORMATION VIEW: Checkout ───────────────────────────────────── */}
      {view === 'information' && (
        <div className="max-w-2xl mx-auto px-6">

          {/* Back */}
          <button
            onClick={() => { setView('home'); window.scrollTo(0, 0) }}
            className="flex items-center gap-2 text-sm font-medium mb-10 hover:opacity-60 transition-opacity"
            style={{ color: 'var(--color-muted)' }}
          >
            ← Back to Calendar
          </button>

          {/* Booking Summary Card */}
          <div
            className="rounded-2xl p-6 mb-8 border"
            style={{ background: 'white', borderColor: 'rgba(224,48,112,0.08)' }}
          >
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--color-muted)' }}>
              Your Appointment
            </p>
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: 'var(--color-pink-blush)' }}
              >
                {selectedSvc?.icon ?? '✦'}
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">{selectedSvc?.name}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                  {fmtDuration(effDuration)} @ ${effPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-0">
              {[
                ['Date',     selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')],
                ['Time',     selectedTime && format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')],
                ...(ADD_ONS.filter(ao => addOns[ao.id]).length > 0
                  ? [['Add-ons', ADD_ONS.filter(ao => addOns[ao.id]).map(ao => ao.label).join(', ')]]
                  : []),
                ...(isRecurring
                  ? [['Schedule', `${recurringFreq} × ${recurringCount} sessions`]]
                  : []),
                ...(selectedSvc?.deposit
                  ? [['Deposit', `$${selectedSvc.deposit} due to confirm`]]
                  : []),
              ].filter(([, v]) => v).map(([l, v]) => (
                <div
                  key={l}
                  className="flex justify-between py-2.5 text-sm border-b last:border-0"
                  style={{ borderColor: 'rgba(224,48,112,0.06)' }}
                >
                  <span style={{ color: 'var(--color-muted)' }}>{l}</span>
                  <span
                    className="font-medium text-right"
                    style={{ color: l === 'Deposit' ? 'var(--color-gold)' : 'var(--color-dark)' }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Client Info */}
            <div className="rounded-2xl p-6 border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
              <p className="font-display font-medium text-xl mb-6">Your Information</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Full Name *',  value: fullName, set: setFullName, type: 'text',  ph: 'Jane Doe' },
                  { label: 'Email *',      value: email,    set: setEmail,    type: 'email', ph: 'you@email.com' },
                  { label: 'Phone',        value: phone,    set: setPhone,    type: 'tel',   ph: '(555) 000-0000' },
                ].map(({ label, value, set, type, ph }) => (
                  <div key={label}>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
                      {label}
                    </label>
                    <input
                      type={type} value={value} onChange={e => set(e.target.value)} placeholder={ph}
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'var(--color-cream)', fontFamily: 'var(--font-body)' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Hair Details */}
            <div className="rounded-2xl p-6 border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
              <p className="font-display font-medium text-xl mb-2">Hair Details</p>
              <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                Optional — length, texture, braid size, colors, special requests.
              </p>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                placeholder="e.g. Medium 4C hair, small knotless to shoulder, #4 with burgundy highlights..."
                className="w-full p-4 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'var(--color-cream)', fontFamily: 'var(--font-body)' }}
              />
            </div>

            {/* Payment */}
            <div className="rounded-2xl p-6 border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
              <p className="font-display font-medium text-xl mb-2">Send Your Deposit</p>
              <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
                {selectedSvc?.deposit
                  ? `Send $${selectedSvc.deposit}`
                  : 'Send a deposit'} via Zelle or Cash App to hold your slot.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { brand: 'Zelle', color: '#6D1ED4', info: 'perfectfingers@email.com', link: null },
                  { brand: 'Cash App', color: '#00A624', info: '$PerfectFingerBraids', link: 'https://cash.app/$PerfectFingerBraids' },
                ].map(p => (
                  <div key={p.brand} className="p-4 rounded-xl border relative overflow-hidden" style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
                    {/* Decorative circle */}
                    <div
                      className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-10 pointer-events-none"
                      style={{ background: p.color }}
                    />
                    <p className="font-display font-bold text-lg mb-1" style={{ color: p.color }}>{p.brand}</p>
                    <p className="text-xs break-all mb-3 font-medium" style={{ color: 'var(--color-dark)' }}>{p.info}</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(p.info); toast.success('Copied!') }}
                        className="flex-1 text-xs py-1.5 rounded-full border transition-colors hover:opacity-70"
                        style={{ borderColor: 'rgba(224,48,112,0.15)', color: 'var(--color-dark)', background: 'var(--color-cream)' }}
                      >
                        Copy
                      </button>
                      {p.link && (
                        <a
                          href={p.link} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-xs py-1.5 rounded-full border text-center hover:opacity-70"
                          style={{ borderColor: 'rgba(224,48,112,0.15)', color: 'var(--color-dark)', background: 'var(--color-cream)' }}
                        >
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="px-4 py-3 rounded-xl text-xs leading-relaxed"
                style={{ background: 'rgba(224,48,112,0.04)', borderLeft: '3px solid var(--color-pink)', color: 'var(--color-muted)' }}
              >
                Include <strong style={{ color: 'var(--color-dark)' }}>
                  {fullName || 'your name'} — {selectedSvc?.name}
                </strong> in the memo.
                Appointment is pending until deposit is received. 24hr cancellation policy applies.
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={submitting}
              className="w-full py-4 rounded-full text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', boxShadow: '0 8px 24px rgba(224,48,112,0.3)' }}
            >
              {submitting ? 'Submitting…' : 'Confirm & Submit Booking'}
            </button>
            <p className="text-center text-xs -mt-2" style={{ color: 'var(--color-muted)' }}>
              By submitting you agree to the deposit and cancellation terms.
            </p>
          </form>
        </div>
      )}

      {/* ── RECURRING MODAL ──────────────────────────────────────────────── */}
      {recurringModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(24,8,16,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setRecModal(false) }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-7 shadow-2xl border"
            style={{ background: 'white', borderColor: 'rgba(224,48,112,0.08)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-medium">Recurring Appointment</h2>
              <button
                onClick={() => setRecModal(false)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70 transition-opacity"
                style={{ borderColor: 'rgba(224,48,112,0.2)' }}
              >
                ✕
              </button>
            </div>

            {/* Starting point */}
            {selectedDate && selectedTime && (
              <div
                className="mb-6 p-4 rounded-xl text-sm"
                style={{ background: 'var(--color-pink-blush)', border: '1px solid rgba(224,48,112,0.12)' }}
              >
                Starting <strong>{format(selectedDate, 'MMMM d, yyyy')}</strong> at{' '}
                <strong style={{ color: 'var(--color-pink)' }}>
                  {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                </strong>
              </div>
            )}

            {/* Selects */}
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-muted)' }}>
                  Repeat Frequency
                </label>
                <select
                  value={recurringFreq} onChange={e => setRecFreq(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)', background: 'var(--color-cream)' }}
                >
                  {RECURRING_FREQS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-muted)' }}>
                  Number of Sessions
                </label>
                <select
                  value={recurringCount} onChange={e => setRecCount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)', background: 'var(--color-cream)' }}
                >
                  {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <option key={n} value={n}>{n} sessions</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live summary */}
            {selectedDate && selectedTime && (
              <div
                className="mb-6 p-4 rounded-xl text-sm leading-relaxed"
                style={{ background: 'rgba(224,48,112,0.04)', borderLeft: '3px solid var(--color-pink)' }}
              >
                This will repeat <strong>{recurringFreq}</strong> on{' '}
                <strong>{format(selectedDate, 'EEEE')}s</strong> at{' '}
                <strong>{format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}</strong>,
                starting <strong>{format(selectedDate, 'MMMM d, yyyy')}</strong>,
                for <strong>{recurringCount} sessions</strong>.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={confirmRecurring}
                className="flex-1 py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}
              >
                Confirm Schedule
              </button>
              <button
                onClick={() => setRecModal(false)}
                className="flex-1 py-3.5 rounded-full text-sm font-medium border hover:opacity-70 transition-opacity"
                style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-dark)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline Calendar Component ──────────────────────────────────────────────
function InlineCalendar({ month, setMonth, selected, onSelect, blockedDates = [] }) {
  const today    = startOfDay(new Date())
  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = getDay(days[0])

  function isDisabled(day) {
    return (
      isBefore(startOfDay(day), today) ||
      !WORKING_DAYS.includes(getDay(day)) ||
      blockedDates.includes(format(day, 'yyyy-MM-dd'))
    )
  }

  return (
    <div>
      {/* Month Nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setMonth(m => addMonths(m, -1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70 transition-opacity"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}
        >
          ‹
        </button>
        <span className="font-display font-bold text-base">{format(month, 'MMMM yyyy')}</span>
        <button
          onClick={() => setMonth(m => addMonths(m, 1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70 transition-opacity"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold tracking-wider py-1"
            style={{ color: 'var(--color-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1.5">
        {[...Array(startPad)].map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const disabled   = isDisabled(day)
          const isSelected = selected && isSameDay(day, selected)
          const isToday    = isSameDay(day, today)
          const isBlocked  = blockedDates.includes(format(day, 'yyyy-MM-dd'))

          return (
            <button
              key={day.toISOString()}
              disabled={disabled}
              onClick={() => !disabled && onSelect(day)}
              className="mx-auto w-9 h-9 flex items-center justify-center text-sm font-bold font-display rounded-full transition-all"
              title={isBlocked ? 'Unavailable' : undefined}
              style={{
                background:     isSelected ? 'var(--color-pink)' : isToday ? 'var(--color-pink-blush)' : 'transparent',
                color:          isSelected ? 'white' : disabled ? 'rgba(139,84,104,0.2)' : 'var(--color-dark)',
                cursor:         disabled ? 'not-allowed' : 'pointer',
                textDecoration: isBlocked ? 'line-through' : 'none',
                boxShadow:      isSelected ? '0 4px 12px rgba(224,48,112,0.3)' : 'none',
                fontWeight:     isToday || isSelected ? '600' : '400',
              }}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'var(--color-muted)' }}>
        <span>Available: Tue–Sat</span>
        <span className="flex items-center gap-1">
          <span style={{ textDecoration: 'line-through' }}>15</span>
          <span>= Unavailable</span>
        </span>
      </div>
    </div>
  )
}

// ── Confirmation Screen ────────────────────────────────────────────────────
function Confirmation({ service, date, time, isRecurring, recurringCount, recurringFreq, navigate, profile }) {
  return (
    <div
      className="min-h-screen pt-24 pb-20 px-6 flex items-center justify-center"
      style={{ background: 'var(--color-cream)' }}
    >
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6"
          style={{ background: 'var(--color-pink-blush)' }}
        >
          🎉
        </div>

        <h1 className="font-display text-4xl font-medium mb-3">
          {isRecurring ? 'Schedule Booked!' : "You're Booked!"}
        </h1>
        <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: 'var(--color-muted)' }}>
          Your appointment{isRecurring ? ` series of ${recurringCount} sessions` : ''} has been submitted.
          We'll confirm once your deposit is received.
          {profile?.full_name && ` See you soon, ${profile.full_name.split(' ')[0]}!`}
        </p>

        <div
          className="rounded-2xl p-6 text-left border mb-8"
          style={{ background: 'white', borderColor: 'rgba(224,48,112,0.08)' }}
        >
          {[
            ['Service', service?.name],
            ['Date',    date && format(date, 'EEEE, MMMM d, yyyy')],
            ['Time',    time && format(new Date(`2000-01-01T${time}`), 'h:mm a')],
            ...(isRecurring ? [['Schedule', `${recurringFreq} × ${recurringCount} sessions`]] : []),
            ['Status',  'Pending deposit confirmation'],
          ].filter(([, v]) => v).map(([l, v]) => (
            <div
              key={l}
              className="flex justify-between py-2.5 text-sm border-b last:border-0"
              style={{ borderColor: 'rgba(224,48,112,0.06)' }}
            >
              <span style={{ color: 'var(--color-muted)' }}>{l}</span>
              <span
                className="font-medium text-right max-w-xs"
                style={{ color: l === 'Status' ? 'var(--color-gold)' : 'var(--color-dark)' }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}
          >
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-full text-sm font-medium border hover:opacity-70 transition-opacity"
            style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-dark)' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}