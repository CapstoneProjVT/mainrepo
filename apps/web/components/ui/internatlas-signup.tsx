'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'

const cn = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ')
}

interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    variant?: 'default' | 'outline'
    className?: string
}

const Button = ({
    children,
    variant = 'default',
    className = '',
    ...props
}: ButtonProps) => {
    const baseStyles =
        'inline-flex items-center justify-center gap-2 whitespace-nowrap ' +
        'rounded-md text-sm font-medium transition-colors ' +
        'focus-visible:outline-none focus-visible:ring-2 ' +
        'focus-visible:ring-primary/50 focus-visible:ring-offset-2 ' +
        'focus-visible:ring-offset-background disabled:pointer-events-none ' +
        'disabled:opacity-50'

    const variantStyles = {
        default:
            'bg-primary bg-gradient-to-r from-blue-500 to-indigo-600 ' +
            'text-primary-foreground hover:from-blue-600 hover:to-indigo-700',
        outline:
            'border border-border bg-background hover:bg-accent ' +
            'hover:text-accent-foreground',
    }

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string
}

const Input = ({ className = '', ...props }: InputProps) => {
    return (
        <input
            className={
                'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ' +
                'text-foreground ring-offset-background file:border-0 ' +
                'file:bg-transparent file:text-sm file:font-medium ' +
                'file:text-foreground placeholder:text-muted-foreground ' +
                'focus-visible:outline-none focus-visible:ring-2 ' +
                'focus-visible:ring-primary/50 focus-visible:ring-offset-2 ' +
                'focus-visible:ring-offset-background disabled:cursor-not-allowed ' +
                'disabled:opacity-50 ' +
                className
            }
            {...props}
        />
    )
}

type RoutePoint = {
    x: number
    y: number
    delay: number
}

const DotMap = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    const routes: { start: RoutePoint; end: RoutePoint; delay: number }[] = [
        {
            start: { x: 100, y: 150, delay: 0 },
            end: { x: 200, y: 80, delay: 2 },
            delay: 0,
        },
        {
            start: { x: 200, y: 80, delay: 2 },
            end: { x: 260, y: 120, delay: 4 },
            delay: 2,
        },
        {
            start: { x: 50, y: 50, delay: 1 },
            end: { x: 150, y: 180, delay: 3 },
            delay: 1,
        },
        {
            start: { x: 280, y: 60, delay: 0.5 },
            end: { x: 180, y: 180, delay: 2.5 },
            delay: 0.5,
        },
    ]

    const getPrimaryColor = () => {
        if (typeof window === 'undefined') {
            return {
                dot: (opacity: number) => `rgba(59, 130, 246, ${opacity})`,
                line: 'rgba(59, 130, 246, 0.45)',
                glow: 'rgba(59, 130, 246, 0.18)',
            }
        }

        const styles = getComputedStyle(document.documentElement)
        const primary = styles.getPropertyValue('--primary').trim()

        return {
            dot: (opacity: number) => `hsl(${primary} / ${opacity})`,
            line: `hsl(${primary} / 0.45)`,
            glow: `hsl(${primary} / 0.18)`,
        }
    }

    const generateDots = (width: number, height: number) => {
        const dots = []
        const gap = 12
        const dotRadius = 1

        for (let x = 0; x < width; x += gap) {
            for (let y = 0; y < height; y += gap) {
                const isInMapShape =
                    ((x < width * 0.25 && x > width * 0.05) &&
                        (y < height * 0.4 && y > height * 0.1)) ||
                    ((x < width * 0.25 && x > width * 0.15) &&
                        (y < height * 0.8 && y > height * 0.4)) ||
                    ((x < width * 0.45 && x > width * 0.3) &&
                        (y < height * 0.35 && y > height * 0.15)) ||
                    ((x < width * 0.5 && x > width * 0.35) &&
                        (y < height * 0.65 && y > height * 0.35)) ||
                    ((x < width * 0.7 && x > width * 0.45) &&
                        (y < height * 0.5 && y > height * 0.1)) ||
                    ((x < width * 0.8 && x > width * 0.65) &&
                        (y < height * 0.8 && y > height * 0.6))

                if (isInMapShape && Math.random() > 0.6) {
                    dots.push({
                        x,
                        y,
                        radius: dotRadius,
                        opacity: Math.random() * 0.2 + 0.06,
                    })
                }
            }
        }

        return dots
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !canvas.parentElement) {
            return
        }

        const resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect
            setDimensions({ width, height })
            canvas.width = width
            canvas.height = height
        })

        resizeObserver.observe(canvas.parentElement)
        return () => resizeObserver.disconnect()
    }, [])

    useEffect(() => {
        if (!dimensions.width || !dimensions.height) {
            return
        }

        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return
        }

        const themeColors = getPrimaryColor()
        const dots = generateDots(dimensions.width, dimensions.height)
        let animationFrameId = 0
        let startTime = Date.now()

        const drawDots = () => {
            ctx.clearRect(0, 0, dimensions.width, dimensions.height)

            dots.forEach((dot) => {
                ctx.beginPath()
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2)
                ctx.fillStyle = themeColors.dot(dot.opacity)
                ctx.fill()
            })
        }

        const drawRoutes = () => {
            const currentTime = (Date.now() - startTime) / 1000

            routes.forEach((route) => {
                const elapsed = currentTime - route.start.delay
                if (elapsed <= 0) {
                    return
                }

                const duration = 3
                const progress = Math.min(elapsed / duration, 1)

                const x = route.start.x + (route.end.x - route.start.x) * progress
                const y = route.start.y + (route.end.y - route.start.y) * progress

                ctx.beginPath()
                ctx.moveTo(route.start.x, route.start.y)
                ctx.lineTo(x, y)
                ctx.strokeStyle = themeColors.line
                ctx.lineWidth = 1.5
                ctx.stroke()

                ctx.beginPath()
                ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2)
                ctx.fillStyle = themeColors.line
                ctx.fill()

                ctx.beginPath()
                ctx.arc(x, y, 3, 0, Math.PI * 2)
                ctx.fillStyle = themeColors.line
                ctx.fill()

                ctx.beginPath()
                ctx.arc(x, y, 6, 0, Math.PI * 2)
                ctx.fillStyle = themeColors.glow
                ctx.fill()

                if (progress === 1) {
                    ctx.beginPath()
                    ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2)
                    ctx.fillStyle = themeColors.line
                    ctx.fill()
                }
            })
        }

        const animate = () => {
            drawDots()
            drawRoutes()

            const currentTime = (Date.now() - startTime) / 1000
            if (currentTime > 15) {
                startTime = Date.now()
            }

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        return () => cancelAnimationFrame(animationFrameId)
    }, [dimensions])

    return (
        <div className="relative h-full w-full overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>
    )
}

export default function InternAtlasSignUp() {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isHovered, setIsHovered] = useState(false)
    const [err, setErr] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr('')
        setIsLoading(true)

        try {
            await api.signup({ email, password })
            router.push('/login?signup=success')
        }
        catch (error: any) {
            setErr(error.message || 'Sign up failed. Please try again.')
        }
        finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full justify-center bg-gradient-to-br from-background via-background to-muted/40 px-4 pt-10 md:pt-12">
            <div className="flex h-full w-full justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--shadow-card)]"
                >
                    <div className="relative hidden h-[600px] w-1/2 overflow-hidden border-r border-border md:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
                            <DotMap />

                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    className="mb-6"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                                        <ArrowRight className="h-6 w-6 text-white" />
                                    </div>
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.5 }}
                                    className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-3xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400"
                                >
                                    InternAtlas
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.5 }}
                                    className="max-w-xs text-center text-sm text-muted-foreground"
                                >
                                    Create your account and start finding the most matched
                                    opportunities
                                </motion.p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col justify-center bg-card p-8 md:w-1/2 md:p-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="mb-1 text-2xl font-bold text-foreground md:text-3xl">
                                Create your account
                            </h1>
                            <p className="mb-8 text-muted-foreground">
                                Sign up to get started with InternAtlas
                            </p>

                            {err ? (
                                <p className="mb-4 text-sm text-danger">{err}</p>
                            ) : null}

                            <form className="space-y-5" onSubmit={handleSignUp}>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-1 block text-sm font-medium text-foreground"
                                    >
                                        Email <span className="text-primary">*</span>
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        required
                                        disabled={isLoading}
                                        className="w-full border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-1 block text-sm font-medium text-foreground"
                                    >
                                        Password <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={isPasswordVisible ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create a password"
                                            required
                                            disabled={isLoading}
                                            className="w-full border-border bg-background pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                setIsPasswordVisible(!isPasswordVisible)
                                            }
                                        >
                                            {isPasswordVisible
                                                ? <Eye size={18} />
                                                : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onHoverStart={() => setIsHovered(true)}
                                    onHoverEnd={() => setIsHovered(false)}
                                    className="pt-2"
                                >
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className={cn(
                                            'relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2 text-white transition-all duration-300 hover:from-blue-600 hover:to-indigo-700',
                                            isHovered ? 'shadow-lg shadow-blue-500/20' : '',
                                        )}
                                    >
                                        <span className="flex items-center justify-center">
                                            {isLoading ? 'Creating account...' : 'Create account'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </span>

                                        {isHovered && !isLoading && (
                                            <motion.span
                                                initial={{ left: '-100%' }}
                                                animate={{ left: '100%' }}
                                                transition={{ duration: 1, ease: 'easeInOut' }}
                                                className="absolute bottom-0 left-0 top-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                style={{ filter: 'blur(8px)' }}
                                            />
                                        )}
                                    </Button>
                                </motion.div>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/login"
                                        className="text-sm text-primary transition-colors hover:opacity-80"
                                    >
                                        Already have an account?
                                    </Link>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}