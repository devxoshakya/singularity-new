import Button from '@/components/Button'
import Link from 'next/link'

export const Header = () => {
  return (
    <header className="py-4 border-b border-white/15 md:border-none sticky top-0 z-10">
      <div className="absolute inset-0 backdrop-blur -z-10 md:hidden"></div>
      <div className="container">
        <div className="flex justify-between items-center md:border border-white/15 md:p-2.5 rounded-xl max-w-2xl mx-auto relative">
          <div className="absolute inset-0 backdrop-blur -z-10 hidden md:block"></div>
          <div className="">
            <div className="border border-white/15 h-10 w-10 rounded-lg inline-flex justify-center items-center">
              <img src="https://cdn2.devxoshakya.xyz/landing/assets/logo.svg" alt="Singularity Logo" className="h-8 w-8" />
            </div>
          </div>
          <div className="hidden md:block">
            <nav className="flex gap-8 text-sm">
              <a href="#" className="text-white/70 hover:text-white transition">
                Features
              </a>
              <a href="#" className="text-white/70 hover:text-white transition">
                Institutions
              </a>
              <a href="#" className="text-white/70 hover:text-white transition">
                Documentation
              </a>
              <a href="#" className="text-white/70 hover:text-white transition">
                About
              </a>
            </nav>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
            <img src="https://cdn2.devxoshakya.xyz/landing/assets/icon-menu.svg" alt="Menu" className="md:hidden" />
          </div>
        </div>
      </div>
    </header>
  )
}
