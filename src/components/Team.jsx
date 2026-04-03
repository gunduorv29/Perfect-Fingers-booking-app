import { motion } from 'framer-motion' 

export default function Team() {
  const team = [
    {
      name: "Tanisha R.",
      role: "Lead Stylist & Owner",
      photo: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=800",
      specialties: "Knotless Box Braids, Goddess Braids, Fulani",
      years: 8,
      bio: "Master braider with 8+ years perfecting tension-free techniques. Passionate about natural hair empowerment and custom designs that celebrate your unique texture."
    },
    {
      name: "Jada M.",
      role: "Senior Stylist",
      photo: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&q=80&w=800",
      specialties: "Passion Twists, Butterfly Locs, Creative Color",
      years: 6,
      bio: "Twist & loc specialist known for flawless installs and creative colorwork. Creates movement and texture that turns heads. Client favorite for protective style switches."
    },
    {
      name: "Nia K.",
      role: "Stylist",
      photo: "https://images.unsplash.com/photo-1605497746444-129633c194ad?auto=format&fit=crop&q=80&w=800",
      specialties: "Cornrows, Faux Locs, Kids' Styles",
      years: 4,
      bio: "Precision cornrow artist with a gentle hand — perfect for first-timers and kids. Specializes in intricate designs and low-tension installs for all-day comfort."
    }
  ]

  return (
    <section className="py-32 px-6 overflow-hidden" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Editorial Header */}
        <div className="mb-32 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-sophisticated text-[var(--color-pink)] mb-6">Our Creative Collective</p>
            <h2 className="font-display text-6xl md:text-8xl leading-tight">
              The Hands Behind <br />
              <span className="italic text-[var(--color-gold)]">The Crown.</span>
            </h2>
          </div>
          <p className="text-sm max-w-xs leading-relaxed opacity-70">
            Licensed professionals dedicated to your comfort and stunning results. 
            A 5⭐ experience in every chair.
          </p>
        </div>

        {/* Blog-Style Alternating List */}
        <div className="space-y-40">
          {team.map((member, i) => (
            <div key={i} 
              className={`flex flex-col md:flex-row items-center gap-12 md:gap-24 ${
                i % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Image Container with Sophisticated Shadow */}
              <div className="w-full md:w-1/2 relative">
                <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-[var(--shadow-elegant)] border border-white/50">
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                {/* Floating "Years" Badge (Pricingplan inspo) */}
                <div className="absolute -bottom-8 -right-8 md:right-auto md:-left-8 bg-white p-6 rounded-3xl shadow-xl z-10 text-center min-w-[120px]">
                  <p className="text-4xl font-display font-bold text-[var(--color-pink)]">{member.years}+</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold">Years Experience</p>
                </div>
              </div>

              {/* Text Content */}
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <span className="text-sophisticated text-[var(--color-pink-deep)] bg-[var(--color-pink-pale)] px-4 py-1.5 rounded-full inline-block mb-4">
                    {member.role}
                  </span>
                  <h3 className="text-5xl font-display mb-2">{member.name}</h3>
                  <p className="text-[var(--color-gold)] font-medium text-sm italic">
                    Specializing in {member.specialties}
                  </p>
                </div>
                
                <p className="text-lg leading-relaxed text-[var(--color-muted)] font-light">
                  {member.bio}
                </p>

                <div className="pt-6">
                  <button className="text-sophisticated border-b-2 border-[var(--color-pink)] pb-1 hover:text-[var(--color-pink)] transition-colors">
                    View Portfolio →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}