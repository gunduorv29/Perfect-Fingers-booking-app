import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Services() {
  const navigate = useNavigate()

  // Fetch the services from Supabase
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('price')
      if (error) throw error
      return data
    }
  })

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>
            Our Offerings
          </p>
          <h1 className="font-display text-4xl font-medium">Services & Pricing</h1>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'white' }} />
            ))}
          </div>
        ) : (
          
          /* Services Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(svc => (
              <div key={svc.id} className="rounded-2xl p-6 border flex flex-col justify-between hover:shadow-lg transition-shadow duration-300" 
                style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
                
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" 
                    style={{ background: 'var(--color-pink-blush)' }}>
                    {svc.icon ?? '✦'}
                  </div>
                  <h3 className="font-display text-xl font-medium mb-2">{svc.name}</h3>
                  <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    {svc.description}
                  </p>
                </div>
                
                <div className="flex items-end justify-between pt-4 border-t" style={{ borderColor: 'rgba(224,48,112,0.06)' }}>
                  <div>
                    <p className="font-display text-xl font-semibold" style={{ color: 'var(--color-pink-deep)' }}>
                      from ${svc.price}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      {Math.floor(svc.duration / 60)}h{svc.duration % 60 > 0 ? ` ${svc.duration % 60}m` : ''} 
                      {svc.deposit ? ` • $${svc.deposit} deposit` : ''}
                    </p>
                  </div>
                  
                  {/* Pushes user to the calendar and pre-selects this specific service */}
                  <button 
                    onClick={() => navigate(`/book?service=${svc.id}`)}
                    className="px-5 py-2.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}
                  >
                    Book
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}