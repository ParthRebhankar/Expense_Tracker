import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    EyeOff,
    Eye,
    ArrowRight,
    HelpCircle,
    FastForward
} from "lucide-react"
import VantaBackground from "@/components/VantaBackground"
import { authenticate } from "@/lib/auth"

const Signup = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');

        // Basic validation
        if (!username.trim()) {
            setError('Username is required.');
            return;
        }
        if (!password) {
            setError('Password is required.');
            return;
        }

        setLoading(true);
        try {
            // Unified authenticate logic (Signup or Login automatically)
            await authenticate(username.trim(), password);
            navigate('/home');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            await authenticate('guest', 'guest');
            navigate('/home');
        } catch (err) {
            setError('Skip mode failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden font-sans antialiased text-[#111111] bg-white">
            {/* Left Panel - Sign In Form */}
            <div className="w-full lg:w-[450px] flex flex-col items-center justify-between p-8 lg:p-12 bg-white relative shrink-0 z-10 transition-all duration-500">
                <div className="w-full flex flex-col items-center">
                    {/* Logo Placeholder */}
                    <div className="mb-12 mt-4 hover:scale-110 transition-transform cursor-pointer">
                        <svg
                            width="45"
                            height="35"
                            viewBox="0 0 100 80"
                            fill="none"
                            xmlns="https://www.svgrepo.com/show/410240/piggy-bank.svg"
                            className="text-[#111111]"
                        >
                            <path d="M50 0L100 80H0L50 0Z" fill="currentColor" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold mb-8 text-[#111111]">Sign in</h1>

                    {/* Error Message */}
                    {error && (
                        <div className="w-full px-4 mb-4 text-center">
                            <div className="text-[12px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-sm inline-block">
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <div className="w-full space-y-4 px-4">
                        <div className="relative group">
                            <div className="absolute top-2 left-3 text-[10px] font-bold text-[#999] uppercase tracking-wider transition-all group-focus-within:text-[#111]">
                                Username
                            </div>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pt-6 pb-2 px-3 h-14 bg-[#EDEDED] border-none focus-visible:ring-2 focus-visible:ring-[#111] rounded-sm font-medium transition-all"
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute top-2 left-3 text-[10px] font-bold text-[#999] uppercase tracking-wider transition-all group-focus-within:text-[#111]">
                                Password
                            </div>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pt-6 pb-2 px-3 h-14 bg-[#EDEDED] border-2 border-transparent focus-visible:border-[#111] focus-visible:ring-0 rounded-sm font-medium transition-all"
                            />
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#111] transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>

                        {/* Social / Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSkip}
                                className="flex-1 h-10 flex items-center justify-center bg-[#EDEDED] rounded-sm hover:bg-[#E0E0E0] transition-all group active:scale-95 text-zinc-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 px-4 shadow-sm"
                            >
                                <FastForward size={14} />
                                Skip
                            </button>
                            <button className="flex-1 h-10 flex items-center justify-center bg-white border border-[#EDEDED] rounded-sm hover:bg-[#F9F9F9] transition-all active:scale-95">
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            </button>
                            <button className="flex-1 h-10 flex items-center justify-center bg-black rounded-sm hover:opacity-90 transition-all active:scale-95">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                    <path d="M17.05 20.28c-.96.95-2.18 1.78-3.4 1.78-1.43 0-1.89-.88-3.57-.88-1.68 0-2.17.86-3.55.88-1.28 0-2.58-.93-3.62-2-2.11-2.16-3.23-6.1-3.23-8.77 0-4.04 2.53-6.17 4.92-6.17 1.25 0 2.22.75 3.06.75.83 0 1.95-.75 3.32-.75.64 0 2.44.05 3.65 1.83-3.04 1.85-2.55 5.89.52 7.15-1 .2.86 1.44 2.11 3.23l1.81 2.95zM12.03 5.4c0-2.3 1.95-4.15 4.14-4.15.05.5 0 1.87-.93 3.16-1.04 1.41-2.48 2.21-3.21 2.21 0-.54 0-1.22 0-1.22z m0 0" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="stay-signed-in" className="data-[state=checked]:bg-[#D13639] data-[state=checked]:border-[#D13639] border-[#EDEDED] rounded-sm transition-all" />
                            <label htmlFor="stay-signed-in" className="text-[12px] font-bold text-[#111] leading-none cursor-pointer select-none">
                                Stay signed in
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Button Section */}
                <div className="w-full flex flex-col items-center">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-16 h-16 bg-[#D13639] flex items-center justify-center rounded-2xl hover:bg-[#B12C2F] transition-all transform hover:scale-105 active:scale-95 shadow-lg mb-8 lg:mb-12 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ArrowRight color="white" size={32} />
                        )}
                    </button>

                    <footer className="w-full text-center space-y-2 pb-4">
                        <div className="space-y-1">
                            <a href="#" className="block text-[11px] font-bold text-[#999] hover:text-[#111] uppercase tracking-wide transition-colors">
                                Can't sign in?
                            </a>
                            <a href="#" className="block text-[11px] font-bold text-[#999] hover:text-[#111] uppercase tracking-wide transition-colors">
                                Create Account
                            </a>
                        </div>
                    </footer>
                </div>

                <div className="absolute top-6 right-6 text-[#999]">
                    <HelpCircle size={20} className="cursor-pointer hover:text-[#111] transition-colors" />
                </div>

            </div>

            {/* Right Panel - Vanta.js NET Effect Background */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden h-full">
                {/* Vanta.js Layer */}
                <VantaBackground />

                {/* Setting icon */}
                <div className="absolute bottom-10 right-10 bg-black/20 p-2 rounded-md hover:bg-black/40 transition-colors cursor-pointer border border-black/10 backdrop-blur-sm z-20 active:scale-90 shadow-xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 15.5C14.21 15.5 16 13.71 16 11.5S14.21 7.5 12 7.5 8 9.29 8 11.5 9.79 15.5 12 15.5M19.43 12.98C19.47 12.5 19.5 12.02 19.5 11.5S19.47 10.5 19.43 10.02L21.54 8.37C21.73 8.22 21.78 7.95 21.66 7.73L19.66 4.27C19.54 4.05 19.27 3.96 19.05 4.05L16.56 5.05C16.05 4.66 16.05 4.66 16.56 5.05Z" />
                        <path d="M19.43 12.98C19.47 12.5 19.5 12.02 19.5 11.5S19.47 10.5 19.43 10.02L21.54 8.37C21.73 8.22 21.78 7.95 21.66 7.73L19.66 4.27C19.54 4.27 19.27 3.96 19.05 4.05L16.56 5.05C16.05 4.66 15.5 4.34 14.87 4.08L14.5 1.42C14.46 1.18 14.24 1 14 1H10C9.76 1 9.54 1.18 9.5 1.42L9.13 4.08C8.5 4.34 7.95 4.66 7.44 5.05L4.95 4.05C4.73 3.96 4.46 4.05 4.34 4.27L2.34 7.73C2.22 7.95 2.27 8.22 2.46 8.37L4.57 10.02C4.53 10.5 4.5 10.98 4.5 11.5S4.53 12.5 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.04 4.95 18.95L7.44 17.95C7.95 18.34 8.5 18.66 9.13 18.92L9.5 21.58C9.54 21.82 9.76 22 10 22H14C14.24 22 14.46 21.82 14.5 21.58L14.87 18.92C15.5 18.66 16.05 18.34 16.56 17.95L19.05 18.95C19.27 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default Signup
