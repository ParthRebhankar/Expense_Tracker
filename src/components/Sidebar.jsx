import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { authFetch, logout, getUser } from '@/lib/auth'
import {
    LayoutDashboard,
    ReceiptText,
    History,
    PiggyBank,
    Bell,
    BellRing,
    Settings,
    LogOut
} from 'lucide-react'
import { cn } from "@/lib/utils"
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const menuItems = [
    { icon: ReceiptText, label: 'Expenses', path: '/home' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: History, label: 'History', path: '/history' },
    { icon: PiggyBank, label: 'Budgets', path: '/budgets' },
    { icon: BellRing, label: 'Notifications', path: '/notifications' },
]

const Sidebar = () => {
    const location = useLocation()
    const [unreadCount, setUnreadCount] = useState(0)
    const user = getUser()

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await authFetch('/api/notifications/unread-count')
                if (res.ok) {
                    const data = await res.json()
                    setUnreadCount(data.count)
                }
            } catch (err) {
                // silently ignore
            }
        }
        fetchCount()
        const interval = setInterval(fetchCount, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 flex flex-col items-start py-8 bg-zinc-950 border-r border-zinc-800 z-50 transition-all duration-300 hover:w-64 group overflow-hidden select-none peer">
            {/* Logo Section - Centered in 80px */}
            <div className="w-20 group-hover:w-full flex items-center justify-center mb-12 shrink-0">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
                    <span className="text-white font-black text-xl italic"><img src="https://www.svgrepo.com/show/410240/piggy-bank.svg" alt="" /></span>
                </div>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 w-full space-y-2 px-3">
                <TooltipProvider delayDuration={0}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>
                                    <Link
                                        to={item.path}
                                        className={cn(
                                            "flex items-center h-12 w-full rounded-xl transition-all duration-200 group/item relative overflow-hidden",
                                            isActive
                                                ? "bg-red-600/10 text-red-500"
                                                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                        )}
                                    >
                                        {/* Icon Container - Always 54px (80px aside - padding) to keep it stable */}
                                        <div className="w-14 flex items-center justify-center shrink-0 relative">
                                            <item.icon size={22} className={cn("transition-colors", isActive && "text-red-500")} />
                                            {item.path === '/notifications' && unreadCount > 0 && (
                                                <div className="absolute top-0 right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40">
                                                    <span className="text-[8px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                                </div>
                                            )}
                                        </div>


                                        {/* Label - Hidden by width and opacity */}
                                        <span className="ml-1 font-bold text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden w-0 group-hover:w-auto pointer-events-none">
                                            {item.label}
                                        </span>

                                        {isActive && (
                                            <div className="absolute left-0 w-1 h-6 bg-red-600 rounded-r-full" />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="group-hover:hidden">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </TooltipProvider>
            </nav>

            {/* Bottom Section */}
            <div className="w-full space-y-4 px-3">

                <div className="px-2">
                    <div className="h-px bg-zinc-800 w-full" />
                </div>

                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={logout}
                                className="flex items-center h-12 w-full rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-all relative overflow-hidden"
                            >
                                <div className="w-14 flex items-center justify-center shrink-0">
                                    <LogOut size={22} />
                                </div>
                                <span className="ml-1 font-bold text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden w-0 group-hover:w-auto pointer-events-none">
                                    Sign Out
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="group-hover:hidden">
                            Sign Out
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* User Profile */}
                <div className="flex items-center h-14 w-full rounded-xl transition-all relative overflow-hidden">
                    <div className="w-14 flex items-center justify-center shrink-0">
                        <Avatar className="w-10 h-10 border-2 border-zinc-800 group-hover:border-red-600 transition-colors cursor-pointer">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>US</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="ml-1 flex flex-col opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden w-0 group-hover:w-auto pointer-events-none">
                        <span className="text-sm font-bold text-zinc-100 truncate whitespace-nowrap">{user?.username || 'UserXYZ'}</span>
                        <span className="text-xs text-zinc-500 truncate whitespace-nowrap uppercase tracking-tighter">Free Plan</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
