'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Ticket, Bell, Shield, Plus, Scan,
    LogOut, Settings, Zap, ArrowLeft
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardNavbarProps {
    user: any;
}

export function DashboardNavbar({ user }: DashboardNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'success'>('idle');

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
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

    if (!user) return null;

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10"
        >
            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="group flex items-center gap-2">
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
                <NavButton href="/dashboard/profile" icon={<User size={16} />} label="Profile" active={pathname === '/dashboard/profile'} />

                {(user.role === 'attendee' || user.role === 'organizer') && (
                    <>
                        <NavButton href="/dashboard/tickets" icon={<Ticket size={16} />} label="My Tickets" active={pathname === '/dashboard/tickets'} />
                        <NavButton href="/dashboard/sponsorships" icon={<Zap size={16} />} label="Sponsorships" active={pathname === '/dashboard/sponsorships'} />
                    </>
                )}

                <NavButton href="/dashboard/settings" icon={<Settings size={16} />} label="Settings" active={pathname === '/dashboard/settings'} />

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
                            <Plus size={16} /> Create
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

                <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-foreground transition-colors" title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </motion.header>
    );
}

function NavButton({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
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

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
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
            </AnimatePresence>
        </div>
    );
}
