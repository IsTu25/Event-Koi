'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Plus, Users, Send, CheckCircle, Clock,
    Trash2, Edit3, Loader, BarChart2, X, AlertCircle
} from 'lucide-react';
import Link from 'next/link';


export default function EmailCampaigns() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        campaign_name: '',
        subject: '',
        body_content: '',
        target_audience: 'ALL_ATTENDEES'
    });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push('/login'); return; }
        const u = JSON.parse(stored);
        if (u.role !== 'organizer' && u.role !== 'admin') { router.push('/dashboard'); return; }
        setUser(u);
        loadData(u.id);
    }, [router]);

    const loadData = async (uid: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/organizer/campaigns?organizer_id=${uid}`);
            if (res.ok) setCampaigns(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreateDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch('/api/organizer/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, organizer_id: user.id })
            });
            if (res.ok) {
                setIsAdding(false);
                setFormData({ campaign_name: '', subject: '', body_content: '', target_audience: 'ALL_ATTENDEES' });
                loadData(user.id);
            } else {
                alert('Failed to save draft');
            }
        } catch (e) { alert('Failed to create campaign'); }
        setActionLoading(false);
    };

    const handleSend = async (campaignId: number) => {
        if (!confirm('Are you sure you want to send this campaign now? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/organizer/campaigns', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SEND', campaign_id: campaignId, organizer_id: user.id })
            });
            if (res.ok) {
                alert('Campaign Sent!');
                loadData(user.id);
            }
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    if (loading && !user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center"><Loader className="animate-spin text-cyan-500" /></div>;

    const totalSent = campaigns.reduce((acc, c) => acc + (c.total_sent || 0), 0);
    const avgOpen = totalSent > 0 ? (campaigns.reduce((acc, c) => acc + (c.opened || 0), 0) / totalSent * 100) : 0;

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans pb-20">
            {/* Ambient Base */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-10 right-10 w-[40vw] h-[40vw] bg-pink-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-10 left-10 w-[40vw] h-[40vw] bg-orange-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-10">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white flex items-center gap-3">
                            Email <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">Campaigns</span>
                        </h1>
                        <p className="text-gray-500 mt-2">Design, schedule, and track communications with attendees.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20"
                    >
                        <Plus size={18} />
                        New Campaign
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Total Emails Sent</h3>
                            <p className="text-5xl font-black text-white">{totalSent.toLocaleString()}</p>
                            <div className="mt-4 flex items-center gap-2 text-xs text-green-400 font-bold">
                                {campaigns.filter(c => c.status === 'SENT').length} Campaigns
                            </div>
                        </div>

                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Avg. Open Rate</h3>
                            <p className="text-4xl font-black text-orange-400">{avgOpen.toFixed(1)}%</p>
                        </div>
                    </div>

                    {/* Active Campaigns */}
                    <div className="lg:col-span-3 space-y-6">
                        {campaigns.length === 0 ? (
                            <div className="py-20 text-center bg-[#161B2B] border border-dashed border-white/10 rounded-3xl">
                                <Mail size={40} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-white font-bold mb-2">No Campaigns Yet</h3>
                                <p className="text-gray-500 text-sm">Start your first email marketing campaign.</p>
                            </div>
                        ) : (
                            campaigns.map(c => (
                                <motion.div key={c.campaign_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161B2B] border border-white/5 rounded-2xl p-6 hover:border-pink-500/20 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border 
                                                    ${c.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                                        c.status === 'SENT' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                    {c.status}
                                                </span>
                                                <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-1">{c.campaign_name}</h3>
                                            <p className="text-sm text-gray-400 mb-4">Subject: "{c.subject}"</p>

                                            {c.status !== 'DRAFT' && (
                                                <div className="flex items-center gap-6 mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={16} className="text-gray-500" />
                                                        <div className="text-sm"><span className="font-bold text-white">{c.total_sent}</span> <span className="text-xs text-gray-500">Sent</span></div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <BarChart2 size={16} className="text-orange-500" />
                                                        <div className="text-sm"><span className="font-bold text-orange-400">{c.total_sent > 0 ? ((c.opened / c.total_sent) * 100).toFixed(0) : 0}%</span> <span className="text-xs text-gray-500">Opened</span></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center justify-end gap-3 min-w-[120px]">
                                            {c.status === 'DRAFT' && (
                                                <button
                                                    disabled={actionLoading}
                                                    onClick={() => handleSend(c.campaign_id)}
                                                    className="w-full py-2 bg-pink-600 hover:bg-pink-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-900/20 transition-colors"
                                                >
                                                    <Send size={14} /> Send Now
                                                </button>
                                            )}
                                            {c.status === 'SENT' && (
                                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                                                    <CheckCircle size={12} className="text-green-500" /> Sent on {new Date(c.sent_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Campaign Builder Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#161B2B] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0B0F1A]">
                                <h3 className="font-black text-xl flex items-center gap-2"><Edit3 className="text-pink-500" /> HTML Email Builder</h3>
                                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleCreateDraft} className="p-6 overflow-y-auto flex-1 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Campaign Name (Internal)</label>
                                        <input required className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/50 outline-none" placeholder="Flash Sale May" value={formData.campaign_name} onChange={e => setFormData({ ...formData, campaign_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Audience</label>
                                        <select required className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/50 outline-none appearance-none" value={formData.target_audience} onChange={e => setFormData({ ...formData, target_audience: e.target.value })}>
                                            <option value="ALL_ATTENDEES">All Past Attendees</option>
                                            <option value="WAITLIST">Waitlist Users</option>
                                            <option value="FOLLOWERS">My Followers</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email Subject Line</label>
                                    <input required className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/50 outline-none" placeholder="Don't miss out on tickets..." value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Content</label>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><AlertCircle size={10} /> Supports basic HTML</span>
                                    </div>
                                    <textarea
                                        required
                                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-pink-500/50 outline-none min-h-[250px] text-gray-300"
                                        placeholder="<h1>Hi there!</h1>\n<p>Tickets are selling fast...</p>"
                                        value={formData.body_content}
                                        onChange={e => setFormData({ ...formData, body_content: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 flex gap-3 border-t border-white/5">
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/5 transition-all">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-white hover:bg-gray-200 text-black rounded-2xl text-sm font-bold transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader size={16} className="animate-spin" /> : 'Save as Draft'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
