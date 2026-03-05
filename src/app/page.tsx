'use client'

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Menu, 
  X, 
  Bot, 
  Code2, 
  Shield, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Mail,
  Sparkles,
  Zap,
  Lock,
  ArrowUpRight,
  Globe,
  Cpu,
  Terminal,
  Layers,
  ExternalLink,
  CheckCircle2,
  Brain,
  LineChart,
  ShieldCheck,
  Smartphone,
  Database,
  FileText,
  Volume2,
  MonitorSmartphone
} from 'lucide-react'
import Image from 'next/image'

// Lazy-load WebGL Shaders (Three.js is heavy — don't block initial paint)
const ShaderBackground = lazy(() => import('@/components/shaders/ShaderBackground').then(m => ({ default: m.ShaderBackground })))
const MorphingBlob = lazy(() => import('@/components/shaders/MorphingBlob').then(m => ({ default: m.MorphingBlob })))
const ParticleField = lazy(() => import('@/components/shaders/ParticleField').then(m => ({ default: m.ParticleField })))

// ============================================
// 3D CARD WITH PERSPECTIVE
// ============================================
function Card3D({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    
    setRotateX(-mouseY / 20)
    setRotateY(mouseX / 20)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
      className={className}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// ============================================
// 3D FLOATING ELEMENT
// ============================================
function Floating3D({ children, depth = 50, className = '' }: {
  children: React.ReactNode
  depth?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let rafId: number | null = null
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        if (!ref.current) { rafId = null; return }
        const rect = ref.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        const x = (e.clientX - centerX) / depth
        const y = (e.clientY - centerY) / depth
        
        setTransform({ x, y })
        rafId = null
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [depth])

  return (
    <motion.div
      ref={ref}
      animate={{
        x: transform.x,
        y: transform.y,
      }}
      transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      style={{ transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// 3D TEXT WITH DEPTH
// ============================================
function Text3D({ children, className = '', depth = 4 }: {
  children: string
  className?: string
  depth?: number
}) {
  return (
    <span className={`relative inline-block ${className}`} style={{ perspective: 500 }}>
      <span className="relative inline-block" style={{ transformStyle: 'preserve-3d' }}>
        {/* Shadow layers */}
        {[...Array(depth)].map((_, i) => (
          <span
            key={i}
            className="absolute inset-0"
            style={{
              transform: `translateZ(${- (i + 1) * 2}px)`,
              opacity: 0.15 - i * 0.03,
              color: i % 2 === 0 ? '#3b82f6' : '#ef4444',
            }}
            aria-hidden="true"
          >
            {children}
          </span>
        ))}
        {/* Main text */}
        <span className="relative" style={{ transform: 'translateZ(0)' }}>
          {children}
        </span>
      </span>
    </span>
  )
}

// ============================================
// GLITCH TEXT EFFECT
// ============================================
function GlitchText({ children, className = '' }: {
  children: string
  className?: string
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <span 
        className="absolute top-0 left-0 text-blue-400 opacity-70 animate-glitch-1"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
        aria-hidden="true"
      >
        {children}
      </span>
      <span 
        className="absolute top-0 left-0 text-red-500 opacity-70 animate-glitch-2"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
        aria-hidden="true"
      >
        {children}
      </span>
    </span>
  )
}

// ============================================
// CUSTOM CURSOR COMPONENT
// ============================================
function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [cursorText, setCursorText] = useState('')

  useEffect(() => {
    const cursor = cursorRef.current
    const cursorDot = cursorDotRef.current
    
    let mouseX = 0
    let mouseY = 0
    let cursorX = 0
    let cursorY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      
      if (cursorDot) {
        cursorDot.style.left = `${mouseX}px`
        cursorDot.style.top = `${mouseY}px`
      }
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        setIsHovering(true)
        const viewText = target.closest('[data-cursor="view"]')
        if (viewText) setCursorText('View')
      }
    }

    const handleMouseOut = () => {
      setIsHovering(false)
      setCursorText('')
    }

    const animateCursor = () => {
      const dx = mouseX - cursorX
      const dy = mouseY - cursorY
      
      cursorX += dx * 0.12
      cursorY += dy * 0.12
      
      if (cursor) {
        cursor.style.left = `${cursorX}px`
        cursor.style.top = `${cursorY}px`
      }
      
      requestAnimationFrame(animateCursor)
    }

    animateCursor()

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])

  return (
    <>
      <div
        ref={cursorRef}
        className={`fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference hidden lg:flex items-center justify-center transition-transform duration-200 ${
          isClicking ? 'scale-75' : 'scale-100'
        }`}
      >
        <div 
          className={`rounded-full border border-white transition-all duration-300 flex items-center justify-center ${
            isHovering ? 'w-24 h-24 bg-white/20 backdrop-blur-sm' : 'w-10 h-10 bg-transparent'
          }`}
        >
          {cursorText && (
            <span className="text-xs font-bold uppercase tracking-wider">{cursorText}</span>
          )}
        </div>
      </div>
      <div
        ref={cursorDotRef}
        className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden lg:block"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50" />
      </div>
    </>
  )
}

// ============================================
// MAGNETIC BUTTON COMPONENT
// ============================================
function MagneticButton({ children, className = '', onClick }: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const element = ref.current
    if (!element) return

    const { left, top, width, height } = element.getBoundingClientRect()
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)

    setPosition({ x: x * 0.35, y: y * 0.35 })
  }

  const reset = () => setPosition({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      <div onClick={onClick} className={className}>
        {children}
      </div>
    </motion.div>
  )
}

// ============================================
// TEXT REVEAL ANIMATION
// ============================================
function TextReveal({ children, className = '', delay = 0 }: {
  children: string
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const words = children.split(' ')

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div className="flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-2">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block overflow-hidden"
            initial={{ y: '100%', rotateX: -90 }}
            animate={isInView ? { y: 0, rotateX: 0 } : {}}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.08,
              ease: [0.33, 0, 0.13, 1]
            }}
          >
            <span className="inline-block">{word}</span>
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}

// ============================================
// SPLIT TEXT ANIMATION
// ============================================
function SplitText({ children, className = '', delay = 0 }: {
  children: string
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const letters = children.split('')

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div className="flex justify-center lg:justify-start">
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ y: '100%', rotateX: -90 }}
            animate={isInView ? { y: 0, rotateX: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: delay + i * 0.025,
              ease: [0.33, 0, 0.13, 1]
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}

// ============================================
// SCROLL PROGRESS INDICATOR
// ============================================
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 origin-left z-[9998]"
      style={{ scaleX }}
    />
  )
}

// ============================================
// IMAGE REVEAL WITH PARALLAX
// ============================================
function ImageReveal({ src, alt, className = '', delay = 0 }: {
  src: string
  alt: string
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1])

  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={isInView ? { clipPath: 'inset(0% 0 0 0)' } : {}}
      transition={{ duration: 1.2, delay, ease: [0.33, 0, 0.13, 1] }}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.img
        src={src}
        alt={alt}
        style={{ y, scale }}
        className="w-full h-full object-cover"
      />
      {/* Overlay gradient */}
      <motion.div
        className="absolute inset-0 bg-slate-950"
        initial={{ opacity: 1 }}
        animate={isInView ? { opacity: 0 } : {}}
        transition={{ duration: 1, delay: delay + 0.3 }}
      />
    </motion.div>
  )
}

// ============================================
// FLOATING SHAPES BACKGROUND
// ============================================
function FloatingShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Animated lines (reduced count for performance) */}
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"
          style={{ width: '100%', top: `${20 + i * 35}%` }}
          animate={{ x: ['-100%', '100%'], opacity: [0, 0.5, 0] }}
          transition={{ duration: 18 + i * 5, repeat: Infinity, ease: 'linear', delay: i * 3 }}
        />
      ))}
      
      {/* Floating orbs with 3D effect */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          top: '5%',
          right: '-10%',
          boxShadow: '0 0 100px 50px rgba(59, 130, 246, 0.02)',
        }}
        animate={{ 
          scale: [1, 1.2, 1], 
          opacity: [0.3, 0.5, 0.3],
          rotateZ: [0, 5, 0]
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.04) 0%, transparent 70%)',
          bottom: '10%',
          left: '-10%',
          boxShadow: '0 0 100px 50px rgba(239, 68, 68, 0.015)',
        }}
        animate={{ 
          scale: [1, 1.3, 1], 
          opacity: [0.2, 0.4, 0.2],
          rotateZ: [0, -5, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, delay: 2 }}
      />
      
      {/* 3D Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center top'
        }}
      />

      {/* Binary code floating (reduced count for performance) */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.015]">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-mono text-blue-400"
            style={{ left: `${15 + i * 30}%` }}
            initial={{ y: -100 }}
            animate={{ y: '110vh' }}
            transition={{
              duration: 25 + i * 5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 3
            }}
          >
            {i % 2 === 0 ? '10110' : '01001'}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// NOISE OVERLAY
// ============================================
function NoiseOverlay() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9990] opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  )
}

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 600)
          return 100
        }
        return prev + Math.random() * 12
      })
    }, 100)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.33, 0, 0.13, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* Animated logo text */}
        <motion.div
          className="text-5xl lg:text-7xl font-bold mb-12"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #ef4444, #3b82f6)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 50px rgba(59, 130, 246, 0.5)',
          }}
        >
          CritiCo
        </motion.div>
        
        {/* Progress bar */}
        <div className="w-64 h-[2px] bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        <motion.div 
          className="mt-6 text-slate-500 font-mono text-sm tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.min(Math.round(progress), 100)}%
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// ANIMATED COUNTER
// ============================================
function AnimatedCounter({ value, suffix = '' }: {
  value: number
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    
    let start = 0
    const duration = 2000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setCount(Math.floor(value * easeOut))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [isInView, value])

  return <span ref={ref}>{count}{suffix}</span>
}

// ============================================
// SERVICE CARD WITH 3D EFFECT
// ============================================
function ServiceCard({ icon: Icon, title, description, index, color = 'blue' }: {
  icon: React.ElementType
  title: string
  description: string
  index: number
  color?: 'blue' | 'red'
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100, rotateX: -10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.33, 0, 0.13, 1]
      }}
      className="group relative"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 lg:p-10 overflow-hidden"
        whileHover={{ 
          y: -10, 
          rotateX: 5,
          rotateY: index === 1 ? 0 : (index === 0 ? 2 : -2)
        }}
        transition={{ duration: 0.4, ease: [0.33, 0, 0.13, 1] }}
        style={{ 
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 4px 6px rgba(0, 0, 0, 0.1),
            0 10px 20px rgba(0, 0, 0, 0.2),
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 40px 80px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `linear-gradient(135deg, ${color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'} 0%, transparent 60%)`
          }}
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${color === 'blue' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'}, transparent)`,
            filter: 'blur(30px)'
          }}
        />

        <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
          {/* Icon with 3D transform */}
          <motion.div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color === 'blue' ? 'from-blue-500/20 to-blue-600/10' : 'from-red-500/20 to-red-600/10'} flex items-center justify-center mb-8`}
            whileHover={{ scale: 1.1, rotateY: 15, rotateX: -10 }}
            transition={{ duration: 0.3 }}
            style={{ 
              transformStyle: 'preserve-3d',
              boxShadow: `
                0 10px 30px ${color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'},
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `
            }}
          >
            <Icon className={`w-10 h-10 ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`} />
          </motion.div>

          {/* Number */}
          <motion.span
            className="absolute top-0 right-0 text-8xl font-bold text-slate-800/40 group-hover:text-slate-700/40 transition-colors duration-500"
            style={{ 
              transform: 'translateZ(20px)',
              textShadow: '0 0 30px rgba(0,0,0,0.3)'
            }}
          >
            0{index + 1}
          </motion.span>

          {/* Title */}
          <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors duration-300">
            {title}
          </h3>

          {/* Description */}
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            {description}
          </p>

          {/* Arrow */}
          <motion.div
            className="flex items-center gap-2 text-slate-500 group-hover:text-blue-400 transition-colors"
            whileHover={{ x: 10 }}
          >
            <span className="text-sm font-medium uppercase tracking-wider">Explore</span>
            <ArrowUpRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// FEATURE SHOWCASE WITH 3D PARALLAX
// ============================================
function FeatureShowcase() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-200px" })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -10])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, perspective: 1000 }}
      className="relative"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.33, 0, 0.13, 1] }}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 3D Shadow layers */}
        <motion.div
          className="absolute -inset-4 rounded-3xl bg-blue-500/10 blur-2xl"
          style={{ transform: 'translateZ(-50px)' }}
        />
        <motion.div
          className="absolute -inset-8 rounded-3xl bg-red-500/5 blur-3xl"
          style={{ transform: 'translateZ(-100px)' }}
        />

        {/* Glow effect */}
        <motion.div
          className="absolute -inset-8 rounded-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.2), transparent 60%)'
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Image container with 3D transform */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border border-slate-700/50"
          style={{ 
            y, 
            rotateX,
            transformStyle: 'preserve-3d',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              0 50px 100px -20px rgba(59, 130, 246, 0.1),
              0 100px 200px -50px rgba(239, 68, 68, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `
          }}
        >
          <motion.img
            src="/critico-hero.png"
            alt="CritiCo - Technology Solutions"
            className="w-full h-auto"
          />
          
          {/* Scanline effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)'
            }}
          />

          {/* Corner accents with 3D depth */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-blue-500/60" style={{ transform: 'translateZ(10px)' }} />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-blue-500/60" style={{ transform: 'translateZ(10px)' }} />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-red-500/60" style={{ transform: 'translateZ(10px)' }} />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-red-500/60" style={{ transform: 'translateZ(10px)' }} />
        </motion.div>

        {/* Floating badges with 3D effect */}
        <motion.div
          className="absolute -top-6 -right-6 z-20"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transform: 'translateZ(40px)' }}
        >
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 shadow-2xl" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Security</div>
                <div className="text-sm font-bold text-white">256-bit SSL</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute -bottom-6 -left-6 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ transform: 'translateZ(30px)' }}
        >
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 shadow-2xl" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Performance</div>
                <div className="text-sm font-bold text-white">99.9% Uptime</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// PROJECT IMAGE CAROUSEL
// ============================================
function ProjectImageCarousel({ images, color }: { images: string[]; color: 'blue' | 'red' }) {
  const [current, setCurrent] = useState(0)
  const hasMultiple = images.length > 1

  const next = () => setCurrent((prev) => (prev + 1) % images.length)
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-slate-900/80">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <Image
            src={images[current]}
            alt={`Screenshot ${current + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />

      {hasMultiple && (
        <>
          {/* Prev / Next buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrent(idx) }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === current
                    ? (color === 'blue' ? 'bg-blue-400 w-5' : 'bg-red-400 w-5')
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate sending
    setTimeout(() => {
      setIsSubmitting(false)
      setFormSubmitted(true)
      setFormData({ name: '', email: '', company: '', message: '' })
    }, 1500)
  }

  return (
    <>
      {/* Custom Cursor */}
      <CustomCursor />
      
      {/* Scroll Progress */}
      <ScrollProgress />
      
      {/* WebGL 3D Shaders (lazy-loaded, non-blocking) */}
      <Suspense fallback={null}>
        <ShaderBackground />
        <MorphingBlob />
        <ParticleField />
      </Suspense>
      
      {/* Background Effects */}
      <FloatingShapes />
      <NoiseOverlay />

      <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden">
        {/* ======================================== */}
        {/* NAVIGATION BAR */}
        {/* ======================================== */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.33, 0, 0.13, 1] }}
          className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-16 py-6 bg-slate-950/80 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <MagneticButton onClick={() => scrollToSection('hero')}>
                <motion.img
                  src="/logo.png"
                  alt="CritiCo Logo"
                  className="h-10 lg:h-12 w-auto"
                  whileHover={{ scale: 1.05 }}
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                  }}
                />
              </MagneticButton>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-12">
                {['Services', 'Projects', 'About', 'Contact'].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <MagneticButton onClick={() => scrollToSection(item.toLowerCase())}>
                      <span className="text-slate-400 hover:text-white transition-colors duration-300 text-sm uppercase tracking-[0.2em] font-medium">
                        {item}
                      </span>
                    </MagneticButton>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button (hidden on mobile) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: 'spring' }}
                className="hidden md:block"
              >
                <MagneticButton onClick={() => scrollToSection('contact')}>
                  <Button className="bg-white text-slate-900 hover:bg-blue-500 hover:text-white font-medium px-7 py-4 rounded-full transition-all duration-300 text-sm uppercase tracking-wider group shadow-lg shadow-white/10 hover:shadow-blue-500/30">
                    <span className="relative z-10">Get a Quote</span>
                    <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </MagneticButton>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                className="md:hidden p-2 relative z-50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <X size={24} />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Menu size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-40 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-8">
                {['Services', 'Projects', 'About', 'Contact'].map((item, index) => (
                  <motion.button
                    key={item}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="text-4xl font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    {item}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================== */}
        {/* HERO SECTION */}
        {/* ======================================== */}
        <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-8 lg:px-16 pt-32 pb-20">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
            className="relative z-10 max-w-7xl mx-auto w-full"
          >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mb-10"
                >
                  <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm text-slate-300 font-medium">Available for new projects</span>
                </motion.div>

                {/* Headline with 3D text */}
                <div className="overflow-hidden mb-6">
                  <motion.h1
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1, delay: 1.4, ease: [0.33, 0, 0.13, 1] }}
                    className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.9] tracking-tight"
                    style={{
                      textShadow: '0 4px 8px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2)'
                    }}
                  >
                    Build{' '}
                    <Text3D className="text-blue-400">Smarter</Text3D>
                  </motion.h1>
                </div>
                <div className="overflow-hidden mb-10">
                  <motion.h1
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1, delay: 1.6, ease: [0.33, 0, 0.13, 1] }}
                    className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.9] tracking-tight"
                    style={{
                      textShadow: '0 4px 8px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2)'
                    }}
                  >
                    Stay{' '}
                    <Text3D className="text-red-500" depth={5}>Secure</Text3D>
                    <span className="text-blue-400">.</span>
                  </motion.h1>
                </div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 }}
                  className="text-lg sm:text-xl text-slate-400 max-w-lg mb-12 leading-relaxed mx-auto lg:mx-0"
                >
                  We provide Full Stack Development, AI Automation, and Cyber Security solutions for the modern enterprise.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                  className="flex flex-wrap gap-4 justify-center lg:justify-start"
                >
                  <MagneticButton onClick={() => scrollToSection('contact')}>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-6 text-lg rounded-full transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 group" style={{ boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3), 0 20px 50px rgba(59, 130, 246, 0.1)' }}>
                      Start a Project
                      <motion.span className="ml-2 inline-block" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <ArrowRight className="w-5 h-5" />
                      </motion.span>
                    </Button>
                  </MagneticButton>
                  <MagneticButton onClick={() => scrollToSection('services')}>
                    <Button variant="outline" className="border-2 border-slate-700 hover:border-white/50 text-white font-semibold px-8 py-6 text-lg rounded-full transition-all duration-300 bg-transparent hover:bg-white/5 shadow-lg shadow-black/20">
                      Our Services
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </MagneticButton>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                  className="mt-16 flex items-center gap-8 justify-center lg:justify-start"
                >
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 2.3 + i * 0.1, type: 'spring' }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-slate-950 flex items-center justify-center text-sm font-bold"
                        style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                      >
                        {String.fromCharCode(64 + i)}
                      </motion.div>
                    ))}
                  </div>
                  <div>
                    <div className="text-white font-semibold">4 Specialists</div>
                    <div className="text-slate-500 text-sm">Ready to help</div>
                  </div>
                </motion.div>
              </div>

              {/* Right Content - Hero Visual */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 1.5, ease: [0.33, 0, 0.13, 1] }}
                className="relative hidden lg:block"
              >
                <FeatureShowcase />
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-8 h-14 rounded-full border-2 border-slate-700 flex items-start justify-center p-2"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                className="w-1.5 h-3 bg-blue-400 rounded-full"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </section>

        {/* ======================================== */}
        {/* MARQUEE SECTION */}
        {/* ======================================== */}
        <section className="py-16 border-y border-slate-800/50 overflow-hidden relative">
          <div>
            <motion.div
              className="flex gap-16 whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} className="flex gap-16">
                  {['AI AUTOMATION', 'FULL STACK DEV', 'CYBER SECURITY', 'CLOUD SOLUTIONS', 'ENTERPRISE APPS'].map((text, i) => (
                    <div key={i} className="flex items-center gap-8">
                      <span className="text-3xl lg:text-5xl font-bold text-slate-700" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{text}</span>
                      <Sparkles className="w-6 h-6 text-blue-500/50" />
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ======================================== */}
        {/* SERVICES SECTION */}
        {/* ======================================== */}
        <section id="services" className="py-32 lg:py-40 px-4 sm:px-8 lg:px-16 relative">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
              >
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300 uppercase tracking-wider">Our Expertise</span>
              </motion.div>
              
              <TextReveal className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 [&>div]:justify-center">
                Our Core Expertise
              </TextReveal>
              
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="w-32 h-1 bg-gradient-to-r from-blue-500 to-red-500 mx-auto origin-left"
              />
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ perspective: 2000 }}>
              <ServiceCard
                icon={Bot}
                title="AI & Automation"
                description="Streamline operations with custom AI agents and workflow automation that transform your business processes."
                index={0}
                color="blue"
              />
              <ServiceCard
                icon={Code2}
                title="Full Stack Dev"
                description="Scalable web and mobile applications tailored to your business needs with cutting-edge technologies."
                index={1}
                color="blue"
              />
              <ServiceCard
                icon={Shield}
                title="Cyber Security"
                description="Comprehensive audits and penetration testing to protect your digital assets from evolving threats."
                index={2}
                color="red"
              />
            </div>
          </div>
        </section>

        {/* ======================================== */}
        {/* PROJECTS GALLERY SECTION */}
        {/* ======================================== */}
        <section id="projects" className="py-32 lg:py-40 px-4 sm:px-8 lg:px-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            {/* Section Header */}
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300 uppercase tracking-wider">Our Work</span>
              </motion.div>

              <TextReveal className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 [&>div]:justify-center">
                Featured Projects
              </TextReveal>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl text-slate-400 max-w-2xl mx-auto"
              >
                Real solutions we&apos;ve delivered for clients across industries.
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="w-32 h-1 bg-gradient-to-r from-blue-500 to-red-500 mx-auto origin-left mt-6"
              />
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {[
                {
                  title: 'Real-Time Soundboard & Mic Mixer',
                  category: 'Desktop · Audio',
                  description: 'A low-latency desktop soundboard that mixes hotkey-triggered audio clips with a live microphone into a single call stream. Features noise reduction, loudness normalization, live transcription, and cloud-synced profiles.',
                  icon: Volume2,
                  color: 'blue' as const,
                  tags: ['C++20', 'Qt 6 / QML', 'RNNoise', 'FFmpeg', 'OpenAI WebSocket', 'OAuth 2.0'],
                  metric: 'Real-time audio processing',
                  images: [
                    '/projects/1/screenshot-1.jpeg',
                    '/projects/1/screenshot-2.jpeg',
                    '/projects/1/screenshot-3.jpeg',
                  ],
                },
                {
                  title: 'Language Institute Management System',
                  category: 'Web · Full Stack',
                  description: 'A web-based platform for managing students, courses, finances, and schedules at a language institute. Includes an interactive dashboard with charts for income, expenses, and student analytics.',
                  icon: MonitorSmartphone,
                  color: 'red' as const,
                  tags: ['PHP', 'JavaScript', 'MySQL', 'Chart.js', 'HTML / CSS'],
                  metric: 'Complete admin platform',
                  images: [
                    '/projects/2/screenshot-1.png',
                  ],
                },
              ].map((project, i) => {
                return (
                  <motion.div
                    key={project.title}
                    initial={{ opacity: 0, y: 60, rotateX: -5 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.7, delay: i * 0.15, ease: [0.33, 0, 0.13, 1] }}
                    className="group relative"
                    style={{ perspective: 1000 }}
                  >
                    <motion.div
                      className="relative bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 overflow-hidden h-full flex flex-col"
                      whileHover={{ y: -8, scale: 1.01 }}
                      transition={{ duration: 0.35, ease: [0.33, 0, 0.13, 1] }}
                      style={{
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                      }}
                    >
                      {/* Top gradient bar */}
                      <div className={`h-1 w-full bg-gradient-to-r ${
                        project.color === 'blue' ? 'from-blue-500 to-blue-400' : 'from-red-500 to-red-400'
                      }`} />

                      {/* Hover glow */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${project.color === 'blue' ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)'} 0%, transparent 60%)`,
                        }}
                      />

                      {/* Image Carousel / Single Image */}
                      <ProjectImageCarousel images={project.images} color={project.color} />

                      <div className="p-8 flex flex-col flex-1">
                        {/* Icon + Category */}
                        <div className="flex items-center justify-between mb-5">
                          <motion.div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                              project.color === 'blue' ? 'from-blue-500/20 to-blue-600/10' : 'from-red-500/20 to-red-600/10'
                            } flex items-center justify-center`}
                            whileHover={{ scale: 1.1, rotateY: 10 }}
                            style={{
                              boxShadow: `0 8px 20px ${project.color === 'blue' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)'}`,
                            }}
                          >
                            <project.icon className={`w-6 h-6 ${project.color === 'blue' ? 'text-blue-400' : 'text-red-400'}`} />
                          </motion.div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{project.category}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                          {project.title}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                          {project.description}
                        </p>

                        {/* Metric badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 w-fit ${
                          project.color === 'blue'
                            ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                            : 'bg-red-500/10 text-red-300 border border-red-500/20'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {project.metric}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 text-[11px] rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50 font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ======================================== */}
        {/* ABOUT SECTION */}
        {/* ======================================== */}
        <section id="about" className="py-32 lg:py-40 px-4 sm:px-8 lg:px-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Left - Content */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 mb-8"
                >
                  <Terminal className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300 uppercase tracking-wider">Why Us</span>
                </motion.div>

                <TextReveal className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
                  Four Specialists. One Vision.
                </TextReveal>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl text-slate-400 leading-relaxed mb-12"
                >
                  We aren&apos;t generalists. We are a team of dedicated experts in AI, Development, and Security delivering critical results for enterprises worldwide.
                </motion.p>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { value: 100, suffix: '+', label: 'Projects' },
                    { value: 50, suffix: '+', label: 'Clients' },
                    { value: 99, suffix: '%', label: 'Success Rate' },
                    { value: 4, suffix: '', label: 'Specialists' }
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                      className="border-l-2 border-slate-800 pl-6"
                    >
                      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent mb-2">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-slate-500 uppercase tracking-wider text-sm">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right - Visual */}
              <Card3D className="h-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative h-full"
                >
                  {/* Decorative elements */}
                  <motion.div
                    className="absolute -inset-8 rounded-3xl border border-slate-800/50"
                    animate={{ rotate: [0, 2, 0, -2, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -inset-16 rounded-3xl border border-slate-800/30"
                    animate={{ rotate: [0, -2, 0, 2, 0] }}
                    transition={{ duration: 12, repeat: Infinity }}
                  />

                  <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl border border-slate-700/50 p-12 backdrop-blur-sm h-full" style={{ boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { icon: Bot, label: 'AI Expert', color: 'blue' },
                        { icon: Code2, label: 'Developer', color: 'blue' },
                        { icon: Shield, label: 'Security', color: 'red' },
                        { icon: Globe, label: 'Cloud', color: 'blue' }
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                          whileHover={{ scale: 1.05, y: -5, rotateY: 5 }}
                          className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 text-center"
                          style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)' }}
                        >
                          <item.icon className={`w-8 h-8 ${item.color === 'blue' ? 'text-blue-400' : 'text-red-400'} mx-auto mb-3`} />
                          <div className="text-white font-semibold">{item.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Card3D>
            </div>
          </div>
        </section>

        {/* ======================================== */}
        {/* CONTACT SECTION */}
        {/* ======================================== */}
        <section id="contact" className="py-32 lg:py-40 px-4 sm:px-8 lg:px-16 relative">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
                >
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300 uppercase tracking-wider">Contact</span>
                </motion.div>

                <SplitText className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 [&>div]:justify-center">
                  Let&apos;s Build Together
                </SplitText>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-xl text-slate-400"
                >
                  Ready to transform your business? Let&apos;s discuss your project.
                </motion.p>
              </div>

              {/* Contact Form */}
              <AnimatePresence mode="wait">
                {formSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -30 }}
                    transition={{ duration: 0.6, ease: [0.33, 0, 0.13, 1] }}
                    className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-12 lg:p-16 text-center"
                    style={{
                      boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 50px 100px -20px rgba(59, 130, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8"
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-3xl font-bold text-white mb-4"
                    >
                      Message Sent!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-lg text-slate-400 mb-8 max-w-md mx-auto"
                    >
                      Thanks for reaching out. We&apos;ll review your message and get back to you within 24 hours.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Button
                        onClick={() => setFormSubmitted(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-8 py-4 rounded-xl transition-all duration-300 border border-slate-700/50"
                      >
                        Send Another Message
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 lg:p-12"
                    style={{ 
                      boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 50px 100px -20px rgba(59, 130, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.03)' 
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <motion.div whileFocus={{ scale: 1.02 }} className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-slate-950 text-xs text-slate-400 uppercase tracking-wider">
                          Name
                        </label>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-0 h-14 rounded-xl transition-all duration-300 hover:border-slate-600"
                          required
                        />
                      </motion.div>
                      <motion.div className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-slate-950 text-xs text-slate-400 uppercase tracking-wider">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="john@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-0 h-14 rounded-xl transition-all duration-300 hover:border-slate-600"
                          required
                        />
                      </motion.div>
                    </div>
                    <motion.div className="relative group">
                      <label className="absolute -top-2.5 left-4 px-2 bg-slate-950 text-xs text-slate-400 uppercase tracking-wider">
                        Company
                      </label>
                      <Input
                        type="text"
                        placeholder="Company Name"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-0 h-14 rounded-xl transition-all duration-300 hover:border-slate-600"
                      />
                    </motion.div>
                    <motion.div className="relative group">
                      <label className="absolute -top-2.5 left-4 px-2 bg-slate-950 text-xs text-slate-400 uppercase tracking-wider">
                        Message
                      </label>
                      <Textarea
                        placeholder="Tell us about your project..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-0 rounded-xl resize-none transition-all duration-300 hover:border-slate-600"
                        required
                      />
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-white hover:bg-blue-500 text-slate-900 hover:text-white font-semibold py-6 text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/30 group overflow-hidden relative disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{ boxShadow: '0 10px 30px rgba(255, 255, 255, 0.1)' }}
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          {isSubmitting ? (
                            <>
                              <motion.span
                                className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full mr-2"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <motion.span className="ml-2 inline-block" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                <ArrowRight className="w-5 h-5" />
                              </motion.span>
                            </>
                          )}
                        </span>
                      </Button>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ======================================== */}
        {/* FOOTER */}
        {/* ======================================== */}
        <footer className="mt-auto border-t border-slate-800/50 relative overflow-hidden">
          {/* Animated line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), rgba(239, 68, 68, 0.5), transparent)'
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logo */}
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-4">
                <img src="/logo.png" alt="CritiCo Logo" className="h-8 w-auto" />
              </motion.div>

              {/* Links */}
              <div className="flex items-center gap-8">
                {['Privacy', 'Terms', 'LinkedIn'].map((item, i) => (
                  <motion.a
                    key={item}
                    href="#"
                    className="text-slate-500 hover:text-white transition-colors text-sm uppercase tracking-wider"
                    whileHover={{ y: -3 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    {item}
                  </motion.a>
                ))}
              </div>

              {/* Copyright */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-slate-600 text-sm"
              >
                © 2026 CritiCo. All rights reserved.
              </motion.p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
