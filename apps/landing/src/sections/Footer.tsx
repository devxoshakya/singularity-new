import Logo from '@/assets/logo.svg'
import XSocial from '@/assets/social-x.svg'
import InstaSocial from '@/assets/social-instagram.svg'
import YTSocial from '@/assets/social-youtube.svg'

export const Footer = () => {
  return (
    <footer>
      <div className="py-5 border-t border-white/15">
        <div className="container">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="flex gap-2 items-center lg:flex-1">
              <Logo className="h-6 w-6" />
              <div className="font-medium">Singularity - AKTU Result Analysis</div>
            </div>
            <nav className="flex flex-col lg:flex-row gap-2 lg:gap-4 lg:flex-1 lg:justify-center">
              <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">
                Features
              </a>
              <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">
                Institutions
              </a>
              <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">
                Documentation
              </a>
              <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">
                Support
              </a>
              <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">
                About Project
              </a>
            </nav>
            <div className="flex gap-5 lg:flex-1 lg:justify-end">
              <XSocial className="text-white/40 hover:text-white transition" />
              <InstaSocial className="text-white/40 hover:text-white transition" />
              <YTSocial className="text-white/40 hover:text-white transition" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
