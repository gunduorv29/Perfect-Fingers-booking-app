import { useState } from 'react'

export default function FAQ() {
  const [open, setOpen] = useState(null)

  const questions = [
    {
      q: "What should I do to prepare for my appointment?",
      a: "Please come with clean, detangled, moisturized hair. Avoid oils/products the day before. For braids/twists, section your hair loosely if possible. We'll handle the rest!"
    },
    {
      q: "What is the cancellation policy?",
      a: "24 hours notice required. Within 24hrs, deposit is non-refundable. Life happens — just let us know ASAP and we'll work with you when possible. No-shows forfeit full deposit."
    },
    {
      q: "Do you provide hair/extensions?",
      a: "Yes! We carry high-quality X-Pression, Yanibo, and other trusted brands. Discuss length/type/colors during booking. Add-on pricing applies."
    },
    {
      q: "How long do styles last?",
      a: "Knotless: 6-8 weeks. Twists/Locs: 8+ weeks w/ proper care. Touch-ups recommended every 4-6 weeks. We provide detailed aftercare instructions."
    },
    {
      q: "What payment methods do you accept?",
      a: "Zelle or Cash App deposit at booking (50%). Balance due at appointment (cash/card/Zelle). No personal checks."
    },
    {
      q: "Are you certified/licensed?",
      a: "Absolutely! All stylists are state-licensed cosmetologists with 5+ years protective styling experience. Your safety and satisfaction guaranteed."
    },
    {
      q: "Can I bring a friend?",
      a: "Space permitting, yes! Friends are welcome to chill during install. Please confirm availability when booking."
    },
    {
      q: "Do you travel for events?",
      a: "Yes for groups 3+ or bridal parties! Travel fee applies based on distance. Perfect for weddings, photoshoots, proms."
    }
  ]

  return (
    <section className="py-24 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest uppercase font-medium mb-4" style={{ color: 'var(--color-pink)' }}>
            Frequently Asked
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6">Questions</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-muted)' }}>
            Got questions? We've got answers. Common concerns from new clients.
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((faq, i) => (
            <div key={i} className="group bg-white rounded-2xl p-6 border hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              style={{ borderColor: 'rgba(224,48,112,0.08)' }}
              onClick={() => setOpen(open === i ? null : i)}>
              
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg md:text-xl leading-tight group-hover:text-pink-deep transition-colors">
                  {faq.q}
                </h3>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold transition-all ml-3 ${open === i ? 'rotate-180 bg-pink text-white' : 'bg-pink-blush text-pink'}`}>
                  ▼
                </div>
              </div>
              
              {open === i && (
                <div className="mt-6 pt-5 border-t pl-2" style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}