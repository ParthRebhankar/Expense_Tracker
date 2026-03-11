import React, { useState, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/auth'
import {
    Bell,
    BellRing,
    AlertTriangle,
    AlertCircle,
    TrendingUp,
    Calendar,
    BarChart3,
    Mail,
    MailCheck,
    Send,
    Settings2,
    Trash2,
    Check,
    CheckCheck,
    X,
    Shield,
    Zap,
    Eye,
    EyeOff,
    RefreshCw,
    Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"

const notificationTypeConfig = {
    budget_reached: {
        icon: AlertTriangle,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        glow: 'shadow-orange-500/5'
    },
    budget_exceeded: {
        icon: AlertCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        glow: 'shadow-red-500/10'
    },
    high_spending: {
        icon: TrendingUp,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        glow: 'shadow-amber-500/5'
    },
    reminder: {
        icon: Calendar,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        glow: 'shadow-blue-500/5'
    },
    weekly_summary: {
        icon: BarChart3,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/5'
    }
}

const categoryTabs = [
    { label: 'All', value: 'all', icon: Bell },
    { label: 'Budget Alerts', value: 'budget', icon: Shield },
    { label: 'Expense Warnings', value: 'warning', icon: AlertTriangle },
    { label: 'System', value: 'system', icon: Settings2 },
]

const Notifications = () => {
    const [notifications, setNotifications] = useState([])
    const [activeTab, setActiveTab] = useState('all')
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    // Preferences
    const [prefs, setPrefs] = useState({
        email_enabled: false,
        email_address: '',
        budget_alerts: true,
        expense_warnings: true,
        weekly_summary: true,
        daily_threshold: 1000
    })
    const [showSettings, setShowSettings] = useState(false)
    const [savingPrefs, setSavingPrefs] = useState(false)
    const [testingEmail, setTestingEmail] = useState(false)

    const fetchNotifications = useCallback(async () => {
        setLoading(true)
        try {
            const url = activeTab === 'all'
                ? '/api/notifications'
                : `/api/notifications?category=${activeTab}`

            const [notifRes, countRes] = await Promise.all([
                authFetch(url),
                authFetch('/api/notifications/unread-count')
            ])

            if (notifRes.ok) {
                const data = await notifRes.json()
                setNotifications(data)
            }
            if (countRes.ok) {
                const countData = await countRes.json()
                setUnreadCount(countData.count)
            }
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setLoading(false)
        }
    }, [activeTab])

    const fetchPreferences = useCallback(async () => {
        try {
            const res = await authFetch('/api/notification-preferences')
            if (res.ok) {
                const data = await res.json()
                setPrefs({
                    email_enabled: data.email_enabled || false,
                    email_address: data.email_address || '',
                    budget_alerts: data.budget_alerts ?? true,
                    expense_warnings: data.expense_warnings ?? true,
                    weekly_summary: data.weekly_summary ?? true,
                    daily_threshold: data.daily_threshold || 1000
                })
            }
        } catch (err) {
            console.error('Error fetching preferences:', err)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    useEffect(() => {
        fetchPreferences()
    }, [fetchPreferences])

    const handleMarkRead = async (id) => {
        try {
            await authFetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
            fetchNotifications()
        } catch (err) {
            console.error('Error marking as read:', err)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await authFetch('/api/notifications/read-all', { method: 'PATCH' })
            fetchNotifications()
        } catch (err) {
            console.error('Error:', err)
        }
    }

    const handleDelete = async (id) => {
        try {
            await authFetch(`/api/notifications/${id}`, { method: 'DELETE' })
            fetchNotifications()
        } catch (err) {
            console.error('Error deleting:', err)
        }
    }

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?')) return
        try {
            await authFetch('/api/notifications', { method: 'DELETE' })
            fetchNotifications()
        } catch (err) {
            console.error('Error:', err)
        }
    }

    const handleSavePreferences = async () => {
        setSavingPrefs(true)
        try {
            await authFetch('/api/notification-preferences', {
                method: 'PUT',
                body: JSON.stringify(prefs)
            })
        } catch (err) {
            console.error('Error saving prefs:', err)
        } finally {
            setSavingPrefs(false)
        }
    }

    const handleTestEmail = async () => {
        setTestingEmail(true)
        try {
            const res = await authFetch('/api/notifications/test-email', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                alert('✅ Test email sent! Check your inbox.')
            } else {
                alert('❌ ' + (data.error || 'Failed to send test email'))
            }
        } catch (err) {
            alert('❌ Network error. Check backend.')
        } finally {
            setTestingEmail(false)
        }
    }

    const handleCheckNotifications = async () => {
        try {
            await authFetch('/api/notifications/check', { method: 'POST' })
            fetchNotifications()
        } catch (err) {
            console.error('Error:', err)
        }
    }

    return (
        <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100 pb-20">
            {/* Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 rounded-2xl bg-red-600/10 text-red-500 border border-red-600/20">
                            <BellRing size={28} />
                        </div>
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40">
                                <span className="text-[10px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white mb-1">Notifications</h1>
                        <p className="text-zinc-500 text-lg font-medium">Stay informed about your spending activity</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold rounded-xl h-10"
                        onClick={handleCheckNotifications}
                    >
                        <RefreshCw size={14} className="mr-2" /> Check Now
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold rounded-xl h-10",
                            showSettings && "bg-red-600/10 text-red-500 border-red-600/20"
                        )}
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Mail size={14} className="mr-2" /> Email Settings
                    </Button>
                </div>
            </header>

            {/* Email Settings Panel */}
            {showSettings && (
                <Card className="mb-8 bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500" />
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            <Mail size={18} className="text-red-500" /> Email Notification Settings
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Configure Mailjet email alerts for important spending events</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Master Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", prefs.email_enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-600")}>
                                    {prefs.email_enabled ? <MailCheck size={18} /> : <EyeOff size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Email Notifications</p>
                                    <p className="text-xs text-zinc-500">Receive alerts via Mailjet when triggered</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPrefs(p => ({ ...p, email_enabled: !p.email_enabled }))}
                                className={cn(
                                    "relative w-12 h-6 rounded-full transition-all duration-300",
                                    prefs.email_enabled ? "bg-red-600" : "bg-zinc-700"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300",
                                    prefs.email_enabled ? "left-6" : "left-0.5"
                                )} />
                            </button>
                        </div>

                        {/* Email Address */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</label>
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                value={prefs.email_address}
                                onChange={(e) => setPrefs(p => ({ ...p, email_address: e.target.value }))}
                                className="h-12 bg-zinc-950 border-zinc-800 rounded-xl font-medium"
                            />
                        </div>

                        {/* Alert Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { key: 'budget_alerts', label: 'Budget Alerts', desc: 'When budgets are reached/exceeded', icon: Shield, color: 'text-red-500' },
                                { key: 'expense_warnings', label: 'Spending Warnings', desc: 'High spending alerts', icon: AlertTriangle, color: 'text-orange-500' },
                                { key: 'weekly_summary', label: 'Weekly Summary', desc: 'Spending reports every week', icon: BarChart3, color: 'text-emerald-500' }
                            ].map(({ key, label, desc, icon: Icon, color }) => (
                                <button
                                    key={key}
                                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                                        prefs[key]
                                            ? "bg-zinc-900 border-zinc-700"
                                            : "bg-zinc-950 border-zinc-800 opacity-50"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg", prefs[key] ? `${color} bg-zinc-950` : "text-zinc-700 bg-zinc-900")}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{label}</p>
                                        <p className="text-[10px] text-zinc-500">{desc}</p>
                                    </div>
                                    <div className={cn(
                                        "ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        prefs[key] ? "border-red-500 bg-red-600" : "border-zinc-700"
                                    )}>
                                        {prefs[key] && <Check size={10} className="text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Daily Threshold */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Daily Spending Alert Threshold (₹)</label>
                            <Input
                                type="number"
                                placeholder="1000"
                                value={prefs.daily_threshold}
                                onChange={(e) => setPrefs(p => ({ ...p, daily_threshold: parseFloat(e.target.value) || 0 }))}
                                className="h-12 bg-zinc-950 border-zinc-800 rounded-xl font-bold text-lg max-w-[200px]"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleSavePreferences}
                                disabled={savingPrefs}
                                className="bg-red-600 hover:bg-red-700 font-black rounded-xl h-12 px-8"
                            >
                                {savingPrefs ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </div>
                                ) : (
                                    <>
                                        <Check size={16} className="mr-2" /> Save Preferences
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleTestEmail}
                                disabled={testingEmail || !prefs.email_address}
                                className="border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white rounded-xl h-12 font-bold"
                            >
                                {testingEmail ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-zinc-500/30 border-t-zinc-400 rounded-full animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    <>
                                        <Send size={14} className="mr-2" /> Send Test Email
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                {/* Category Tabs */}
                <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                    {categoryTabs.map((tab) => {
                        const Icon = tab.icon
                        const count = tab.value === 'all'
                            ? notifications.length
                            : notifications.filter(n => n.category === tab.value).length
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                    activeTab === tab.value
                                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                                )}
                            >
                                <Icon size={14} />
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Bulk Actions */}
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 font-bold rounded-xl h-10"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck size={14} className="mr-2" /> Mark All Read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 font-bold rounded-xl h-10"
                            onClick={handleClearAll}
                        >
                            <Trash2 size={14} className="mr-2" /> Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading notifications</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
                    <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
                        <Bell size={40} className="text-zinc-800" />
                    </div>
                    <p className="text-xl font-black text-zinc-400">All caught up!</p>
                    <p className="text-sm font-medium text-zinc-600 max-w-[280px] text-center mt-2">No notifications right now. We'll alert you when something needs attention.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => {
                        const config = notificationTypeConfig[notif.type] || notificationTypeConfig.reminder
                        const Icon = config.icon

                        return (
                            <Card
                                key={notif.id}
                                className={cn(
                                    "group transition-all duration-300 overflow-hidden cursor-default",
                                    notif.is_read
                                        ? "bg-zinc-900/40 border-zinc-800/60 opacity-70 hover:opacity-100"
                                        : `bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-xl ${config.glow} hover:shadow-2xl hover:-translate-y-0.5`
                                )}
                            >
                                <div className="flex items-start p-5 gap-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        notif.is_read ? "bg-zinc-800 text-zinc-600" : `${config.bg} ${config.color}`,
                                        !notif.is_read && "group-hover:scale-110"
                                    )}>
                                        <Icon size={22} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={cn(
                                                "font-black text-sm leading-tight",
                                                notif.is_read ? "text-zinc-400" : "text-white"
                                            )}>
                                                {notif.title}
                                            </h3>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-sm leading-relaxed mb-2",
                                            notif.is_read ? "text-zinc-600" : "text-zinc-400"
                                        )}>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0 border-dashed",
                                                    notif.is_read
                                                        ? "text-zinc-700 border-zinc-800"
                                                        : `${config.color} ${config.borderColor}`
                                                )}
                                            >
                                                {notif.category}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                        {!notif.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 rounded-xl text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                onClick={() => handleMarkRead(notif.id)}
                                                title="Mark as read"
                                            >
                                                <Eye size={14} />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 w-9 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={() => handleDelete(notif.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Accent Line */}
                                {!notif.is_read && (
                                    <div className={cn("h-0.5 w-full", config.bg.replace('/10', ''))} />
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Stats Footer */}
            {notifications.length > 0 && (
                <div className="mt-8 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            {notifications.filter(n => !n.is_read).length} unread
                        </span>
                    </div>
                    <div className="w-px h-3 bg-zinc-800" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            {notifications.filter(n => n.is_read).length} read
                        </span>
                    </div>
                    <div className="w-px h-3 bg-zinc-800" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {notifications.length} total
                    </span>
                </div>
            )}
        </div>
    )
}

export default Notifications
