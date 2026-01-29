'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, ArrowRight, Lock, Mail } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-6 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-10 group">
                    <div className="relative w-10 h-10">
                        <span className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-orange-400 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-full h-full bg-[#0B0F1A] rounded-xl border border-white/10 flex items-center justify-center">
                            <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-orange-400 font-bold text-xl">E</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Event <span className="text-cyan-400">Ekhanei</span></h1>
                    </div>
                </Link>

                <div className="bg-[#161B2B]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                    {/* Decor */}
                    <div className="absolute top-0 right-0 p-12 bg-cyan-500/5 rounded-bl-[4rem] pointer-events-none" />

                    <div className="text-center mb-8 relative">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-gray-400">Sign in to continue to your dashboard</p>
                    </div>

                    {registered && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 rounded-xl bg-green-500/10 p-4 text-sm text-green-400 border border-green-500/20 text-center flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">✅</span>
                            <span>Account created successfully! Please log in.</span>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 text-center flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">⚠️</span>
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/10 text-center">
                        <p className="text-gray-400">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors inline-block hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
