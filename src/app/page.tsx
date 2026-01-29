'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  TrendingUp,
  ShieldCheck,
  Zap,
  ChevronRight,
  Play,
  ArrowRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-cyan-500/30 overflow-x-hidden font-sans">

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-orange-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow delay-1000" />
      </div>

      <Navbar />
      <HeroSection />
      <FeaturesBentoGrid />
      <CalendarSection />
      <SocialFeedSection />
      <CallToAction />
      <Footer />

      {/* Custom Cursor Follower implemented via CSS/JS or just global style depending on pref. 
          For performance in React, simple CSS hover effects are often smoother than JS cursors unless essential.
          We'll stick to high-end CSS hover states.
      */}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'py-4 bg-background/80 backdrop-blur-xl border-b border-border-custom' : 'py-8 bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8">
            <span className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-orange-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-full h-full bg-background rounded-lg border border-border-custom flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-orange-400 font-bold text-lg">E</span>
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight">Event <span className="text-cyan-400">Ekhanei</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          {['Features', 'Marketplace', 'Community', 'Pricing'].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="hover:text-foreground transition-colors relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-orange-400 transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link href="/register" className="group relative px-5 py-2.5 rounded-full overflow-hidden bg-white/5 hover:bg-white/10 transition-colors border border-border-custom">
            <span className="relative z-10 text-sm font-bold flex items-center gap-2">
              Get Started <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Content */}
        <div className="space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wide"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            v2.0 Now Live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
          >
            Event Mgmt. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-orange-400">Redefined.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed"
          >
            The all-in-one platform for modern organizers. Intelligent ticketing, real-time analytics, and seamless attendee engagement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/dashboard" className="group relative px-8 py-4 bg-white text-black rounded-full font-bold overflow-hidden transition-transform hover:scale-105">
              <span className="relative z-10 flex items-center gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <button className="px-8 py-4 rounded-full border border-border-custom hover:bg-white/5 transition-colors font-semibold flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Watch Demo
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-8 flex items-center gap-6 text-sm text-gray-500"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-gray-800 flex items-center justify-center text-xs font-bold ring-2 ring-border-custom">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p>Trusted by <span className="text-foreground font-bold">2,000+</span> organizers</p>
          </motion.div>
        </div>

        {/* Right 3D Visual */}
        <div className="relative perspective-1000">
          <motion.div
            initial={{ opacity: 0, rotateX: 20, rotateY: -20, scale: 0.9 }}
            animate={{ opacity: 1, rotateX: 5, rotateY: -10, scale: 1 }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 0.5
            }}
            className="relative w-full aspect-[3/4] max-w-md mx-auto"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Glass Card - The Ticket */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="h-1/3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-8 flex flex-col justify-between relative">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <Zap className="w-24 h-24 text-foreground" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">V.I.P ACCESS</span>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-foreground leading-none mb-1">UNREAL</h2>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">SUMMIT 2026</h2>
                </div>
              </div>

              {/* Body - QR & Info */}
              <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent absolute top-0" />

                {/* QR Code Simulation */}
                <div className="relative w-48 h-48 bg-white/5 rounded-2xl p-4 border border-border-custom mb-8 group overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EventEkhaneiDemo')] bg-center bg-no-repeat bg-contain opacity-80 mix-blend-lighten" />
                  <motion.div
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                  />
                </div>

                <div className="w-full space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Holder</span>
                    <span className="font-mono text-foreground">Isfak.eth</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Seat</span>
                    <span className="font-mono text-cyan-400">A-142</span>
                  </div>
                </div>
              </div>

              {/* Perforated Bottom */}
              <div className="relative h-16 bg-black/20 flex items-center justify-between px-8">
                <div className="absolute -top-3 left-4 w-6 h-6 rounded-full bg-background" />
                <div className="absolute -top-3 right-4 w-6 h-6 rounded-full bg-background" />
                <div className="w-full border-t-2 border-dashed border-border-custom absolute top-0 left-0" />
                <span className="font-mono text-[10px] text-gray-500">ID: 8X99-22BB-11AA</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />)}
                </div>
              </div>
            </div>

            {/* Decorative Glow Behind */}
            <div className="absolute -inset-10 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-[60px] -z-10 rounded-full" />
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function FeaturesBentoGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for the <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Future of Events</span></h2>
          <p className="text-gray-400 text-lg">Every tool you need to manage, scale, and analyze your events in one unified dashboard.</p>
        </div>

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[250px]"
        >
          {/* Main Featured Item */}
          <motion.div variants={item} className="md:col-span-2 md:row-span-2 rounded-[2rem] bg-card border border-border-custom p-8 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={200} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                  <TrendingUp />
                </div>
                <h3 className="text-3xl font-bold mb-4">Real-time Analytics</h3>
                <p className="text-gray-400 text-lg max-w-sm">Watch your ticket sales, check-ins, and revenue stream in real-time with our sophisticated data visualization engine.</p>
              </div>

              {/* Mock Graph */}
              <div className="h-32 w-full flex items-end gap-2 mt-8 opacity-50">
                {[40, 70, 45, 90, 60, 80, 50, 95].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="flex-1 bg-gradient-to-t from-cyan-500/10 to-cyan-500 rounded-t-sm"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Smart Ticketing */}
          <motion.div variants={item} className="md:col-span-1 md:row-span-2 rounded-[2rem] bg-card border border-border-custom p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/10 to-transparent" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Ticket />
            </div>
            <h3 className="text-2xl font-bold mb-4">Smart Ticketing</h3>
            <p className="text-gray-400 text-sm mb-8">Generated QR codes with anti-fraud layers and dynamic validation.</p>

            <div className="relative w-full aspect-square bg-gray-900 rounded-xl border border-border-custom p-4 flex items-center justify-center">
              <div className="absolute w-[120%] h-[2px] bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-[scan_2s_linear_infinite]" />
              <div className="w-24 h-24 bg-white/10 rounded-lg" />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item} className="md:col-span-1 rounded-[2rem] bg-card border border-border-custom p-6 flex flex-col justify-center hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-orange-400" />
              <ArrowRight className="text-gray-600 group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-lg font-bold">Manage Attendees</h3>
            <p className="text-xs text-gray-500 mt-2">CRM integration included</p>
          </motion.div>

          <motion.div variants={item} className="md:col-span-1 rounded-[2rem] bg-card border border-border-custom p-6 flex flex-col justify-center hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <ShieldCheck className="text-green-400" />
              <ArrowRight className="text-gray-600 group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-lg font-bold">Secure Payments</h3>
            <p className="text-xs text-gray-500 mt-2">Global gateways supported</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function CalendarSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Visual */}
        <div className="order-2 lg:order-1 relative">
          <div className="absolute -inset-10 bg-gradient-to-tr from-cyan-900/40 to-blue-900/40 blur-[80px] rounded-full" />

          <div className="relative bg-card rounded-[2.5rem] border border-border-custom p-8 shadow-2xl">
            {/* Mock Calendar Header */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">January 2026</h3>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer">←</div>
                <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer">→</div>
              </div>
            </div>

            {/* Mock Calendar Grid */}
            <div className="grid grid-cols-7 gap-4 mb-4 text-center text-sm font-medium text-gray-500">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-4 text-center">
              {/* Previous month days */}
              {[28, 29, 30, 31].map(d => <div key={`prev-${d}`} className="text-gray-700 py-2">{d}</div>)}

              {/* Current month */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <div key={d} className="relative group cursor-pointer py-2 text-sm rounded-xl hover:bg-white/5 transition-colors">
                  <span className={`
                                        ${d === 15 ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-gray-300'}
                                        w-8 h-8 flex items-center justify-center rounded-full mx-auto
                                    `}>
                    {d}
                  </span>
                  {/* Event Dot */}
                  {[2, 15, 22, 28].includes(d) && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />
                  )}

                  {/* Tooltip for Event */}
                  {d === 15 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gray-900 border border-border-custom rounded-lg p-3 text-left shadow-xl hidden group-hover:block z-10">
                      <p className="text-xs font-bold text-foreground mb-1">Tech Conf '26</p>
                      <p className="text-[10px] text-gray-400">10:00 AM - Main Hall</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="order-1 lg:order-2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wide">
            <Calendar className="w-3 h-3" /> Smart Scheduling
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">Never miss a beat <br />with <span className="text-foreground">Smart Calendars</span></h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Sync perfectly with Google Calendar, Outlook, and Apple Calendar. Drag-and-drop scheduling with automatic time-zone detection for your global audience.
          </p>
          <ul className="space-y-4 pt-4">
            {['Automatic Availability Detection', 'Multi-timezone Support', 'Buffer Time Management'].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SocialFeedSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Marquee Text */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full opacity-[0.03] select-none pointer-events-none">
        <h2 className="text-[20vw] font-black whitespace-nowrap leading-none text-foreground whitespace-nowrap animate-marquee">
          COMMUNITY CONNECT EVENTS LIVE
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Live Social Feed</h2>
        <p className="text-gray-400">See what attendees are saying right now.</p>
      </div>

      <div className="flex gap-6 overflow-hidden mask-linear-fade">
        {/* We duplicate the column to create infinite scroll effect if we used framer, 
                    but for static MVP we'll just show a nice grid of "tweets/posts" */}

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6 mt-12">
            <SocialCard name="Sarah J." handle="@sarah_ux" time="2m ago" content="The production quality at #EventEkhanei summits is just another level! 🚀" tags={['#Design', '#Tech']} />
            <SocialCard name="Dev DAO" handle="@dev_dao" time="1h ago" content="Just dropped our new roadmap at the community meetup. Thanks for hosting us!" tags={['#Web3', '#Community']} />
          </div>
          <div className="space-y-6">
            <SocialCard name="Mark T." handle="@mark_events" time="5m ago" content="Checking in with the new QR scanner was blazing fast. Literally 1 second. ⚡️" tags={['#CX', '#EventTech']} highlight />
            <SocialCard name="CryptoDaily" handle="@cryptodaily" time="2h ago" content="Sold out our NFT gallery opening in 10 minutes. The backend held up perfectly." tags={['#NFT', '#SoldOut']} />
          </div>
          <div className="space-y-6 mt-8">
            <SocialCard name="Elena R." handle="@elena_arts" time="15m ago" content="Can't wait for the workshop tomorrow. The schedule UI is so clean." tags={['#Workshop', '#Learning']} />
            <SocialCard name="StartupInc" handle="@startup_inc" time="3h ago" content="Networking features actually work. Met 3 potential co-founders already." tags={['#Networking', '#Startup']} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialCard({ name, handle, time, content, tags, highlight }: any) {
  return (
    <div className={`p-6 rounded-3xl border ${highlight ? 'bg-gradient-to-br from-cyan-900/20 to-[#161B2B] border-cyan-500/30' : 'bg-card border-border-custom'} backdrop-blur-sm transition-transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${highlight ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-foreground'}`}>
            {name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight text-foreground">{name}</h4>
            <p className="text-xs text-gray-500">{handle}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <p className="text-gray-300 text-sm mb-4 leading-relaxed">{content}</p>
      <div className="flex gap-2">
        {tags.map((t: string) => (
          <span key={t} className="text-[10px] text-cyan-400 font-medium">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function CallToAction() {
  return (
    <section className="py-32 relative text-center px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0F1A] to-cyan-900/20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h2 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter">
          Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400">Scale?</span>
        </h2>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Join thousands of organizers creating unforgettable experiences. Free to start, powerful enough to grow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/register" className="px-10 py-5 rounded-full bg-cyan-500 text-black font-bold text-lg hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            Get Started Now
          </Link>
          <Link href="/contact" className="px-10 py-5 rounded-full border border-border-custom hover:bg-white/5 font-bold text-lg transition-colors">
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border-custom bg-[#05080F] pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
        <div className="col-span-2 lg:col-span-2 space-y-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight text-foreground">Event <span className="text-cyan-400">Ekhanei</span></span>
          </Link>
          <p className="text-gray-500 max-w-xs text-sm">
            Redefining event management with cutting-edge technology and beautiful design.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-foreground mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Integrations</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-foreground mb-6">Resources</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Community</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-foreground mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">About</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Legal</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 border-t border-border-custom pt-8">
        <p>&copy; 2026 Event Ekhanei Inc. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
        </div>
      </div>
    </footer>
  );
}
