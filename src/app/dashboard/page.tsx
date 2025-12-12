'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'success'>('idle');
    const [searchQuery, setSearchQuery] = useState('');
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
        if (user) fetchEvents();
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) fetchEvents();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/events?search=${encodeURIComponent(searchQuery)}`);
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
        <div className="relative min-h-screen animated-gradient-bg text-white">
            {/* Floating Orbs - Subtle for dashboard */}
            <div className="floating-orb orb-1 opacity-30" />
            <div className="floating-orb orb-2 opacity-30" />

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
                {/* Header */}
                <header className="glass-strong rounded-2xl p-6 mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        {/* Logo & Welcome */}
                        <div className="flex items-center gap-6">
                            <Link href="/" className="text-2xl font-black text-gradient shrink-0">Event Koi</Link>
                            <div className="hidden md:block h-8 w-px bg-white/10" />
                            <div className="hidden md:block">
                                <p className="text-sm text-gray-400">Welcome back,</p>
                                <p className="font-bold text-white flex items-center gap-2">
                                    {user.name}
                                    <span className="badge-primary text-[10px]">{user.role}</span>
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-wrap items-center gap-3">
                            <NavButton href="/dashboard/profile" icon="👤" label="Profile" />

                            {(user.role === 'attendee' || user.role === 'organizer') && (
                                <NavButton href="/dashboard/tickets" icon="🎟️" label="Tickets" />
                            )}

                            <NotificationBell userId={user.id || user.userId || (user as any).insertId} />

                            <div className="h-6 w-px bg-white/10 hidden sm:block" />

                            {user.role === 'admin' && (
                                <Link
                                    href="/dashboard/admin"
                                    className="gradient-btn px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
                                >
                                    🛡️ Admin Panel
                                </Link>
                            )}

                            {user.role === 'organizer' && (
                                <Link
                                    href="/dashboard/create-event"
                                    className="gradient-btn px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
                                >
                                    ✨ Create Event
                                </Link>
                            )}

                            {user.role === 'attendee' && (
                                <button
                                    onClick={handleRequestRole}
                                    disabled={requestStatus === 'success'}
                                    className="glass px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    {requestStatus === 'success' ? '⏳ Request Pending' : '🚀 Become Organizer'}
                                </button>
                            )}

                            <button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-white transition-colors p-2"
                                title="Logout"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon="🎭"
                        label="Your Role"
                        value={user.role}
                        gradient="from-pink-500 to-rose-500"
                    />
                    <StatCard
                        icon="📅"
                        label="Member Since"
                        value={new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        gradient="from-purple-500 to-indigo-500"
                    />
                    <StatCard
                        icon="🎉"
                        label="Available Events"
                        value={events.length.toString()}
                        gradient="from-indigo-500 to-cyan-500"
                    />
                </div>

                {/* Events Section */}
                <div className="glass-strong rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                🎪 Upcoming Events
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Discover and join amazing events</p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                            <input
                                type="text"
                                placeholder="Search events, organizers..."
                                className="premium-input w-full pl-12"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="premium-card p-6 space-y-4">
                                    <div className="skeleton h-4 w-20 rounded-full" />
                                    <div className="skeleton h-6 w-3/4 rounded-lg" />
                                    <div className="skeleton h-4 w-full rounded-lg" />
                                    <div className="skeleton h-4 w-2/3 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-20 glass rounded-2xl">
                            <div className="text-6xl mb-4">🎭</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Events Found</h3>
                            <p className="text-gray-400">
                                {searchQuery ? 'Try a different search term' : 'Be the first to create an event!'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event: any) => (
                                <EventCard key={event.event_id} event={event} onClick={() => router.push(`/dashboard/event/${event.event_id}`)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Components

function NavButton({ href, icon, label }: { href: string; icon: string; label: string }) {
    return (
        <Link
            href={href}
            className="glass px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
        >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

function StatCard({ icon, label, value, gradient }: { icon: string; label: string; value: string; gradient: string }) {
    return (
        <div className="stat-card group hover:scale-105 transition-transform cursor-default">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-white capitalize">{value}</p>
                </div>
            </div>
        </div>
    );
}

function EventCard({ event, onClick }: { event: any; onClick: () => void }) {
    const statusColors: { [key: string]: string } = {
        'PUBLISHED': 'badge-success',
        'DRAFT': 'badge-warning',
        'CANCELLED': 'bg-red-500/20 border-red-500/30 text-red-400',
    };

    return (
        <div
            onClick={onClick}
            className="event-card premium-card p-6 cursor-pointer group"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status] || 'badge-primary'}`}>
                    {event.status}
                </span>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                    {event.category_name || 'General'}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-all line-clamp-1">
                {event.title}
            </h3>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                {event.description || 'No description available'}
            </p>

            {/* Details */}
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-base">📅</span>
                    <span>{new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-gray-600">•</span>
                    <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-base">📍</span>
                    <span className="line-clamp-1">{event.venue_name || 'Online Event'} {event.venue_city && `(${event.venue_city})`}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-base">👤</span>
                    <span>By {event.organizer_name}</span>
                </div>
            </div>

            {/* Hover indicator */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-500">Click to view details</span>
                <span className="text-pink-500 group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </div>
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
                className="glass p-2.5 rounded-xl hover:bg-white/10 transition-colors relative"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold notification-badge">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/10">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                🔔 Notifications
                                {unreadCount > 0 && (
                                    <span className="text-xs badge-primary">{unreadCount} new</span>
                                )}
                            </h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-4xl mb-2">🔕</div>
                                    <p className="text-gray-500 text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(n => (
                                        <div
                                            key={n.notification_id}
                                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.is_read ? 'bg-pink-500/5' : ''}`}
                                            onClick={() => !n.is_read && markAsRead(n.notification_id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5 text-lg">
                                                    {n.type === 'MESSAGE' && '💬'}
                                                    {n.type === 'EVENT_REMINDER' && '⏰'}
                                                    {n.type === 'NEW_EVENT' && '🎉'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm ${!n.is_read ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                        {n.content}
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 mt-1">
                                                        {new Date(n.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!n.is_read && (
                                                    <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-2" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
