'use client'
import acmeLogo from '@/assets/logo-acme.png'
import apexLogo from '@/assets/logo-apex.png'
import celestialLogo from '@/assets/logo-celestial.png'
import quantumLogo from '@/assets/logo-quantum.png'
import pulseLogo from '@/assets/logo-pulse.png'
import echoLogo from '@/assets/logo-echo.png'
import { motion } from 'framer-motion'

export const LogoTicker = () => {
  const logos = [
    acmeLogo,
    pulseLogo,
    echoLogo,
    celestialLogo,
    apexLogo,
    quantumLogo,
    // repeat
    acmeLogo,
    pulseLogo,
    echoLogo,
    celestialLogo,
    apexLogo,
    quantumLogo,
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
                <img src={logo.src} alt="" className="h-6 w-auto" key={index} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
