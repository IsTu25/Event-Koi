'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EventDetails() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [user, setUser] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [ticketTypes, setTicketTypes] = useState<any[]>([]);
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [newTicket, setNewTicket] = useState({
        name: '',
        price: '',
        quantity: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        venue_id: '',
        category_id: ''
    });
    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Fetch venues and categories for editing
    useEffect(() => {
        if (isEditing && venues.length === 0) {
            fetch('/api/venues').then(r => r.json()).then(setVenues);
            fetch('/api/categories').then(r => r.json()).then(setCategories);
        }
    }, [isEditing]);

    // Populate form when event loads
    useEffect(() => {
        if (event) {
            setEditFormData({
                title: event.title,
                description: event.description,
                start_time: new Date(event.start_time).toISOString().slice(0, 16),
                end_time: new Date(event.end_time).toISOString().slice(0, 16),
                venue_id: event.venue_id,
                category_id: event.category_id
            });
        }
    }, [event]);

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });
            if (res.ok) {
                alert('Event updated successfully');
                setIsEditing(false);
                fetchData(id as string);
            } else {
                alert('Update failed');
            }
        } catch (err) {
            alert('Error updating event');
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (id) {
            fetchData(id as string);
        }
    }, [id, router]);

    const fetchData = async (eventId: string) => {
        try {
            const [eventRes, ticketsRes, sponsorsRes] = await Promise.all([
                fetch(`/api/events/${eventId}`),
                fetch(`/api/ticket-types?event_id=${eventId}`),
                fetch(`/api/sponsors?event_id=${eventId}`)
            ]);

            if (eventRes.ok) setEvent(await eventRes.json());
            if (ticketsRes.ok) setTicketTypes(await ticketsRes.json());
            if (sponsorsRes.ok) setSponsors(await sponsorsRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/ticket-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: id,
                    name: newTicket.name,
                    price: parseFloat(newTicket.price),
                    quantity: parseInt(newTicket.quantity)
                })
            });

            if (res.ok) {
                setNewTicket({ name: '', price: '', quantity: '' });
                fetchData(id as string);
            } else {
                alert('Failed to add ticket type');
            }
        } catch (error) {
            console.error(error);
            alert('Error adding ticket type');
        } finally {
            setSubmitting(false);
        }
    };

    // Add Sponsor Handler
    const [newSponsor, setNewSponsor] = useState({ name: '', contribution: '', tier: 'Partner', logo: null as File | null });
    const [sponsorLoading, setSponsorLoading] = useState(false);

    const handleAddSponsor = async (e: React.FormEvent) => {
        e.preventDefault();
        setSponsorLoading(true);
        const data = new FormData();
        data.append('event_id', id as string);
        data.append('name', newSponsor.name);
        data.append('contribution_amount', newSponsor.contribution);
        data.append('tier', newSponsor.tier);
        if (newSponsor.logo) data.append('logo', newSponsor.logo);

        try {
            const res = await fetch('/api/sponsors', { method: 'POST', body: data });
            if (res.ok) {
                setNewSponsor({ name: '', contribution: '', tier: 'Partner', logo: null });
                fetchData(id as string);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSponsorLoading(false);
        }
    };

    if (!user || loading) {
        return (
            <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
                <div className="text-center glass-strong p-12 rounded-3xl">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
                    <p className="text-gray-400 mb-6">The event you're looking for doesn't exist or has been removed.</p>
                    <Link href="/dashboard" className="gradient-btn px-6 py-3 rounded-xl font-bold inline-block">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const isOrganizer = user.id === event.organizer_id;

    return (
        <div className="relative min-h-screen animated-gradient-bg text-white">
            {/* Floating Orbs */}
            <div className="floating-orb orb-1 opacity-20" />
            <div className="floating-orb orb-2 opacity-20" />

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
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

                    {/* Event Hero */}
                    <div className="glass-strong rounded-3xl p-8 mb-8">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            className="premium-input w-full text-2xl font-bold"
                                            value={editFormData.title}
                                            onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                            placeholder="Event Title"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="datetime-local"
                                                className="premium-input dark-calendar"
                                                value={editFormData.start_time}
                                                onChange={e => setEditFormData({ ...editFormData, start_time: e.target.value })}
                                            />
                                            <select
                                                className="premium-input"
                                                value={editFormData.venue_id}
                                                onChange={e => setEditFormData({ ...editFormData, venue_id: e.target.value })}
                                            >
                                                <option value="">Select Venue</option>
                                                {venues.map(v => <option key={v.venue_id} value={v.venue_id}>{v.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <span className={`badge-${event.status === 'PUBLISHED' ? 'success' : 'warning'}`}>
                                                {event.status}
                                            </span>
                                            {event.category_name && (
                                                <span className="badge-primary">{event.category_name}</span>
                                            )}
                                        </div>
                                        <h1 className="text-4xl lg:text-5xl font-black text-gradient-glow mb-4">
                                            {event.title}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-6 text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">📅</span>
                                                <div>
                                                    <span className="block text-white font-medium">
                                                        {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-sm">
                                                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            {event.venue_name && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">📍</span>
                                                    <div>
                                                        <span className="block text-white font-medium">{event.venue_name}</span>
                                                        <span className="text-sm">{event.venue_city}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">👤</span>
                                                <div>
                                                    <span className="block text-white font-medium">{event.organizer_name}</span>
                                                    <span className="text-sm">Organizer</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Organizer Controls */}
                            {isOrganizer && (
                                <div className="flex flex-col items-end gap-4">
                                    <div className="stat-card text-center min-w-[150px]">
                                        <span className="text-sm text-gray-400 block mb-1">Total Sales</span>
                                        <span className="text-3xl font-black text-gradient">৳0</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="glass px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                                        >
                                            {isEditing ? '✕ Cancel' : '✏️ Edit'}
                                        </button>
                                        {isEditing && (
                                            <button
                                                onClick={handleUpdateEvent}
                                                className="gradient-btn px-5 py-2.5 rounded-xl font-semibold"
                                            >
                                                💾 Save
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to DELETE this event? This action cannot be undone.")) {
                                                    await fetch(`/api/events/${id}`, { method: 'DELETE' });
                                                    router.push('/dashboard');
                                                }
                                            }}
                                            className="glass px-5 py-2.5 rounded-xl font-semibold text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/30"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Updates Section */}
                        <div className="glass-strong rounded-3xl p-8">
                            <EventUpdates eventId={id as string} user={user} isOrganizer={isOrganizer} />
                        </div>

                        {/* About Section */}
                        <div className="glass-strong rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-xl">
                                    📝
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">About This Event</h2>
                                    <p className="text-gray-400 text-sm">Event description and details</p>
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <textarea
                                        className="premium-input w-full min-h-[200px] resize-none"
                                        value={editFormData.description}
                                        onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                        placeholder="Event Description..."
                                    />
                                    <div>
                                        <label className="text-gray-400 text-sm mb-2 block">Category</label>
                                        <select
                                            className="premium-input w-full"
                                            value={editFormData.category_id}
                                            onChange={e => setEditFormData({ ...editFormData, category_id: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {event.description || 'No description provided for this event.'}
                                </p>
                            )}
                        </div>

                        {/* Sponsors Section */}
                        <div className="glass-strong rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">
                                    🤝
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Sponsors</h2>
                                    <p className="text-gray-400 text-sm">Companies supporting this event</p>
                                </div>
                            </div>

                            {sponsors.filter(s => s.status === 'APPROVED').length === 0 ? (
                                <div className="text-center py-12 glass rounded-2xl">
                                    <div className="text-4xl mb-3">🏢</div>
                                    <p className="text-gray-400">No sponsors yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {sponsors.filter(s => s.status === 'APPROVED').map((s: any) => (
                                        <div key={s.sponsor_id} className="premium-card p-6 text-center group">
                                            {s.logo_url && (
                                                <img src={s.logo_url} alt={s.name} className="h-12 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                            )}
                                            <h4 className="font-bold text-white mb-2">{s.name}</h4>
                                            <span className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full ${s.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                    s.tier === 'Silver' ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                                                        s.tier === 'Bronze' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                            'badge-primary'
                                                }`}>{s.tier}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ticket Types Section */}
                        <div className="glass-strong rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xl">
                                    🎫
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Ticket Packages</h2>
                                    <p className="text-gray-400 text-sm">Available ticket options</p>
                                </div>
                            </div>

                            {ticketTypes.length === 0 ? (
                                <div className="text-center py-12 glass rounded-2xl border-dashed border-2 border-white/10">
                                    <div className="text-4xl mb-3">🎟️</div>
                                    <p className="text-gray-400">No tickets created yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ticketTypes.map((ticket) => (
                                        <div key={ticket.ticket_type_id} className="premium-card p-6 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{ticket.name}</h3>
                                                <p className="text-sm text-gray-400">{ticket.quantity} tickets available</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-gradient">৳{Number(ticket.price).toFixed(0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {isOrganizer ? (
                            <>
                                {/* Create Ticket Form */}
                                <div className="glass-strong rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-lg">
                                            🎟️
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Create Ticket</h3>
                                    </div>
                                    <form onSubmit={handleAddTicket} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Ticket Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. VIP Access"
                                                required
                                                className="premium-input w-full"
                                                value={newTicket.name}
                                                onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Price (৳)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    placeholder="0.00"
                                                    className="premium-input w-full"
                                                    value={newTicket.price}
                                                    onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
                                                <input
                                                    type="number"
                                                    required
                                                    placeholder="100"
                                                    className="premium-input w-full"
                                                    value={newTicket.quantity}
                                                    onChange={(e) => setNewTicket({ ...newTicket, quantity: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full gradient-btn py-3 rounded-xl font-bold disabled:opacity-50"
                                        >
                                            {submitting ? 'Adding...' : '+ Add Ticket Type'}
                                        </button>
                                    </form>
                                </div>

                                {/* Add Sponsor Form */}
                                <div className="glass-strong rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg">
                                            🤝
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Add Sponsor</h3>
                                    </div>
                                    <form onSubmit={handleAddSponsor} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Sponsor Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="premium-input w-full"
                                                value={newSponsor.name}
                                                onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Tier</label>
                                                <select
                                                    className="premium-input w-full"
                                                    value={newSponsor.tier}
                                                    onChange={e => setNewSponsor({ ...newSponsor, tier: e.target.value })}
                                                >
                                                    <option>Partner</option>
                                                    <option>Bronze</option>
                                                    <option>Silver</option>
                                                    <option>Gold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Amount (৳)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="premium-input w-full"
                                                    value={newSponsor.contribution}
                                                    onChange={e => setNewSponsor({ ...newSponsor, contribution: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Logo</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => e.target.files && setNewSponsor({ ...newSponsor, logo: e.target.files[0] })}
                                                className="w-full text-sm text-gray-400"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={sponsorLoading}
                                            className="w-full glass py-3 rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                                        >
                                            {sponsorLoading ? 'Adding...' : '+ Add Sponsor'}
                                        </button>
                                    </form>
                                </div>

                                {/* Pending Sponsor Requests */}
                                {sponsors.filter(s => s.status === 'PENDING').length > 0 && (
                                    <div className="glass-strong rounded-3xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <span className="text-yellow-500">⏳</span>
                                            Pending Requests ({sponsors.filter(s => s.status === 'PENDING').length})
                                        </h3>
                                        <div className="space-y-4">
                                            {sponsors.filter(s => s.status === 'PENDING').map((s: any) => (
                                                <div key={s.sponsor_id} className="premium-card p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        {s.logo_url && <img src={s.logo_url} className="w-8 h-8 object-contain rounded" />}
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{s.name}</h4>
                                                            <p className="text-xs text-gray-500">{s.tier} • ৳{s.contribution_amount}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                await fetch('/api/sponsors', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ sponsor_id: s.sponsor_id, status: 'APPROVED' })
                                                                });
                                                                fetchData(id as string);
                                                            }}
                                                            className="py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500 hover:text-white transition-colors"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                await fetch('/api/sponsors', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ sponsor_id: s.sponsor_id, status: 'REJECTED' })
                                                                });
                                                                fetchData(id as string);
                                                            }}
                                                            className="py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors"
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Buy Tickets (Attendee View) */}
                                <div className="glass-strong rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-lg">
                                            🎫
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Get Tickets</h3>
                                    </div>

                                    {ticketTypes.length === 0 ? (
                                        <div className="text-center py-8 glass rounded-xl">
                                            <p className="text-gray-400">Tickets not yet available</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {ticketTypes.map((ticket) => (
                                                <div key={ticket.ticket_type_id} className="premium-card p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="font-bold text-white">{ticket.name}</span>
                                                        <span className="text-xl font-black text-gradient">৳{Number(ticket.price).toFixed(0)}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-4">{ticket.quantity} remaining</p>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm(`Book ${ticket.name} for ৳${ticket.price}?`)) return;
                                                            try {
                                                                const res = await fetch('/api/bookings', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        user_id: user.id,
                                                                        event_id: id,
                                                                        ticket_type_id: ticket.ticket_type_id
                                                                    })
                                                                });
                                                                if (res.ok) {
                                                                    alert('Ticket Booked Successfully! View in "My Tickets".');
                                                                    fetchData(id as string);
                                                                } else {
                                                                    alert('Booking Failed');
                                                                }
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert('Error booking ticket');
                                                            }
                                                        }}
                                                        disabled={ticket.quantity <= 0}
                                                        className="w-full gradient-btn py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {ticket.quantity > 0 ? '🎟️ Buy Ticket' : '❌ Sold Out'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Become Sponsor Form */}
                                <div className="glass-strong rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg">
                                            🤝
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Become a Sponsor</h3>
                                            <p className="text-xs text-gray-400">Support this event</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleAddSponsor} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="premium-input w-full"
                                                value={newSponsor.name}
                                                onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Tier</label>
                                                <select
                                                    className="premium-input w-full"
                                                    value={newSponsor.tier}
                                                    onChange={e => setNewSponsor({ ...newSponsor, tier: e.target.value })}
                                                >
                                                    <option>Partner</option>
                                                    <option>Bronze</option>
                                                    <option>Silver</option>
                                                    <option>Gold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Amount (৳)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    className="premium-input w-full"
                                                    value={newSponsor.contribution}
                                                    onChange={e => setNewSponsor({ ...newSponsor, contribution: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Logo (Optional)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => e.target.files && setNewSponsor({ ...newSponsor, logo: e.target.files[0] })}
                                                className="w-full text-sm text-gray-400"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={sponsorLoading}
                                            className="w-full gradient-btn py-3 rounded-xl font-bold disabled:opacity-50"
                                        >
                                            {sponsorLoading ? 'Submitting...' : '📤 Submit Application'}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Event Updates Component
function EventUpdates({ eventId, user, isOrganizer }: { eventId: string, user: any, isOrganizer: boolean }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [eventId]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/posts?event_id=${eventId}&user_id=${user.id}`);
            if (res.ok) setPosts(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setPosting(true);
        try {
            const formData = new FormData();
            formData.append('event_id', eventId);
            formData.append('user_id', user.id);
            formData.append('content', content);
            if (image) formData.append('image', image);

            const res = await fetch('/api/posts', { method: 'POST', body: formData });
            if (res.ok) {
                setContent('');
                setImage(null);
                fetchPosts();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setPosting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xl">
                    📢
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Updates & News</h2>
                    <p className="text-gray-400 text-sm">Latest announcements from the organizer</p>
                </div>
            </div>

            {isOrganizer && (
                <form onSubmit={handleCreatePost} className="mb-8 glass rounded-2xl p-4">
                    <textarea
                        className="premium-input w-full mb-3 resize-none"
                        placeholder="Post an update for your attendees..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                        rows={3}
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                id="post-image"
                                className="hidden"
                                onChange={e => e.target.files && setImage(e.target.files[0])}
                            />
                            <label htmlFor="post-image" className="cursor-pointer text-gray-400 hover:text-white flex items-center gap-2 text-sm glass px-3 py-2 rounded-lg">
                                📷 {image ? <span className="text-green-400">{image.name}</span> : 'Add Photo'}
                            </label>
                            {image && (
                                <button type="button" onClick={() => setImage(null)} className="text-red-400 text-sm hover:underline">
                                    Remove
                                </button>
                            )}
                        </div>
                        <button
                            disabled={posting}
                            className="gradient-btn px-6 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                        >
                            {posting ? 'Posting...' : '📤 Post Update'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {posts.length === 0 ? (
                    <div className="text-center py-12 glass rounded-2xl">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-gray-400">No updates yet</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.post_id} post={post} user={user} refresh={fetchPosts} />
                    ))
                )}
            </div>
        </div>
    );
}

// Post Card Component
function PostCard({ post, user, refresh }: { post: any, user: any, refresh: () => void }) {
    const [commenting, setCommenting] = useState(false);
    const [commentText, setCommentText] = useState('');

    const handleLike = async () => {
        await fetch('/api/posts/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: post.post_id, user_id: user.id })
        });
        refresh();
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/posts/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: post.post_id, user_id: user.id, content: commentText })
        });
        setCommentText('');
        setCommenting(false);
        refresh();
    };

    return (
        <div className="premium-card p-6">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                        {post.author_image ? (
                            <img src={post.author_image} className="w-full h-full object-cover" />
                        ) : (
                            <span>👤</span>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white">{post.author_name}</h4>
                    <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</span>
                </div>
            </div>

            {/* Content */}
            <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            {post.image_url && (
                <img src={post.image_url} className="w-full rounded-xl mb-4" alt="Post" />
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 text-sm text-gray-400 border-t border-white/10 pt-4">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 hover:text-pink-400 transition-colors ${post.is_liked ? 'text-pink-500' : ''}`}
                >
                    <span className="text-lg">{post.is_liked ? '❤️' : '🤍'}</span>
                    {post.like_count} Likes
                </button>
                <button
                    onClick={() => setCommenting(!commenting)}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                >
                    <span className="text-lg">💬</span>
                    {post.comments?.length || 0} Comments
                </button>
            </div>

            {/* Comments Section */}
            {(commenting || (post.comments && post.comments.length > 0)) && (
                <div className="mt-4 glass rounded-xl p-4 space-y-4">
                    {post.comments?.map((c: any) => (
                        <div key={c.comment_id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5 flex-shrink-0">
                                <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center text-xs">
                                    {c.profile_image ? (
                                        <img src={c.profile_image} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>👤</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="glass px-3 py-2 rounded-xl rounded-tl-none">
                                    <span className="text-xs font-bold text-white block mb-1">{c.user_name}</span>
                                    <p className="text-xs text-gray-300">{c.content}</p>
                                </div>
                                <span className="text-[10px] text-gray-600 block mt-1">
                                    {new Date(c.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}

                    {commenting && (
                        <form onSubmit={handleComment} className="flex gap-2 mt-3">
                            <input
                                className="flex-1 premium-input text-sm"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                            />
                            <button className="gradient-btn px-4 rounded-xl text-sm font-semibold">
                                Post
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
