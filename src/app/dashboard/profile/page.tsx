'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeChat, setActiveChat] = useState<any>(null);

    const [formData, setFormData] = useState({
        designation: '',
        profile_image: null as File | null,
        organization_id_card: null as File | null,
        proof_document: null as File | null
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsed = JSON.parse(storedUser);
        fetchData(parsed.id || parsed.userId || parsed.insertId);
    }, [router]);

    const fetchData = async (userId: string) => {
        try {
            const res = await fetch(`/api/user/profile?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setFormData(prev => ({ ...prev, designation: data.designation || '' }));
            } else {
                router.push('/login');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        const data = new FormData();
        data.append('user_id', user.id);
        data.append('designation', formData.designation);
        if (formData.profile_image) data.append('profile_image', formData.profile_image);
        if (formData.organization_id_card) data.append('organization_id_card', formData.organization_id_card);
        if (formData.proof_document) data.append('proof_document', formData.proof_document);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                body: data
            });

            if (res.ok) {
                alert('Profile updated successfully!');
                fetchData(user.id);
            } else {
                alert('Update failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating profile');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen animated-gradient-bg text-white">
            {/* Floating Orbs */}
            <div className="floating-orb orb-1 opacity-30" />
            <div className="floating-orb orb-2 opacity-30" />

            <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-8">
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

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-gradient-glow">My Profile</h1>
                            <p className="text-gray-400 mt-2">Manage your account and verification</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-center glass rounded-2xl px-6 py-4">
                                <span className="block text-3xl font-bold text-gradient">{user?.events_organized || 0}</span>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Organized</span>
                            </div>
                            <div className="text-center glass rounded-2xl px-6 py-4">
                                <span className="block text-3xl font-bold text-gradient">{user?.events_attended || 0}</span>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Attended</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="glass-strong rounded-3xl p-8 text-center sticky top-8">
                            {/* Avatar */}
                            <div className="relative inline-block mb-6">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-1">
                                    <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                                        {user?.profile_image ? (
                                            <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl">👤</span>
                                        )}
                                    </div>
                                </div>
                                {user?.is_verified && (
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-lg shadow-lg">
                                        ✓
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                            <p className="text-gray-400 text-sm mb-4">{user?.email}</p>

                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${user?.is_verified ? 'badge-success' : 'badge-warning'}`}>
                                {user?.is_verified ? '✅ Verified User' : '⚠️ Not Verified'}
                            </span>

                            <div className="text-left space-y-4 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Role</span>
                                    <span className="badge-primary capitalize">{user?.role}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Phone</span>
                                    <span className="text-white font-medium">{user?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Designation</span>
                                    <span className="text-white font-medium">{user?.designation || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Verification Form */}
                        <div className="glass-strong rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-xl">
                                    📋
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Verification Documents</h3>
                                    <p className="text-gray-400 text-sm">Upload documents to get verified</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Designation / Job Title</label>
                                    <input
                                        type="text"
                                        className="premium-input w-full"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        placeholder="e.g. Event Manager, Student"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FileUpload
                                        label="Profile Picture"
                                        accept="image/*"
                                        file={formData.profile_image}
                                        onChange={(e) => handleFileChange(e, 'profile_image')}
                                    />
                                    <FileUpload
                                        label="Organization ID Card"
                                        accept="image/*,.pdf"
                                        file={formData.organization_id_card}
                                        onChange={(e) => handleFileChange(e, 'organization_id_card')}
                                    />
                                </div>

                                <FileUpload
                                    label="Proof of Legitimacy (Certificates/Docs)"
                                    accept="image/*,.pdf"
                                    file={formData.proof_document}
                                    onChange={(e) => handleFileChange(e, 'proof_document')}
                                />

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="gradient-btn px-8 py-3 rounded-xl font-bold disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Uploading...
                                        </span>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Organized Events */}
                        {user?.role === 'organizer' && (
                            <div className="glass-strong rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xl">
                                        🎪
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Events You Organized</h3>
                                        <p className="text-gray-400 text-sm">Manage your created events</p>
                                    </div>
                                </div>
                                <MyOrganizedEventsList userId={user.id} />
                            </div>
                        )}

                        {/* Friends Section */}
                        <div className="glass-strong rounded-3xl p-8">
                            <FriendsManager userId={user?.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FileUpload({ label, accept, file, onChange }: { label: string; accept: string; file: File | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
            <div className="glass rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <input type="file" accept={accept} onChange={onChange} className="w-full text-sm text-gray-400" />
                {file && (
                    <span className="text-green-400 text-sm mt-2 block flex items-center gap-2">
                        <span>✓</span> {file.name}
                    </span>
                )}
            </div>
        </div>
    );
}

function MyOrganizedEventsList({ userId }: { userId: string }) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/events?organizer_id=${userId}`)
            .then(res => res.json())
            .then(data => setEvents(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map(i => (
                    <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8 glass rounded-xl">
                <div className="text-3xl mb-2">🎭</div>
                <p className="text-gray-400">No events organized yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((e: any) => (
                <Link
                    key={e.event_id}
                    href={`/dashboard/event/${e.event_id}`}
                    className="block premium-card p-4 group"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${e.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>
                                    {e.status}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(e.start_time).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-white group-hover:text-gradient transition-all">{e.title}</h4>
                            <p className="text-xs text-gray-400">{e.venue_name || 'Online'}</p>
                        </div>
                        <span className="text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all">→</span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function FriendsManager({ userId }: { userId: string }) {
    const [friends, setFriends] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [activeChat, setActiveChat] = useState<any>(null);

    useEffect(() => {
        fetchFriends();
    }, [userId]);

    const fetchFriends = async () => {
        try {
            const res = await fetch(`/api/friends?user_id=${userId}`);
            if (res.ok) setFriends(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/users?search=${searchQuery}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.filter((u: any) => u.id !== userId));
            }
        } catch (e) { console.error(e); } finally { setSearching(false); }
    };

    const sendRequest = async (friendId: string) => {
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, friend_id: friendId })
            });
            if (res.ok) {
                alert('Request sent!');
                setSearchResults([]);
                setSearchQuery('');
                fetchFriends();
            } else { alert('Failed'); }
        } catch (e) { console.error(e); }
    };

    const updateStatus = async (friendshipId: string, status: string) => {
        try {
            await fetch('/api/friends', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: friendshipId, status })
            });
            fetchFriends();
        } catch (e) { console.error(e); }
    };

    const ChatWindow = ({ friend, onClose }: { friend: any, onClose: () => void }) => {
        const [messages, setMessages] = useState<any[]>([]);
        const [input, setInput] = useState('');
        const [sending, setSending] = useState(false);

        useEffect(() => {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }, [friend.id]);

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?user_id=${userId}&friend_id=${friend.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (e) { console.error(e); }
        };

        const sendMessage = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim()) return;
            setSending(true);
            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender_id: userId, receiver_id: friend.id, content: input })
                });
                if (res.ok) {
                    setInput('');
                    fetchMessages();
                }
            } catch (e) { console.error(e); } finally { setSending(false); }
        };

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="glass-strong w-full max-w-md rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
                                <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                                    {friend.image ? <img src={friend.image} className="w-full h-full object-cover" /> : <span>👤</span>}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{friend.name}</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-gray-400">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl w-10 h-10 glass rounded-full flex items-center justify-center">×</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center mt-20 opacity-50">
                                <div className="text-4xl mb-2">👋</div>
                                <p className="text-gray-400 text-sm">Start a conversation with {friend.name}</p>
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.sender_id == userId;
                            return (
                                <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-gradient-to-br from-pink-600 to-indigo-600 text-white rounded-tr-sm' : 'glass text-white rounded-tl-sm'}`}>
                                        <p>{msg.content}</p>
                                        <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-pink-200/70' : 'text-gray-500'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-3 items-center">
                        <input
                            className="flex-1 premium-input"
                            placeholder="Type a message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            autoFocus
                        />
                        <button
                            disabled={sending || !input.trim()}
                            className="gradient-btn w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div>
            {activeChat && <ChatWindow friend={activeChat} onClose={() => setActiveChat(null)} />}

            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-xl">
                    👥
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Friends & Connections</h3>
                    <p className="text-gray-400 text-sm">Connect with other users</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-6">
                <input
                    className="flex-1 premium-input"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} disabled={searching} className="gradient-btn px-6 rounded-xl font-semibold disabled:opacity-50">
                    {searching ? '...' : 'Find'}
                </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mb-8 pb-6 border-b border-white/10">
                    <h4 className="text-sm font-bold text-gray-400 mb-4">Found Users</h4>
                    <div className="space-y-3">
                        {searchResults.map(u => (
                            <div key={u.id} className="flex items-center justify-between premium-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
                                        <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                                            {u.profile_image ? <img src={u.profile_image} className="w-full h-full object-cover" /> : <span>👤</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{u.name}</p>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => sendRequest(u.id)} className="badge-primary hover:bg-pink-500/30 transition-colors cursor-pointer">+ Add</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Requests */}
            {friends.some(f => f.status === 'PENDING' && f.is_incoming) && (
                <div className="mb-8">
                    <h4 className="text-sm font-bold text-yellow-500 mb-4 flex items-center gap-2">
                        <span>⏳</span> Pending Requests
                    </h4>
                    <div className="space-y-3">
                        {friends.filter(f => f.status === 'PENDING' && f.is_incoming).map(f => (
                            <div key={f.id} className="flex items-center justify-between premium-card p-4 border-yellow-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 p-0.5">
                                        <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                                            {f.friend.image ? <img src={f.friend.image} className="w-full h-full object-cover" /> : <span>👤</span>}
                                        </div>
                                    </div>
                                    <p className="font-bold text-white">{f.friend.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => updateStatus(f.id, 'ACCEPTED')} className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-400 transition-colors">Accept</button>
                                    <button onClick={() => updateStatus(f.id, 'REJECTED')} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends List */}
            <div>
                <h4 className="text-sm font-bold text-gray-400 mb-4">My Friends ({friends.filter(f => f.status === 'ACCEPTED').length})</h4>
                {friends.filter(f => f.status === 'ACCEPTED').length === 0 ? (
                    <div className="text-center py-8 glass rounded-xl">
                        <div className="text-3xl mb-2">🤝</div>
                        <p className="text-gray-400 text-sm">No friends yet. Search and add people!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.filter(f => f.status === 'ACCEPTED').map(f => (
                            <div key={f.id} className="flex items-center justify-between premium-card p-4 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5 group-hover:scale-105 transition-transform">
                                        <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                                            {f.friend.image ? <img src={f.friend.image} className="w-full h-full object-cover" /> : <span>👤</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{f.friend.name}</p>
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                            <span className="text-[10px] text-gray-500">Friend</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveChat(f.friend)}
                                    className="gradient-btn w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                                    title="Send Message"
                                >
                                    💬
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
