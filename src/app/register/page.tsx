'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Briefcase, Phone, Upload, Check, Loader, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
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
        <div className="relative min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-6 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-orange-900/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-2xl relative z-10"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-10 group">
                    <div className="relative w-10 h-10">
                        <span className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-orange-400 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-full h-full bg-[#0B0F1A] rounded-xl border border-white/10 flex items-center justify-center">
                            <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-orange-400 font-bold text-xl">E</span>
                        </div>
                    </div>
                    <span className="font-bold text-2xl tracking-tight">Event <span className="text-cyan-400">Ekhanei</span></span>
                </Link>

                <div className="bg-[#161B2B]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">

                    {/* Header & Steps */}
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                            <p className="text-gray-400">Join the future of events</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0B0F1A] p-2 rounded-full border border-white/10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1 ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>1</div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2 ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>2</div>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-8 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3"
                        >
                            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">!</div>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                                placeholder="john@example.com"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            <input
                                                type="password"
                                                required
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="w-full mt-4 bg-white text-black hover:bg-gray-100 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Phone</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                                <input
                                                    type="tel"
                                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                                    placeholder="+123..."
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Designation</label>
                                            <div className="relative group">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                                    placeholder="Developer"
                                                    value={designation}
                                                    onChange={e => setDesignation(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${profileImage ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                                            <label className="cursor-pointer flex items-center justify-center gap-4 py-2">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setProfileImage(e.target.files[0])} />
                                                {profileImage ? (
                                                    <span className="text-cyan-400 flex items-center gap-2 font-medium"><Check className="w-5 h-5" /> {profileImage.name}</span>
                                                ) : (
                                                    <span className="text-gray-400 flex items-center gap-2"><Upload className="w-5 h-5" /> Upload Profile Photo *</span>
                                                )}
                                            </label>
                                        </div>

                                        <div className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${idCard ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                                            <label className="cursor-pointer flex items-center justify-center gap-4 py-2">
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && setIdCard(e.target.files[0])} />
                                                {idCard ? (
                                                    <span className="text-purple-400 flex items-center gap-2 font-medium"><Check className="w-5 h-5" /> {idCard.name}</span>
                                                ) : (
                                                    <span className="text-gray-400 flex items-center gap-2"><Upload className="w-5 h-5" /> Upload Organization ID (Optional)</span>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-6 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-colors"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="w-5 h-5 animate-spin" />
                                                    Creating Account...
                                                </>
                                            ) : (
                                                'Complete Registration'
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
