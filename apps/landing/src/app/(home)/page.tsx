import { Header } from '@/sections/Header'
import  Hero  from '@/sections/Hero'
import { LogoTicker } from '@/sections/LogoTicker'
import { Features } from '@/sections/Features'
import { Benefits } from '@/sections/Benefits'
import { Testimonials } from '@/sections/Testimonials'
import { CallToAction } from '@/sections/CallToAction'
import  { Footer2 }  from '@/components/footer2'
import { MietResults } from '@/components/miet-results'
import { Faq } from '@/components/faq'

export default function Home() {
  return (
    <div  className="w-full container mx-auto relative overflow-hidden p-4">
      {/* <Header /> */}
      <Hero />
      <LogoTicker />
      <Features />
      {/* <Benefits /> */}
      <Testimonials />
      <MietResults />
      <Faq />
      <CallToAction />
      <Footer2 />
    </div>
  )
}
