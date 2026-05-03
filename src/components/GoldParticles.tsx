import { motion } from 'framer-motion'
import { useMemo } from 'react'

const COLORS = [
  'rgba(205,180,120,0.5)',
  'rgba(185,151,88,0.45)',
  'rgba(250,204,21,0.45)',
  'rgba(245,158,11,0.5)',
]

function rand(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

type Particle = {
  id: string
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
  driftX: number
  driftY: number
}

/**
 * Floating gold particles for section backgrounds. Fits gold / premium theme.
 */
export default function GoldParticles({ count = 12, className = '' }: { count?: number; className?: string }) {
  const particles = useMemo<Particle[]>(() => {
    const p: Particle[] = []
    for (let i = 0; i < count; i++) {
      const a = rand(i * 7.13)
      const b = rand(i * 11.29)
      const c = rand(i * 3.77)
      const d = rand(i * 5.91)
      const e = rand(i * 2.33)
      const f = rand(i * 13.1)
      p.push({
        id: `p-${i}`,
        x: 5 + a * 90,
        y: 5 + b * 90,
        size: 2 + c * 3,
        color: COLORS[i % COLORS.length] ?? COLORS[0],
        duration: 14 + d * 10,
        delay: e * 3,
        driftX: (f - 0.5) * 12,
        driftY: (rand(i * 1.7) - 0.5) * 12,
      })
    }
    return p
  }, [count])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((pt) => (
        <motion.span
          key={pt.id}
          className="absolute rounded-full"
          style={{
            left: `${pt.x}%`,
            top: `${pt.y}%`,
            width: pt.size,
            height: pt.size,
            backgroundColor: pt.color,
            boxShadow: `0 0 ${pt.size * 3}px ${pt.color}`,
          }}
          animate={{
            x: [0, pt.driftX, 0],
            y: [0, pt.driftY, 0],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: pt.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: pt.delay,
          }}
        />
      ))}
    </div>
  )
}
