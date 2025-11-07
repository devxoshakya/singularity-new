import { Header } from '@/sections/Header'
import  Hero  from '@/sections/Hero'
import { LogoTicker } from '@/sections/LogoTicker'
import { Features } from '@/sections/Features'
import { Benefits } from '@/sections/Benefits'
import { Testimonials } from '@/sections/Testimonials'
import { CallToAction } from '@/sections/CallToAction'
import { Footer } from '@/sections/Footer'

export default function Home() {
  return (
    <div  className="w-full container mx-auto relative overflow-hidden p-4">
      {/* <Header /> */}
      <Hero />
      <LogoTicker />
      <Features />
      {/* <Benefits /> */}
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  )
}
