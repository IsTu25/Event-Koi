'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import {
    Calendar, MapPin, Clock, ArrowLeft, Download, XCircle,
    QrCode, Ticket as TicketIcon, AlertCircle, CheckCircle, Loader
} from 'lucide-react';

export default function MyTickets() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsed = JSON.parse(storedUser);
        const normalizedUser = { ...parsed, id: parsed.id || parsed.userId || parsed.insertId };
        setUser(normalizedUser);
        fetchTickets(normalizedUser.id);
    }, [router]);

    const fetchTickets = async (userId: string) => {
        try {
            const res = await fetch(`/api/bookings?user_id=${userId}`);
            if (res.ok) {
                setTickets(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (ticketId: string, ticketElementId: string) => {
        const printWindow = window.open('', '', 'height=600,width=800');
        const ticketElement = document.getElementById(ticketElementId);

        if (printWindow && ticketElement) {
            printWindow.document.write('<html><head><title>Print Ticket</title>');
            printWindow.document.write(`
                <style>
                    body { font-family: 'Courier New', Courier, monospace; -webkit-print-color-adjust: exact; padding: 40px; display: flex; justify-content: center; background: #f0f0f0; }
                    .ticket-container { border: 2px solid #000; border-radius: 0px; overflow: hidden; width: 700px; display: flex; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                    .left { background: #000; color: #fff; padding: 30px; flex: 1; position: relative; border-right: 2px dashed #fff; }
                    .right { background: #fff; color: #000; padding: 30px; width: 220px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
                    h1 { margin: 0 0 15px; font-size: 28px; line-height: 1.1; text-transform: uppercase; }
                    p { margin: 5px 0; }
                    .label { font-size: 10px; text-transform: uppercase; color: #888; margin-top: 15px; letter-spacing: 1px; }
                    .value { font-size: 16px; font-weight: bold; }
                    .barcode { margin-top: 30px; text-align: center; font-family: 'Courier New', monospace; letter-spacing: 6px; border: 1px solid #333; padding: 10px; background: #fff; color: #000; font-size: 12px; }
                    .visual-barcode { height: 40px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px); width: 100%; margin-top: 10px; }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(ticketElement.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const handleCancel = async (ticket: any) => {
        const eventDate = new Date(ticket.start_time);
        const now = new Date();
        const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

        let confirmMsg = '';
        if (diffDays > 7) {
            confirmMsg = 'You are more than 7 days away. You will receive a FULL REFUND. Proceed?';
        } else if (diffDays > 2) {
            confirmMsg = `You are within 7 days. You will receive a 50% REFUND (৳${(Number(ticket.price) * 0.5).toFixed(2)}). Proceed?`;
        } else {
            alert('Cannot cancel within 48 hours of the event.');
            return;
        }

        if (confirm(confirmMsg)) {
            try {
                const res = await fetch('/api/bookings/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticket_id: ticket.ticket_id, user_id: user.id })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    fetchTickets(user.id);
                } else {
                    alert(data.message);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans selection:bg-cyan-500/30 pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[50vw] h-[50vw] bg-cyan-900/05 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[50vw] h-[50vw] bg-purple-900/05 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10">
                <DashboardNavbar user={user} />

                <div className="flex items-center gap-4 mb-12">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20">
                        🎟️
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">My <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Tickets</span></h1>
                        <p className="text-gray-400 mt-1">Access and manage your event passes.</p>
                    </div>
                </div>

                {tickets.length === 0 ? (
                    <div className="text-center py-20 bg-[#161B2B] rounded-3xl border border-white/5 border-dashed">
                        <TicketIcon className="w-20 h-20 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Tickets Found</h3>
                        <p className="text-gray-400 mb-8">You haven't booked any tickets yet.</p>
                        <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
                            Browse Events
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {tickets.map((t) => (
                            <motion.div
                                key={t.ticket_id || t.booking_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative"
                            >
                                {/* Ticket Card */}
                                <div className="relative flex flex-col md:flex-row bg-[#161B2B] rounded-3xl overflow-hidden border border-white/10 hover:border-pink-500/30 transition-all shadow-xl hover:shadow-2xl hover:shadow-pink-500/10">

                                    {/* Left Content */}
                                    <div className="flex-1 p-6 md:p-10 relative overflow-hidden">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold tracking-wider inline-flex items-center gap-1">
                                                        <TicketIcon size={12} className="text-pink-500" />
                                                        {t.ticket_name} PASS
                                                    </span>
                                                    <span className="font-mono text-xs text-gray-500 tracking-widest">#{t.unique_code.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                                <h2 className="text-3xl font-black text-white mb-2 leading-tight">{t.event_title}</h2>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-4">
                                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                                        <Calendar size={14} className="text-pink-400" />
                                                        {new Date(t.start_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                                        <Clock size={14} className="text-pink-400" />
                                                        {new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 mt-10 pt-8 border-t border-white/5">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Venue</p>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-base font-bold text-white">{t.venue_name}</p>
                                                            <p className="text-xs text-gray-400">{t.venue_city}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Admit</p>
                                                    <p className="text-base font-bold text-white">01 Person</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Perforation */}
                                    <div className="hidden md:flex flex-col justify-between py-2 relative">
                                        <div className="w-6 h-6 rounded-full bg-[#0B0F1A] border-r border-b border-white/10 absolute -top-3 -left-3" />
                                        <div className="h-full border-l-2 border-dashed border-white/10 mx-auto" />
                                        <div className="w-6 h-6 rounded-full bg-[#0B0F1A] border-r border-t border-white/10 absolute -bottom-3 -left-3" />
                                    </div>

                                    {/* Right Content (Stub using black/dark styling) */}
                                    <div className="md:w-80 bg-[#000000]/40 backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center border-t md:border-t-0 border-l border-white/10 relative">

                                        {/* Status Indicators */}
                                        {t.status === 'CANCELLED' ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/30">
                                                    <XCircle size={32} className="text-red-500" />
                                                </div>
                                                <p className="text-red-500 font-bold tracking-widest text-sm mb-1">CANCELLED</p>
                                                <p className="text-xs text-red-500/70">Refund: ৳{t.refund_amount ? Number(t.refund_amount).toFixed(2) : '0.00'}</p>
                                            </div>
                                        ) : (
                                            <div className="w-full flex flex-col items-center">
                                                <div className="bg-white p-3 rounded-xl shadow-lg mb-6">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.unique_code}`}
                                                        alt="QR Code"
                                                        className="w-32 h-32"
                                                    />
                                                </div>
                                                <p className="font-mono text-xs text-gray-500 tracking-[0.2em] mb-6">{t.unique_code}</p>

                                                {t.status === 'VALID' && (
                                                    <div className="w-full space-y-3">
                                                        <button
                                                            onClick={() => handlePrint(t.ticket_id, `ticket-${t.ticket_id}`)}
                                                            className="w-full py-3 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-white/20"
                                                        >
                                                            <Download size={16} /> Download
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(t)}
                                                            className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            Cancel Ticket
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Hidden Printable Ticket Structure */}
                                <div id={`ticket-${t.ticket_id}`} className="hidden">
                                    <div className="ticket-container">
                                        <div className="left">
                                            <h1>{t.event_title}</h1>
                                            <p className="value">{new Date(t.start_time).toLocaleDateString()} @ {new Date(t.start_time).toLocaleTimeString()}</p>
                                            <p className="label">LOCATION</p>
                                            <p className="value">{t.venue_name}, {t.venue_city}</p>
                                            <p className="label">TICKET TYPE</p>
                                            <p className="value">{t.ticket_name}</p>
                                            <div className="barcode">
                                                ID: {t.unique_code}
                                                <div className="visual-barcode"></div>
                                            </div>
                                        </div>
                                        <div className="right">
                                            <p className="label">ADMIT ONE</p>
                                            <div style={{ width: '100px', height: '100px', background: '#000', margin: '20px 0', border: '4px solid #000' }}>
                                                {/* In a real scenario, use an img tag for QR here too for print */}
                                            </div>
                                            <p className="value">৳{Number(t.price).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
