import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Mocking the supabase client for the isolated preview environment
const supabase = {
  from: () => ({
    select: () => ({
      order: () => ({
        order: async () => ({ data: [], error: null })
      })
    })
  })
}

const CATEGORIES = ['All', 'Feedins', 'Heart Parts', 'Knotless']

export default function Services() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')

  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Real data extracted from your Acuity Scheduling page
  const REAL_SERVICES_FALLBACK = [
    // FEEDINS
    { id: 'feed-1', name: '4 Freestyled Feedins', description: '4 Feedins completely freestyled. I.e. any design.', price: 100, duration: 60, category: 'feedins', deposit: 50, icon: '✨' },
    { id: 'feed-2', name: '6-8 Freestyled Feedins', description: 'Feedins completely freestyled. I.e. any design.', price: 150, duration: 60, category: 'feedins', deposit: 75, icon: '✨' },
    { id: 'feed-3', name: '10-12 Freestyle Feedins', description: 'Feedins completely freestyled. I.e. any design.', price: 200, duration: 90, category: 'feedins', deposit: 100, icon: '✨' },
    { id: 'feed-4', name: '14-18 Freestyle Feedins', description: 'Feedins completely freestyled. I.e. any design.', price: 225, duration: 120, category: 'feedins', deposit: 112, icon: '✨' },
    
    // HEART PARTS
    { id: 'heart-1', name: 'Heart Shaped Braids', description: 'Heart shaped parts in 3 rows. 4th row additional $50.', price: 200, duration: 120, category: 'heart parts', deposit: 100, icon: '💖' },
    
    // KNOTLESS
    { id: 'knot-1', name: 'Large Knotless', description: 'All braids are Butt length, unless longer length is added on below.', price: 185, duration: 120, category: 'knotless', deposit: 92, icon: '🌟' },
    { id: 'knot-2', name: 'Medium Knotless', description: 'Standard medium knotless box braids. Clean and lightweight.', price: 250, duration: 180, category: 'knotless', deposit: 125, icon: '🌟' },
    { id: 'knot-3', name: 'Small Knotless', description: 'Small precision parts. Perfect for a fuller, longer-lasting look.', price: 325, duration: 300, category: 'knotless', deposit: 162, icon: '🌟' }
  ]

  // Fetch real services from Supabase (if you add more via Admin panel)
  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('category')
          .order('price');

        if (error) throw error;

        if (isMounted && data) {
          setServices(data);
        }
      } catch (error) {
        console.error("Error loading services:", error.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchServices();

    return () => {
      isMounted = false;
    };
  }, [])

  // Filter based on active tab
  const filteredServices = activeTab === 'All' 
    ? services 
    : services.filter(svc => svc.category?.toLowerCase() === activeTab.toLowerCase())

  // If your database is empty, we fall back to the beautifully formatted Acuity data!
  const displayServices = filteredServices.length > 0 
    ? filteredServices 
    : REAL_SERVICES_FALLBACK.filter(s => activeTab === 'All' || s.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="text-xs tracking-widest uppercase font-medium mb-4" style={{ color: 'var(--color-pink)' }}>
            Complete Price Menu
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-medium mb-6">Services Menu</h1>
          <p className="text-lg max-w-2xl mx-auto mb-12" style={{ color: 'var(--color-muted)' }}>
            Transparent pricing. All services include consultation, shampoo, and styling. Deposit 50% due at booking.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-16 max-w-2xl mx-auto">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-medium border transition-all ${activeTab === cat ? 'bg-linear-to-r from-pink to-pink-deep text-white shadow-lg' : 'bg-white hover:shadow-md'}`}
              style={{ 
                borderColor: activeTab === cat ? 'transparent' : 'rgba(224,48,112,0.2)'
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl animate-pulse shadow-lg" style={{ background: 'linear-gradient(135deg, white 0%, var(--color-cream) 100%)' }} />
            ))}
          </div>
        ) : (
          <>
            {displayServices.length === 0 ? (
              /* Empty State */
              <div className="text-center py-20 bg-white rounded-3xl border shadow-sm" style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-display text-2xl font-medium mb-2">No services found</h3>
                <p className="text-gray-500">
                  {activeTab === 'All' 
                    ? "Services are currently being updated. Check back soon!" 
                    : `No services available in the ${activeTab} category right now.`}
                </p>
              </div>
            ) : (
              /* Services Grid */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {displayServices.map(svc => (
                  <div key={svc.id} className="group rounded-3xl p-8 border hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 flex flex-col bg-linear-to-b from-white via-pink-blush/30 to-white shadow-xl"
                    style={{ borderColor: 'rgba(224,48,112,0.08)' }}>
                    
                    {/* B&A Placeholder */}
                    <div className="relative mb-6 rounded-2xl overflow-hidden aspect-4/3 bg-linear-to-br group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 bg-linear-to-r from-gray-900/10 via-transparent to-pink-500/5" />
                      <div className="absolute -top-2 -right-2 w-16 h-16 rounded-2xl bg-linear-to-br from-pink/20 to-gold/20 flex items-center justify-center text-2xl opacity-80">
                        ✨
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-xl p-2 text-center text-xs font-semibold text-pink-deep">
                        Before & After
                      </div>
                    </div>

                    {/* Service Info */}
                    <div className="flex-1">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform"
                        style={{ background: 'linear-gradient(135deg, var(--color-pink-blush), rgba(224,48,112,0.1))' }}>
                        {svc.icon || '✦'}
                      </div>
                      <h3 className="font-display text-2xl font-semibold mb-3 leading-tight group-hover:text-pink-deep transition-colors">{svc.name}</h3>
                      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-muted)' }}>
                        {svc.description}
                      </p>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-6 border-t mt-auto" style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
                      <div className="flex items-baseline justify-between mb-4">
                        <div>
                          <span className="font-display text-3xl font-semibold block" style={{ color: 'var(--color-pink-deep)' }}>
                            ${svc.price}
                          </span>
                          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                            {Math.floor(svc.duration/60)}h {svc.duration % 60 > 0 ? `${svc.duration % 60}m` : ''}
                          </span>
                        </div>
                        {svc.deposit > 0 && (
                          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-gold-light text-gold border" 
                            style={{ borderColor: 'rgba(201,149,106,0.3)' }}>
                            ${svc.deposit} deposit
                          </span>
                        )}
                      </div>
                      <button onClick={() => navigate(`/book?service=${svc.id}`)}
                        className="w-full py-4 rounded-2xl text-lg font-semibold text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-center"
                        style={{ 
                          background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))',
                          boxShadow: '0 12px 32px rgba(224,48,112,0.4)'
                        }}>
                        Book Now
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* Category Info */}
            <div className="text-center max-w-3xl mx-auto py-12">
              <p className="text-lg font-medium mb-4" style={{ color: 'var(--color-dark)' }}>
                {activeTab}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {activeTab === 'All' ? 
                  'Full service menu above. Click categories to filter. All prices include consultation, shampoo, and blowdry.' :
                  `Specializing in ${activeTab.toLowerCase()}. Premium techniques, quality hair, detailed installs. See portfolio for results.`
                }
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}