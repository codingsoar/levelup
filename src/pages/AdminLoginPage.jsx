import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const { loginAdmin } = useAuthStore();

    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!adminId.trim() || !password.trim()) {
            setError('Please enter Admin ID and Password.');
            return;
        }

        if (loginAdmin(adminId.trim(), password)) {
            navigate('/admin');
            return;
        }

        setError('Invalid Admin Credentials.');
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col overflow-hidden relative selection:bg-accent-pink selection:text-white">
            {/* Background Elements - Identical to Student Login */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent-purple/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten"></div>
                <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten"></div>

                <div className="absolute top-20 left-20 text-accent-yellow/40 animate-pulse hidden md:block">
                    <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>pentagon</span>
                </div>
                <div className="absolute bottom-20 right-40 text-accent-pink/30 animate-bounce hidden md:block" style={{ animationDuration: '3s' }}>
                    <span className="material-symbols-outlined text-5xl">circle</span>
                </div>
                <div className="absolute top-1/2 left-10 text-primary/30 hidden md:block">
                    <span className="material-symbols-outlined text-4xl">change_history</span>
                </div>
                <div className="absolute bottom-1/3 right-10 text-accent-purple/30 hidden md:block">
                    <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>star</span>
                </div>
            </div>

            <div className="layout-container flex h-full grow flex-col z-10 justify-center items-center p-4">
                {/* Login Card */}
                <div className="bg-white dark:bg-[#1a2c33] rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden border border-white/50 dark:border-white/5 backdrop-blur-sm relative">
                    {/* Top Decoration Line */}
                    <div className="h-2 w-full bg-gradient-to-r from-accent-purple via-primary to-secondary"></div>

                    <div className="p-8 md:p-10 flex flex-col gap-6">
                        {/* Header Section */}
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="size-16 rounded-2xl bg-gradient-to-br from-admin-primary to-admin-secondary flex items-center justify-center shadow-lg shadow-admin-primary/30 mb-2 group cursor-default hover:scale-105 transition-transform duration-300">
                                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-dark-text dark:text-white text-3xl font-extrabold tracking-tight">Admin Portal</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Manage the learning experience</p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <form className="flex flex-col gap-5 mt-2" onSubmit={handleSubmit}>
                            {/* Admin ID Input */}
                            <div className="space-y-1.5 group">
                                <label className="text-dark-text dark:text-slate-200 text-sm font-bold flex items-center gap-2" htmlFor="admin-id">
                                    <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                                    Admin ID
                                </label>
                                <div className="relative">
                                    <input
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-[#25363d] px-4 py-3.5 text-dark-text dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                                        id="admin-id"
                                        placeholder="Enter Admin ID"
                                        type="text"
                                        value={adminId}
                                        onChange={(e) => setAdminId(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5 group">
                                <label className="text-dark-text dark:text-slate-200 text-sm font-bold flex items-center gap-2" htmlFor="password">
                                    <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-[#25363d] px-4 py-3.5 text-dark-text dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                                        id="password"
                                        placeholder="Enter your password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                            {/* Primary Button */}
                            <button className="mt-2 w-full bg-admin-primary hover:bg-admin-secondary text-white font-bold text-lg h-12 rounded-xl shadow-lg shadow-admin-primary/25 hover:shadow-admin-secondary/40 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group">
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">login</span>
                                <span>Admin Login</span>
                            </button>
                        </form>
                    </div>

                    {/* Bottom decorative accent */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800"></div>
                </div>

                {/* Footer Text */}
                <div className="mt-8 text-center text-slate-400/80 dark:text-slate-500 text-xs">
                    <p>© 2026 LEVEL UP LEARNING.</p>
                </div>
            </div>
        </div>
    );
}
