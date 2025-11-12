'use client'
import Button from '@/components/Button'
import { RefObject, useEffect, useRef } from 'react'
import { useMotionTemplate, useMotionValue, useScroll, useTransform } from 'framer-motion'
import { motion } from 'framer-motion'

const useRelativeMousePosition = (to: RefObject<HTMLElement | HTMLDivElement | null>) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const updateMousePosition = (event: MouseEvent) => {
    if (!to.current) return

    const { top, left } = to.current.getBoundingClientRect()
    mouseX.set(event.clientX - left)
    mouseY.set(event.clientY - top)
  }

  useEffect(() => {
    window.addEventListener('mousemove', updateMousePosition)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [])

  return [mouseX, mouseY]
}

export const CallToAction = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const borderedDivRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300])

  const [mouseX, mouseY] = useRelativeMousePosition(borderedDivRef)
  const maskImage = useMotionTemplate`radial-gradient(50% 50% at ${mouseX}px ${mouseY}px, black, transparent)`

  return (
    <section ref={sectionRef} className="py-20 md:py-24">
      <div className="container">
        <motion.div
          ref={borderedDivRef}
          className="border border-white/15 py-24 rounded-xl overflow-hidden relative group"
          animate={{
            backgroundPositionX: 1800,
          }}
          transition={{
            repeat: Infinity,
            duration: 60,
            ease: 'linear',
          }}
          style={{
            backgroundImage: `url(https://cdn2.devshakya.xyz/landing/assets/stars.png)`,
            backgroundPositionY: backgroundPositionY,
          }}
        >
          <div
            className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay mask-[radial-gradient(50%_50%_at_50%_35%,black,transparent)] group-hover:opacity-0 transition duration-300"
            style={{
              backgroundImage: `url(https://cdn2.devshakya.xyz/landing/assets/grid-lines.png)`,
            }}
          ></div>
          <motion.div
            className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay opacity-0 group-hover:opacity-100 transition duration-300"
            style={{
              maskImage: maskImage,
              backgroundImage: `url(https://cdn2.devshakya.xyz/landing/assets/grid-lines.png)`,
            }}
          ></motion.div>
          <div className="relative">
            <h2 className="text-5xl md:text-6xl font-medium max-w-sm mx-auto tracking-tighter text-center">
              Automated result analysis for everyone.
            </h2>
            <p className="text-lg md:text-xl max-w-xs mx-auto text-center text-white/70 px-4 mt-5 tracking-tight">
              Achieve accurate, comprehensive results without the manual complexity.
            </p>
            <div className="mt-8 flex justify-center">
              <Button>Get Started</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
