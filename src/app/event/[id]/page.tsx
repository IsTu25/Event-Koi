'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicEventPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [event, setEvent] = useState<any>(null);
    const [ticketTypes, setTicketTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchEventData();
        }
    }, [id]);

    const fetchEventData = async () => {
        try {
            const [eventRes, ticketsRes] = await Promise.all([
                fetch(`/api/events/${id}`),
                fetch(`/api/ticket-types?event_id=${id}`)
            ]);

            if (eventRes.ok) {
                setEvent(await eventRes.json());
            } else {
                // Handle 404 or error
            }

            if (ticketsRes.ok) {
                setTicketTypes(await ticketsRes.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen animated-gradient-bg flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
                    <Link href="/dashboard" className="text-pink-400 hover:text-pink-300">Browse Events</Link>
                </div>
            </div>
        );
    }

    const minPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map(t => parseFloat(t.price))) : 0;

    return (
        <div className="relative min-h-screen animated-gradient-bg text-white font-sans">
            <div className="floating-orb orb-1 opacity-20" />
            <div className="floating-orb orb-2 opacity-20" />

            {/* Navbar */}
            <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-6">
                <Link href="/" className="text-2xl font-black text-gradient">Event Ekhanei</Link>
                <div className="flex gap-4">
                    <Link href="/login" className="px-5 py-2 rounded-full glass border border-white/10 hover:bg-white/10 transition-all font-medium text-sm">Log In</Link>
                    <Link href="/dashboard" className="px-5 py-2 rounded-full gradient-btn font-medium text-sm">Dashboard</Link>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-xs font-bold uppercase tracking-wider text-pink-400">
                            {event.category_name || 'Event'}
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                            {event.title}
                        </h1>
                        <div className="flex flex-col gap-3 text-gray-300 text-lg">
                            <div className="flex items-center gap-3">
                                <span>📅</span>
                                <span>{new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span>⏰</span>
                                <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span>📍</span>
                                <span>{event.venue_name}, {event.venue_city}</span>
                            </div>
                        </div>

                        <div className="pt-8 flex gap-4">
                            <button
                                onClick={() => router.push(`/dashboard/event/${id}`)}
                                className="px-8 py-4 rounded-2xl gradient-btn text-xl font-bold shadow-lg shadow-pink-500/25 hover:scale-105 transition-transform"
                            >
                                Get Tickets
                            </button>
                            <div className="px-6 py-4 rounded-2xl glass flex flex-col justify-center">
                                <span className="text-xs text-gray-400 uppercase font-bold">Starting from</span>
                                <span className="text-xl font-bold text-white">৳{minPrice.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Visual Card */}
                    <div className="relative aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden glass-strong border border-white/10 shadow-2xl p-2 group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 mix-blend-overlay" />
                        <div className="w-full h-full bg-black/40 rounded-2xl flex items-center justify-center relative overflow-hidden">
                            {/* Abstract Pattern if no image */}
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                            <div className="text-center p-8">
                                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-500">🎉</div>
                                <h3 className="text-2xl font-bold text-white">{event.organizer_name}</h3>
                                <p className="text-gray-400">Organizer</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left: Description */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-500 text-lg">📝</span>
                                About Event
                            </h2>
                            <div className="glass-strong p-8 rounded-3xl border border-white/10 text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500 text-lg">🎟️</span>
                                Ticket Packages
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ticketTypes.map(ticket => (
                                    <div key={ticket.ticket_type_id} className="glass p-6 rounded-3xl border border-white/10 hover:border-pink-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-white">{ticket.name}</h3>
                                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                                                ৳{parseFloat(ticket.price).toFixed(0)}
                                            </span>
                                        </div>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-gray-400">
                                                <span className="text-green-400">✓</span> Full Access
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-400">
                                                <span className="text-green-400">✓</span> Instant Confirmation
                                            </li>
                                        </ul>
                                        <button
                                            onClick={() => router.push(`/dashboard/event/${id}`)}
                                            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-600 group-hover:border-transparent"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-8">
                        <div className="glass-strong p-6 rounded-3xl border border-white/10 sticky top-8">
                            <h3 className="text-xl font-bold mb-6">Event Info</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Date</label>
                                    <p className="font-medium text-white">{new Date(event.start_time).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Time</label>
                                    <p className="font-medium text-white">{new Date(event.start_time).toLocaleTimeString()} BD Time</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Location</label>
                                    <p className="font-medium text-white">{event.venue_name}</p>
                                    <p className="text-sm text-gray-400">{event.venue_city}</p>
                                </div>

                                <div className="h-px bg-white/10 my-4" />

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Organized By</label>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                                            {event.organizer_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{event.organizer_name}</p>
                                            <Link href="#" className="text-xs text-pink-400 hover:text-pink-300">View Profile</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/dashboard/event/${id}`)}
                                className="w-full mt-8 gradient-btn py-3 rounded-xl font-bold shadow-lg"
                            >
                                Get Tickets
                            </button>
                        </div>
                    </div>

                </div>

            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Event Ekhanei. All rights reserved.</p>
            </footer>

        </div>
    );
}
