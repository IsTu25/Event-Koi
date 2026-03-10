'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Eye, Globe, Palette, Save, Check, Shield } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [prefs, setPrefs] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'notifications' | 'privacy' | 'security' | 'preferences' | 'account'>('notifications');
    const [roleRequest, setRoleRequest] = useState<any>(null);
    const [requestingRole, setRequestingRole] = useState(false);

    // 2FA state
    const [tfa, setTfa] = useState<any>(null);
    const [tfaLoading, setTfaLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push('/login'); return; }
        const u = JSON.parse(stored);
        setUser(u);
        fetch(`/api/user-preferences?user_id=${u.id}`)
            .then(r => r.json())
            .then(d => { setPrefs(d); setLoading(false); });

        fetch(`/api/users/role-request?user_id=${u.id}`)
            .then(r => r.json())
            .then(d => setRoleRequest(d));

        fetch(`/api/users/2fa?user_id=${u.id}`)
            .then(r => r.json())
            .then(d => setTfa(d));
    }, [router]);
    const handleRoleRequest = async () => {
        setRequestingRole(true);
        const res = await fetch('/api/users/role-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, requested_role: 'organizer' }),
        });
        setRequestingRole(false);
        if (res.ok) {
            setRoleRequest({ status: 'PENDING' });
            alert('Your request to become an organizer has been submitted for review.');
        }
    };

    const toggleTfa = async () => {
        setTfaLoading(true);
        const action = tfa?.is_enabled ? 'DISABLE' : 'ENABLE';
        const res = await fetch('/api/users/2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, action })
        });
        const data = await res.json();
        setTfaLoading(false);
        if (res.ok) {
            setTfa((prev: any) => ({ ...prev, is_enabled: action === 'ENABLE' }));
            if (action === 'ENABLE' && data.backup_codes) {
                alert(`2FA Enabled! IMPORTANT: Save these backup codes:\n\n${data.backup_codes.join('\n')}`);
            }
        } else {
            alert('Failed to update 2FA settings.');
        }
    };


    const handleSave = async () => {
        setSaving(true);
        const res = await fetch('/api/user-preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...prefs, user_id: user.id }),
        });
        setSaving(false);
        if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    };

    const toggle = (key: string) => setPrefs((p: any) => ({ ...p, [key]: !p[key] }));

    const sections = [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Eye },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'preferences', label: 'Preferences', icon: Globe },
        { id: 'account', label: 'Account', icon: Palette }
    ] as const;

    if (loading) return (
        <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-cyan-900/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto p-6 lg:p-10">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Link href="/dashboard/profile" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Profile
                    </Link>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-black text-white">Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your notification and privacy preferences</p>
                </motion.div>

                {/* Section Tabs */}
                <div className="flex gap-1 p-1 bg-[#161B2B] border border-white/5 rounded-2xl mb-8">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                                ${activeSection === s.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            <s.icon size={15} />
                            {s.label}
                        </button>
                    ))}
                </div>

                <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-[#161B2B] border border-white/5 rounded-3xl overflow-hidden">

                        {activeSection === 'notifications' && (
                            <div className="divide-y divide-white/5">
                                {[
                                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                                    { key: 'push_notifications', label: 'Push Notifications', desc: 'Browser & mobile push notifications' },
                                    { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Text message alerts (data rates may apply)' },
                                    { key: 'notify_new_events', label: 'New Event Alerts', desc: 'Notified when new events match your interests' },
                                    { key: 'notify_event_reminders', label: 'Event Reminders', desc: '24 hours before events you\'ve booked' },
                                    { key: 'notify_friend_requests', label: 'Friend & Follow Alerts', desc: 'When someone follows you or sends a request' },
                                    { key: 'notify_messages', label: 'Message Notifications', desc: 'When you receive a new message' },
                                    { key: 'notify_promotions', label: 'Promotions & Offers', desc: 'Special deals and promotional emails' },
                                ].map(item => (
                                    <ToggleRow key={item.key} label={item.label} desc={item.desc}
                                        value={!!prefs[item.key]} onChange={() => toggle(item.key)} />
                                ))}
                            </div>
                        )}

                        {activeSection === 'privacy' && (
                            <div className="divide-y divide-white/5">
                                <div className="p-6">
                                    <p className="font-semibold text-white mb-1">Profile Visibility</p>
                                    <p className="text-gray-500 text-sm mb-4">Who can see your profile?</p>
                                    <div className="flex gap-3">
                                        {['Public', 'Friends', 'Private'].map(option => (
                                            <button
                                                key={option}
                                                onClick={() => setPrefs((p: any) => ({ ...p, privacy_mode: option.toUpperCase() }))}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                                                    ${(prefs.privacy_mode || '').toUpperCase() === option.toUpperCase()
                                                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {[
                                    { key: 'show_email', label: 'Show Email on Profile', desc: 'Others can see your email address' },
                                    { key: 'show_phone', label: 'Show Phone on Profile', desc: 'Others can see your phone number' },
                                ].map(item => (
                                    <ToggleRow key={item.key} label={item.label} desc={item.desc}
                                        value={!!prefs[item.key]} onChange={() => toggle(item.key)} />
                                ))}
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="p-8 space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield size={20} className="text-cyan-400" /> Two-Factor Authentication (2FA)</h3>
                                    <p className="text-sm text-gray-400 mb-6">Protect your account using an extra layer of security. When enabled, you'll be required to enter a code in addition to your password.</p>

                                    <div className="p-6 rounded-2xl bg-[#0B0F1A] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-white uppercase text-xs tracking-widest">{tfa?.is_enabled ? '2FA IS ACTIVE' : '2FA IS DISABLED'}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">{tfa?.is_enabled ? 'Your account is secured.' : 'We recommend enabling this.'}</p>
                                        </div>
                                        <button
                                            disabled={tfaLoading}
                                            onClick={toggleTfa}
                                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tfa?.is_enabled ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20'}`}
                                        >
                                            {tfaLoading ? '...' : (tfa?.is_enabled ? 'Disable 2FA' : 'Enable 2FA')}
                                        </button>
                                    </div>

                                    {!tfa?.is_enabled && (
                                        <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                                            🌟 <strong className="text-purple-400">Bonus:</strong> Enable 2FA to unlock the "Iron Clad" security achievement points!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'preferences' && (
                            <div className="divide-y divide-white/5">
                                <div className="p-6">
                                    <p className="font-semibold text-white mb-1">Theme</p>
                                    <p className="text-gray-500 text-sm mb-4">Choose your preferred display theme</p>
                                    <div className="flex gap-3">
                                        {['system', 'dark', 'light'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setPrefs((p: any) => ({ ...p, theme: opt }))}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border capitalize transition-all
                                                    ${prefs.theme === opt
                                                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="font-semibold text-white mb-1">Language</p>
                                    <p className="text-gray-500 text-sm mb-4">Your preferred language</p>
                                    <select
                                        className="bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                                        value={prefs.language || 'en'}
                                        onChange={e => setPrefs((p: any) => ({ ...p, language: e.target.value }))}
                                    >
                                        <option value="en">🇺🇸 English</option>
                                        <option value="bn">🇧🇩 বাংলা (Bengali)</option>
                                        <option value="hi">🇮🇳 हिंदी (Hindi)</option>
                                    </select>
                                </div>
                                <div className="p-6">
                                    <p className="font-semibold text-white mb-1">Currency</p>
                                    <p className="text-gray-500 text-sm mb-4">Display prices in</p>
                                    <select
                                        className="bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                                        value={prefs.currency || 'BDT'}
                                        onChange={e => setPrefs((p: any) => ({ ...p, currency: e.target.value }))}
                                    >
                                        <option value="BDT">৳ BDT (Bangladeshi Taka)</option>
                                        <option value="USD">$ USD (US Dollar)</option>
                                        <option value="GBP">£ GBP (British Pound)</option>
                                        <option value="EUR">€ EUR (Euro)</option>
                                    </select>
                                </div>
                                <div className="p-6">
                                    <p className="font-semibold text-white mb-1">Discovery Radius</p>
                                    <p className="text-gray-500 text-sm mb-4">Find events within {prefs.preferred_radius_km || 50} km</p>
                                    <input
                                        type="range" min={5} max={500} step={5}
                                        value={prefs.preferred_radius_km || 50}
                                        onChange={e => setPrefs((p: any) => ({ ...p, preferred_radius_km: parseInt(e.target.value) }))}
                                        className="w-full accent-cyan-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                                        <span>5 km</span><span>500 km</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'account' && (
                            <div className="p-8">
                                <h3 className="text-xl font-bold mb-2">Account Type</h3>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6 font-semibold">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Current Role</p>
                                            <p className="text-2xl font-black capitalize text-cyan-400">{user?.role}</p>
                                        </div>
                                        <div className="text-right">
                                            <StatusBadge status={user?.is_verified ? 'VERIFIED' : 'UNVERIFIED'} />
                                        </div>
                                    </div>
                                </div>

                                {user?.role === 'attendee' && (
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                            🚀 Become an Event Organizer
                                        </h4>
                                        <p className="text-sm text-gray-400 mb-6">
                                            Want to host your own events? Request an organizer role to start creating, managing, and selling tickets for your own experiences.
                                        </p>

                                        {roleRequest?.status === 'PENDING' ? (
                                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs font-bold text-center">
                                                ⏳ Your request is currently under review by our admin team.
                                            </div>
                                        ) : roleRequest?.status === 'REJECTED' ? (
                                            <div>
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center mb-4">
                                                    ❌ Your previous request was rejected. Please contact support to learn more.
                                                </div>
                                                <button onClick={handleRoleRequest} disabled={requestingRole} className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-xl font-bold text-sm transition-all border border-white/5 disabled:opacity-50">
                                                    {requestingRole ? 'Submitting...' : 'Try Requesting Again'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={handleRoleRequest} disabled={requestingRole} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50">
                                                {requestingRole ? 'Processing...' : 'Request Organizer Privileges'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {user?.role === 'organizer' && (
                                    <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
                                            <Check size={24} />
                                        </div>
                                        <h4 className="font-bold text-white mb-2">You are an Organizer</h4>
                                        <p className="text-sm text-gray-400">
                                            You have full access to create and manage events. Check your <Link href="/dashboard/create-event" className="text-cyan-400 font-bold hover:underline">Event Dashboard</Link> to get started.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all
                                ${saved
                                    ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'
                                } disabled:opacity-50`}
                        >
                            {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving...' : <><Save size={16} /> Save Settings</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const isSuccess = s === 'VERIFIED' || s === 'APPROVED';
    const isWarning = s === 'PENDING' || s === 'UNVERIFIED';
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border 
            ${isSuccess ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                isWarning ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {status}
        </span>
    );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: () => void }) {
    return (
        <div className="flex items-center justify-between gap-6 p-6">
            <div>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative w-12 h-6 rounded-full transition-all duration-200 shrink-0
                    ${value ? 'bg-cyan-500' : 'bg-white/10'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200
                    ${value ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}
