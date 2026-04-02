import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { format, parseISO, isPast, isToday } from 'date-fns'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const STATUS_COLORS = {
  pending:   { bg: 'rgba(201,149,106,0.1)', text: '#A07040', label: 'Pending Deposit', border: 'rgba(201,149,106,0.2)' },
  confirmed: { bg: 'rgba(16,185,129,0.1)',  text: '#059669', label: 'Confirmed', border: 'rgba(16,185,129,0.2)' },
  cancelled: { bg: 'rgba(224,48,112,0.1)',  text: 'var(--color-pink)', label: 'Cancelled', border: 'rgba(224,48,112,0.2)' },
  completed: { bg: 'rgba(139,84,104,0.1)',  text: 'var(--color-muted)', label: 'Completed', border: 'rgba(139,84,104,0.2)' },
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('upcoming')

  const isGuest = !user

  if (isGuest) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
        <div className="max-w-4xl mx-auto text-center py-24">
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-8" style={{ background: 'var(--color-pink-blush)' }}>📅</div>
          <h1 className="font-display text-4xl md:text-5xl font-medium mb-6">Your Dashboard</h1>
          <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'var(--color-muted)' }}>
            Log in to view your appointments, manage bookings, and see your style history.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Link to="/login" className="flex-1 py-4 px-8 rounded-full text-lg font-medium text-white text-center shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
              Log In
            </Link>
            <Link to="/book" className="flex-1 py-4 px-8 rounded-full text-lg font-medium border text-center shadow-lg hover:shadow-xl transition-all"
              style={{ borderColor: 'rgba(224,48,112,0.3)', background: 'white' }}>
              Book Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch user bookings with React Query
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name, icon, duration, price)')
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Cancel Appointment Mutation (Optimistic UI update)
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      toast.success('Appointment cancelled.')
      queryClient.invalidateQueries({ queryKey: ['my-appointments', user?.id] })
    },
    onError: () => toast.error('Could not cancel appointment.')
  })

  const upcoming = appointments.filter(a => !isPast(parseISO(a.appointment_date)) || isToday(parseISO(a.appointment_date))).filter(a => a.status !== 'cancelled' && a.status !== 'completed')
  const past = appointments.filter(a => isPast(parseISO(a.appointment_date)) || a.status === 'completed' || a.status === 'cancelled')

  const displayList = tab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen pt-28 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>Client Portal</p>
            <h1 className="font-display text-4xl md:text-5xl font-medium mb-3">
              Hello, <span style={{ color: 'var(--color-pink-deep)' }}>{profile?.full_name?.split(' ')[0] || 'Beautiful'}</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Manage your appointments and style history.</p>
          </div>
          <Link to="/book" className="px-8 py-3.5 rounded-full text-sm font-medium text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-center flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
            <span>+</span> Book New Appointment
          </Link>
        </div>

        {/* Premium Pill Tabs */}
        <div className="flex gap-2 mb-8 p-1.5 w-fit rounded-2xl border bg-white/60 backdrop-blur-md shadow-sm" style={{ borderColor: 'rgba(224,48,112,0.08)' }}>
          {[['upcoming', `Upcoming (${upcoming.length})`], ['past', 'History']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${tab === key ? 'shadow-sm' : 'hover:opacity-70'}`}
              style={{ 
                background: tab === key ? 'white' : 'transparent',
                color: tab === key ? 'var(--color-pink-deep)' : 'var(--color-muted)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-3xl animate-pulse bg-white border shadow-sm" style={{ borderColor: 'rgba(224,48,112,0.05)' }} />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border bg-white/50 backdrop-blur-sm shadow-sm transition-all" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-5 shadow-inner" style={{ background: 'var(--color-pink-blush)' }}>✨</div>
            <h3 className="font-display text-2xl font-medium mb-2">No {tab} appointments</h3>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--color-muted)' }}>
              {tab === 'upcoming' ? "Your schedule is wide open. Ready for a fresh new look?" : "You haven't had any past appointments with us yet."}
            </p>
            {tab === 'upcoming' && (
              <Link to="/services" className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--color-pink)' }}>
                Browse Services <span>→</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5">
            {displayList.map(appt => {
              const st = STATUS_COLORS[appt.status] || STATUS_COLORS.pending
              const dateObj = parseISO(appt.appointment_date)
              const isApptToday = isToday(dateObj)
              
              return (
                <div key={appt.id} className="group rounded-3xl p-5 md:p-6 border bg-white shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 hover:-translate-y-0.5" 
                  style={{ borderColor: isApptToday && appt.status !== 'cancelled' ? 'rgba(224,48,112,0.3)' : 'rgba(224,48,112,0.08)' }}>
                  
                  {isApptToday && appt.status !== 'cancelled' && (
                    <div className="absolute top-0 right-0 px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white rounded-bl-2xl shadow-sm" style={{ background: 'var(--color-pink)' }}>
                      Today
                    </div>
                  )}

                  <div className="flex gap-5 items-start">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105" 
                      style={{ background: 'linear-gradient(135deg, var(--color-pink-blush), #fff)' }}>
                      {appt.services?.icon ?? '✦'}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-medium text-gray-900">{appt.services?.name}</h3>
                      <p className="text-sm mt-1 mb-3" style={{ color: 'var(--color-muted)' }}>
                        {format(dateObj, 'EEEE, MMMM d, yyyy')} • {format(new Date(`2000-01-01T${appt.appointment_time}`), 'h:mm a')}
                      </p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border" 
                        style={{ background: st.bg, color: st.text, borderColor: st.border }}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 md:gap-3 border-t md:border-t-0 pt-5 md:pt-0" style={{ borderColor: 'rgba(224,48,112,0.06)' }}>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Total</p>
                      <p className="font-display font-semibold text-2xl" style={{ color: 'var(--color-dark)' }}>
                        ${appt.services?.price}
                      </p>
                    </div>
                    {appt.status === 'pending' && (
                      <button 
                        onClick={() => { if(window.confirm('Are you sure you want to cancel this booking?')) cancelMutation.mutate(appt.id) }}
                        disabled={cancelMutation.isPending}
                        className="text-xs font-medium px-5 py-2.5 rounded-full border bg-white shadow-sm hover:shadow transition-all duration-200"
                        style={{ borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-pink)' }}>
                        Cancel Booking
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
  )
}