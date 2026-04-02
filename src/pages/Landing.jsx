import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Testimonials from '../components/Testimonials'
import FAQ from '../components/FAQ'
import Team from '../components/Team'

const STEPS = [
  { n: '01', title: 'Choose Your Style', desc: 'Browse our full menu of protective styles, see pricing and estimated duration, and pick the one that fits you.' },
  { n: '02', title: 'Pick a Date & Time', desc: 'Select from available slots on the calendar. Create your free account and lock in your appointment in seconds.' },
  { n: '03', title: 'Pay & Show Up', desc: 'Send your deposit via Zelle or Cash App to confirm. Come with clean, detangled hair — and leave looking stunning.' },
]

export default function Landing() {
  const [services, setServices] = useState([])

  useEffect(() => {
    supabase.from('services').select('*').limit(3).then(({ data }) => {
      if (data) setServices(data)
    })
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream)' }}>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--color-pink)' }} />
          <div className="absolute bottom-0 -left-20 w-[350px] h-[350px] rounded-full opacity-10 blur-3xl"
            style={{ background: 'var(--color-gold)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center py-16">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-6 border"
              style={{ background: 'rgba(224,48,112,0.06)', borderColor: 'rgba(224,48,112,0.2)', color: 'var(--color-pink-deep)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-pink)' }} />
              Now Accepting Bookings
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-tight mb-6">
              Where Every<br />
              <em className="not-italic" style={{ color: 'var(--color-pink)' }}>Braid</em> Tells<br />
              Your Story.
            </h1>

            <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: 'var(--color-muted)' }}>
              Precision braiding and protective styles crafted for women who celebrate their crown.
              Book your next appointment in minutes — no phone calls needed.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/services"
                className="px-7 py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', boxShadow: '0 8px 28px rgba(224,48,112,0.3)' }}>
                Book an Appointment
              </Link>
              <a href="#gallery"
                className="px-7 py-3.5 rounded-full text-sm font-medium border hover:border-pink transition-colors"
                style={{ borderColor: 'rgba(24,8,16,0.18)', color: 'var(--color-dark)' }}>
                View Gallery
              </a>
            </div>
          </div>

          {/* Right – logo placeholder + stats */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 gap-3"
              style={{ background: 'rgba(224,48,112,0.03)', borderColor: 'rgba(224,48,112,0.2)' }}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-display text-3xl font-semibold border-2"
                style={{ background: 'var(--color-pink-blush)', borderColor: 'var(--color-gold)', color: 'var(--color-pink-deep)' }}>
                PFB
              </div>
              <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-muted)' }}>Logo Placeholder</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['500+', 'Happy Clients'], ['8+', 'Braid Styles'], ['5★', 'Avg. Rating']].map(([n, l]) => (
                <div key={l} className="rounded-xl p-4 text-center border"
                  style={{ background: 'white', borderColor: 'rgba(224,48,112,0.07)' }}>
                  <p className="font-display text-2xl font-semibold" style={{ color: 'var(--color-pink)' }}>{n}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>

      {/* ── WHY US ── */}
      <section className="py-24 px-6" style={{ background: 'var(--color-cream)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-widest uppercase font-medium mb-4" style={{ color: 'var(--color-pink)' }}>
              Why Perfect Fingers
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-8">What Sets Us Apart</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-muted)' }}>
              Precision craftsmanship, comfort-first technique, styles that move with you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '✨', title: 'Tension-Free', desc: 'Proprietary knotless technique eliminates scalp stress while maximizing longevity. Comfort meets durability.' },
              { icon: '⚡', title: 'Fast Booking', desc: 'Real-time calendar. No phone tag. Deposit locks your slot instantly. In <48hrs from inquiry to install.' },
              { icon: '👑', title: 'Custom Design', desc: 'Your texture, face shape, lifestyle. Every braid customized — no cookie-cutter installs here.' },
              { icon: '🎨', title: 'Premium Hair', desc: 'X-Pression, Yanibo, water wave only. Tested for tangle-free removal and maximum shine.' },
              { icon: '🧼', title: 'Sanitary Standards', desc: 'Fresh braiding hair per client. Sanitized tools. Clean station. Licensed pros only.' },
              { icon: '⏱️', title: 'Predictable Timing', desc: 'Exact duration quotes. No endless waits. Finish on-time guarantee or discount applied.' }
            ].map((feature, i) => (
              <div key={i} className="group text-center hover:-translate-y-2 transition-all duration-300 rounded-3xl p-8 border bg-white shadow-lg hover:shadow-2xl"
                style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform" 
                  style={{ background: 'var(--color-pink-blush)' }}>
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-semibold mb-4 group-hover:text-pink transition-colors">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES PREVIEW ── */}
      <section className="py-24 px-6" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>What We Offer</p>
              <h2 className="font-display text-4xl md:text-5xl font-medium">Popular Styles</h2>
            </div>
            <Link to="/services" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--color-pink)' }}>
              View all services →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {services.length > 0
              ? services.map(svc => <ServiceCard key={svc.id} svc={svc} />)
              : PLACEHOLDER_SERVICES.map(svc => <ServiceCard key={svc.id} svc={svc} />)
            }
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(140deg, var(--color-dark) 0%, var(--color-dark-mid) 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-widest uppercase font-medium mb-3" style={{ color: 'var(--color-gold-light)' }}>The Process</p>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-4 text-white">Three Steps to Your Perfect Look</h2>
          <p className="text-sm leading-relaxed mb-16 max-w-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Booking is entirely online — no phone calls, no waiting. Just you, your style, and a slot on the calendar.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                {i < 2 && <div className="hidden md:block absolute top-6 left-full w-8 h-px" style={{ background: 'rgba(224,48,112,0.4)' }} />}
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-semibold text-white mb-5 border"
                  style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', borderColor: 'rgba(224,48,112,0.3)' }}>
                  {s.n}
                </div>
                <h3 className="font-display text-xl font-medium text-white mb-3">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" className="py-24 px-6" style={{ background: 'var(--color-cream)' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>Our Work</p>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-12">The Portfolio</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {[
              'Hero Shot - Medium Knotless', 'Closeup Detail', 'Goddess Braids Full', 'Side Profile', 'Butterfly Locs Back', 'Lemonade Cornrows', 
              'Passion Twists Motion', 'Fulani Front', 'Bantu Knots Color', 'Faux Locs Jumbo', 'Bohemian Full Head', 'Wedding Updo Braids',
              'Kids Cornrows', 'Tribal Designs', 'Triangle Parting', 'Curly Ends Detail', 'Install Progress', 'Fresh Wash Day'
            ].map((label, i) => (
              <Link key={i} to="/gallery" className="group rounded-2xl aspect-video border-2 border-dashed hover:border-solid hover:shadow-xl transition-all overflow-hidden bg-gradient-to-br hover:-translate-y-1 hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, rgba(224,48,112,0.06), rgba(201,149,106,0.06)), url('data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><defs><pattern id=\\"grain\\" width=\\"100\\" height=\\"100\\" patternUnits=\\"userSpaceOnUse\\"><circle cx=\\"25\\" cy=\\"25\\" r=\\"1\\" fill=\\"%23E03070\\" opacity=\\"0.05\\"/><circle cx=\\"75\\" cy=\\"75\\" r=\\"0.8\\" fill=\\"%23C9956A\\" opacity=\\"0.03\\"/></pattern></defs><rect width=\\"100\\" height=\\"100\\" fill=\\"url(%23grain)\\"/></svg>')`,
                  borderColor: 'rgba(224,48,112,0.2)'
                }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:opacity-0 transition-opacity" />
                <div className="h-full w-full rounded-xl bg-gradient-to-br from-gray-900/20 via-pink-500/5 to-gold/10 flex items-end p-4">
                  <p className="font-medium text-xs tracking-wide text-white/90 drop-shadow-lg group-hover:text-lg transition-all">
                    {label}
                  </p>
                </div>
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  ➤
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/gallery" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-medium text-white shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all bg-gradient-to-r from-pink to-pink-deep"
              style={{ boxShadow: '0 20px 40px rgba(224,48,112,0.4)' }}>
              View Full Gallery
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEW SECTIONS ── */}
      <Team />
      <Testimonials />
      <FAQ />

      {/* ── PAYMENT ── */}
      <section className="py-24 px-6" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto">  
          <p className="text-xs tracking-widest uppercase font-medium mb-2" style={{ color: 'var(--color-pink)' }}>Payment Info</p>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-4">Simple & Secure Payment</h2>
          <p className="text-sm leading-relaxed mb-10 max-w-md" style={{ color: 'var(--color-muted)' }}>
            We accept Zelle and Cash App. A deposit is required at booking to hold your slot.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <PayCard
              brand="Zelle" brandColor="#6D1ED4"
              info="perfectfingers@email.com"
              note="Send deposit via Zelle to confirm your appointment."
              btnLabel="Copy Email"
              onAction={() => { navigator.clipboard.writeText('perfectfingers@email.com') }}
            />
            <PayCard
              brand="Cash App" brandColor="#00A624"
              info="$PerfectFingerBraids"
              note="Tap to open Cash App and pay your deposit directly."
              btnLabel="Open Cash App →"
              onAction={() => window.open('https://cash.app/$PerfectFingerBraids', '_blank')}
            />
          </div>
          <div className="mt-6 max-w-2xl px-5 py-4 rounded-xl border-l-4 text-sm leading-relaxed"
            style={{ background: 'rgba(224,48,112,0.04)', borderColor: 'var(--color-pink)', color: 'var(--color-muted)' }}>
            <strong style={{ color: 'var(--color-dark)' }}>Please note:</strong> Include your <strong style={{ color: 'var(--color-dark)' }}>full name + service</strong> in the payment memo.
            Appointments are confirmed only after the deposit is received.
            Deposits are non-refundable for cancellations within 24 hours.
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6" style={{ background: 'var(--color-dark)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold font-display border"
              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', borderColor: 'var(--color-gold)' }}>
              PFB
            </div>
            <div>
              <p className="font-display text-base text-white">Perfect Finger Braids</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Luxury protective styling</p>
            </div>
          </div>
          <div className="flex gap-6">
            {[['/', 'Home'], ['/services', 'Services'], ['#gallery', 'Gallery']].map(([href, label]) => (
              <a key={label} href={href} className="text-sm hover:text-pink-pale transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</a>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} Perfect Finger Braids. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function ServiceCard({ svc }) {
  return (
    <div className="rounded-2xl p-6 border group hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer"
      style={{ background: 'var(--color-cream)', borderColor: 'rgba(224,48,112,0.07)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
        style={{ background: 'var(--color-pink-blush)' }}>
        {svc.icon ?? '✦'}
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">{svc.name}</h3>
      <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--color-muted)' }}>{svc.description}</p>
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(224,48,112,0.08)' }}>
        <span className="font-display text-xl font-semibold" style={{ color: 'var(--color-pink-deep)' }}>
          from ${svc.price}
        </span>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(224,48,112,0.06)', color: 'var(--color-muted)' }}>
          {svc.duration} min
        </span>
      </div>
      <Link to={`/book?service=${svc.id}`}
        className="mt-4 block text-center text-sm font-medium py-2.5 rounded-xl transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', color: 'white' }}>
        Book Now
      </Link>
    </div>
  )
}

function PayCard({ brand, brandColor, info, note, btnLabel, onAction }) {
  const [copied, setCopied] = useState(false)
  function handleClick() {
    onAction()
    if (btnLabel.includes('Copy')) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  return (
    <div className="rounded-2xl p-6 border relative overflow-hidden"
      style={{ borderColor: 'rgba(224,48,112,0.1)' }}>
      <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: 'var(--color-pink-pale)', transform: 'translate(40%,40%)' }} />
      <p className="font-display text-2xl font-semibold mb-2" style={{ color: brandColor }}>{brand}</p>
      <p className="text-base font-medium mb-1" style={{ color: 'var(--color-dark)' }}>{info}</p>
      <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>{note}</p>
      <button onClick={handleClick}
        className="text-xs px-4 py-2 rounded-full border transition-colors hover:opacity-80"
        style={{ borderColor: 'rgba(224,48,112,0.15)', color: 'var(--color-dark)', background: 'var(--color-cream)' }}>
        {copied ? 'Copied!' : btnLabel}
      </button>
    </div>
  )
}

const PLACEHOLDER_SERVICES = [
  { id: '1', name: 'Knotless Box Braids', description: 'Lightweight, tension-free braids that start with your natural hair. Beginner-friendly and long-lasting.', price: 120, duration: 180, icon: '🌿' },
  { id: '2', name: 'Goddess Braids', description: 'Bohemian braids with curly ends for a romantic look perfect for any occasion.', price: 140, duration: 240, icon: '🌸' },
  { id: '3', name: 'Passion Twists', description: 'Lightweight twists with wavy hair for a textured, effortless look with incredible bounce.', price: 150, duration: 240, icon: '🌀' },
]