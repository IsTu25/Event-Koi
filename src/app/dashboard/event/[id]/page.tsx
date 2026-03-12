'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, User, Heart, MessageCircle, Send,
    Share2, Trash2, Edit2, CheckCircle, XCircle, DollarSign,
    Ticket, Image as ImageIcon, Briefcase, Plus, Loader, ArrowLeft,
    Megaphone, ThumbsUp, MessageSquare, BarChart3, X, Star, Tag, Shield
} from 'lucide-react';

export default function EventDetails() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [user, setUser] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [ticketTypes, setTicketTypes] = useState<any[]>([]);
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: string }>({});
    const [waitlistItems, setWaitlistItems] = useState<any[]>([]);
    const [eventTags, setEventTags] = useState<any[]>([]);
    const [eventReviews, setEventReviews] = useState<any[]>([]);
    const [eventRevenue, setEventRevenue] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Ticket Creation State
    const [newTicket, setNewTicket] = useState({ name: '', price: '', quantity: '' });
    const [ticketSubmitting, setTicketSubmitting] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '', description: '', start_time: '', end_time: '', venue_id: '', category_id: ''
    });
    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Sponsor State
    const [newSponsor, setNewSponsor] = useState({ name: '', contribution: '', tier: 'Partner', logo: null as File | null });
    const [sponsorLoading, setSponsorLoading] = useState(false);

    // Analytics State
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Review Form State
    const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const u = JSON.parse(storedUser);
        setUser(u);
        if (id) fetchData(id as string, u);
    }, [id, router]);

    useEffect(() => {
        if (isEditing && venues.length === 0) {
            Promise.all([
                fetch('/api/venues').then(r => r.json()),
                fetch('/api/categories').then(r => r.json())
            ]).then(([v, c]) => {
                setVenues(v);
                setCategories(c);
            });
        }
    }, [isEditing]);

    useEffect(() => {
        if (event) {
            setEditFormData({
                title: event.title,
                description: event.description || '',
                start_time: new Date(event.start_time).toISOString().slice(0, 16),
                end_time: new Date(event.end_time).toISOString().slice(0, 16),
                venue_id: event.venue_id || '',
                category_id: event.category_id || ''
            });
        }
    }, [event]);

    const fetchData = async (eventId: string, currentUser?: any) => {
        const u = currentUser || user;
        if (!u?.id) return;

        try {
            const [eventRes, ticketsRes, sponsorsRes, waitlistRes, tagsRes, reviewsRes, revenueRes] = await Promise.all([
                fetch(`/api/events/${eventId}`),
                fetch(`/api/ticket-types?event_id=${eventId}`),
                fetch(`/api/sponsors?event_id=${eventId}`),
                fetch(`/api/event-waitlist?user_id=${u.id}&event_id=${eventId}`),
                fetch(`/api/event-tags?event_id=${eventId}`),
                fetch(`/api/event-reviews?event_id=${eventId}`),
                fetch(`/api/event-revenue?event_id=${eventId}`)
            ]);

            if (eventRes.ok) setEvent(await eventRes.json());
            if (ticketsRes.ok) setTicketTypes(await ticketsRes.json());
            if (sponsorsRes.ok) setSponsors(await sponsorsRes.json());
            if (waitlistRes.ok) setWaitlistItems(await waitlistRes.json());
            if (tagsRes.ok) setEventTags(await tagsRes.json());
            if (reviewsRes.ok) setEventReviews(await reviewsRes.json());
            if (revenueRes.ok) setEventRevenue(await revenueRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinWaitlist = async (ticketTypeId: number) => {
        try {
            const res = await fetch('/api/event-waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, event_id: id, ticket_type_id: ticketTypeId })
            });
            if (res.ok) {
                alert('Success! You are now on the waitlist.');
                fetchData(id as string);
            }
        } catch (e) { alert('Failed to join waitlist'); }
    };

    const handleUpdateEvent = async () => {
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
        } catch (err) { alert('Error updating event'); }
    };

    const handleAddTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setTicketSubmitting(true);
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
            }
        } catch (error) { console.error(error); } finally { setTicketSubmitting(false); }
    };

    const loadAnalytics = async () => {
        setShowAnalytics(true);
        if (analyticsData) return;
        setAnalyticsLoading(true);
        try {
            const res = await fetch(`/api/events/${id}/analytics`);
            if (res.ok) setAnalyticsData(await res.json());
        } catch (e) { console.error(e); }
        setAnalyticsLoading(false);
    };

    const handleAddSponsor = async (e: React.FormEvent) => {
        e.preventDefault();
        setSponsorLoading(true);
        const data = new FormData();
        data.append('event_id', id as string);
        data.append('name', newSponsor.name);
        data.append('contribution_amount', newSponsor.contribution);
        data.append('tier', newSponsor.tier);
        if (isOrganizer) {
            data.append('status', 'APPROVED');
        }
        if (newSponsor.logo) data.append('logo', newSponsor.logo);

        try {
            const res = await fetch('/api/sponsors', { method: 'POST', body: data });
            if (res.ok) {
                setNewSponsor({ name: '', contribution: '', tier: 'Partner', logo: null });
                fetchData(id as string);
            }
        } catch (e) { console.error(e); } finally { setSponsorLoading(false); }
    };

    const handlePostReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setReviewSubmitting(true);
        try {
            const res = await fetch('/api/event-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: id,
                    user_id: user.id,
                    rating: newReview.rating,
                    title: newReview.title,
                    content: newReview.content
                })
            });
            const data = await res.json();
            if (res.ok) {
                setNewReview({ rating: 5, title: '', content: '' });
                fetchData(id as string);
                alert("Review submitted!");
            } else {
                alert(data.error || "Failed to post review.");
            }
        } catch (err) {
            console.error(err);
            alert("Error posting review.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (!event) return null;

    const isOrganizer = user.id === event.organizer_id;

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans selection:bg-cyan-500/30 pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-cyan-900/05 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[40vw] h-[40vw] bg-purple-900/05 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10">

                {/* Header Back Link */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                </motion.div>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#161B2B] border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden"
                >
                    {/* Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-cyan-900/10 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
                        <div className="flex-1 space-y-6">
                            {isEditing ? (
                                <div className="space-y-4 max-w-xl">
                                    <input
                                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:border-cyan-500/50 outline-none"
                                        value={editFormData.title}
                                        onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                        placeholder="Event Title"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none custom-date-input"
                                            value={editFormData.start_time}
                                            onChange={e => setEditFormData({ ...editFormData, start_time: e.target.value })}
                                        />
                                        <select
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none appearance-none"
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
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${event.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {event.status}
                                        </span>
                                        {event.category_name && (
                                            <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                                {event.category_name}
                                            </span>
                                        )}
                                        {eventTags.map((tag: any) => (
                                            <span key={tag.tag_id} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-white/5 text-gray-400 border border-white/10">
                                                <Tag size={10} /> {tag.tag_name}
                                            </span>
                                        ))}
                                    </div>
                                    <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                                        {event.title}
                                    </h1>
                                    <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="text-cyan-400" size={18} />
                                            <span>
                                                {new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="text-cyan-400" size={18} />
                                            <span>
                                                {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {event.venue_name && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="text-cyan-400" size={18} />
                                                <span>{event.venue_name}, {event.venue_city}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <User className="text-cyan-400" size={18} />
                                            <span>Org. by {event.organizer_name}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Organizer Actions */}
                        {isOrganizer && (
                            <div className="flex flex-col items-end gap-4 min-w-[200px]">
                                <div className="p-4 rounded-2xl bg-[#0B0F1A] border border-white/10 text-center w-full">
                                    <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Total Sales</span>
                                    <span className="text-2xl font-bold text-white">
                                        ৳{(Number(eventRevenue?.ticket_revenue || 0) + Number(eventRevenue?.sponsor_revenue || 0)).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isEditing ? <><XCircle size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Details</>}
                                    </button>
                                    {!isEditing && (
                                        <button
                                            onClick={loadAnalytics}
                                            className="flex-1 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/10"
                                        >
                                            <BarChart3 size={16} /> Analytics
                                        </button>
                                    )}
                                    {isEditing && (
                                        <button
                                            onClick={handleUpdateEvent}
                                            className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Save Changes
                                        </button>
                                    )}
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to DELETE this event? This action cannot be undone.")) {
                                                await fetch(`/api/events/${id}`, { method: 'DELETE' });
                                                router.push('/dashboard');
                                            }
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Delete Event
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Main) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Event Updates / Wall */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8">
                            <EventUpdates eventId={id as string} user={user} isOrganizer={isOrganizer} />
                        </div>

                        {/* About */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Briefcase size={20} /></span>
                                About Event
                            </h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl p-4 text-white min-h-[200px] focus:outline-none focus:border-cyan-500/50"
                                    value={editFormData.description}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                />
                            ) : (
                                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {event.description || 'No description provided.'}
                                </p>
                            )}
                        </div>

                        {/* Sponsors Display */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><DollarSign size={20} /></span>
                                Our Sponsors
                            </h3>
                            {sponsors.filter(s => s.status === 'APPROVED').length === 0 ? (
                                <div className="text-center py-8 bg-[#0B0F1A] rounded-xl border border-white/5 border-dashed">
                                    <p className="text-gray-500 text-sm">No sponsors yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {sponsors.filter(s => s.status === 'APPROVED').map((s: any) => (
                                        <div key={s.sponsor_id} className="p-4 rounded-xl bg-[#0B0F1A] border border-white/5 flex flex-col items-center text-center">
                                            {s.logo_url && <img src={s.logo_url} className="h-10 object-contain mb-3" />}
                                            <p className="font-bold text-white text-sm">{s.name}</p>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{s.tier}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Event Reviews Display */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Star size={20} /></span>
                                Attendee Reviews
                            </h3>

                            {/* Write Review Form - Only for Attendees */}
                            {!isOrganizer && (
                                <form onSubmit={handlePostReview} className="mb-8 p-6 rounded-2xl bg-[#0B0F1A] border border-white/5 space-y-4">
                                    <h4 className="font-bold text-white text-sm">Write a Review</h4>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                className="focus:outline-none"
                                            >
                                                <Star size={24} className={star <= newReview.rating ? "fill-amber-500 text-amber-500 transition-colors" : "text-gray-600 transition-colors"} />
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        className="w-full bg-[#161B2B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none placeholder-gray-500"
                                        placeholder="Review Title (e.g. Amazing Experience!)"
                                        value={newReview.title}
                                        onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                                        required
                                    />
                                    <textarea
                                        className="w-full bg-[#161B2B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none placeholder-gray-500 min-h-[100px] resize-none"
                                        placeholder="Share your thoughts about this event..."
                                        value={newReview.content}
                                        onChange={e => setNewReview({ ...newReview, content: e.target.value })}
                                        required
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            disabled={reviewSubmitting}
                                            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                                        >
                                            {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {eventReviews.length === 0 ? (
                                <div className="text-center py-8 bg-[#0B0F1A] rounded-xl border border-white/5 border-dashed">
                                    <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {eventReviews.map((review: any) => (
                                        <div key={review.review_id} className="p-5 rounded-xl bg-[#0B0F1A] border border-white/5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                                        {review.profile_image ? <img src={review.profile_image} className="w-full object-cover h-full" /> : <div className="flex justify-center items-center h-full"><User size={14} className="text-gray-500" /></div>}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-none mb-1">{review.user_name}</p>
                                                        <div className="flex text-amber-500">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={12} className={i < review.rating ? "fill-current" : "text-gray-600"} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-gray-500">{new Date(review.review_date).toLocaleDateString()}</span>
                                            </div>
                                            {review.title && <p className="font-bold text-white text-sm mb-1">{review.title}</p>}
                                            {review.content && <p className="text-gray-400 text-sm leading-relaxed">{review.content}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ticket Types Display */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-pink-500/10 text-pink-500"><Ticket size={20} /></span>
                                Ticket Packages
                            </h3>
                            {ticketTypes.length === 0 ? (
                                <div className="text-center py-8 bg-[#0B0F1A] rounded-xl border border-white/5 border-dashed">
                                    <p className="text-gray-500 text-sm">No tickets available yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ticketTypes.map((t) => (
                                        <div key={t.ticket_type_id} className="flex justify-between items-center p-4 rounded-xl bg-[#0B0F1A] border border-white/5">
                                            <div>
                                                <p className="font-bold text-white">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.quantity} available</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-cyan-400">৳{Number(t.price).toFixed(0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="lg:col-span-1 space-y-6">

                        {isOrganizer ? (
                            <>
                                {/* Add Ticket Module */}
                                <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <Plus size={16} className="text-cyan-500" /> Add Ticket Type
                                    </h4>
                                    <form onSubmit={handleAddTicket} className="space-y-4">
                                        <input
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                            placeholder="Ticket Name"
                                            value={newTicket.name}
                                            onChange={e => setNewTicket({ ...newTicket, name: e.target.value })}
                                            required
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="number"
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                                placeholder="Price"
                                                value={newTicket.price}
                                                onChange={e => setNewTicket({ ...newTicket, price: e.target.value })}
                                                required
                                            />
                                            <input
                                                type="number"
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                                placeholder="Qty"
                                                value={newTicket.quantity}
                                                onChange={e => setNewTicket({ ...newTicket, quantity: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-colors">
                                            {ticketSubmitting ? 'Adding...' : 'Add Ticket'}
                                        </button>
                                    </form>
                                </div>

                                {/* Manage Sponsors Module */}
                                <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <Plus size={16} className="text-amber-500" /> Add Sponsor
                                    </h4>
                                    <form onSubmit={handleAddSponsor} className="space-y-4">
                                        <input
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                            placeholder="Company Name"
                                            value={newSponsor.name}
                                            onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none appearance-none"
                                            value={newSponsor.tier}
                                            onChange={e => setNewSponsor({ ...newSponsor, tier: e.target.value })}
                                        >
                                            <option>Partner</option>
                                            <option>Bronze</option>
                                            <option>Silver</option>
                                            <option>Gold</option>
                                        </select>
                                        <input
                                            type="number"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                            placeholder="Amount (৳)"
                                            value={newSponsor.contribution}
                                            onChange={e => setNewSponsor({ ...newSponsor, contribution: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="w-full text-sm text-gray-500"
                                            onChange={e => e.target.files && setNewSponsor({ ...newSponsor, logo: e.target.files[0] })}
                                        />
                                        <button className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-colors">
                                            {sponsorLoading ? 'Adding...' : 'Add Sponsor'}
                                        </button>
                                    </form>

                                    {/* Pending Requests */}
                                    {sponsors.filter(s => s.status === 'PENDING').length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-white/10">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Pending Requests</h5>
                                            <div className="space-y-3">
                                                {sponsors.filter(s => s.status === 'PENDING').map(s => (
                                                    <div key={s.sponsor_id} className="p-4 rounded-xl bg-[#0B0F1A] border border-white/5 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-sm font-bold text-white block">{s.name}</span>
                                                                <span className="text-[10px] text-gray-500">Requested for ৳{s.contribution_amount}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <label className="text-[9px] font-bold text-gray-600 uppercase mb-1">Assign Tier</label>
                                                                <select
                                                                    className="bg-[#161B2B] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-cyan-500/50"
                                                                    value={selectedTiers[s.sponsor_id] || s.tier}
                                                                    onChange={(e) => setSelectedTiers({ ...selectedTiers, [s.sponsor_id]: e.target.value })}
                                                                >
                                                                    <option>Partner</option>
                                                                    <option>Bronze</option>
                                                                    <option>Silver</option>
                                                                    <option>Gold</option>
                                                                    <option>Platinum</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    const tier = selectedTiers[s.sponsor_id] || s.tier;
                                                                    await fetch('/api/sponsors', {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ sponsor_id: s.sponsor_id, status: 'APPROVED', tier: tier })
                                                                    });
                                                                    fetchData(id as string);
                                                                }}
                                                                className="flex-1 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 transition-all"
                                                            >
                                                                Approve as {selectedTiers[s.sponsor_id] || s.tier}
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    await fetch('/api/sponsors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sponsor_id: s.sponsor_id, status: 'REJECTED' }) });
                                                                    fetchData(id as string);
                                                                }}
                                                                className="flex-1 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-all"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Attendee Booking */}
                                <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6 sticky top-6">
                                    <h4 className="text-xl font-bold text-white mb-6">Get Tickets</h4>
                                    {ticketTypes.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">Tickets coming soon.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {ticketTypes.map((t) => (
                                                <div key={t.ticket_type_id} className="p-4 rounded-xl bg-[#0B0F1A] border border-white/5">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="font-bold text-white">{t.name}</span>
                                                        <span className="text-lg font-black text-cyan-400">৳{Number(t.price).toFixed(0)}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-4">{t.quantity} remaining</p>
                                                    <button
                                                        onClick={async () => {
                                                            if (t.quantity > 0) {
                                                                if (!confirm(`Book ${t.name} for ৳${t.price}?`)) return;
                                                                try {
                                                                    const res = await fetch('/api/bookings', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ user_id: user.id, event_id: id, ticket_type_id: t.ticket_type_id })
                                                                    });
                                                                    if (res.ok) { alert('Ticket Booked! Check My Tickets.'); fetchData(id as string); }
                                                                    else alert('Booking failed');
                                                                } catch (e) { console.error(e); }
                                                            } else {
                                                                handleJoinWaitlist(t.ticket_type_id);
                                                            }
                                                        }}
                                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${t.quantity > 0
                                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                                                            : waitlistItems.some(w => w.ticket_type_id === t.ticket_type_id)
                                                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 cursor-default'
                                                                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20'
                                                            }`}
                                                    >
                                                        {t.quantity > 0 ? 'Book Ticket' : waitlistItems.find(w => w.ticket_type_id === t.ticket_type_id)
                                                            ? `Waitlist Pos: ${waitlistItems.find(w => w.ticket_type_id === t.ticket_type_id)?.position_in_queue || '...'}`
                                                            : 'Join Waitlist'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Become Sponsor (Attendee View) */}
                                <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6 mt-6">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <DollarSign size={16} className="text-amber-500" /> Sponsor Event
                                    </h4>
                                    <form onSubmit={handleAddSponsor} className="space-y-4">
                                        <input className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none" placeholder="Company Name" value={newSponsor.name} onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })} required />
                                        <input type="number" className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none" placeholder="Amount (৳)" value={newSponsor.contribution} onChange={e => setNewSponsor({ ...newSponsor, contribution: e.target.value })} required />
                                        <button disabled={sponsorLoading} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-colors">
                                            {sponsorLoading ? 'Submitting...' : 'Apply as Sponsor'}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Analytics Modal */}
            <AnimatePresence>
                {showAnalytics && (
                    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} className="bg-[#161B2B] sm:rounded-3xl w-full max-w-5xl h-[90vh] sm:h-[80vh] flex flex-col border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0B0F1A]">
                                <div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-2"><BarChart3 size={24} className="text-cyan-400" /> Advanced Analytics</h2>
                                    <p className="text-gray-500 text-xs">Real-time engagement, demographics, and sales performance.</p>
                                </div>
                                <button onClick={() => setShowAnalytics(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                                {analyticsLoading ? (
                                    <div className="h-full flex items-center justify-center"><Loader className="animate-spin text-cyan-500 w-10 h-10" /></div>
                                ) : !analyticsData ? (
                                    <div className="text-center py-20 text-gray-500 text-sm">Failed to load analytics data.</div>
                                ) : (
                                    <>
                                        {/* Financial KPI */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-[#0B0F1A] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Total Page Views</h4>
                                                <p className="text-3xl font-black text-white">{analyticsData.totalViews > 0 ? analyticsData.totalViews.toLocaleString() : (analyticsData.timeline?.reduce((a: any, c: any) => a + c.total_views, 0).toLocaleString() || 0)}</p>
                                            </div>
                                            <div className="bg-[#161B2B] p-6 rounded-2xl border border-white/5">
                                                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Ticket Revenue</h4>
                                                <p className="text-3xl font-black text-emerald-400">৳{Number(analyticsData.finances?.total_ticket_revenue || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="bg-[#161B2B] p-6 rounded-2xl border border-white/5">
                                                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Sponsorships</h4>
                                                <p className="text-3xl font-black text-amber-400">৳{Number(analyticsData.finances?.total_sponsorship_revenue || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="bg-[#161B2B] p-6 rounded-2xl border border-white/5">
                                                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Platform Fees</h4>
                                                <p className="text-3xl font-black text-rose-400">-৳{Number(analyticsData.finances?.platform_fee || 0).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 p-8 rounded-3xl border border-cyan-500/30 mb-8 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                                <Shield size={80} className="text-cyan-500" />
                                            </div>
                                            <h4 className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2">Net revenue (Your Payout)</h4>
                                            <p className="text-5xl font-black text-white">৳{Number(analyticsData.finances?.net_revenue || 0).toLocaleString()}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Charts Mockups - Demographics */}
                                            <div className="bg-[#0B0F1A] border border-white/5 rounded-2xl p-6">
                                                <h3 className="font-bold mb-6 text-white text-lg">Ticket Sales Distribution</h3>
                                                <div className="space-y-4">
                                                    {(analyticsData.demographics || []).map((d: any) => (
                                                        <div key={d.age_group}>
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-gray-400 font-semibold truncate max-w-[70%]">{d.age_group}</span>
                                                                <span className="text-white font-bold">{d.percentage}%</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${d.percentage}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-purple-500 to-cyan-500" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Daily Sales Trends */}
                                            <div className="bg-[#0B0F1A] border border-white/5 rounded-2xl p-6">
                                                <h3 className="font-bold mb-6 text-white text-lg">Sales Velocity (Last 5 Days)</h3>
                                                <div className="h-48 flex items-end gap-2">
                                                    {analyticsData.salesTrend?.length > 0 ? analyticsData.salesTrend.map((t: any) => {
                                                        const max = Math.max(...analyticsData.salesTrend.map((x: any) => x.tickets_sold));
                                                        return (
                                                            <div key={t.date} className="flex-1 h-full flex flex-col justify-end group relative pt-6">
                                                                <p className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 font-bold opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">{t.tickets_sold} tix</p>
                                                                <motion.div initial={{ height: 0 }} animate={{ height: `${(t.tickets_sold / max) * 100}%` }} className="w-full bg-gradient-to-t from-cyan-500/20 to-cyan-500/60 hover:to-cyan-400 rounded-t-md border-t border-cyan-400/50 transition-colors" />
                                                                <p className="text-center text-[9px] text-gray-500 mt-2 truncate w-full">{new Date(t.date).getDate()}/{new Date(t.date).getMonth() + 1}</p>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 border border-dashed border-white/10 rounded-xl">
                                                            <span className="text-xl mb-2">📉</span>
                                                            <p className="text-sm">Not enough data to map trends.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

// --- Sub Components ---

function EventUpdates({ eventId, user, isOrganizer }: { eventId: string, user: any, isOrganizer: boolean }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [posting, setPosting] = useState(false);

    useEffect(() => { fetchPosts(); }, [eventId]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/posts?event_id=${eventId}&user_id=${user.id}`);
            if (res.ok) setPosts(await res.json());
        } catch (e) { console.error(e); }
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
            if (res.ok) { setContent(''); setImage(null); fetchPosts(); }
        } catch (e) { console.error(e); } finally { setPosting(false); }
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Megaphone size={20} /></span>
                News & Updates
            </h3>

            {isOrganizer && (
                <div className="mb-8 p-4 rounded-2xl bg-[#0B0F1A] border border-white/10">
                    <textarea
                        className="w-full bg-transparent text-white placeholder-gray-600 resize-none outline-none text-sm min-h-[80px]"
                        placeholder="Announce something..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3">
                        <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer transition-colors">
                            <ImageIcon size={14} />
                            {image ? <span className="text-green-400">{image.name}</span> : 'Add Image'}
                            <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setImage(e.target.files[0])} />
                        </label>
                        <button
                            disabled={posting || !content.trim()}
                            onClick={handleCreatePost}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                            {posting ? 'Posting...' : 'Post Update'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {posts.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">No updates posted yet.</p>
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
        <div className="p-6 rounded-2xl bg-[#0B0F1A] border border-white/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                    {post.author_image ? <img src={post.author_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-gray-500" /></div>}
                </div>
                <div>
                    <p className="text-sm font-bold text-white">{post.author_name}</p>
                    <p className="text-[10px] text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                </div>
            </div>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">{post.content}</p>
            {post.image_url && <img src={post.image_url} className="w-full rounded-xl mb-4 border border-white/5" />}

            <div className="flex gap-6 pt-4 border-t border-white/5">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors ${post.is_liked ? 'text-pink-500' : 'text-gray-500 hover:text-white'}`}
                >
                    <Heart size={14} className={post.is_liked ? 'fill-current' : ''} /> {post.like_count} Likes
                </button>
                <button
                    onClick={() => setCommenting(!commenting)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
                >
                    <MessageSquare size={14} /> {post.comments?.length || 0} Comments
                </button>
            </div>

            {/* Comments */}
            {(commenting || (post.comments && post.comments.length > 0)) && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    {post.comments?.map((c: any) => (
                        <div key={c.comment_id} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                {c.profile_image ? <img src={c.profile_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={10} className="text-gray-500" /></div>}
                            </div>
                            <div className="flex-1">
                                <div className="bg-white/5 rounded-xl px-3 py-2 inline-block">
                                    <span className="text-xs font-bold text-white block mb-0.5">{c.user_name}</span>
                                    <span className="text-xs text-gray-400">{c.content}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {commenting && (
                        <form onSubmit={handleComment} className="flex gap-2">
                            <input
                                className="flex-1 bg-[#161B2B] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                            />
                            <button className="p-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500"><Send size={14} /></button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
