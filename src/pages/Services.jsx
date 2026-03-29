import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .order('price', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setServices(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs tracking-widest uppercase font-medium mb-3" style={{ color: 'var(--color-pink)' }}>
            Full Menu
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-medium mb-4">Our Services</h1>
          <p className="text-base leading-relaxed max-w-lg" style={{ color: 'var(--color-muted)' }}>
            Every style is crafted to protect your natural hair while keeping you looking flawless.
            Prices vary by hair length and thickness — final quote given at consultation.
          </p>
        </div>

        {/* Policy banner */}
        <div className="mb-10 px-5 py-4 rounded-xl flex flex-wrap items-center gap-4 border"
          style={{ background: 'white', borderColor: 'rgba(224,48,112,0.08)' }}>
          {[
            ['🕐', 'Please arrive with clean, detangled hair'],
            ['💳', 'Deposit required to confirm booking'],
            ['⏰', '24 hr cancellation policy applies'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Services grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl p-6 border animate-pulse h-64"
                style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }} />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(svc => (
              <ServiceCard key={svc.id} svc={svc} />
            ))}
          </div>
        )}

        {services.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-3" style={{ color: 'var(--color-muted)' }}>Services coming soon</p>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Check back shortly or contact us directly.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceCard({ svc }) {
  const hours = Math.floor(svc.duration / 60)
  const mins  = svc.duration % 60
  const dur   = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`

  return (
    <div className="rounded-2xl p-6 border flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all"
      style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
      {/* Top accent */}
      <div className="h-1 rounded-full mb-5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(90deg, var(--color-pink), var(--color-gold))' }} />

      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
        style={{ background: 'var(--color-pink-blush)' }}>
        {svc.icon ?? '✦'}
      </div>

      <h2 className="font-display text-xl font-semibold mb-2">{svc.name}</h2>
      <p className="text-xs leading-relaxed flex-1 mb-5" style={{ color: 'var(--color-muted)' }}>
        {svc.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(224,48,112,0.06)', color: 'var(--color-muted)' }}>
          ⏱ {dur}
        </span>
        {svc.deposit && (
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(201,149,106,0.1)', color: 'var(--color-gold)' }}>
            Deposit: ${svc.deposit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(224,48,112,0.07)' }}>
        <div>
          <span className="font-display text-2xl font-semibold" style={{ color: 'var(--color-pink-deep)' }}>
            from ${svc.price}
          </span>
        </div>
        <Link to={`/book?service=${svc.id}`}
          className="px-5 py-2.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
          Book
        </Link>
      </div>
    </div>
  )
}