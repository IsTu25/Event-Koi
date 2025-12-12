'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EventDetails() {
    const router = useRouter();
    const params = useParams(); // params is NOT a promise in client components in this version, check recent Next.js. Actually in 15 it behaves differently but usually unpacked. Let's assume standard client usage. NOTE: In Next 15 params is a Promise. But usually standard hooks handle it. Let's wrap in `use` or just create safe access. 
    // Wait, let's keep it simple. useParams() usually returns the object directly in client components in older 13/14 versions. In 15 it might be async. I'll code defensively or just assume 14/15 compat.
    // Actually, in standard Client Components `useParams` returns the object.

    const { id } = params;

    const [user, setUser] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [ticketTypes, setTicketTypes] = useState<any[]>([]);
    const [sponsors, setSponsors] = useState<any[]>([]); // ADD THIS LINE
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
                fetchData(id as string); // Refresh list
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

    if (!user || loading) return <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="min-h-screen bg-black text-white p-8">Event not found</div>;

    const isOrganizer = user.id === event.organizer_id;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 border-b border-white/10 pb-6">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-zinc-400 hover:text-white mb-4 flex items-center gap-2"
                    >
                        ← Back to Dashboard
                    </button>
                    <div className="flex justify-between items-end">
                        <div>
                            {isEditing ? (
                                <div className="space-y-3 mb-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-700">
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-700 rounded p-2 text-white font-bold text-2xl"
                                        value={editFormData.title}
                                        onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                        placeholder="Event Title"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="datetime-local"
                                            className="bg-black border border-zinc-700 rounded p-2 text-zinc-300 text-sm"
                                            value={editFormData.start_time}
                                            onChange={e => setEditFormData({ ...editFormData, start_time: e.target.value })}
                                        />
                                        <select
                                            className="bg-black border border-zinc-700 rounded p-2 text-zinc-300 text-sm"
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 mb-4 inline-block`}>
                                        {event.status}
                                    </span>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        {event.title}
                                    </h1>
                                    <div className="flex items-center gap-4 text-zinc-400">
                                        <span>📅 {new Date(event.start_time).toLocaleDateString()}</span>
                                        <span>📍 {event.venue_name}, {event.venue_city}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        {isOrganizer && (
                            <div className="flex flex-col items-end gap-4">
                                <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg mb-2">
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider block">Total Sales</span>
                                    <span className="text-xl font-bold text-white">৳0.00</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-700 transition"
                                    >
                                        {isEditing ? 'Cancel Edit' : 'Edit Event'}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to DELETE this event? This action cannot be undone.")) {
                                                await fetch(`/api/events/${id}`, { method: 'DELETE' });
                                                router.push('/dashboard');
                                            }
                                        }}
                                        className="bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition"
                                    >
                                        Delete Event
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                            <EventUpdates eventId={id as string} user={user} isOrganizer={isOrganizer} />
                        </div>

                        {/* About Section */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">About Event</h2>
                                {isEditing && (
                                    <button
                                        onClick={handleUpdateEvent}
                                        className="bg-green-500 text-white px-4 py-1 rounded text-sm font-bold hover:bg-green-600 transition"
                                    >
                                        Save Changes
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <textarea
                                        className="w-full bg-black border border-zinc-700 rounded p-4 text-zinc-300 min-h-[200px]"
                                        value={editFormData.description}
                                        onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                        placeholder="Event Description..."
                                    />
                                    <div>
                                        <label className="text-zinc-500 text-sm mb-1 block">Category</label>
                                        <select
                                            className="w-full bg-black border border-zinc-700 rounded p-2 text-zinc-300"
                                            value={editFormData.category_id}
                                            onChange={e => setEditFormData({ ...editFormData, category_id: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                    {event.description || 'No description provided.'}
                                </p>
                            )}
                        </div>

                        {/* Sponsors List */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                            <h2 className="text-xl font-bold text-white mb-6">Sponsors</h2>
                            {sponsors.length === 0 ? (
                                <p className="text-zinc-500 italic">No sponsors yet.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {sponsors.map((s: any) => (
                                        <div key={s.sponsor_id} className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                            {s.logo_url && (
                                                <img src={s.logo_url} alt={s.name} className="h-12 object-contain mb-3" />
                                            )}
                                            <h4 className="font-bold text-white">{s.name}</h4>
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded mt-2 ${s.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-500' :
                                                s.tier === 'Silver' ? 'bg-gray-400/20 text-gray-400' :
                                                    'bg-orange-800/20 text-orange-400'
                                                }`}>{s.tier}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ticket Types List */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Ticket Packages</h2>
                            </div>

                            {ticketTypes.length === 0 ? (
                                <div className="text-center py-12 border border-zinc-700 border-dashed rounded-xl">
                                    <p className="text-zinc-500">No tickets created yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ticketTypes.map((ticket) => (
                                        <div key={ticket.ticket_type_id} className="flex justify-between items-center p-4 bg-black border border-zinc-800 rounded-xl hover:border-pink-500/30 transition-colors">
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{ticket.name}</h3>
                                                <p className="text-sm text-zinc-500">{ticket.quantity} available</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-white">৳{Number(ticket.price).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Manage Actions */}
                    <div className="space-y-6">
                        {isOrganizer ? (
                            <>
                                {/* Ticket Form */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <span>🎟️</span> Create Ticket Type
                                    </h3>
                                    <form onSubmit={handleAddTicket} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Ticket Name</label>
                                            <input type="text" placeholder="e.g. VIP Access" required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newTicket.name} onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-2">Price (৳)</label>
                                                <input type="number" step="0.01" required placeholder="0.00" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newTicket.price} onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-2">Quantity</label>
                                                <input type="number" required placeholder="100" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newTicket.quantity} onChange={(e) => setNewTicket({ ...newTicket, quantity: e.target.value })} />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
                                            {submitting ? 'Adding...' : 'Add Ticket Type'}
                                        </button>
                                    </form>
                                </div>

                                {/* Sponsor Form */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <span>🤝</span> Add Sponsor
                                    </h3>
                                    <form onSubmit={handleAddSponsor} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Sponsor Name</label>
                                            <input type="text" required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newSponsor.name} onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-2">Tier</label>
                                                <select className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newSponsor.tier} onChange={e => setNewSponsor({ ...newSponsor, tier: e.target.value })}>
                                                    <option>Partner</option> <option>Bronze</option> <option>Silver</option> <option>Gold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-2">Amount</label>
                                                <input type="number" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newSponsor.contribution} onChange={e => setNewSponsor({ ...newSponsor, contribution: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Logo</label>
                                            <input type="file" accept="image/*" onChange={e => e.target.files && setNewSponsor({ ...newSponsor, logo: e.target.files[0] })} className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white" />
                                        </div>
                                        <button type="submit" disabled={sponsorLoading} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-opacity disabled:opacity-50 mt-2">
                                            {sponsorLoading ? 'Adding...' : 'Add Sponsor'}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                {/* Ticket Selection UI (For Attendees) */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6">Select Tickets</h3>
                                    {ticketTypes.length === 0 ? (
                                        <p className="text-zinc-500">Tickets not yet available.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {ticketTypes.map((ticket) => (
                                                <div key={ticket.ticket_type_id} className="p-4 bg-black border border-zinc-800 rounded-xl">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-bold text-white">{ticket.name}</span>
                                                        <span className="text-white font-mono">৳{Number(ticket.price).toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mb-4">{ticket.quantity} remaining</p>
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
                                                                    // Refresh ticket count
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
                                                        className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {ticket.quantity > 0 ? 'Buy Ticket' : 'Sold Out'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sponsor Application Form */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <span>🤝</span> Become a Sponsor
                                    </h3>
                                    <p className="text-zinc-500 text-sm mb-4">Interested in sponsoring this event? Submit an application.</p>
                                    <form onSubmit={handleAddSponsor} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Sponsor/Company Name</label>
                                            <input type="text" required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newSponsor.name} onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-2">Tier</label>
                                                <select className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newSponsor.tier} onChange={e => setNewSponsor({ ...newSponsor, tier: e.target.value })}>
                                                    <option>Partner</option> <option>Bronze</option> <option>Silver</option> <option>Gold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-2">Contribution (৳)</label>
                                                <input type="number" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 transition-colors" value={newSponsor.contribution} onChange={e => setNewSponsor({ ...newSponsor, contribution: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Logo (Optional)</label>
                                            <input type="file" accept="image/*" onChange={e => e.target.files && setNewSponsor({ ...newSponsor, logo: e.target.files[0] })} className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white" />
                                        </div>
                                        <button type="submit" disabled={sponsorLoading} className="w-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold py-3 rounded-lg transition-opacity disabled:opacity-50 mt-2">
                                            {sponsorLoading ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Organizer: Manage Sponsor Requests */}
                        {isOrganizer && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-6">
                                <h3 className="text-lg font-bold text-white mb-4">Sponsor Requests</h3>
                                {sponsors.filter((s: any) => s.status === 'PENDING').length === 0 ? (
                                    <p className="text-zinc-500 text-sm">No pending requests.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {sponsors.filter((s: any) => s.status === 'PENDING').map((s: any) => (
                                            <div key={s.sponsor_id} className="p-4 bg-black border border-zinc-800 rounded-xl">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {s.logo_url && <img src={s.logo_url} className="w-8 h-8 object-contain" />}
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{s.name}</h4>
                                                        <p className="text-xs text-zinc-500">{s.tier} • ৳{s.contribution_amount}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={async () => {
                                                        await fetch('/api/sponsors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sponsor_id: s.sponsor_id, status: 'APPROVED' }) });
                                                        fetchData(id as string);
                                                    }} className="bg-green-500/20 text-green-500 text-xs py-1 rounded hover:bg-green-500 hover:text-white transition">Approve</button>
                                                    <button onClick={async () => {
                                                        await fetch('/api/sponsors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sponsor_id: s.sponsor_id, status: 'REJECTED' }) });
                                                        fetchData(id as string);
                                                    }} className="bg-red-500/20 text-red-500 text-xs py-1 rounded hover:bg-red-500 hover:text-white transition">Reject</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
            <h2 className="text-xl font-bold text-white mb-6">Updates & News 📢</h2>

            {isOrganizer && (
                <form onSubmit={handleCreatePost} className="mb-8 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <textarea
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-zinc-300 mb-3 focus:outline-none focus:border-pink-500"
                        placeholder="Post an update for your attendees..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                id="post-image"
                                className="hidden"
                                onChange={e => e.target.files && setImage(e.target.files[0])}
                            />
                            <label htmlFor="post-image" className="cursor-pointer text-zinc-400 hover:text-white flex items-center gap-1 text-sm">
                                📷 {image ? <span className="text-green-500">{image.name}</span> : 'Add Photo'}
                            </label>
                            {image && <button type="button" onClick={() => setImage(null)} className="text-red-500 text-xs hover:underline">Remove</button>}
                        </div>
                        <button disabled={posting} className="bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90">
                            {posting ? 'Posting...' : 'Post Update'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {posts.length === 0 ? (
                    <p className="text-zinc-500 italic text-center">No updates yet.</p>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.post_id} post={post} user={user} refresh={fetchPosts} />
                    ))
                )}
            </div>
        </div>
    );
}

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
        <div className="bg-black border border-zinc-800 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                    {post.author_image ? <img src={post.author_image} className="w-full h-full object-cover" /> : <div className="text-center pt-1">👤</div>}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white">{post.author_name}</h4>
                    <span className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</span>
                </div>
            </div>

            <p className="text-zinc-300 text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
            {post.image_url && <img src={post.image_url} className="w-full rounded-lg mb-4" />}

            <div className="flex items-center gap-6 text-sm text-zinc-400 border-t border-zinc-800 pt-3">
                <button onClick={handleLike} className={`flex items-center gap-1 hover:text-pink-500 ${post.is_liked ? 'text-pink-500' : ''}`}>
                    <span>{post.is_liked ? '❤️' : '🤍'}</span> {post.like_count} Likes
                </button>
                <button onClick={() => setCommenting(!commenting)} className="hover:text-white">
                    💬 {post.comments.length} Comments
                </button>
            </div>

            {/* Comments Section */}
            {(commenting || post.comments.length > 0) && (
                <div className="mt-4 bg-zinc-900/50 p-3 rounded-lg space-y-3">
                    {post.comments.map((c: any) => (
                        <div key={c.comment_id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                {c.profile_image ? <img src={c.profile_image} className="w-full h-full object-cover" /> : <div className="text-[10px] text-center pt-1">👤</div>}
                            </div>
                            <div>
                                <div className="bg-zinc-800 px-3 py-2 rounded-lg rounded-tl-none">
                                    <span className="text-xs font-bold text-white block mb-1">{c.user_name}</span>
                                    <p className="text-xs text-zinc-300">{c.content}</p>
                                </div>
                                <span className="text-[10px] text-zinc-600 block mt-1">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}

                    {commenting && (
                        <form onSubmit={handleComment} className="flex gap-2 mt-2">
                            <input
                                className="flex-1 bg-black border border-zinc-700 rounded px-3 py-1 text-sm text-white"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                            />
                            <button className="text-xs bg-indigo-500 text-white px-3 rounded hover:bg-indigo-600">Post</button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
