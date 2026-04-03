import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

// Shown while Supabase loads or if the table hasn't been seeded yet.
// Mirrors the seed data in supabase/schema.sql exactly.
const PLACEHOLDER_SERVICES = [
  { id: 'p1', name: 'Knotless Box Braids',     description: 'Lightweight, tension-free knotless braids that start with your natural hair. Beginner-friendly and long-lasting.',        duration: 180, price: 120, deposit: 40,  icon: '🌿' },
  { id: 'p2', name: 'Classic Box Braids',       description: 'Timeless and versatile box braids with extensions in your choice of length, size, and color.',                           duration: 180, price: 100, deposit: 35,  icon: '✦'  },
  { id: 'p3', name: 'Goddess Braids',           description: 'Bohemian braids with curly ends for a romantic, goddess-inspired look perfect for any occasion.',                        duration: 240, price: 140, deposit: 50,  icon: '🌸' },
  { id: 'p4', name: 'Feed-In Braids',           description: 'Natural-looking cornrows with gradually added extension hair for a seamless, scalp-friendly protective style.',          duration: 150, price: 80,  deposit: 30,  icon: '⬡'  },
  { id: 'p5', name: 'Stitch Braids',            description: 'Cornrows with a distinct stitched parting pattern. Clean graphic lines that make a bold statement.',                     duration: 150, price: 90,  deposit: 30,  icon: '🔶' },
  { id: 'p6', name: 'Passion Twists',           description: 'Lightweight bohemian twists with wavy hair for a textured, effortless look with incredible bounce.',                    duration: 240, price: 150, deposit: 50,  icon: '🌀' },
  { id: 'p7', name: 'Senegalese Twists',        description: 'Silky rope-like twists using Kanekalon hair. Smooth finish with maximum length and flexibility.',                        duration: 210, price: 130, deposit: 45,  icon: '🪢' },
  { id: 'p8', name: 'Cornrows (Straight Back)', description: 'Classic straight-back cornrows, clean and sleek. A simple, low-maintenance protective style staple.',                   duration: 90,  price: 60,  deposit: 20,  icon: '⬟' },
]

export default function Services() {
  const navigate = useNavigate()

  const { data: services, isLoading, isError } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('price')
      if (error) throw error
      return data
    },
  })

  // Use DB data if available, otherwise show placeholders so the page is never blank
  const displayServices = services?.length > 0 ? services : PLACEHOLDER_SERVICES
  const usingPlaceholders = !services?.length

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>
            Our Offerings
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-medium">Services & Pricing</h1>
          <p className="text-sm mt-4 max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
            All services include consultation, shampoo, and blowdry. Deposit required at booking.
          </p>
        </div>

        {/* Connection warning when falling back to placeholders */}
        {isError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 max-w-2xl mx-auto text-xs leading-relaxed">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <strong>Database temporarily unavailable</strong>
            </div>
            <p className="text-amber-800">
              Showing demo services. Your booking will work once{' '}
              <code className="px-1 py-0.5 bg-amber-100 rounded text-xs">VITE_SUPABASE_*</code>{' '}
              vars are added to <code>.env.local</code> + services table seeded.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-56 rounded-2xl animate-pulse"
                style={{ background: 'white' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayServices.map(svc => {
              const serviceId = usingPlaceholders ? 'demo' : svc.id
              const isDemo = usingPlaceholders || !svc.id
              
              return (
                <div
                  key={svc.id}
                  className="rounded-2xl p-6 border flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
                  style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}
                >
                  <div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                      style={{ background: isDemo ? 'var(--color-cream)' : 'var(--color-pink-blush)' }}
                    >
                      {svc.icon ?? '✦'}
                    </div>
                    <h3 className="font-display text-xl font-medium mb-2">{svc.name}</h3>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                      {svc.description}
                    </p>
                  </div>

                  <div
                    className="flex items-end justify-between pt-4 border-t"
                    style={{ borderColor: 'rgba(224,48,112,0.06)' }}
                  >
                    <div>
                      <p className="font-display text-xl font-semibold" style={{ color: 'var(--color-pink-deep)' }}>
                        from ${svc.price}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                        {Math.floor(svc.duration / 60)}h{svc.duration % 60 > 0 ? ` ${svc.duration % 60}m` : ''}
                        {svc.deposit ? ` · $${svc.deposit} deposit` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (!isDemo) navigate(`/book?service=${serviceId}`)
                      }}
                      disabled={isDemo}
                      className="px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:scale-105 active:scale-95"
                      style={{ 
                        background: isDemo 
                          ? 'var(--color-muted)' 
                          : 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' 
                      }}
                    >
                      {isDemo ? 'Coming Soon' : 'Book'}

                    </button>
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
