import Link from 'next/link'
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react'
import { whitelabel } from '@/lib/whitelabel'


// loading spinner sulal creazione servizi
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{whitelabel.appName}</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Accedi
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Gestisci le tue prenotazioni
          <br />
          <span className="text-blue-600">in modo semplice e professionale</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Sistema completo per la gestione di appuntamenti, clienti e staff.
          Perfetto per saloni, centri benessere, studi professionali e molto altro.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Accedi al Sistema
          </Link>
          <Link
            href="#features"
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-semibold text-lg"
          >
            Scopri di più
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Funzionalità principali</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Calendario Intelligente</h3>
            <p className="text-gray-600">
              Gestisci appuntamenti con calendario interattivo e prevenzione overbooking
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestione Staff</h3>
            <p className="text-gray-600">
              Organizza il tuo team con orari flessibili e assegnazione servizi
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Prenotazioni Online</h3>
            <p className="text-gray-600">
              I tuoi clienti possono prenotare 24/7 dal tuo sito personalizzato
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-tenant</h3>
            <p className="text-gray-600">
              Ogni business ha il proprio spazio isolato e sicuro
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Hai già un account?</h2>
          <p className="text-xl mb-8 opacity-90">
            Entra nel circuito <br />
           <a href="tel:+39 327 032 3334">Call: +39 327 032 3334</a> <br />
            BENNATO BROKER GLOBALE
          </p>
          <Link 
            href="/login"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg"
          >
            Accedi Ora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600">{whitelabel.footer.copyright}</p>
            <div className="flex gap-6">
              {whitelabel.footer.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
