export default function NotFound() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6 flex items-center justify-center" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-md text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br text-3xl font-display font-semibold shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))',
            color: 'white'
          }}>
          404
        </div>
        
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-medium mb-4">Page Not Found</h1>
          <p className="text-lg" style={{ color: 'var(--color-muted)' }}>
            The page you're looking for doesn't exist or has moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/" 
            className="block w-full py-4 px-8 rounded-full text-lg font-medium text-white text-center hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
            Go Home
          </a>
          <a href="/services"
            className="block w-full py-4 px-8 rounded-full text-lg font-medium border text-center hover:opacity-90 transition-opacity"
            style={{ borderColor: 'rgba(24,8,16,0.15)', color: 'var(--color-dark)' }}>
            View Services
          </a>
        </div>
      </div>
    </div>
  )
}

