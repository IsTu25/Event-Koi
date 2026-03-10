'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    User, Ticket, Bell, Shield, Calendar, Plus, Scan, LayoutDashboard,
    Search, MapPin, Clock, ChevronRight, LogOut, ArrowUpRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'success'>('idle');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState<any[]>([]);
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchEvents();
            fetchCategories();
            fetchSearchHistory();
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchEvents();
    }, [selectedCategory]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) fetchEvents();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) setCategories(await res.json());
        } catch (e) {
            console.error('Failed to fetch categories', e);
        }
    };

    const fetchSearchHistory = async () => {
        try {
            const res = await fetch(`/api/search-history?user_id=${user.id || user.userId || (user as any).insertId}`);
            if (res.ok) {
                const history = await res.json();
                const uniqueQueries = Array.from(new Set(history.map((h: any) => h.query).filter(Boolean))).slice(0, 5);
                setSearchHistory(uniqueQueries);
            }
        } catch (e) {
            console.error('Failed to fetch search history', e);
        }
    };

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/events?search=${encodeURIComponent(searchQuery)}&category_id=${selectedCategory}`);
            if (res.ok) {
                const data = await res.json();
                const upcomingEvents = data.filter((e: any) => new Date(e.end_time) > new Date());
                setEvents(upcomingEvents);
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived state for grouped events
    const groupedEvents = events.reduce((acc: any, event: any) => {
        const style = getCategoryStyles(event.category_name);
        if (!acc[style.zone]) acc[style.zone] = [];
        acc[style.zone].push(event);
        return acc;
    }, {});

    const handleRequestRole = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/user/request-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id || user.userId || (user as any).insertId })
            });
            if (res.ok) {
                alert('Request submitted! Admin will review it.');
                setRequestStatus('success');
            } else {
                const data = await res.json();
                alert(data.message || 'Request failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-cyan-500/30">
            {/* Ambient Background - Subtle on dashboard to not distract */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[40vw] h-[40vw] bg-cyan-900/05 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[10%] w-[40vw] h-[40vw] bg-purple-900/05 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10 space-y-10">

                {/* Header Section */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                    <div className="flex items-center gap-6">
                        <Link href="/" className="group flex items-center gap-2">
                            <div className="relative w-10 h-10">
                                <span className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-orange-400 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-full h-full bg-background rounded-xl border border-white/10 flex items-center justify-center">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-orange-400 font-bold text-xl">E</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Event<span className="text-cyan-400">Koi</span></h1>
                                <p className="text-xs text-gray-500 font-medium">Dashboard</p>
                            </div>
                        </Link>

                        <div className="hidden md:block h-8 w-px bg-white/5" />

                        <div className="hidden md:block">
                            <h2 className="text-white font-medium flex items-center gap-2">
                                Hello, {user.name}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${user.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    user.role === 'organizer' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                        'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                                    }`}>
                                    {user.role}
                                </span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <NavButton href="/dashboard/profile" icon={<User size={16} />} label="Profile" />
                        {(user.role === 'attendee' || user.role === 'organizer') && (
                            <NavButton href="/dashboard/tickets" icon={<Ticket size={16} />} label="My Tickets" />
                        )}

                        <NotificationBell userId={user.id || user.userId || (user as any).insertId} />

                        <div className="h-6 w-px bg-white/10 hidden sm:block" />

                        {user.role === 'admin' && (
                            <Link href="/dashboard/admin" className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold flex items-center gap-2">
                                <Shield size={16} /> Admin
                            </Link>
                        )}

                        {user.role === 'organizer' && (
                            <>
                                <Link href="/dashboard/create-event" className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2">
                                    <Plus size={16} /> Create Event
                                </Link>
                                <Link href="/dashboard/scan" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-semibold flex items-center gap-2">
                                    <Scan size={16} /> Scan
                                </Link>
                            </>
                        )}

                        {user.role === 'attendee' && (
                            <button
                                onClick={handleRequestRole}
                                disabled={requestStatus === 'success'}
                                className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                            >
                                {requestStatus === 'success' ? 'Pending...' : 'Become Organizer'}
                            </button>
                        )}

                        <ThemeToggle />

                        <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-foreground transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </motion.header>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Sidebar / Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        <div className="bg-card border-border-custom rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <LayoutDashboard size={100} />
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Organized</h3>
                            <p className="text-4xl font-bold text-white mb-4">
                                {user.role === 'organizer' ? '12' : '0'}
                                <span className="text-sm font-normal text-gray-500 ml-2">events</span>
                            </p>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                            </div>
                        </div>

                        <div className="bg-card border-border-custom rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Ticket size={100} />
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Tickets Purchased</h3>
                            <p className="text-4xl font-bold text-white mb-4">
                                {user.role === 'attendee' ? events.length : '5'}
                                <span className="text-sm font-normal text-gray-500 ml-2">tickets</span>
                            </p>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-1/4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Content / Events */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border-border-custom rounded-2xl p-4">
                            <div className="relative w-full sm:max-w-md group z-20">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    className="w-full bg-background border-border-custom rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium text-sm"
                                    value={searchQuery}
                                    onFocus={() => setShowSearchHistory(true)}
                                    onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {showSearchHistory && searchHistory.length > 0 && !searchQuery && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border-custom rounded-xl shadow-xl overflow-hidden">
                                        <div className="px-4 py-2 border-b border-border-custom flex justify-between items-center text-xs">
                                            <span className="text-gray-500 font-semibold uppercase tracking-wider">Recent Searches</span>
                                            <button
                                                onClick={async () => {
                                                    await fetch(`/api/search-history?user_id=${user.id || user.userId || (user as any).insertId}`, { method: 'DELETE' });
                                                    setSearchHistory([]);
                                                }}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {searchHistory.map((query: any, i) => (
                                            <button
                                                key={i}
                                                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-cyan-400 transition-colors flex items-center gap-3"
                                                onClick={() => {
                                                    setSearchQuery(query);
                                                    setShowSearchHistory(false);
                                                }}
                                            >
                                                <Clock size={14} className="opacity-50" />
                                                {query}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 px-2 sm:px-0 scrollbar-hide">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === 'all'
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    All
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.category_id}
                                        onClick={() => setSelectedCategory(cat.category_id.toString())}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat.category_id.toString()
                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Events Zones */}
                        <div className="space-y-12">
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-64 rounded-3xl bg-[#161B2B] animate-pulse border border-white/5" />
                                    ))}
                                </div>
                            ) : events.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-card/50 border border-white/5 border-dashed">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <Search className="text-gray-500" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Events Found</h3>
                                    <p className="text-gray-500">Try adjusting your search or filters</p>
                                </div>
                            ) : (
                                Object.entries(groupedEvents).map(([zone, zoneEvents]: [string, any], index) => {
                                    // Get styles just for the header icon/color
                                    const sampleStyle = getCategoryStyles((zoneEvents as any[])[0].category_name);

                                    return (
                                        <motion.div
                                            key={zone}
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-3 border-b border-white/5 pb-2 mb-4">
                                                {sampleStyle.icon}
                                                <h3 className={`text-xl font-bold ${sampleStyle.textColor}`}>{zone}</h3>
                                                <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-md">{zoneEvents.length}</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {(zoneEvents as any[]).map((event: any) => (
                                                    <EventCard key={event.event_id} event={event} onClick={() => router.push(`/dashboard/event/${event.event_id}`)} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Components

function NavButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

// Helper to determine category styling "Zones"
function getCategoryStyles(categoryName: string = '') {
    const lowerCat = categoryName.toLowerCase();

    // Tech & Business
    if (lowerCat.includes('tech') || lowerCat.includes('innovation') || lowerCat.includes('startup') || lowerCat.includes('business') || lowerCat.includes('gaming') || lowerCat.includes('esports')) {
        return {
            zone: 'Tech & Future Zone',
            borderColor: 'border-cyan-500/50',
            glowColor: 'shadow-cyan-500/20',
            bgGradient: 'from-cyan-500/5 to-blue-500/5',
            textColor: 'text-cyan-400',
            icon: <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><LayoutDashboard size={18} /></div>,
            badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        };
    }
    // Arts, Music & Culture
    else if (lowerCat.includes('music') || lowerCat.includes('entertainment') || lowerCat.includes('concert') || lowerCat.includes('film') || lowerCat.includes('media') || lowerCat.includes('fashion') || lowerCat.includes('art') || lowerCat.includes('culture')) {
        return {
            zone: 'Creative & Vibe Zone',
            borderColor: 'border-purple-500/50',
            glowColor: 'shadow-purple-500/20',
            bgGradient: 'from-purple-500/5 to-pink-500/5',
            textColor: 'text-purple-400',
            icon: <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Ticket size={18} /></div>,
            badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
    }
    // Sports & Adventure
    else if (lowerCat.includes('sport') || lowerCat.includes('fitness') || lowerCat.includes('travel') || lowerCat.includes('adventure')) {
        return {
            zone: 'Action & Adventure Zone',
            borderColor: 'border-orange-500/50',
            glowColor: 'shadow-orange-500/20',
            bgGradient: 'from-orange-500/5 to-red-500/5',
            textColor: 'text-orange-400',
            icon: <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Shield size={18} /></div>,
            badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        };
    }
    // Education, Health & Community
    else if (lowerCat.includes('education') || lowerCat.includes('learning') || lowerCat.includes('book') || lowerCat.includes('health') || lowerCat.includes('wellness') || lowerCat.includes('charity')) {
        return {
            zone: 'Growth & Community Zone',
            borderColor: 'border-emerald-500/50',
            glowColor: 'shadow-emerald-500/20',
            bgGradient: 'from-emerald-500/5 to-teal-500/5',
            textColor: 'text-emerald-400',
            icon: <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><User size={18} /></div>,
            badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
    }
    // Social, Food & Family
    else if (lowerCat.includes('wedding') || lowerCat.includes('marriage') || lowerCat.includes('family') || lowerCat.includes('food')) {
        return {
            zone: 'Social & Family Zone',
            borderColor: 'border-rose-500/50',
            glowColor: 'shadow-rose-500/20',
            bgGradient: 'from-rose-500/5 to-pink-500/5',
            textColor: 'text-rose-400',
            icon: <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400"><User size={18} /></div>,
            badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        };
    } else {
        // Default
        return {
            zone: 'General Event',
            borderColor: 'border-white/10',
            glowColor: 'shadow-white/5',
            bgGradient: 'from-white/5 to-white/0',
            textColor: 'text-gray-400',
            icon: <div className="p-2 rounded-lg bg-white/5 text-gray-400"><Calendar size={18} /></div>,
            badge: 'bg-white/5 text-gray-300 border-white/10'
        };
    }
}

function EventCard({ event, onClick }: { event: any; onClick: () => void }) {
    const styles = getCategoryStyles(event.category_name);

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300
                bg-card border ${styles.borderColor} hover:shadow-2xl ${styles.glowColor}
                group
            `}
        >
            {/* Dynamic Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.bgGradient} opacity-50 group-hover:opacity-100 transition-opacity`} />

            {/* Animated Highlight Line on Top */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${styles.bgGradient.replace('/5', '')} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />

            {/* Decorative Icon Watermark */}
            <div className={`absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12 ${styles.textColor}`}>
                <ArrowUpRight size={140} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        {styles.icon}
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest block opacity-70 ${styles.textColor}`}>
                                {styles.zone}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                                {event.category_name || 'Event'}
                            </span>
                        </div>
                    </div>
                    {event.status !== 'PUBLISHED' && (
                        <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            {event.status}
                        </span>
                    )}
                </div>

                <h3 className={`text-xl font-bold text-white mb-2 group-hover:${styles.textColor} transition-colors line-clamp-1`}>
                    {event.title}
                </h3>

                <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed h-10">
                    {event.description || 'No description available'}
                </p>

                <div className="mt-auto space-y-3 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        <Clock size={16} className={styles.textColor} />
                        <span>{new Date(event.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        <MapPin size={16} className={styles.textColor} />
                        <span className="line-clamp-1">{event.venue_name || 'Online'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/notifications?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.is_read).length);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: id })
            });
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute right-0 mt-4 w-80 bg-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm">Notifications</h3>
                            {unreadCount > 0 && <span className="text-xs text-cyan-400 font-medium">{unreadCount} new</span>}
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell size={32} className="mx-auto text-gray-700 mb-3" />
                                    <p className="text-gray-500 text-xs">All caught up!</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(n => (
                                        <div
                                            key={n.notification_id}
                                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${!n.is_read ? 'bg-cyan-500/05' : ''}`}
                                            onClick={() => !n.is_read && markAsRead(n.notification_id)}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-cyan-500' : 'bg-transparent'}`} />
                                            <div>
                                                <p className={`text-sm ${!n.is_read ? 'text-white' : 'text-gray-400'}`}>
                                                    {n.content}
                                                </p>
                                                <p className="text-[10px] text-gray-600 mt-1">
                                                    {new Date(n.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}

// Add these custom styles to your global CSS for scrollbars if needed
// .custom-scrollbar::-webkit-scrollbar { width: 6px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }
