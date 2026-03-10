'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicEventPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [event, setEvent] = useState<any>(null);
    const [ticketTypes, setTicketTypes] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'about' | 'schedule' | 'reviews'>('about');

    // Review form
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewContent, setReviewContent] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMsg, setReviewMsg] = useState('');

    // Waitlist
    const [waitlistLoading, setWaitlistLoading] = useState(false);
    const [waitlistMsg, setWaitlistMsg] = useState('');

    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

    useEffect(() => {
        if (id) fetchAll();
    }, [id]);

    const fetchAll = async () => {
        try {
            const [eventRes, ticketsRes, reviewsRes, schedRes, tagsRes] = await Promise.all([
                fetch(`/api/events/${id}`),
                fetch(`/api/ticket-types?event_id=${id}`),
                fetch(`/api/event-reviews?event_id=${id}`),
                fetch(`/api/event-schedule?event_id=${id}`),
                fetch(`/api/event-tags?event_id=${id}`),
            ]);
            if (eventRes.ok) setEvent(await eventRes.json());
            if (ticketsRes.ok) setTicketTypes(await ticketsRes.json());
            if (reviewsRes.ok) setReviews(await reviewsRes.json());
            if (schedRes.ok) setSchedule(await schedRes.json());
            if (tagsRes.ok) setTags(await tagsRes.json());
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
    const minPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map(t => parseFloat(t.price))) : 0;

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return setReviewMsg('Please log in to review.');
        if (!rating) return setReviewMsg('Please select a rating.');
        setSubmittingReview(true);
        const res = await fetch('/api/event-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: id, user_id: user.id, rating, title: reviewTitle, content: reviewContent }),
        });
        if (res.ok) {
            setReviewMsg('Review submitted! Thank you.');
            setRating(0); setReviewTitle(''); setReviewContent('');
            fetchAll();
        } else setReviewMsg('Failed to submit review.');
        setSubmittingReview(false);
    };

    const handleJoinWaitlist = async (ticketTypeId: string) => {
        if (!user) return setWaitlistMsg('Please log in to join the waitlist.');
        setWaitlistLoading(true);
        const res = await fetch('/api/event-waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: id, user_id: user.id, ticket_type_id: ticketTypeId }),
        });
        const data = await res.json();
        setWaitlistMsg(res.ok ? `✅ You're #${data.position} on the waitlist!` : data.error || 'Failed to join waitlist.');
        setWaitlistLoading(false);
    };

    const handleBookTicket = async (ticket: any) => {
        if (!user) { router.push('/login'); return; }
        if (!confirm(`Book "${ticket.name}" for ৳${ticket.price}?`)) return;
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, event_id: id, ticket_type_id: ticket.ticket_type_id }),
        });
        if (res.ok) {
            const data = await res.json();
            alert(`🎟️ Booked! Ticket: ${data.ticket_number}\nQR: ${data.qr_code}`);
            fetchAll();
        } else {
            const err = await res.json();
            alert(err.message || 'Booking failed');
        }
    };

    if (loading) return (
        <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!event) return (
        <div className="min-h-screen animated-gradient-bg flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
                <Link href="/dashboard" className="text-pink-400 hover:text-pink-300">Browse Events</Link>
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen animated-gradient-bg text-white font-sans">
            <div className="floating-orb orb-1 opacity-20" />
            <div className="floating-orb orb-2 opacity-20" />

            {/* Nav */}
            <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-6">
                <Link href="/" className="text-2xl font-black text-gradient">Event Ekhanei</Link>
                <div className="flex gap-4">
                    {user ? (
                        <Link href="/dashboard" className="px-5 py-2 rounded-full gradient-btn font-medium text-sm">Dashboard</Link>
                    ) : (
                        <>
                            <Link href="/login" className="px-5 py-2 rounded-full glass border border-white/10 hover:bg-white/10 transition-all font-medium text-sm">Log In</Link>
                            <Link href="/dashboard" className="px-5 py-2 rounded-full gradient-btn font-medium text-sm">Dashboard</Link>
                        </>
                    )}
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {event.category_name && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-xs font-bold uppercase tracking-wider text-pink-400">
                                    {event.category_name}
                                </span>
                            )}
                            {tags.map((t: any) => (
                                <span key={t.tag_id} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-medium">
                                    #{t.tag_name}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-black leading-tight">{event.title}</h1>

                        {/* Rating pill */}
                        {reviews.length > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-yellow-500/30">
                                <span className="text-yellow-400">★</span>
                                <span className="font-bold text-white">{avgRating.toFixed(1)}</span>
                                <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 text-gray-300">
                            <div className="flex items-center gap-3">
                                <span>📅</span>
                                <span>{new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span>⏰</span>
                                <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {event.venue_name && (
                                <div className="flex items-center gap-3">
                                    <span>📍</span>
                                    <span>{event.venue_name}, {event.venue_city}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <span>👤</span>
                                <span>Organized by <span className="text-white font-semibold">{event.organizer_name}</span></span>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4 items-center flex-wrap">
                            <button
                                onClick={() => router.push(`/dashboard/event/${id}`)}
                                className="px-8 py-4 rounded-2xl gradient-btn text-xl font-bold shadow-lg shadow-pink-500/25 hover:scale-105 transition-transform"
                            >
                                Get Tickets
                            </button>
                            {minPrice > 0 && (
                                <div className="px-6 py-4 rounded-2xl glass flex flex-col justify-center">
                                    <span className="text-xs text-gray-400 uppercase font-bold">Starting from</span>
                                    <span className="text-xl font-bold text-white">৳{minPrice.toFixed(0)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ticket Cards */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-200 mb-4">Available Tickets</h3>
                        {ticketTypes.length === 0 ? (
                            <div className="glass-strong p-8 rounded-3xl border border-white/10 text-center text-gray-500">
                                Tickets coming soon
                            </div>
                        ) : (
                            ticketTypes.map(ticket => (
                                <motion.div
                                    key={ticket.ticket_type_id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass-strong p-6 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">{ticket.name}</h4>
                                            <p className="text-sm text-gray-500">{ticket.quantity > 0 ? `${ticket.quantity} remaining` : 'Sold Out'}</p>
                                        </div>
                                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                                            ৳{parseFloat(ticket.price).toFixed(0)}
                                        </span>
                                    </div>
                                    {ticket.quantity > 0 ? (
                                        <button
                                            onClick={() => handleBookTicket(ticket)}
                                            className="w-full py-3 rounded-xl gradient-btn font-semibold hover:scale-[1.02] transition-transform text-sm"
                                        >
                                            Book Now
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <button className="w-full py-2.5 rounded-xl bg-gray-700/50 text-gray-400 cursor-not-allowed font-semibold text-sm" disabled>
                                                Sold Out
                                            </button>
                                            <button
                                                onClick={() => handleJoinWaitlist(ticket.ticket_type_id)}
                                                disabled={waitlistLoading}
                                                className="w-full py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 font-semibold text-sm transition-all"
                                            >
                                                {waitlistLoading ? 'Joining...' : 'Join Waitlist'}
                                            </button>
                                        </div>
                                    )}
                                    {waitlistMsg && <p className="mt-2 text-xs text-center text-purple-300">{waitlistMsg}</p>}
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Content Tabs */}
                <div className="mb-8">
                    <div className="flex gap-1 border-b border-white/10">
                        {(['about', 'schedule', 'reviews'] as const).map(sec => (
                            <button
                                key={sec}
                                onClick={() => setActiveSection(sec)}
                                className={`px-6 py-3 text-sm font-semibold capitalize transition-all relative
                                    ${activeSection === sec ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {sec} {sec === 'reviews' && reviews.length > 0 && `(${reviews.length})`}
                                {sec === 'schedule' && schedule.length > 0 && `(${schedule.length})`}
                                {activeSection === sec && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* About */}
                    {activeSection === 'about' && (
                        <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="glass-strong p-8 rounded-3xl border border-white/10 text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {event.description || 'No description provided.'}
                            </div>

                            {/* Venue Info */}
                            {event.venue_name && (
                                <div className="mt-6 glass-strong p-6 rounded-2xl border border-white/10">
                                    <h3 className="font-bold text-white mb-4">📍 Venue Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Venue</p>
                                            <p className="text-white font-medium">{event.venue_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">City</p>
                                            <p className="text-white font-medium">{event.venue_city}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Schedule */}
                    {activeSection === 'schedule' && (
                        <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {schedule.length === 0 ? (
                                <div className="glass-strong p-12 rounded-3xl border border-white/10 text-center text-gray-500">
                                    <p className="text-4xl mb-4">📋</p>
                                    <p>No schedule posted yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {schedule.map((session: any, i: number) => (
                                        <motion.div
                                            key={session.schedule_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="glass-strong p-6 rounded-2xl border border-white/10 flex gap-6"
                                        >
                                            <div className="text-center shrink-0 w-20">
                                                <p className="text-xs text-pink-400 font-bold uppercase">
                                                    {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="w-px bg-white/10" />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-white">{session.title}</h4>
                                                        {session.description && <p className="text-gray-400 text-sm mt-1">{session.description}</p>}
                                                        {session.speaker_name && (
                                                            <p className="text-sm text-purple-400 mt-2">🎤 {session.speaker_name}</p>
                                                        )}
                                                        {session.location && (
                                                            <p className="text-xs text-gray-500 mt-1">📍 {session.location}</p>
                                                        )}
                                                    </div>
                                                    <span className="px-2 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-medium shrink-0">
                                                        {session.session_type}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Reviews */}
                    {activeSection === 'reviews' && (
                        <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                            {/* Rating Summary */}
                            {reviews.length > 0 && (
                                <div className="glass-strong p-6 rounded-2xl border border-white/10 flex items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-6xl font-black text-white">{avgRating.toFixed(1)}</p>
                                        <div className="flex justify-center gap-0.5 my-2">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`text-xl ${s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                                            ))}
                                        </div>
                                        <p className="text-gray-500 text-sm">{reviews.length} reviews</p>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = reviews.filter(r => r.rating === star).length;
                                            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <span className="text-yellow-400 text-sm w-4">{star}★</span>
                                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-gray-500 text-xs w-6">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Write Review */}
                            <div className="glass-strong p-6 rounded-2xl border border-white/10">
                                <h3 className="font-bold text-white mb-4">Write a Review</h3>
                                {!user ? (
                                    <p className="text-gray-500 text-sm">
                                        <Link href="/login" className="text-pink-400 hover:underline">Log in</Link> to leave a review.
                                    </p>
                                ) : (
                                    <form onSubmit={handleSubmitReview} className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-2">Your rating</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button
                                                        type="button"
                                                        key={s}
                                                        onMouseEnter={() => setHoverRating(s)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        onClick={() => setRating(s)}
                                                        className={`text-3xl transition-transform hover:scale-125 ${s <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-600'}`}
                                                    >★</button>
                                                ))}
                                            </div>
                                        </div>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 text-sm"
                                            placeholder="Review title (optional)"
                                            value={reviewTitle}
                                            onChange={e => setReviewTitle(e.target.value)}
                                        />
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 text-sm min-h-[100px] resize-none"
                                            placeholder="Share your experience..."
                                            value={reviewContent}
                                            onChange={e => setReviewContent(e.target.value)}
                                        />
                                        {reviewMsg && <p className="text-sm text-pink-400">{reviewMsg}</p>}
                                        <button className="px-6 py-3 rounded-xl gradient-btn font-semibold text-sm" disabled={submittingReview}>
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-4">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <p className="text-4xl mb-3">⭐</p>
                                        <p>No reviews yet. Be the first!</p>
                                    </div>
                                ) : (
                                    reviews.map((review: any) => (
                                        <motion.div key={review.review_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="glass-strong p-6 rounded-2xl border border-white/10">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0">
                                                    {review.reviewer_name?.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <p className="font-semibold text-white">{review.reviewer_name}</p>
                                                        {review.is_verified && (
                                                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">✓ Attended</span>
                                                        )}
                                                        <span className="text-gray-600 text-xs ml-auto">{new Date(review.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex gap-0.5 mb-2">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <span key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                                                        ))}
                                                    </div>
                                                    {review.title && <p className="font-semibold text-white text-sm mb-1">{review.title}</p>}
                                                    {review.content && <p className="text-gray-400 text-sm leading-relaxed">{review.content}</p>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm mt-16">
                <p>© {new Date().getFullYear()} Event Ekhanei. All rights reserved.</p>
            </footer>
        </div>
    );
}
