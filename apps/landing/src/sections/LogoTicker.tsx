'use client'
import { motion } from 'framer-motion'

export const LogoTicker = () => {
  const logos = [
    'https://cdn2.devshakya.xyz/landing/assets/logo-acme.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-pulse.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-echo.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-celestial.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-apex.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-quantum.png',
    // repeat
    'https://cdn2.devshakya.xyz/landing/assets/logo-acme.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-pulse.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-echo.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-celestial.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-apex.png',
    'https://cdn2.devshakya.xyz/landing/assets/logo-quantum.png',
  ]
  return (
    <section className="py-20 md:py-24">
      <div className="container">
        <div className="flex items-center gap-5">
          <h2 className="flex-1 md:flex-none">Trusted by AKTU-affiliated institutions</h2>
          <div className="flex flex-1 overflow-hidden mask-[linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
            <motion.div
              className="flex flex-none gap-14 pr-14 -translate-x-1/2"
              initial={{ translateX: '0%' }}
              animate={{ translateX: '-50%' }}
              transition={{
                repeat: Infinity,
                duration: 30,
                ease: 'linear',
              }}
            >
              {logos.map((logo, index) => (
                <img src={logo} alt="" className="h-6 w-auto" key={index} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
