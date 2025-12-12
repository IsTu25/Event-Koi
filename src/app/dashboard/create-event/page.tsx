'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateEvent() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        venue_id: '',
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
        <div className="relative min-h-screen animated-gradient-bg text-white">
            {/* Floating Orbs */}
            <div className="floating-orb orb-1 opacity-30" />
            <div className="floating-orb orb-2 opacity-30" />

            <div className="relative z-10 max-w-4xl mx-auto p-6 lg:p-8">
                {/* Header */}
                <header className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/30">
                            ✨
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gradient-glow">Create New Event</h1>
                            <p className="text-gray-400 mt-1">Fill in the details to publish your event</p>
                        </div>
                    </div>
                </header>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Event Details Card */}
                    <div className="glass-strong rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-lg">
                                📝
                            </div>
                            <h2 className="text-xl font-bold text-white">Event Details</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Event Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="premium-input w-full text-lg"
                                    placeholder="Give your event an exciting name"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    className="premium-input w-full h-32 resize-none"
                                    placeholder="Tell people what your event is about..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Start Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="premium-input w-full dark-calendar"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">End Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="premium-input w-full dark-calendar"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Venue</label>
                                    <select
                                        className="premium-input w-full"
                                        value={formData.venue_id}
                                        onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                                    >
                                        <option value="">Select a Venue (Optional)</option>
                                        {venues.map((v: any) => (
                                            <option key={v.venue_id} value={v.venue_id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                                    <select
                                        className="premium-input w-full"
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Select a Category (Optional)</option>
                                        {categories.map((c: any) => (
                                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Card */}
                    <div className="glass-strong rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg">
                                    💳
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Listing Fee Payment</h2>
                                    <p className="text-sm text-gray-400">Pay to publish your event</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-gradient">৳1,000</span>
                                <span className="block text-xs text-gray-500">One-time fee</span>
                            </div>
                        </div>

                        <div className="premium-card p-6 shimmer">
                            <div className="absolute top-4 right-4 opacity-10">
                                <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M2 10h20v2H2zm0-2V6c0-1.103.897-2 2-2h16c1.103 0 2 .897 2 2v2H2zm0 12v-8h20v8c0 1.103-.897 2-2 2H4c-1.103 0-2-.897-2-2z" />
                                </svg>
                            </div>

                            <div className="relative z-10 space-y-5">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Card Number</label>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        className="premium-input w-full font-mono tracking-widest"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Expiry</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            className="premium-input w-full font-mono text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">CVC</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            className="premium-input w-full font-mono text-center"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Cardholder Name</label>
                                    <input
                                        type="text"
                                        placeholder="JOHN DOE"
                                        className="premium-input w-full uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Your payment is secure and encrypted</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full gradient-btn py-5 rounded-2xl text-xl font-bold disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Event...
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                Create & Publish Event
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
