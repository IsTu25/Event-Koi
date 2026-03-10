'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Upload, FileText, CheckCircle, Shield, ArrowLeft,
    MessageCircle, Search, UserPlus, X, Send, Clock,
    Calendar, MapPin, ChevronRight, Users, Loader, Check
} from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [savingExtended, setSavingExtended] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        designation: '',
        profile_image: null as File | null,
        organization_id_card: null as File | null,
        proof_document: null as File | null
    });

    const [extendedProfile, setExtendedProfile] = useState({
        bio: '',
        website_url: '',
        location: '',
        language_preference: 'en',
        timezone: ''
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

            const extRes = await fetch(`/api/user-profiles?user_id=${userId}`);
            if (extRes.ok) {
                const extData = await extRes.json();
                if (extData.bio !== undefined) {
                    setExtendedProfile({
                        bio: extData.bio || '',
                        website_url: extData.website_url || '',
                        location: extData.location || '',
                        language_preference: extData.language_preference || 'en',
                        timezone: extData.timezone || ''
                    });
                }
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
                // Reset file inputs visually if needed, though they are uncontrolled usually
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

    const handleExtendedSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingExtended(true);
        try {
            const res = await fetch('/api/user-profiles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    ...extendedProfile
                })
            });
            if (res.ok) alert('Extended profile updated!');
            else alert('Failed to update extended profile.');
        } catch (e) {
            console.error(e);
            alert('Error updating extended profile.');
        } finally {
            setSavingExtended(false);
            fetchData(user.id);
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
                <div className="absolute top-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-cyan-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-purple-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10">
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

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">My <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Profile</span></h1>
                            <p className="text-gray-400">Manage your persona and verification status.</p>
                        </div>
                        <div className="flex gap-4">
                            <StatBadge count={user?.events_organized || 0} label="Organized" />
                            <StatBadge count={user?.events_attended || 0} label="Attended" />
                        </div>
                    </div>
                </motion.header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#161B2B] border border-white/5 rounded-3xl p-8 sticky top-8"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-6 group">
                                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-cyan-500 to-purple-600">
                                        <div className="w-full h-full rounded-full bg-[#0B0F1A] overflow-hidden flex items-center justify-center relative">
                                            {user?.profile_image ? (
                                                <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={48} className="text-gray-600" />
                                            )}
                                        </div>
                                    </div>
                                    {user?.is_verified && (
                                        <div className="absolute bottom-0 right-0 bg-cyan-500 text-black p-1.5 rounded-full border-4 border-[#161B2B]" title="Verified User">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                                <p className="text-cyan-400 text-sm font-medium mb-4">{user?.email}</p>

                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8 ${user?.is_verified ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                    {user?.is_verified ? <CheckCircle size={14} /> : <Shield size={14} />}
                                    {user?.is_verified ? 'Verified Account' : 'Not Verified'}
                                </div>

                                <div className="w-full space-y-4 pt-6 border-t border-white/5">
                                    <ProfileDetail label="Role" value={user?.role} capitalize />
                                    <ProfileDetail label="Phone" value={user?.phone || 'N/A'} />
                                    <ProfileDetail label="Designation" value={user?.designation || 'N/A'} />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Edit & Functional Components */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Verification / Edit Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#161B2B] border border-white/5 rounded-3xl p-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Profile Details</h3>
                                    <p className="text-gray-400 text-sm">Update your information and documents</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Designation / Job Title</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        placeholder="e.g. Senior Event Manager"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FileUploadField
                                        label="Profile Picture"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'profile_image')}
                                        file={formData.profile_image}
                                    />
                                    <FileUploadField
                                        label="Organization ID"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleFileChange(e, 'organization_id_card')}
                                        file={formData.organization_id_card}
                                    />
                                </div>

                                <FileUploadField
                                    label="Proof of Legitimacy"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileChange(e, 'proof_document')}
                                    file={formData.proof_document}
                                />

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Save Profile Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Extended User Profile */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-[#161B2B] border border-white/5 rounded-3xl p-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Extended Profile</h3>
                                    <p className="text-gray-400 text-sm">Rich bio, links, and public profile data</p>
                                </div>
                            </div>

                            <form onSubmit={handleExtendedSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Short Bio</label>
                                    <textarea
                                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors resize-none min-h-[100px]"
                                        value={extendedProfile.bio}
                                        onChange={(e) => setExtendedProfile({ ...extendedProfile, bio: e.target.value })}
                                        placeholder="Tell us a little bit about yourself..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Personal Website</label>
                                        <input
                                            type="url"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                            value={extendedProfile.website_url}
                                            onChange={(e) => setExtendedProfile({ ...extendedProfile, website_url: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                            value={extendedProfile.location}
                                            onChange={(e) => setExtendedProfile({ ...extendedProfile, location: e.target.value })}
                                            placeholder="City, Country"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                            value={extendedProfile.timezone}
                                            onChange={(e) => setExtendedProfile({ ...extendedProfile, timezone: e.target.value })}
                                            placeholder="e.g. UTC+6"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                            value={extendedProfile.language_preference}
                                            onChange={(e) => setExtendedProfile({ ...extendedProfile, language_preference: e.target.value })}
                                            placeholder="e.g. en or bn"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={savingExtended}
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                                    >
                                        {savingExtended ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                Saving Bio...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Save Extended Profile
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>

                        {/* 2. Organized Events (If Organizer) */}
                        {user?.role === 'organizer' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-[#161B2B] border border-white/5 rounded-3xl p-8"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Your Events</h3>
                                        <p className="text-gray-400 text-sm">Events you have organized</p>
                                    </div>
                                </div>
                                <MyOrganizedEventsList userId={user.id} />
                            </motion.div>
                        )}

                        {/* 3. Friends & Network */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-[#161B2B] border border-white/5 rounded-3xl p-8"
                        >
                            <FriendsManager userId={user?.id} />
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Sub Components ---

function StatBadge({ count, label }: { count: number, label: string }) {
    return (
        <div className="bg-[#161B2B] border border-white/10 px-5 py-3 rounded-2xl text-center min-w-[100px]">
            <span className="block text-2xl font-bold text-white">{count}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</span>
        </div>
    );
}

function ProfileDetail({ label, value, capitalize = false }: { label: string, value: string, capitalize?: boolean }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={`text-white font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</span>
        </div>
    );
}

function FileUploadField({ label, accept, onChange, file }: { label: string, accept: string, onChange: (e: any) => void, file: File | null }) {
    return (
        <div className="group">
            <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
            <label className="flex items-center justify-center w-full h-14 px-4 transition bg-[#0B0F1A] border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-white/5">
                <div className="flex items-center gap-2 overflow-hidden">
                    {file ? (
                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                        <Upload className="w-5 h-5 text-gray-500 shrink-0 group-hover:text-cyan-400 font-bold" />
                    )}
                    <span className={`text-sm truncate ${file ? 'text-green-500 font-medium' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        {file ? file.name : 'Choose file...'}
                    </span>
                </div>
                <input type="file" className="hidden" accept={accept} onChange={onChange} />
            </label>
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

    if (loading) return <div className="h-20 bg-white/5 animate-pulse rounded-xl" />;

    if (events.length === 0) {
        return (
            <div className="text-center py-8 bg-[#0B0F1A] rounded-xl border border-white/5 border-dashed">
                <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No events organized yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {events.map((e: any) => (
                <Link
                    key={e.event_id}
                    href={`/dashboard/event/${e.event_id}`}
                    className="flex justify-between items-center p-4 bg-[#0B0F1A] border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all group"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${e.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {e.status}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(e.start_time).toLocaleDateString()}
                            </span>
                        </div>
                        <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{e.title}</h4>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
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
            } else { alert('Failed to send request'); }
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

    return (
        <div>
            {activeChat && <ChatWindow friend={activeChat} userId={userId} onClose={() => setActiveChat(null)} />}

            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-400">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Friends & Network</h3>
                    <p className="text-gray-400 text-sm">Connect with other attendees</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <input
                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                    placeholder="Search users to add..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                >
                    {searching ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
            </div>

            {/* Search Results */}
            <AnimatePresence>
                {searchResults.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Results</h4>
                        <div className="space-y-2">
                            {searchResults.map(u => (
                                <div key={u.id} className="flex items-center justify-between bg-[#0B0F1A] p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                            {u.profile_image ? <img src={u.profile_image} className="w-full h-full object-cover" /> : <User size={14} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{u.name}</p>
                                            <p className="text-[10px] text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => sendRequest(u.id)} className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-colors" title="Add Friend">
                                        <UserPlus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pending Requests */}
            {friends.some(f => f.status === 'PENDING' && f.is_incoming) && (
                <div className="mb-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        Pending Requests
                    </h4>
                    <div className="space-y-3">
                        {friends.filter(f => f.status === 'PENDING' && f.is_incoming).map(f => (
                            <div key={f.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                        {f.friend.image ? <img src={f.friend.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={14} /></div>}
                                    </div>
                                    <span className="text-sm font-medium text-white">{f.friend.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => updateStatus(f.id, 'ACCEPTED')} className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30">Accept</button>
                                    <button onClick={() => updateStatus(f.id, 'REJECTED')} className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends List */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                    My Friends ({friends.filter(f => f.status === 'ACCEPTED').length})
                </h4>

                {friends.filter(f => f.status === 'ACCEPTED').length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">You haven't added any friends yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {friends.filter(f => f.status === 'ACCEPTED').map(f => (
                            <div
                                key={f.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F1A] border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                                onClick={() => setActiveChat(f.friend)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 p-0.5">
                                        <div className="w-full h-full rounded-full bg-[#0B0F1A] overflow-hidden flex items-center justify-center">
                                            {f.friend.image ? <img src={f.friend.image} className="w-full h-full object-cover" /> : <User size={16} />}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0B0F1A]" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm line-clamp-1">{f.friend.name}</p>
                                        <p className="text-[10px] text-gray-500">Tap to chat</p>
                                    </div>
                                </div>
                                <MessageCircle size={18} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ChatWindow({ friend, userId, onClose }: { friend: any, userId: string, onClose: () => void }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [friend.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-[#161B2B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0B0F1A]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 p-0.5">
                            <div className="w-full h-full rounded-full bg-[#0B0F1A] overflow-hidden flex items-center justify-center">
                                {friend.image ? <img src={friend.image} className="w-full h-full object-cover" /> : <User size={16} />}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{friend.name}</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] text-gray-400">Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B0F1A]/30">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                            <MessageCircle size={40} className="mb-2" />
                            <p className="text-sm">Start chatting with {friend.name}</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.sender_id == userId;
                        return (
                            <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe
                                    ? 'bg-cyan-600 text-white rounded-tr-sm'
                                    : 'bg-[#1F2937] text-gray-200 rounded-tl-sm'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-cyan-200' : 'text-gray-500'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-[#161B2B]">
                    <div className="relative">
                        <input
                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                            placeholder="Type your message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={sending || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:bg-gray-700"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
