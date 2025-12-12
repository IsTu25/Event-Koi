'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('attendee');
    const [phone, setPhone] = useState('');
    const [designation, setDesignation] = useState('');

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [idCard, setIdCard] = useState<File | null>(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!name || !email || !password || !designation || !profileImage) {
            setError('Please fill in all required fields (Name, Email, Password, Designation, Profile Photo)');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('role', role);
            formData.append('phone', phone);
            formData.append('designation', designation);

            if (profileImage) formData.append('profile_image', profileImage);
            if (idCard) formData.append('organization_id_card', idCard);

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && (!name || !email || !password)) {
            setError('Please fill in all fields');
            return;
        }
        setError('');
        setStep(2);
    };

    return (
        <div className="relative min-h-screen animated-gradient-bg text-white overflow-hidden">
            {/* Floating Orbs */}
            <div className="floating-orb orb-1" />
            <div className="floating-orb orb-2" />
            <div className="floating-orb orb-3" />

            {/* Particles */}
            <div className="particles">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 15}s`,
                            animationDuration: `${15 + Math.random() * 10}s`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center p-6 py-12">
                <div className="w-full max-w-2xl">
                    {/* Logo */}
                    <Link href="/" className="block text-center mb-8">
                        <h1 className="text-4xl font-black text-gradient-glow">Event Koi</h1>
                    </Link>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'gradient-btn' : 'glass'}`}>
                                1
                            </div>
                            <div className={`w-20 h-1 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-white/10'}`} />
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'gradient-btn' : 'glass'}`}>
                                2
                            </div>
                        </div>
                    </div>

                    {/* Register Card */}
                    <div className="glass-strong rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {step === 1 ? 'Create Your Account' : 'Complete Your Profile'}
                            </h2>
                            <p className="text-gray-400">
                                {step === 1 ? 'Join the Event Koi community' : 'Just a few more details'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 text-center flex items-center justify-center gap-2">
                                <span className="text-lg">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {step === 1 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="premium-input w-full"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            className="premium-input w-full"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Password *</label>
                                        <input
                                            type="password"
                                            required
                                            className="premium-input w-full"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="w-full gradient-btn py-4 rounded-xl font-bold text-white text-lg mt-6"
                                    >
                                        Continue →
                                    </button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="premium-input w-full"
                                                placeholder="+880 1234 567890"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">I am a...</label>
                                            <select
                                                className="premium-input w-full"
                                                value={role}
                                                onChange={e => setRole(e.target.value)}
                                            >
                                                <option value="attendee">Attendee</option>
                                                <option value="organizer">Organizer</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Designation / Job Title *</label>
                                        <input
                                            type="text"
                                            required
                                            className="premium-input w-full"
                                            placeholder="e.g. Student, Software Engineer, Manager"
                                            value={designation}
                                            onChange={e => setDesignation(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Profile Picture *</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                required
                                                onChange={(e) => e.target.files && setProfileImage(e.target.files[0])}
                                                className="w-full text-sm text-gray-400"
                                            />
                                            {profileImage && (
                                                <span className="text-green-400 text-sm mt-2 block">✓ {profileImage.name}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Organization ID / Proof (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => e.target.files && setIdCard(e.target.files[0])}
                                            className="w-full text-sm text-gray-400"
                                        />
                                        {idCard && (
                                            <span className="text-green-400 text-sm mt-2 block">✓ {idCard.name}</span>
                                        )}
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 glass py-4 rounded-xl font-bold text-white text-lg hover:bg-white/10 transition-colors"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 gradient-btn py-4 rounded-xl font-bold text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Creating...
                                                </span>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/10 text-center">
                            <p className="text-gray-400">
                                Already have an account?{' '}
                                <Link href="/login" className="text-gradient font-semibold hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Back to home */}
                    <div className="mt-8 text-center">
                        <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
