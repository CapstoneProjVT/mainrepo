'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function LandingPage() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check if already logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        if (isLoggedIn) {
            router.replace('/opportunities')
        }
    }, [router])

    if (!mounted) return null

    return (
        <div className='min-h-screen'>
            {/* Hero Section */}
            <section className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center'>
                <h1 className='text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6'>
                    Find Your Perfect{' '}
                    <span className='bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>
                        Internship
                    </span>
                </h1>
                <p className='text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed'>
                    AI-powered matching helps you discover internship opportunities that align with your skills and goals. Track applications, prepare for interviews, and land your dream role.
                </p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <Link href='/signup'>
                        <Button size='lg' className='text-lg px-8'>
                            Start Free
                        </Button>
                    </Link>
                    <Link href='/login'>
                        <Button size='lg' variant='outline' className='text-lg px-8'>
                            Sign In
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20'>
                <h2 className='text-4xl font-bold text-center text-foreground mb-4'>
                    Everything You Need
                </h2>
                <p className='text-center text-muted-foreground mb-12 text-lg'>
                    All the tools to succeed in your internship search
                </p>

                <div className='grid md:grid-cols-3 gap-8'>
                    {/* Feature 1: AI Matching */}
                    <Card className='p-6 border-border/50 hover:border-primary/30 transition-border'>
                        <div className='text-4xl mb-4'>✨</div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>AI-Powered Matching</h3>
                        <p className='text-muted-foreground'>
                            Get personalized match scores based on your profile. Our AI analyzes your skills and shows relevant opportunities first.
                        </p>
                    </Card>

                    {/* Feature 2: Application Tracking */}
                    <Card className='p-6 border-border/50 hover:border-primary/30 transition-border'>
                        <div className='text-4xl mb-4'>📊</div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>Track Applications</h3>
                        <p className='text-muted-foreground'>
                            Manage all your applications in one place. Monitor stages from applied to interview to offer with custom pipelines.
                        </p>
                    </Card>

                    {/* Feature 3: Interview Prep */}
                    <Card className='p-6 border-border/50 hover:border-primary/30 transition-border'>
                        <div className='text-4xl mb-4'>🎯</div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>Interview Prep</h3>
                        <p className='text-muted-foreground'>
                            Get AI-generated interview questions and talking points tailored to each role you apply to.
                        </p>
                    </Card>

                    {/* Feature 4: Cover Letters */}
                    <Card className='p-6 border-border/50 hover:border-primary/30 transition-border'>
                        <div className='text-4xl mb-4'>📝</div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>AI Cover Letters</h3>
                        <p className='text-muted-foreground'>
                            Generate polished cover letter drafts in seconds. Customize and submit with confidence.
                        </p>
                    </Card>

                    {/* Feature 5: Smart Filtering */}
                    <Card className='p-6 border-border/50 hover:border-primary/30 transition-border'>
                        <div className='text-4xl mb-4'>🔍</div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>Smart Filters</h3>
                        <p className='text-muted-foreground'>
                            Filter by location, tech stack, company type, and deadline. Find exactly what you are looking for.
                        </p>
                    </Card>

                    {/* Feature 6: Insights */}
                    <Card className='p-6 border-border/50 hover:border-primary/30 transition-border'>
                        <div className='text-4xl mb-4'>📈</div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>Insights & Metrics</h3>
                        <p className='text-muted-foreground'>
                            Track your search metrics, visualization of your application funnel, and key performance indicators.
                        </p>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            <section className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center'>
                <Card className='p-12 bg-primary/5 border-primary/20'>
                    <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4'>
                        Ready to find your internship?
                    </h2>
                    <p className='text-lg text-muted-foreground mb-8'>
                        Join hundreds of students using InternAtlas to land their dream internships.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                        <Link href='/signup'>
                            <Button size='lg' className='text-lg px-8'>
                                Create Free Account
                            </Button>
                        </Link>
                    </div>
                </Card>
            </section>

            {/* Footer */}
            <footer className='border-t border-border/40 mt-20 py-12'>
                <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm'>
                    <p>&copy; 2026 InternAtlas. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
