'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, Calendar, FileText, CheckCircle, XCircle,
    TrendingUp, Activity, Lock, AlertTriangle, DollarSign, BarChart2,
    Search, ArrowLeft, ChevronRight, Bell, RefreshCw, Ban,
    Eye, Trash2, Gavel, Flag, Database, Settings, Download,
    BookOpen, UserX, Clock, Star, Zap, Globe, Mail
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'overview' | 'users' | 'events' | 'requests' | 'moderation' | 'reports' | 'finance' | 'analytics' | 'logs' | 'sponsorships' | 'social' | 'system' | 'intelligence' | 'campaigns' | 'audit';

export default function AdminDashboard() {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [analytics, setAnalytics] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [refunds, setRefunds] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [auditLog, setAuditLog] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    // New data states for full table coverage
    const [sponsorshipData, setSponsorshipData] = useState<any>(null);
    const [selectedSponsorTiers, setSelectedSponsorTiers] = useState<{ [key: string]: string }>({});
    const [moderationData, setModerationData] = useState<any[]>([]);
    const [systemData, setSystemData] = useState<any>({ categories: [], venues: [], roles: [], adminUsers: [] });
    const [socialData, setSocialData] = useState<any>(null);
    const [intelData, setIntelData] = useState<any>(null);
    const [userAnalyticsData, setUserAnalyticsData] = useState<any>(null);

    // Filters
    const [userSearch, setUserSearch] = useState('');
    const [reportFilter, setReportFilter] = useState('PENDING');
    const [logLevel, setLogLevel] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { router.push('/login'); return; }
        const u = JSON.parse(storedUser);
        if (u.role !== 'admin') { router.push('/dashboard'); return; }
        setAdminUser(u);
        loadAll(u.id);
    }, [router]);

    const loadAll = useCallback(async (adminId?: string) => {
        setRefreshing(true);
        try {
            const [analyticsRes, usersRes, eventsRes, reqRes, reportsRes, refundsRes, logsRes, auditRes, sponsorRes, sysCatRes, sysVenRes, sysRoleRes, sysAdmRes, socialRes, intelRes, userAnalyticsRes, campaignsRes, moderationRes] = await Promise.allSettled([
                fetch('/api/analytics/platform?days=30&t=' + Date.now()),
                fetch('/api/users?t=' + Date.now()),
                fetch('/api/events?t=' + Date.now()),
                fetch('/api/admin/requests?t=' + Date.now()),
                fetch('/api/reported-content?t=' + Date.now()),
                fetch('/api/refunds?t=' + Date.now()),
                fetch('/api/admin/system-logs?limit=50&t=' + Date.now()),
                fetch('/api/admin/audit-log?limit=50&t=' + Date.now()),
                fetch('/api/admin/sponsorships?t=' + Date.now()),
                fetch('/api/admin/system?type=categories&t=' + Date.now()),
                fetch('/api/admin/system?type=venues&t=' + Date.now()),
                fetch('/api/admin/roles?t=' + Date.now()),
                fetch('/api/admin/users?t=' + Date.now()),
                fetch('/api/admin/social?t=' + Date.now()),
                fetch('/api/admin/intelligence?t=' + Date.now()),
                fetch('/api/admin/users/analytics?t=' + Date.now()),
                fetch('/api/admin/campaigns?t=' + Date.now()),
                fetch('/api/admin/moderation?t=' + Date.now()),
            ]);

            if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) setAnalytics(await analyticsRes.value.json());
            if (usersRes.status === 'fulfilled' && usersRes.value.ok) setUsers(await usersRes.value.json());
            if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) setEvents(await eventsRes.value.json());
            if (reqRes.status === 'fulfilled' && reqRes.value.ok) setRequests(await reqRes.value.json());
            if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) setReports(await reportsRes.value.json());
            if (refundsRes.status === 'fulfilled' && refundsRes.value.ok) setRefunds(await refundsRes.value.json());
            if (logsRes.status === 'fulfilled' && logsRes.value.ok) setLogs(await logsRes.value.json());
            if (auditRes.status === 'fulfilled' && auditRes.value.ok) setAuditLog(await auditRes.value.json());
            if (sponsorRes.status === 'fulfilled' && sponsorRes.value.ok) setSponsorshipData(await sponsorRes.value.json());
            if (socialRes.status === 'fulfilled' && socialRes.value.ok) setSocialData(await socialRes.value.json());
            if (intelRes.status === 'fulfilled' && intelRes.value.ok) setIntelData(await intelRes.value.json());
            if (userAnalyticsRes.status === 'fulfilled' && userAnalyticsRes.value.ok) setUserAnalyticsData(await userAnalyticsRes.value.json());
            if (campaignsRes.status === 'fulfilled' && campaignsRes.value.ok) setCampaigns(await campaignsRes.value.json());
            if (moderationRes.status === 'fulfilled' && moderationRes.value.ok) setModerationData(await moderationRes.value.json());

            // Set System Data
            const sysData: any = { categories: [], venues: [], roles: [], adminUsers: [] };
            if (sysCatRes.status === 'fulfilled' && sysCatRes.value.ok) sysData.categories = await sysCatRes.value.json();
            if (sysVenRes.status === 'fulfilled' && sysVenRes.value.ok) sysData.venues = await sysVenRes.value.json();
            if (sysRoleRes.status === 'fulfilled' && sysRoleRes.value.ok) sysData.roles = await sysRoleRes.value.json();
            if (sysAdmRes.status === 'fulfilled' && sysAdmRes.value.ok) sysData.adminUsers = await sysAdmRes.value.json();
            setSystemData(sysData);

        } catch (e) { console.error(e); } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleRequestAction = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
        await fetch('/api/admin/requests', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: requestId, status }),
        });
        loadAll();
    };

    const handleVerifyUser = async (userId: number, verify: boolean) => {
        await fetch('/api/admin/verify-user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_verified: verify }),
        });
        loadAll();
    };

    const handleReportAction = async (reportId: number, status: string) => {
        await fetch('/api/reported-content', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: reportId, status, admin_id: adminUser?.id, resolution_note: `Resolved by admin` }),
        });
        loadAll();
    };

    const handleRefundAction = async (refundId: number, status: string) => {
        await fetch('/api/refunds', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refund_id: refundId, status, admin_id: adminUser?.id }),
        });
        loadAll();
    };

    const handleModerateUser = async (userId: number, action: string) => {
        const reason = prompt(`Reason for ${action}:`);
        if (!reason) return;
        await fetch('/api/admin/moderation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, admin_id: adminUser?.id, action, reason, duration_days: action === 'SUSPENSION' ? 7 : null }),
        });
        alert(`${action} applied.`);
        loadAll();
    };

    const handleRevokeModeration = async (userId: number, action: string) => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this user?`)) return;
        await fetch('/api/admin/moderation', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, admin_id: adminUser?.id, action }),
        });
        alert(`${action} performed.`);
        loadAll();
    };

    const summary = analytics?.summary || {};
    const activeUsers = users.filter(u => {
        const mod = moderationData.find(m => Number(m.user_id) === Number(u.id));
        return !(mod && (Number(mod.is_banned) === 1 || mod.is_banned === true));
    });
    const filteredUsers = activeUsers.filter(u =>
        !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    useEffect(() => {
        if (!activeTab || loading) return;
        if (['finance', 'sponsorships', 'campaigns', 'overview', 'intelligence', 'social', 'moderation'].includes(activeTab)) {
            loadAll();
        }
    }, [activeTab]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 font-medium">Loading Command Center...</p>
                </div>
            </div>
        );
    }

    const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'users', label: 'Users', icon: Users, badge: activeUsers.length },
        { id: 'events', label: 'Events', icon: Calendar, badge: events.length },
        { id: 'requests', label: 'Requests', icon: Lock, badge: requests.length },
        { id: 'finance', label: 'Finance', icon: DollarSign },
        { id: 'sponsorships', label: 'Sponsorships', icon: Zap, badge: sponsorshipData?.sponsorships?.filter((s: any) => s.status === 'PENDING').length },
        { id: 'social', label: 'Engagement', icon: Globe },
        { id: 'intelligence', label: 'Intelligence', icon: Download },
        { id: 'campaigns', label: 'Campaigns', icon: Mail, badge: campaigns.length },
        { id: 'system', label: 'Settings', icon: Settings },
        { id: 'reports', label: 'Moderation', icon: Shield, badge: reports.filter(r => r.status === 'PENDING').length },
        { id: 'moderation', label: 'Users Panel', icon: UserX },
        { id: 'audit', label: 'Audit Log', icon: Activity },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'logs', label: 'System', icon: Database },
    ];

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans selection:bg-red-500/20">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-red-900/8 blur-[120px]" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/8 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto p-4 lg:p-8">
                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
                            <Shield size={12} /> Admin Command Center
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">
                            Event<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Koi</span> Admin
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Full platform control & analytics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadAll()}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold transition-all">
                            <ArrowLeft size={16} /> Dashboard
                        </button>
                    </div>
                </header>

                {/* Tab Nav */}
                <div className="flex gap-1 overflow-x-auto pb-2 mb-8 scrollbar-none">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all relative
                                ${activeTab === tab.id
                                    ? 'bg-white/10 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={15} />
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ======================== OVERVIEW ======================== */}
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Users', value: summary.total_users || 0, icon: Users, color: 'cyan', sub: `+${summary.new_users || 0} this month` },
                                    { label: 'Published Events', value: summary.published_events || 0, icon: Calendar, color: 'purple', sub: `${summary.new_events || 0} new events` },
                                    { label: 'Total Bookings', value: summary.total_bookings || 0, icon: BookOpen, color: 'green', sub: `${summary.recent_bookings || 0} recent` },
                                    { label: 'Net Revenue', value: `৳${Number(summary.total_net_revenue || 0).toFixed(0)}`, icon: DollarSign, color: 'orange', sub: `৳${Number(summary.recent_revenue || 0).toFixed(0)} recent` },
                                    { label: 'Pending Refunds', value: summary.pending_refunds || 0, icon: RefreshCw, color: 'red', sub: 'Awaiting review' },
                                    { label: 'Role Requests', value: summary.pending_role_requests || 0, icon: Lock, color: 'yellow', sub: 'Pending approval' },
                                    { label: 'Open Reports', value: summary.open_reports || 0, icon: Flag, color: 'rose', sub: 'Content reports' },
                                    { label: 'Active Bans', value: summary.active_moderations || 0, icon: Ban, color: 'red', sub: 'User moderations' },
                                ].map((kpi, i) => (
                                    <motion.div
                                        key={kpi.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`bg-[#161B2B] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all`}
                                    >
                                        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                            <kpi.icon size={60} />
                                        </div>
                                        <p className="text-gray-500 text-xs font-medium mb-1">{kpi.label}</p>
                                        <p className="text-3xl font-black text-white mb-1">{kpi.value}</p>
                                        <p className="text-[11px] text-gray-600">{kpi.sub}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* User Growth */}
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-cyan-400" /> User Growth (30 days)</h3>
                                    <SimpleBarChart data={analytics?.userGrowth || []} valueKey="count" labelKey="date" color="#06b6d4" />
                                </div>
                                {/* Booking Trend */}
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity size={16} className="text-purple-400" /> Booking Trend (30 days)</h3>
                                    <SimpleBarChart data={analytics?.bookingTrend || []} valueKey="bookings" labelKey="date" color="#a855f7" />
                                </div>
                            </div>

                            {/* Top Events + Category Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Star size={16} className="text-yellow-400" /> Top Events by Bookings</h3>
                                    <div className="space-y-3">
                                        {(analytics?.topEvents || []).slice(0, 5).map((e: any, i: number) => (
                                            <div key={e.event_id} className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-gray-500 w-5">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{e.title}</p>
                                                    <p className="text-[11px] text-gray-500">{e.bookings} bookings · ৳{Number(e.revenue).toFixed(0)}</p>
                                                </div>
                                                <span className="text-xs text-cyan-400 font-bold">৳{Number(e.revenue).toFixed(0)}</span>
                                            </div>
                                        ))}
                                        {!analytics?.topEvents?.length && <p className="text-gray-600 text-sm">No data yet</p>}
                                    </div>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Globe size={16} className="text-green-400" /> Category Performance</h3>
                                    <div className="space-y-3">
                                        {(analytics?.categoryStats || []).slice(0, 6).map((c: any) => (
                                            <div key={c.name} className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-white font-medium">{c.name}</span>
                                                        <span className="text-gray-500">{c.bookings} bookings</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                                            style={{ width: `${Math.min(100, (c.bookings / Math.max(1, ...(analytics?.categoryStats || []).map((x: any) => x.bookings))) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== USERS ======================== */}
                    {activeTab === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <h2 className="font-bold text-white text-lg">Active Users ({activeUsers.length})</h2>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            className="bg-[#0B0F1A] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                                            placeholder="Search users..."
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['User', 'Role', 'Verified', 'Joined', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((u, i) => (
                                                <motion.tr
                                                    key={u.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-semibold text-white text-sm">{u.name}</p>
                                                            <p className="text-[11px] text-gray-500">{u.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <RoleBadge role={u.role} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.is_verified ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-500 border border-white/5'}`}>
                                                                {u.is_verified ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                                {u.is_verified ? 'Verified' : 'Unverified'}
                                                            </span>
                                                            {moderationData.find(m => m.user_id === u.id && m.is_banned) && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase">
                                                                    <Ban size={10} /> Banned
                                                                </span>
                                                            )}
                                                            {moderationData.find(m => m.user_id === u.id && m.is_suspended) && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-black uppercase">
                                                                    <Clock size={10} /> Suspended
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <AdminBtn onClick={() => handleVerifyUser(u.id, !u.is_verified)} color={u.is_verified ? 'red' : 'green'}>
                                                                {u.is_verified ? 'Revoke' : 'Verify'}
                                                            </AdminBtn>
                                                            <AdminBtn onClick={() => handleModerateUser(u.id, 'WARNING')} color="yellow">Warn</AdminBtn>
                                                            {moderationData.find(m => m.user_id === u.id && m.is_suspended) ? (
                                                                <AdminBtn onClick={() => handleRevokeModeration(u.id, 'UNSUSPEND')} color="green">Unsuspend</AdminBtn>
                                                            ) : (
                                                                <AdminBtn onClick={() => handleModerateUser(u.id, 'SUSPENSION')} color="orange">Suspend</AdminBtn>
                                                            )}
                                                            {moderationData.find(m => m.user_id === u.id && m.is_banned) ? (
                                                                <AdminBtn onClick={() => handleRevokeModeration(u.id, 'UNBAN')} color="green">Unban</AdminBtn>
                                                            ) : (
                                                                <AdminBtn onClick={() => handleModerateUser(u.id, 'BAN')} color="red">Ban</AdminBtn>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredUsers.length === 0 && <EmptyState message="No users found" />}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== EVENTS ======================== */}
                    {activeTab === 'events' && (
                        <motion.div key="events" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5">
                                    <h2 className="font-bold text-white text-lg">All Events ({events.length})</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['Title', 'Organizer', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map((e, i) => (
                                                <motion.tr key={e.event_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-semibold text-white max-w-[200px] truncate text-sm">{e.title}</td>
                                                    <td className="px-6 py-4 text-gray-400 text-sm">{e.organizer_name}</td>
                                                    <td className="px-6 py-4">
                                                        {e.category_name && (
                                                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                                                                {e.category_name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={e.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(e.start_time).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <Link href={`/dashboard/event/${e.event_id}`}>
                                                                <AdminBtn color="blue">View</AdminBtn>
                                                            </Link>
                                                            <AdminBtn onClick={async () => { if (confirm('Delete this event?')) { await fetch(`/api/events/${e.event_id}`, { method: 'DELETE' }); loadAll(); } }} color="red">Delete</AdminBtn>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== REQUESTS ======================== */}
                    {activeTab === 'requests' && (
                        <motion.div key="requests" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5">
                                    <h2 className="font-bold text-white text-lg">Role Requests ({requests.length})</h2>
                                </div>
                                {requests.length === 0 ? <EmptyState message="No pending role requests" /> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    {['User', 'Email', 'Role Requested', 'Submitted', 'Actions'].map(h => (
                                                        <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {requests.map((req, i) => (
                                                    <motion.tr key={req.request_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-white text-sm">{req.name}</td>
                                                        <td className="px-6 py-4 text-gray-400 text-sm">{req.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20 capitalize">{req.requested_role}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                <AdminBtn onClick={() => handleRequestAction(req.request_id, 'APPROVED')} color="green">Approve</AdminBtn>
                                                                <AdminBtn onClick={() => handleRequestAction(req.request_id, 'REJECTED')} color="red">Reject</AdminBtn>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== REPORTS ======================== */}
                    {activeTab === 'reports' && (
                        <motion.div key="reports" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="flex gap-2">
                                {['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map(s => (
                                    <button key={s} onClick={() => setReportFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${reportFilter === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                                        {s} ({reports.filter(r => r.status === s).length})
                                    </button>
                                ))}
                            </div>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['Reporter', 'Content Type', 'Reason', 'Date', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reports.filter(r => r.status === reportFilter).map((r, i) => (
                                                <motion.tr key={r.report_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-white font-medium">{r.reporter_name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-bold">{r.content_type}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400 text-xs max-w-[200px] truncate">{r.reason}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            {reportFilter === 'PENDING' && <>
                                                                <AdminBtn onClick={() => handleReportAction(r.report_id, 'REVIEWING')} color="blue">Review</AdminBtn>
                                                                <AdminBtn onClick={() => handleReportAction(r.report_id, 'DISMISSED')} color="gray">Dismiss</AdminBtn>
                                                                <AdminBtn onClick={() => handleReportAction(r.report_id, 'RESOLVED')} color="green">Resolve</AdminBtn>
                                                            </>}
                                                            {reportFilter === 'REVIEWING' && <>
                                                                <AdminBtn onClick={() => handleReportAction(r.report_id, 'RESOLVED')} color="green">Resolve</AdminBtn>
                                                                <AdminBtn onClick={() => handleReportAction(r.report_id, 'DISMISSED')} color="gray">Dismiss</AdminBtn>
                                                            </>}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reports.filter(r => r.status === reportFilter).length === 0 && <EmptyState message={`No ${reportFilter.toLowerCase()} reports`} />}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== FINANCE ======================== */}
                    {activeTab === 'finance' && (
                        <motion.div key="finance" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Organizing Revenue (৳1k/Event)', value: `৳${Number(summary.organizing_revenue || 0).toLocaleString()}`, color: 'blue' },
                                    { label: 'Ticket Commission (10%)', value: `৳${Number(summary.ticket_commission || 0).toLocaleString()}`, color: 'orange' },
                                    { label: 'Total Tickets Sold', value: (summary.total_tickets_sold || 0).toLocaleString(), color: 'purple' },
                                    { label: 'Platform Net Revenue', value: `৳${Number(summary.total_net_revenue || 0).toLocaleString()}`, color: 'green' },
                                ].map(stat => (
                                    <div key={stat.label} className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                        <p className="text-gray-500 text-xs font-medium mb-2">{stat.label}</p>
                                        <p className="text-3xl font-black text-white">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5">
                                    <h2 className="font-bold text-white">Refund Management</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['Requester', 'Event', 'Amount', 'Reason', 'Status', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {refunds.map((r, i) => (
                                                <motion.tr key={r.refund_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-white font-medium">{r.requester_name}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-400 max-w-[150px] truncate">{r.event_title}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-orange-400">৳{Number(r.amount).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-500 max-w-[150px] truncate">{r.reason || 'Not specified'}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                                                    <td className="px-6 py-4">
                                                        {r.status === 'REQUESTED' && (
                                                            <div className="flex gap-2">
                                                                <AdminBtn onClick={() => handleRefundAction(r.refund_id, 'COMPLETED')} color="green">Approve</AdminBtn>
                                                                <AdminBtn onClick={() => handleRefundAction(r.refund_id, 'REJECTED')} color="red">Reject</AdminBtn>
                                                            </div>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {refunds.length === 0 && <EmptyState message="No refunds yet" />}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== MODERATION ======================== */}
                    {activeTab === 'moderation' && (
                        <motion.div key="moderation" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                            {/* Ban Section */}
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-2">
                                    <Ban className="text-red-500" size={20} />
                                    <h2 className="font-bold text-white text-lg">Banned Users</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['User', 'Ban Date', 'Reason', 'Banned By', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {moderationData.filter(m => Number(m.is_banned) === 1).map(m => (
                                                <tr key={m.moderation_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-semibold">{m.user_name}</p>
                                                        <p className="text-[10px] text-gray-500">{m.email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-400">{m.ban_date ? new Date(m.ban_date).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="px-6 py-4 text-xs text-red-400 font-medium max-w-[200px] truncate">{m.ban_reason}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{m.banned_by_name || 'System'}</td>
                                                    <td className="px-6 py-4">
                                                        <AdminBtn onClick={() => handleRevokeModeration(m.user_id, 'UNBAN')} color="green">Lift Ban</AdminBtn>
                                                    </td>
                                                </tr>
                                            ))}
                                            {moderationData.filter(m => Number(m.is_banned) === 1).length === 0 && (
                                                <tr><td colSpan={5} className="py-8 text-center text-gray-600 text-sm italic">No active bans</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Suspension Section */}
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-2">
                                    <Clock className="text-orange-500" size={20} />
                                    <h2 className="font-bold text-white text-lg">Suspended Users</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['User', 'Ends At', 'Reason', 'By', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {moderationData.filter(m => Number(m.is_suspended) === 1).map(m => (
                                                <tr key={m.moderation_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-semibold">{m.user_name}</p>
                                                        <p className="text-[10px] text-gray-500">{m.email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-orange-400 font-bold">{m.suspension_end ? new Date(m.suspension_end).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-400 max-w-[200px] truncate">{m.suspension_reason}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{m.suspended_by_name || 'System'}</td>
                                                    <td className="px-6 py-4">
                                                        <AdminBtn onClick={() => handleRevokeModeration(m.user_id, 'UNSUSPEND')} color="green">Lift Suspension</AdminBtn>
                                                    </td>
                                                </tr>
                                            ))}
                                            {moderationData.filter(m => Number(m.is_suspended) === 1).length === 0 && (
                                                <tr><td colSpan={5} className="py-8 text-center text-gray-600 text-sm italic">No active suspensions</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Warnings Section */}
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-2">
                                    <AlertTriangle className="text-yellow-500" size={20} />
                                    <h2 className="font-bold text-white text-lg">Warned Users</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['User', 'Warnings', 'Last Warning', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {moderationData.filter(m => Number(m.warning_level) > 0).map(m => (
                                                <tr key={m.moderation_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-semibold">{m.user_name}</p>
                                                        <p className="text-[10px] text-gray-500">{m.email}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${m.warning_level >= 3 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                            {m.warning_level} WARNINGS
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{m.last_warning_date ? new Date(m.last_warning_date).toLocaleString() : 'N/A'}</td>
                                                    <td className="px-6 py-4">
                                                        <AdminBtn onClick={() => handleRevokeModeration(m.user_id, 'CLEAR_WARNINGS')} color="gray">Clear History</AdminBtn>
                                                    </td>
                                                </tr>
                                            ))}
                                            {moderationData.filter(m => m.warning_level > 0).length === 0 && (
                                                <tr><td colSpan={4} className="py-8 text-center text-gray-600 text-sm italic">No users with warnings</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== AUDIT LOG ======================== */}
                    {activeTab === 'audit' && (
                        <motion.div key="audit" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2"><Activity size={20} className="text-yellow-400" /> Platform Audit Trail</h2>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {auditLog.map((log: any) => (
                                        <div key={log.log_id} className="flex items-start gap-4 p-4 rounded-xl bg-[#0B0F1A] border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                                <Zap size={14} className="text-yellow-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm text-white font-bold"><span className="text-red-400">{log.admin_name}</span> performed {log.action}</p>
                                                    <span className="text-[10px] text-gray-600 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">Target: {log.entity_type} ID#{log.entity_id}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {auditLog.length === 0 && <EmptyState message="No audit actions recorded yet." />}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== ANALYTICS ======================== */}
                    {activeTab === 'analytics' && (
                        <motion.div key="analytics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users size={16} className="text-cyan-400" /> User Role Distribution</h3>
                                    {(analytics?.userRoles || []).map((r: any) => (
                                        <div key={r.role} className="flex items-center gap-3 mb-3">
                                            <RoleBadge role={r.role} />
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                                                    style={{ width: `${(r.count / users.length) * 100}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-400 font-bold w-8 text-right">{r.count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><DollarSign size={16} className="text-green-400" /> Revenue by Period</h3>
                                    <SimpleBarChart data={analytics?.bookingTrend || []} valueKey="revenue" labelKey="date" color="#10b981" />
                                </div>
                            </div>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-4">Full Top Events Leaderboard</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['#', 'Event', 'Organizer', 'Category', 'Bookings', 'Revenue'].map(h => (
                                                    <th key={h} className="pb-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pr-4">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(analytics?.topEvents || []).map((e: any, i: number) => (
                                                <tr key={e.event_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="py-3 pr-4 text-gray-500 font-bold text-sm">#{i + 1}</td>
                                                    <td className="py-3 pr-4 text-white font-semibold text-sm max-w-[200px] truncate">{e.title}</td>
                                                    <td className="py-3 pr-4 text-gray-400 text-sm">{e.organizer_name}</td>
                                                    <td className="py-3 pr-4">
                                                        {e.category_name && <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[10px] font-bold">{e.category_name}</span>}
                                                    </td>
                                                    <td className="py-3 pr-4 text-white font-bold text-sm">{e.bookings}</td>
                                                    <td className="py-3 text-green-400 font-bold text-sm">৳{Number(e.revenue).toFixed(0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== LOGS ======================== */}
                    {activeTab === 'logs' && (
                        <motion.div key="logs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="flex gap-2">
                                {['', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map(lvl => (
                                    <button key={lvl || 'all'} onClick={() => setLogLevel(lvl)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${logLevel === lvl ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                                        {lvl || 'ALL'}
                                    </button>
                                ))}
                            </div>
                            <div className="bg-[#0B0F1A] border border-white/5 rounded-2xl overflow-hidden font-mono text-xs">
                                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                                    <Database size={14} className="text-green-400" />
                                    <span className="text-green-400 font-bold">System Logs</span>
                                    <span className="text-gray-600">— last 50 entries</span>
                                </div>
                                <div className="max-h-[600px] overflow-y-auto p-4 space-y-1">
                                    {logs
                                        .filter(l => !logLevel || l.level === logLevel)
                                        .map((log: any) => (
                                            <div key={log.log_id} className={`flex gap-3 p-2 rounded ${log.level === 'ERROR' ? 'bg-red-500/5 text-red-400' : log.level === 'WARN' ? 'bg-yellow-500/5 text-yellow-400' : 'text-green-400'}`}>
                                                <span className="text-gray-600 shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                                                <span className={`font-bold shrink-0 w-12 ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-green-400'}`}>
                                                    [{log.level}]
                                                </span>
                                                <span className="text-gray-400 shrink-0">[{log.category}]</span>
                                                <span className="text-gray-300">{log.message}</span>
                                            </div>
                                        ))}
                                    {logs.filter(l => !logLevel || l.level === logLevel).length === 0 && (
                                        <p className="text-gray-600 text-center py-8">No logs matching filter</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== SPONSORSHIPS ==================== */}
                    {activeTab === 'sponsorships' && (
                        <motion.div key="sponsorships" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h2 className="font-bold text-white text-lg flex items-center gap-2"><Zap size={18} className="text-yellow-400" /> Platform Sponsorships</h2>
                                        <p className="text-gray-500 text-sm mt-1">Review and manage organizer-sponsor relationships</p>
                                    </div>
                                    <Link href="/dashboard/sponsorships">
                                        <button className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 font-bold text-xs rounded-xl transition-colors">
                                            Open Organizer Hub
                                        </button>
                                    </Link>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Sponsorship Distribution</h3>
                                    <div className="space-y-3">
                                        {['Partner', 'Bronze', 'Silver', 'Gold', 'Platinum'].map(tier => {
                                            const count = (sponsorshipData?.sponsors || []).filter((s: any) => s.tier === tier).length;
                                            return (
                                                <div key={tier} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                                                    <span className="text-sm font-semibold">{tier}</span>
                                                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-black">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Top Sponsors</h3>
                                    <div className="space-y-3">
                                        {(sponsorshipData?.sponsors || []).slice(0, 5).map((s: any) => (
                                            <div key={s.sponsor_id} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-cyan-400">{s.name ? s.name[0] : 'S'}</div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">{s.name}</p>
                                                    <p className="text-xs text-gray-500">৳{Number(s.contribution_amount).toLocaleString()} · {s.tier}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5"><h2 className="font-bold">Pending Approvals</h2></div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                {['Sponsor', 'Event', 'Tier', 'Amount', 'Actions'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sponsorshipData?.sponsorships?.filter((s: any) => s.status === 'PENDING').map((s: any) => (
                                                <tr key={s.sponsorship_id} className="border-b border-white/5">
                                                    <td className="px-6 py-4 text-sm font-semibold">{s.sponsor_name}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-400">{s.event_title}</td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            className="bg-[#0B0F1A] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-cyan-500/50"
                                                            value={selectedSponsorTiers[s.sponsorship_id] || s.tier}
                                                            onChange={(e) => setSelectedSponsorTiers({ ...selectedSponsorTiers, [s.sponsorship_id]: e.target.value })}
                                                        >
                                                            <option>Partner</option>
                                                            <option>Bronze</option>
                                                            <option>Silver</option>
                                                            <option>Gold</option>
                                                            <option>Platinum</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-green-400">৳{s.amount_paid}</td>
                                                    <td className="px-6 py-4 flex gap-2">
                                                        <AdminBtn onClick={async () => {
                                                            const tier = selectedSponsorTiers[s.sponsorship_id] || s.tier;
                                                            await fetch('/api/admin/sponsorships', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ sponsorship_id: s.sponsorship_id, status: 'CONFIRMED', tier: tier, approved_by: adminUser.id })
                                                            });
                                                            loadAll();
                                                        }} color="green">Confirm as {selectedSponsorTiers[s.sponsorship_id] || s.tier}</AdminBtn>
                                                        <AdminBtn onClick={async () => { await fetch('/api/admin/sponsorships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sponsorship_id: s.sponsorship_id, status: 'REJECTED', approved_by: adminUser.id }) }); loadAll(); }} color="red">Reject</AdminBtn>
                                                    </td>
                                                </tr>
                                            ))}
                                            {sponsorshipData?.sponsorships?.filter((s: any) => s.status === 'PENDING').length === 0 && (
                                                <tr><td colSpan={5} className="py-12 text-center text-gray-500">No pending sponsorships</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== SOCIAL/ENGAGEMENT ================= */}
                    {activeTab === 'social' && (
                        <motion.div key="social" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Messaging Volume (30 days)</h3>
                                    <SimpleBarChart data={socialData?.messaging || []} valueKey="message_count" labelKey="date" color="#ec4899" />
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Top Influencers</h3>
                                    <div className="space-y-3">
                                        {(socialData?.influencers || []).slice(0, 5).map((u: any) => (
                                            <div key={u.email} className="flex justify-between items-center">
                                                <span className="text-sm font-semibold">{u.name}</span>
                                                <span className="text-xs text-cyan-400 font-bold">{u.friend_count} friends</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== INTELLIGENCE ===================== */}
                    {activeTab === 'intelligence' && (
                        <motion.div key="intel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6 text-center">
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Daily Active Users</p>
                                    <p className="text-4xl font-black text-white">{intelData?.kpis?.dau || 0}</p>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6 text-center">
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Monthly Active Users</p>
                                    <p className="text-4xl font-black text-cyan-400">{intelData?.kpis?.mau || 0}</p>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6 text-center">
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">30-Day Retention</p>
                                    <p className="text-4xl font-black text-purple-400">{intelData?.kpis?.retention || "0.0"}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Trending Search Queries</h3>
                                    <div className="space-y-2">
                                        {(intelData?.queries || []).map((q: any) => (
                                            <div key={q.query} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5">
                                                <span className="text-sm">"{q.query}"</span>
                                                <span className="text-xs font-black text-purple-400">{q.count} times</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Engagement Trends</h3>
                                    <SimpleBarChart data={intelData?.dailyMetrics || []} valueKey="total_bookings" labelKey="metric_date" color="#3B82F6" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Top Platform Spenders</h3>
                                    <div className="space-y-3">
                                        {(intelData?.topSpenders || []).map((s: any) => (
                                            <div key={s.email} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-bold">{s.name}</p>
                                                    <p className="text-[10px] text-gray-500">{s.email}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-green-400">৳{Number(s.total_spent).toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-600">{s.total_tickets} tickets</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Most Socially Active Users</h3>
                                    <div className="space-y-3">
                                        {(intelData?.sociallyActive || []).map((s: any) => (
                                            <div key={s.email} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-bold">{s.name}</p>
                                                    <p className="text-[10px] text-gray-500">{s.email}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-pink-400">{s.messages_sent} Messages</p>
                                                    <p className="text-[10px] text-gray-600">{s.friend_count} Friends</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== CAMPAIGNS ======================== */}
                    {activeTab === 'campaigns' && (
                        <motion.div key="campaigns" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h2 className="font-bold text-white text-lg flex items-center gap-2"><Mail size={18} className="text-pink-500" /> Platform Campaigns</h2>
                                        <p className="text-gray-500 text-sm mt-1">Cross-platform marketing broadcast tracker</p>
                                    </div>
                                    <Link href="/dashboard/campaigns">
                                        <button className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/20 font-bold text-xs rounded-xl transition-colors">
                                            Open Organizer Hub
                                        </button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-white/5 bg-[#0B0F1A]">
                                    <div className="bg-[#161B2B] p-4 rounded-xl border border-white/5">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Broadcasted</p>
                                        <p className="text-3xl font-black text-white">{campaigns.filter(c => c.status === 'SENT').length}</p>
                                    </div>
                                    <div className="bg-[#161B2B] p-4 rounded-xl border border-white/5">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Audience Reached</p>
                                        <p className="text-3xl font-black text-cyan-400">{campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0)}</p>
                                    </div>
                                    <div className="bg-[#161B2B] p-4 rounded-xl border border-white/5">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Drafts</p>
                                        <p className="text-3xl font-black text-orange-400">{campaigns.filter(c => c.status === 'DRAFT').length}</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-[#0B0F1A]">
                                                {['Campaign', 'Target', 'Status', 'Performance', 'Organizer', 'Date'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaigns.map((c, i) => (
                                                <motion.tr key={c.campaign_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-semibold text-white max-w-[200px] truncate">{c.campaign_name}</p>
                                                        <p className="text-[11px] text-gray-500 truncate max-w-[200px]">Sub: {c.subject}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 rounded uppercase text-[10px] font-bold bg-white/5 text-gray-400 border border-white/10">{c.target_audience.replace('_', ' ')}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full uppercase text-[10px] font-bold border ${c.status === 'SENT' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {c.status === 'SENT' ? (
                                                            <div>
                                                                <p className="text-sm font-bold text-cyan-400">{c.total_sent} Sent</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-600">Pending</p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-300 font-medium">{c.organizer_name || 'System'}</p>
                                                        <p className="text-[11px] text-gray-500">{c.organizer_email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {campaigns.length === 0 && <EmptyState message="No campaigns broadcasted across the platform yet." />}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ======================== SYSTEM STRUCTURE ================= */}
                    {activeTab === 'system' && (
                        <motion.div key="system" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h2 className="font-bold text-white text-lg flex items-center gap-2"><Settings size={18} className="text-gray-400" /> System Settings & Structure</h2>
                                        <p className="text-gray-500 text-sm mt-1">Manage platform categories, venues, and admin rules</p>
                                    </div>
                                    <Link href="/dashboard/settings">
                                        <button className="px-4 py-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/20 font-bold text-xs rounded-xl transition-colors">
                                            Open Account Settings
                                        </button>
                                    </Link>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Platform Categories ({systemData.categories.length})</h3>
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {systemData.categories.map((c: any) => (
                                            <div key={c.category_id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10 group">
                                                <span className="text-sm font-semibold">{c.name}</span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <AdminBtn onClick={async () => { if (confirm('Delete?')) { await fetch(`/api/admin/system?type=categories&id=${c.category_id}`, { method: 'DELETE' }); loadAll(); } }} color="red">Delete</AdminBtn>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={async () => { const n = prompt('Category Name:'); if (n) { await fetch('/api/admin/system', { method: 'POST', body: JSON.stringify({ type: 'categories', name: n }) }); loadAll(); } }} className="w-full py-2 border border-dashed border-white/10 rounded-xl text-gray-500 text-xs hover:text-white hover:border-white/20 transition-all">+ Add Category</button>
                                    </div>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Platform Venues ({systemData.venues.length})</h3>
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {systemData.venues.map((v: any) => (
                                            <div key={v.venue_id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10 group">
                                                <div>
                                                    <p className="text-sm font-semibold">{v.name}</p>
                                                    <p className="text-[10px] text-gray-500">{v.city} · {v.capacity} pax</p>
                                                </div>
                                                <AdminBtn onClick={async () => { if (confirm('Delete?')) { await fetch(`/api/admin/system?type=venues&id=${v.venue_id}`, { method: 'DELETE' }); loadAll(); } }} color="red">Delete</AdminBtn>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Admin Roles ({systemData.roles.length})</h3>
                                    <div className="space-y-3">
                                        {systemData.roles.map((r: any) => (
                                            <div key={r.role_id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-bold text-red-400 capitalize">{r.role_name}</p>
                                                    <span className="text-[10px] text-gray-500">ID: {r.role_id}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">{r.description || 'No description'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-[#161B2B] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4">Staff & Admin Users ({systemData.adminUsers.length})</h3>
                                    <div className="space-y-3">
                                        {systemData.adminUsers.map((au: any, i: number) => (
                                            <div key={au.user_id || au.id || i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                                <div>
                                                    <p className="text-sm font-semibold">{au.name}</p>
                                                    <p className="text-[10px] text-red-400 font-bold uppercase">{au.role_name}</p>
                                                </div>
                                                <AdminBtn onClick={async () => { if (confirm('Delete admin access?')) { await fetch(`/api/admin/users?id=${au.admin_user_id}`, { method: 'DELETE' }); loadAll(); } }} color="red">Revoke</AdminBtn>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}

// Reusable components
function AdminBtn({ children, onClick, color = 'blue' }: { children: React.ReactNode; onClick?: () => void; color?: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-500/15 text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20',
        green: 'bg-green-500/15 text-green-400 hover:bg-green-500 hover:text-white border-green-500/20',
        red: 'bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20',
        orange: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500 hover:text-white border-orange-500/20',
        yellow: 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500 hover:text-white border-yellow-500/20',
        gray: 'bg-gray-500/15 text-gray-400 hover:bg-gray-500 hover:text-white border-gray-500/20',
    };
    return (
        <button onClick={onClick} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all hover:scale-105 active:scale-95 ${colors[color] || colors.blue}`}>
            {children}
        </button>
    );
}

function RoleBadge({ role }: { role: string }) {
    const styles: Record<string, string> = {
        admin: 'bg-red-500/10 text-red-400 border-red-500/20',
        organizer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        attendee: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[role] || styles.attendee}`}>
            {role}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const styles: Record<string, string> = {
        PUBLISHED: 'bg-green-500/10 text-green-400 border-green-500/20',
        DRAFT: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
        COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        REQUESTED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        PENDING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/20',
        DISMISSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[s] || 'bg-white/5 text-gray-400 border-white/10'}`}>
            {status}
        </span>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-16 text-center">
            <p className="text-gray-500">{message}</p>
        </div>
    );
}

function SimpleBarChart({ data, valueKey, labelKey, color }: { data: any[]; valueKey: string; labelKey: string; color: string }) {
    if (!data || data.length === 0) return <p className="text-gray-600 text-sm py-4">No data yet</p>;
    const max = Math.max(...data.map((d: any) => Number(d[valueKey]) || 0), 1);
    const recent = data.slice(-20);
    return (
        <div className="flex items-end gap-1 h-28">
            {recent.map((d: any, i: number) => {
                const pct = (Number(d[valueKey]) / max) * 100;
                return (
                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group relative">
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
                            {d[valueKey]}
                        </div>
                        <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max(2, pct)}%`, backgroundColor: color, opacity: 0.7 + (i / recent.length) * 0.3 }} />
                    </div>
                );
            })}
        </div>
    );
}
