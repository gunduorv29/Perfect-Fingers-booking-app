import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { format, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, startOfDay } from 'date-fns'
import toast from 'react-hot-toast'

const WORKING_DAYS = [2, 3, 4, 5, 6]

export default function AvailabilityManager() {
  const [blocked, setBlocked]     = useState([])  // array of { id, date, reason }
  const [calMonth, setCalMonth]   = useState(new Date())
  const [loading, setLoading]     = useState(true)
  const [reason, setReason]       = useState('')
  const [selected, setSelected]   = useState(null) // date string selected to block

  // Used for manual refreshes after block/unblock actions
  async function loadBlocked() {
    setLoading(true)
    const from = format(startOfMonth(calMonth), 'yyyy-MM-dd')
    const to   = format(endOfMonth(calMonth),   'yyyy-MM-dd')
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date')
    if (data) setBlocked(data)
    setLoading(false)
  }

  // ✅ Fix: async function defined inline inside the effect so setState is called
  // after an await — satisfies react-hooks/immutability and exhaustive-deps.
  // calMonth is captured directly, so it's a proper dependency.
  useEffect(() => {
    let cancelled = false
    async function fetchBlocked() {
      setLoading(true)
      const from = format(startOfMonth(calMonth), 'yyyy-MM-dd')
      const to   = format(endOfMonth(calMonth),   'yyyy-MM-dd')
      const { data } = await supabase
        .from('blocked_dates')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date')
      if (cancelled) return
      if (data) setBlocked(data)
      setLoading(false)
    }
    fetchBlocked()
    return () => { cancelled = true }
  }, [calMonth])

  async function blockDate() {
    if (!selected) return
    const exists = blocked.find(b => b.date === selected)
    if (exists) { toast.error('This date is already blocked.'); return }
    const { error } = await supabase.from('blocked_dates').insert({ date: selected, reason: reason || 'Unavailable', all_day: true })
    if (error) return toast.error('Could not block date.')
    toast.success(`${format(parseISO(selected), 'MMM d')} blocked.`)
    setSelected(null); setReason('')
    loadBlocked()
  }

  async function unblockDate(id, dateStr) {
    const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
    if (error) return toast.error('Could not unblock date.')
    toast.success(`${format(parseISO(dateStr), 'MMM d')} unblocked.`)
    loadBlocked()
  }

  const blockedDateStrings = blocked.map(b => b.date)
  const days     = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) })
  const startPad = getDay(days[0])
  const today    = startOfDay(new Date())

  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-medium">Availability</h3>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Click a date to block it</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCalMonth(m => addMonths(m, -1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}>‹</button>
        <span className="font-display text-base font-medium">{format(calMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCalMonth(m => addMonths(m, 1))}
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:opacity-70"
          style={{ borderColor: 'rgba(224,48,112,0.2)' }}>›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-xs py-1" style={{ color: 'var(--color-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 mb-5">
        {[...Array(startPad)].map((_,i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr   = format(day, 'yyyy-MM-dd')
          const isBlocked = blockedDateStrings.includes(dateStr)
          const isWorkday = WORKING_DAYS.includes(getDay(day))
          const isPast    = day < today
          const isSel     = selected === dateStr
          const isToday   = isSameDay(day, today)

          return (
            <button
              key={dateStr}
              disabled={isPast || !isWorkday}
              onClick={() => {
                if (isBlocked) {
                  const b = blocked.find(b => b.date === dateStr)
                  if (b) unblockDate(b.id, b.date)
                } else {
                  setSelected(isSel ? null : dateStr)
                }
              }}
              className="aspect-square rounded-lg text-xs flex items-center justify-center transition-all"
              style={{
                background: isBlocked ? 'rgba(224,48,112,0.12)'
                  : isSel ? 'rgba(224,48,112,0.08)'
                  : isToday ? 'var(--color-pink-blush)'
                  : 'transparent',
                color: isPast || !isWorkday ? 'rgba(139,84,104,0.25)'
                  : isBlocked ? 'var(--color-pink)'
                  : isSel ? 'var(--color-pink)'
                  : 'var(--color-dark)',
                cursor: isPast || !isWorkday ? 'not-allowed' : 'pointer',
                border: isBlocked ? '1px solid rgba(224,48,112,0.25)' : isSel ? '1px solid rgba(224,48,112,0.4)' : '1px solid transparent',
                textDecoration: isBlocked ? 'line-through' : 'none',
                fontWeight: isToday ? '500' : '400',
              }}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Block form */}
      {selected && (
        <div className="p-4 rounded-xl border mb-4" style={{ background: 'var(--color-cream)', borderColor: 'rgba(224,48,112,0.1)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-dark)' }}>
            Block <strong>{format(parseISO(selected), 'MMMM d, yyyy')}</strong>
          </p>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason (e.g. Holiday, Vacation)"
            className="w-full px-3 py-2 rounded-lg border text-xs outline-none mb-3"
            style={{ borderColor: 'rgba(224,48,112,0.2)', fontFamily: 'var(--font-body)' }}
          />
          <div className="flex gap-2">
            <button onClick={blockDate}
              className="flex-1 py-2 rounded-full text-xs font-medium text-white"
              style={{ background: 'var(--color-pink)' }}>
              Block Date
            </button>
            <button onClick={() => { setSelected(null); setReason('') }}
              className="flex-1 py-2 rounded-full text-xs font-medium border"
              style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Blocked list */}
      {blocked.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>Blocked this month</p>
          <div className="flex flex-col gap-1.5">
            {blocked.map(b => (
              <div key={b.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg text-xs"
                style={{ background: 'rgba(224,48,112,0.04)' }}>
                <div>
                  <span className="font-medium" style={{ color: 'var(--color-dark)' }}>
                    {format(parseISO(b.date), 'EEE, MMM d')}
                  </span>
                  {b.reason && <span className="ml-2" style={{ color: 'var(--color-muted)' }}>— {b.reason}</span>}
                </div>
                <button onClick={() => unblockDate(b.id, b.date)}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-pink)' }}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="w-5 h-5 rounded-full border-2 animate-spin mx-auto"
            style={{ borderColor: 'var(--color-pink-pale)', borderTopColor: 'var(--color-pink)' }} />
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'var(--color-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: 'rgba(224,48,112,0.12)', display: 'inline-block' }} />
          Blocked
        </span>
        <span>Click blocked date to unblock</span>
      </div>
    </div>
  )
}