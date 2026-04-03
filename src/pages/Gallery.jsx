import { Link } from 'react-router-dom'

const GALLERY_ITEMS = [
  'Hero Shot - Medium Knotless', 'Closeup Detail', 'Goddess Braids Full', 'Side Profile', 
  'Butterfly Locs Back', 'Lemonade Cornrows', 'Passion Twists Motion', 'Fulani Front', 
  'Bantu Knots Color', 'Faux Locs Jumbo', 'Bohemian Full Head', 'Wedding Updo Braids',
  'Kids Cornrows', 'Tribal Designs', 'Triangle Parting', 'Curly Ends Detail', 
  'Install Progress', 'Fresh Wash Day'
]

export default function Gallery() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest uppercase font-medium mb-4" style={{ color: 'var(--color-pink)' }}>
            Our Work
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-medium mb-6">Gallery</h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-muted)' }}>
            Precision braiding and protective styles. Every installation tells a story.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-12">
          {GALLERY_ITEMS.map((label, i) => (
            <div key={i} 
              className="group relative rounded-2xl aspect-video overflow-hidden bg-gradient-to-br hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, rgba(224,48,112,0.08), rgba(201,149,106,0.06))'
              }}>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="font-medium text-xs tracking-wide drop-shadow-lg group-hover:text-lg transition-all duration-300">
                  {label}
                </p>
              </div>
              
              {/* Arrow */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 text-white">
                ➤
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            to="/services"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-medium text-white shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-pink-500 to-pink-600"
            style={{ 
              boxShadow: '0 20px 40px rgba(224,48,112,0.4)'
            }}>
            Ready to Book?
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

