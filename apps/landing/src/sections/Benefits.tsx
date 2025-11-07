'use client'
import { motion } from 'framer-motion'

const benefits = [
  {
    title: 'Lightning Fast Processing',
    description: 'Process each roll number in just ~2 seconds with TypeScript and Bun runtime optimization.',
    icon: '⚡',
  },
  {
    title: 'Comprehensive Analysis',
    description: 'Generate SGPA calculations, subject-wise performance metrics, and detailed statistical insights.',
    icon: '📊',
  },
  {
    title: 'Automated Excel Reports',
    description: 'Automatically save structured reports in your Documents folder with professional formatting.',
    icon: '📈',
  },
  {
    title: 'AKTU Format Compliance',
    description: 'Specifically designed for AKTU result formats with 95% accuracy validation.',
    icon: '🎯',
  },
  {
    title: 'User-Friendly Interface',
    description: 'Intuitive web-based interface designed for faculty and administrative staff.',
    icon: '💻',
  },
  {
    title: 'Error-Free Processing',
    description: 'Eliminate manual errors with automated data extraction and validation.',
    icon: '✅',
  },
]

export const Benefits = () => {
  return (
    <section className="py-20 md:py-24">
      <div className="container">
        <h2 className="text-5xl md:text-6xl font-medium text-center tracking-tighter">
          Why Choose Singularity?
        </h2>
        <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
          Designed specifically for AKTU-affiliated institutions, Singularity transforms manual result processing 
          into an automated, efficient, and accurate workflow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border border-white/15 p-6 rounded-xl bg-[linear-gradient(to_bottom_left,rgb(140,69,255,.1),transparent)] hover:bg-[linear-gradient(to_bottom_left,rgb(140,69,255,.2),transparent)] transition-all duration-300"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 border border-white/15 p-8 rounded-xl bg-[linear-gradient(to_bottom_left,rgb(140,69,255,.1),transparent)]">
          <h3 className="text-2xl md:text-3xl font-semibold text-center mb-6">
            Technical Excellence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-purple-300">Development Stack</h4>
              <ul className="text-white/70 space-y-2">
                <li>• TypeScript for type-safe development</li>
                <li>• Bun runtime for high-speed processing</li>
                <li>• Electron for cross-platform compatibility</li>
                <li>• Advanced data automation techniques</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-3 text-purple-300">Project Timeline</h4>
              <ul className="text-white/70 space-y-2">
                <li>• Project Duration: 1 year (Oct 2024 - Nov 2025)</li>
                <li>• MIET Accuracy Validation: 95% success rate</li>
                <li>• Market Research: Registrar office engagement</li>
                <li>• Continuous improvement and feedback integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
