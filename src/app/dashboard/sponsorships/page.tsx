'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Plus, DollarSign, Users, Briefcase,
    CheckCircle, Clock, Trash2, Edit3, Loader, Save, X
} from 'lucide-react';
import Link from 'next/link';

export default function SponsorshipManagement() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState<any[]>([]);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        event_id: '',
        name: '',
        description: '',
        price: '',
        total_slots: '1',
        benefits: ''
    });

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
            const [sponsorRes, eventsRes] = await Promise.all([
                fetch(`/api/organizer/sponsorships?organizer_id=${uid}`),
                fetch(`/api/events?organizer_id=${uid}`)
            ]);

            if (sponsorRes.ok) {
                const data = await sponsorRes.json();
                setPackages(data.packages || []);
                setSponsorships(data.sponsorships || []);
            }
            if (eventsRes.ok) setMyEvents(await eventsRes.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/organizer/sponsorships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    total_slots: parseInt(formData.total_slots),
                    benefits: formData.benefits.split(',').map(b => b.trim())
                })
            });
            if (res.ok) {
                setIsAdding(false);
                setFormData({ event_id: '', name: '', description: '', price: '', total_slots: '1', benefits: '' });
                loadData(user.id);
            }
        } catch (e) { alert('Failed to create package'); }
        setLoading(false);
    };

    if (loading && !user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center"><Loader className="animate-spin text-cyan-500" /></div>;

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans pb-20">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-purple-900/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-cyan-900/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-10">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-black text-white flex items-center gap-3">
                            Sponsorship <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Hub</span>
                        </h1>
                        <p className="text-gray-500 mt-2">Create packages and manage sponsors for your events</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/20"
                    >
                        <Plus size={18} />
                        Create Tier
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Packages */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Briefcase className="text-purple-400" size={20} />
                            Your Sponsorship Tiers
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {packages.map(pkg => (
                                <motion.div key={pkg.package_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#161B2B] border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                                            {pkg.event_title}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><Edit3 size={14} /></button>
                                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-1">{pkg.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{pkg.description}</p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <div className="text-green-400 font-black text-xl">৳{Number(pkg.price).toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-gray-600 uppercase italic">
                                            {pkg.slots_taken} / {pkg.total_slots} SLOTS TAKEN
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {packages.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-[#161B2B] border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-gray-500 italic">No sponsorship tiers created yet.</p>
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-bold flex items-center gap-2 pt-6">
                            <CheckCircle className="text-green-400" size={20} />
                            Active Sponsor Agreements
                        </h2>
                        <div className="bg-[#161B2B] border border-white/5 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Sponsor</th>
                                        <th className="px-6 py-4">Event / Tier</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sponsorships.map(s => (
                                        <tr key={s.sponsorship_id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-sm">{s.sponsor_name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-white">{s.event_title}</p>
                                                <p className="text-[10px] text-gray-500 italic">{s.package_name}</p>
                                            </td>
                                            <td className="px-6 py-4 text-green-400 font-bold text-sm">৳{Number(s.amount_paid).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border 
                                                    ${s.payment_status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                    {s.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {sponsorships.length === 0 && (
                                        <tr><td colSpan={4} className="py-12 text-center text-gray-600 text-sm">No active sponsorships yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stats & Tips */}
                    <div className="space-y-6">
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} className="text-green-400" /></div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Sponsorship Revenue</h3>
                            <p className="text-4xl font-black text-white">৳{sponsorships.reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0).toLocaleString()}</p>
                            <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                                <Clock size={12} />
                                <span>Updated just now</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-6">
                            <h4 className="font-bold text-white mb-2">Organizer Tips 💡</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex gap-2 italic"><span>•</span> Create multiple tiers (Bronze, Silver, Gold) to attract different budgets.</li>
                                <li className="flex gap-2 italic"><span>•</span> Clearly list benefits like brand visibility, VIP tickets, and speaking slots.</li>
                                <li className="flex gap-2 italic"><span>•</span> Upload a sample sponsorship deck to attract larger corporate partners.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#161B2B] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-black text-xl">Create Sponsorship Tier</h3>
                                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreatePackage} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Event</label>
                                    <select required className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm" value={formData.event_id} onChange={e => setFormData({ ...formData, event_id: e.target.value })}>
                                        <option value="">Select an Event</option>
                                        {myEvents.map(e => <option key={e.event_id} value={e.event_id}>{e.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tier Name (e.g. Platinum)</label>
                                    <input required className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm" type="text" placeholder="Gold Partner" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm h-20" placeholder="Briefly explain this tier..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price (৳)</label>
                                        <input required className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono" type="number" placeholder="50000" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Slots Available</label>
                                        <input required className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm" type="number" value={formData.total_slots} onChange={e => setFormData({ ...formData, total_slots: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Benefits (comma separated)</label>
                                    <input className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm" type="text" placeholder="Logo on banner, 2 VIP tickets, Stage mention" value={formData.benefits} onChange={e => setFormData({ ...formData, benefits: e.target.value })} />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/5 transition-all">Cancel</button>
                                    <button type="submit" disabled={loading} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                                        {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save Package
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
