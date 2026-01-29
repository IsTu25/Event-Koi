'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Calendar, MapPin, Type, AlignLeft, CreditCard, DollarSign,
    ArrowLeft, CheckCircle, Loader, Layers, Clock, ShieldCheck
} from 'lucide-react';

export default function CreateEvent() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [useCustomVenue, setUseCustomVenue] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        venue_id: '',
        venue_name: '',
        category_id: '',
        status: 'PUBLISHED'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchVenuesAndCategories();
    }, [router]);

    const fetchVenuesAndCategories = async () => {
        try {
            const [vRes, cRes] = await Promise.all([
                fetch('/api/venues'),
                fetch('/api/categories')
            ]);

            if (vRes.ok) setVenues(await vRes.json());
            if (cRes.ok) setCategories(await cRes.json());
        } catch (error) {
            console.error('Failed to fetch options', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    organizer_id: user.id || user.userId || (user as any).insertId,
                    listing_fee: 1000.00,
                    payment_confirmed: true
                })
            });

            if (!res.ok) throw new Error('Failed to create event');

            router.push('/dashboard');
        } catch (error) {
            alert('Error creating event');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans selection:bg-cyan-500/30 pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-cyan-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-10">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
                            ✨
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white">Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Event</span></h1>
                            <p className="text-gray-400 mt-1">Design an unforgettable experience.</p>
                        </div>
                    </div>
                </motion.header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Event Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Info Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-1 space-y-6"
                        >
                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-lg font-bold text-white mb-2">Event Basics</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Provide the core details of your event. A catchy title and clear description help attract more attendees.
                                </p>
                            </div>

                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-lg font-bold text-white mb-2">Timing & Location</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Ensure the dates are correct. Choose a venue from our list or specify a custom location.
                                </p>
                            </div>
                        </motion.div>

                        {/* Right Form Inputs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2 space-y-6"
                        >
                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8 space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Title</label>
                                    <div className="relative group">
                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                            placeholder="e.g. Summer Music Festival 2024"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                    <div className="relative group">
                                        <AlignLeft className="absolute left-4 top-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                        <textarea
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium min-h-[120px] resize-none"
                                            placeholder="Tell potential attendees what to expect..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Start Time */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Time</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium custom-date-input"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* End Time */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">End Time</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium custom-date-input"
                                                value={formData.end_time}
                                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Venue */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Venue</label>
                                            <button
                                                type="button"
                                                onClick={() => setUseCustomVenue(!useCustomVenue)}
                                                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider hover:underline"
                                            >
                                                {useCustomVenue ? 'Select Existing' : 'Enter Custom'}
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            {useCustomVenue ? (
                                                <input
                                                    type="text"
                                                    placeholder="Custom Venue Name"
                                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                                    value={formData.venue_name}
                                                    onChange={(e) => setFormData({ ...formData, venue_name: e.target.value, venue_id: '' })}
                                                />
                                            ) : (
                                                <select
                                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium appearance-none"
                                                    value={formData.venue_id}
                                                    onChange={(e) => setFormData({ ...formData, venue_id: e.target.value, venue_name: '' })}
                                                >
                                                    <option value="" className="bg-[#0B0F1A]">Select a Venue</option>
                                                    {venues.map((v: any) => (
                                                        <option key={v.venue_id} value={v.venue_id} className="bg-[#0B0F1A]">{v.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                        <div className="relative group">
                                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <select
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium appearance-none"
                                                value={formData.category_id}
                                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            >
                                                <option value="" className="bg-[#0B0F1A]">Select Category</option>
                                                {categories.map((c: any) => (
                                                    <option key={c.category_id} value={c.category_id} className="bg-[#0B0F1A]">{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Payment Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-1"
                        >
                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6 h-full flex flex-col justify-center">
                                <div className="p-3 bg-green-500/10 rounded-xl w-fit text-green-500 mb-4">
                                    <DollarSign size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Listing Fee</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-3xl font-black text-white">৳1,000</span>
                                    <span className="text-sm text-gray-500">BDT</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    A one-time fee is required to publish your event on the Event Ekhanei platform.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-2"
                        >
                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                {/* Decorative Background for Payment */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                <div className="flex items-center gap-3 mb-6">
                                    <CreditCard className="text-cyan-400" size={24} />
                                    <h3 className="text-xl font-bold text-white">Payment Method</h3>
                                </div>

                                {/* Mock Card Form */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-all font-mono tracking-widest"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM / YY"
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CVC</label>
                                            <input
                                                type="text"
                                                placeholder="123"
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-center"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cardholder Name</label>
                                        <input
                                            type="text"
                                            placeholder="NAME ON CARD"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-all font-medium uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                                    <ShieldCheck size={14} className="text-green-500" />
                                    <span>Payments are secure and encrypted.</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Submit Action */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="pt-6"
                    >
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-6 h-6 animate-spin" />
                                    Processing Payment & Creating Event...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-6 h-6" />
                                    Pay & Publish Event
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>
            </div>
        </div>
    );
}
