'use client'
import ProductImage from '@/assets/product-image.png'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { animate, motion, useMotionTemplate, useMotionValue, ValueAnimationTransition } from 'framer-motion'
import { ComponentPropsWithoutRef, useEffect, useRef, useState } from 'react'

const tabs = [
  {
    icon: '/assets/lottie/vroom.lottie',
    title: 'Automated Result Extraction',
    isNew: false,
    backgroundPositionX: 0,
    backgroundPositionY: 0,
    backgroundSizeX: 150,
  },
  {
    icon: '/assets/lottie/click.lottie',
    title: 'One-Click Analysis',
    isNew: false,
    backgroundPositionX: 98,
    backgroundPositionY: 100,
    backgroundSizeX: 135,
  },
  {
    icon: '/assets/lottie/stars.lottie',
    title: 'Statistical Insights Generator',
    isNew: true,
    backgroundPositionX: 100,
    backgroundPositionY: 27,
    backgroundSizeX: 177,
  },
]

const FeatureTab = (props: (typeof tabs)[number] & ComponentPropsWithoutRef<'div'> & { selected: boolean }) => {
  const tabRef = useRef<HTMLDivElement>(null)
  const dotLottieRef = useRef<any>(null)
  const xPercentage = useMotionValue(0)
  const yPercentage = useMotionValue(0)
  const maskImage = useMotionTemplate`radial-gradient(80px 80px at ${xPercentage}% ${yPercentage}%, black, transparent)`

  useEffect(() => {
    if (!tabRef.current || !props.selected) return

    xPercentage.set(0)
    yPercentage.set(0)

    const { height, width } = tabRef.current.getBoundingClientRect()
    const circumference = height * 2 + width * 2
    const times = [0, width / circumference, (width + height) / circumference, (width * 2 + height) / circumference, 1]

    const options: ValueAnimationTransition = {
      times: times,
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
      repeatType: 'loop',
    }

    animate(xPercentage, [0, 100, 100, 0, 0], options)
    animate(yPercentage, [0, 0, 100, 100, 0], options)
  }, [props.selected])

  const handleTabHover = () => {
    dotLottieRef?.current?.setFrame(0)
    dotLottieRef?.current?.play()
  }

  return (
    <div
      onMouseEnter={handleTabHover}
      className="border border-white/15 flex p-2.5 rounded-xl gap-2.5 items-center lg:flex-1 relative"
      ref={tabRef}
      onClick={props.onClick}
    >
      {props.selected && (
        <motion.div
          style={{
            maskImage: maskImage,
          }}
          className="absolute inset-0 -m-px border border-[#A369FF] rounded-xl"
        ></motion.div>
      )}
      <div className="h-12 w-12 border border-white/15 rounded-lg inline-flex items-center justify-center">
        <DotLottieReact 
          src={props.icon} 
          className="h-5 w-5"
          dotLottieRefCallback={(dotLottie) => {
            dotLottieRef.current = dotLottie;
          }}
        />
      </div>
      <div className="font-medium">{props.title}</div>
      {props.isNew && <div className="text-xs rounded-full px-2 py-0.5 bg-[#8c44ff] text-black font-semibold">new</div>}
    </div>
  )
}

export const Features = () => {
  const [selectedTab, setSelectedTab] = useState(0)

  const backgroundPositionX = useMotionValue(tabs[0].backgroundPositionX)
  const backgroundPositionY = useMotionValue(tabs[0].backgroundPositionY)
  const backgroundSizeX = useMotionValue(tabs[0].backgroundSizeX)

  const backgroundPosition = useMotionTemplate`${backgroundPositionX}% ${backgroundPositionY}%`
  const backgroundSize = useMotionTemplate`${backgroundSizeX}% auto`

  const handleSelectTab = (index: number) => {
    setSelectedTab(index)

    const options: ValueAnimationTransition = {
      duration: 2,
      ease: 'easeInOut',
    }

    animate(backgroundSizeX, [backgroundSizeX.get(), 100, tabs[index].backgroundSizeX], options)
    animate(backgroundPositionX, [backgroundPositionX.get(), tabs[index].backgroundPositionX], options)
    animate(backgroundPositionY, [backgroundPositionY.get(), tabs[index].backgroundPositionY], options)
  }

  return (
    <section className="py-20 md:py-24">
      <div className="container">
        <h2 className="text-5xl md:text-6xl font-medium text-center tracking-tighter">Elevate your result analysis.</h2>
        <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
          From small departments to large institutions, our automated tool has revolutionized the way AKTU-affiliated colleges approach result processing and analysis.
        </p>

        <div className="mt-10 flex flex-col lg:flex-row gap-3">
          {tabs.map((tab, index) => (
            <FeatureTab selected={selectedTab === index} onClick={() => handleSelectTab(index)} {...tab} key={index} />
          ))}
        </div>

        <div className="border border-white/20 p-2.5 rounded-xl mt-3">
          <motion.div
            className="aspect-video bg-cover border border-white/20 rounded-lg"
            style={{
              backgroundImage: `url(${ProductImage.src})`,
              backgroundPosition: backgroundPosition,
              backgroundSize: backgroundSize,
            }}
          ></motion.div>
        </div>
      </div>
    </section>
  )
}
