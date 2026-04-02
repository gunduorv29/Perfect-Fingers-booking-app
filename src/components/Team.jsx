export default function Team() {
  const team = [
    {
      name: "Tanisha R.",
      role: "Lead Stylist & Owner",
      photo: "👩🏾‍🦱",
      specialties: "Knotless Box Braids, Goddess Braids, Fulani, Wedding Styles",
      years: 8,
      bio: "Master braider with 8+ years perfecting tension-free techniques. Passionate about natural hair empowerment and custom designs that celebrate your unique texture. Featured in local beauty blogs."
    },
    {
      name: "Jada M.",
      role: "Senior Stylist",
      photo: "👩🏽‍🦱",
      specialties: "Passion Twists, Butterfly Locs, Lemonade Braids, Color",
      years: 6,
      bio: "Twist & loc specialist known for flawless installs and creative colorwork. Creates movement and texture that turns heads. Client favorite for protective style switches."
    },
    {
      name: "Nia K.",
      role: "Stylist",
      photo: "👩🏿‍🦳",
      specialties: "Cornrows, Faux Locs, Bantu Knots, Kids' Styles",
      years: 4,
      bio: "Precision cornrow artist with a gentle hand — perfect for first-timers and kids. Specializes in intricate designs and low-tension installs for all-day comfort."
    },
    {
      name: "Zara P.",
      role: "Stylist Apprentice",
      photo: "👩🏻",
      specialties: "Box Braids, Twists, Wash/Detangle, Asst.",
      years: 2,
      bio: "Rising star learning directly from Tanisha. Excellent with prep work and classic styles. Bringing fresh energy and meticulous attention to detail."
    }
  ]

  return (
    <section className="py-24 px-6" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs tracking-widest uppercase font-medium mb-6" style={{ color: 'var(--color-pink)' }}>
            Meet the Team
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6">Your Stylists</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-muted)' }}>
            Licensed professionals dedicated to your comfort and stunning results. Clean workspace, quality products, 5⭐ experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <div key={i} className="group text-center hover:-translate-y-3 transition-all duration-500 rounded-3xl p-8 border bg-gradient-to-b from-white to-pink-blush shadow-xl hover:shadow-2xl"
              style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
              
              {/* Photo */}
              <div className="w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300 bg-white border-4"
                style={{ 
                  borderColor: 'rgba(224,48,112,0.2)',
                  background: 'linear-gradient(135deg, var(--color-pink-blush), white)'
                }}>
                {member.photo}
              </div>

              {/* Name & Role */}
              <h3 className="font-display text-2xl font-semibold mb-2 group-hover:text-pink-deep transition-colors" style={{ color: 'var(--color-dark)' }}>
                {member.name}
              </h3>
              <p className="text-sm font-medium mb-4 px-4 py-1.5 rounded-full inline-block bg-white shadow-sm" 
                style={{ color: 'var(--color-pink-deep)' }}>
                {member.role}
              </p>

              {/* Specialties */}
              <p className="text-xs uppercase tracking-wider mb-3 text-muted opacity-75">{member.specialties}</p>
              
              <div className="flex items-center justify-center gap-4 mb-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-2xl">{member.years}+ Years</span>
              </div>

              {/* Bio */}
              <p className="text-sm leading-relaxed px-2" style={{ color: 'var(--color-muted)' }}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

