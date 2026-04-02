import { useState } from 'react'

const TESTIMONIALS = [
  {
    quote: "The knotless box braids came out PERFECT. No tension, super lightweight, and they lasted 6 weeks with minimal upkeep. Tanisha took her time and made me feel so comfortable. Already booked my touch-up!",
    author: "Aaliyah J.",
    rating: 5,
    photo: "👩🏾‍🦱"
  },
  {
    quote: "Goddess braids for my sister's wedding — jaw-dropping results! Tanisha blended the curly ends so naturally, everyone thought they were my real hair. Best bridal service ever.",
    author: "Nia R.",
    rating: 5,
    photo: "👩🏽"
  },
  {
    quote: "Passion twists were everything I wanted and more. Bouncy, lightweight, and held up through 2 weeks of vacation. Great communication throughout the install process.",
    author: "Jada M.",
    rating: 5,
    photo: "👩🏿"
  },
  {
    quote: "First time getting fulani braids and Tanisha made it painless and beautiful. Perfect size and tension. My scalp feels great and they look salon-fresh even after washing.",
    author: "Zara K.",
    rating: 5,
    photo: "👩🏾"
  },
  {
    quote: "Butterfly locs came out magazine-worthy! The layering and styling was on point. Got so many compliments. Definitely my go-to spot for protective styles now.",
    author: "Maya P.",
    rating: 5,
    photo: "👩🏻‍🦱"
  }
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)

  return (
    <section className="py-24 px-6" style={{ background: 'white' }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-widest uppercase font-medium mb-4" style={{ color: 'var(--color-pink)' }}>
          Client Love
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-medium mb-16">What Our Clients Say</h2>
        
        <div className="relative">
          {/* Testimonial Card */}
          <div className="bg-gradient-to-br from-pink-blush to-white/70 backdrop-blur-xl rounded-3xl p-10 md:p-12 border shadow-2xl max-w-2xl mx-auto"
            style={{ 
              borderColor: 'rgba(224,48,112,0.12)',
              boxShadow: '0 25px 50px -12px rgba(224,48,112,0.15)'
            }}>
            <div className="flex gap-3 items-center justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="w-6 h-6 rounded-full" 
                  style={{ background: i < TESTIMONIALS[current].rating ? 'var(--color-gold)' : 'rgba(224,48,112,0.2)' }} />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl leading-relaxed italic font-medium mb-8" 
              style={{ color: 'var(--color-dark)' }}>
              "{TESTIMONIALS[current].quote}"
            </blockquote>
            <div className="flex items-center gap-4 justify-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-semibold bg-white shadow-md border-2"
                style={{ borderColor: 'rgba(224,48,112,0.1)', background: 'var(--color-cream)' }}>
                {TESTIMONIALS[current].photo}
              </div>
              <div>
                <p className="font-semibold text-lg" style={{ color: 'var(--color-dark)' }}>{TESTIMONIALS[current].author}</p>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex gap-2 justify-center mt-10">
            {TESTIMONIALS.map((_, i) => (
              <button key={i}
                onClick={() => setCurrent(i)}
                className={`w-3 h-3 rounded-full transition-all ${i === current ? 'w-8 scale-110' : ''}`}
                style={{ 
                  background: i === current ? 'var(--color-pink)' : 'rgba(224,48,112,0.3)'
                }} />
            ))}
          </div>

          {/* All testimonials link */}
          <p className="mt-12 text-sm font-medium hover:opacity-80 transition-opacity" 
            style={{ color: 'var(--color-pink)' }}>
            → See all reviews
          </p>
        </div>
      </div>
    </section>
  )
}

