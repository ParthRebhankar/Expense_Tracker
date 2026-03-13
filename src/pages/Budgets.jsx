import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { authFetch } from '@/lib/auth'
import {
    PiggyBank,
    TrendingUp,
    Trash2,
    Plus,
    AlertCircle,
    CheckCircle2,
    History as HistoryIcon,
    Utensils,
    Bus,
    ShoppingBag,
    FileText,
    Smartphone,
    PlusCircle,
    Film,
    MoreHorizontal,
    Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts'
import { format, getDaysInMonth, getDate } from "date-fns"
import { cn } from "@/lib/utils"

const categoriesList = [
    { name: 'Total', icon: Target, isSpecial: true },
    { name: 'Food', icon: Utensils },
    { name: 'Travel', icon: Bus },
    { name: 'Shopping', icon: ShoppingBag },
    { name: 'Bills', icon: FileText },
    { name: 'Recharge', icon: Smartphone },
    { name: 'Medical', icon: PlusCircle },
    { name: 'Entertainment', icon: Film },
    { name: 'Miscellaneous', icon: MoreHorizontal },
]

const Budgets = () => {
    const [budgetStatus, setBudgetStatus] = useState([])
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingCategory, setUpdatingCategory] = useState('Total')
    const [newBudgetAmount, setNewBudgetAmount] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [trendData, setTrendData] = useState([])
    const [trendFilter, setTrendFilter] = useState('30d')
    const [trendCategory, setTrendCategory] = useState('Total')
    const [trendLoading, setTrendLoading] = useState(false)

    const fetchBudgetData = useCallback(async () => {
        setLoading(true)
        try {
            const [statusRes, historyRes] = await Promise.all([
                authFetch('/api/budgets/status'),
                authFetch('/api/budgets/history'),
            ])

            const statusData = statusRes.ok ? await statusRes.json() : []
            const historyData = historyRes.ok ? await historyRes.json() : []

            setBudgetStatus(Array.isArray(statusData) ? statusData : [])
            setHistory(Array.isArray(historyData) ? historyData : [])
        } catch (err) {
            console.error('Error fetching budget data:', err)
            setBudgetStatus([])
            setHistory([])
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchBudgetTrend = useCallback(async () => {
        setTrendLoading(true)
        try {
            const res = await authFetch(`/api/budgets/trend?category=${trendCategory}&filter=${trendFilter}`)
            if (res.ok) {
                const data = await res.json()
                setTrendData(Array.isArray(data) ? data : [])
            }
        } catch (err) {
            console.error('Error fetching trend data:', err)
            setTrendData([])
        } finally {
            setTrendLoading(false)
        }
    }, [trendCategory, trendFilter])

    useEffect(() => {
        fetchBudgetData()
    }, [fetchBudgetData])

    useEffect(() => {
        fetchBudgetTrend()
    }, [fetchBudgetTrend])

    const handleUpdateBudget = async () => {
        if (!updatingCategory || isNaN(parseFloat(newBudgetAmount))) return

        try {
            const res = await authFetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryName: updatingCategory,
                    amount: parseFloat(newBudgetAmount)
                })
            })
            if (res.ok) {
                setIsDialogOpen(false)
                setNewBudgetAmount('')
                fetchBudgetData()
            }
        } catch (err) {
            console.error('Error updating budget:', err)
        }
    }

    const totalBudgetData = useMemo(() =>
        budgetStatus.find(b => b.category === 'Total') || { budget: 0, spent: 0 },
        [budgetStatus]
    )

    const categoryBudgets = useMemo(() =>
        budgetStatus.filter(b => b.category !== 'Total'),
        [budgetStatus]
    )

    const daysInMonth = getDaysInMonth(new Date())
    const today = getDate(new Date())
    const dailySpendingLimit = totalBudgetData.budget > 0
        ? (totalBudgetData.budget / daysInMonth).toFixed(2)
        : 0

    const currentDailyAvg = today > 0 ? (totalBudgetData.spent / today).toFixed(2) : 0

    const getStatusColor = (spent, budget) => {
        if (!budget || budget === 0) return 'text-zinc-500'
        const percent = (spent / budget) * 100
        if (percent >= 100) return 'text-red-500'
        if (percent >= 80) return 'text-orange-500'
        return 'text-emerald-500'
    }

    const getProgressColor = (spent, budget) => {
        if (!budget || budget === 0) return 'bg-zinc-800'
        const percent = (spent / budget) * 100
        if (percent >= 100) return 'bg-red-600'
        if (percent >= 80) return 'bg-orange-600'
        return 'bg-emerald-600'
    }

    return (
        <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100 pb-20">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-1">Budget Planner</h1>
                    <p className="text-zinc-500 text-lg font-medium">Keep your spending under control</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl">
                            <Plus className="mr-2 h-5 w-5" /> Set New Budget
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">Set Category Budget</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500">Pick Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {categoriesList.map(c => (
                                        <Button
                                            key={c.name}
                                            type="button"
                                            variant={updatingCategory === c.name ? "default" : "outline"}
                                            className={cn(
                                                "h-10 text-xs font-bold transition-all",
                                                updatingCategory === c.name ? "bg-red-600" : "bg-zinc-950 border-zinc-800"
                                            )}
                                            onClick={() => setUpdatingCategory(c.name)}
                                        >
                                            {c.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500">Budget Amount (₹)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 5000"
                                    value={newBudgetAmount}
                                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                                    className="h-14 bg-zinc-950 border-zinc-800 text-2xl font-black"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdateBudget} className="w-full bg-red-600 hover:bg-red-700 font-black h-12">Update Budget</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <PiggyBank size={80} className="text-red-600" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Monthly Budget</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black text-white mb-4">₹{(totalBudgetData.budget || 0).toLocaleString()}</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-zinc-500">Used: ₹{(totalBudgetData.spent || 0).toLocaleString()}</span>
                                        <span className={getStatusColor(totalBudgetData.spent, totalBudgetData.budget)}>
                                            {totalBudgetData.budget > 0 ? (totalBudgetData.spent / totalBudgetData.budget * 100).toFixed(0) : 0}%
                                        </span>
                                    </div>
                                    <Progress value={(totalBudgetData.spent / (totalBudgetData.budget || 1)) * 100} className="h-2 bg-zinc-800" indicatorClassName={getProgressColor(totalBudgetData.spent, totalBudgetData.budget)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Daily Spending Limit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-emerald-500">₹{dailySpendingLimit}</div>
                                <p className="text-zinc-400 text-xs mt-2 font-medium">To stay within your ₹{totalBudgetData.budget} budget.</p>
                                <div className="mt-4 pt-4 border-t border-zinc-800">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Current Avg: ₹{currentDailyAvg}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Budget Remaining</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "text-3xl font-black",
                                    (totalBudgetData.budget - totalBudgetData.spent) < 0 ? "text-red-500" : "text-white"
                                )}>
                                    ₹{(totalBudgetData.budget - totalBudgetData.spent).toLocaleString()}
                                </div>
                                {totalBudgetData.spent > totalBudgetData.budget && totalBudgetData.budget > 0 && (
                                    <Badge variant="destructive" className="mt-2 text-[10px] py-0 px-2 animate-pulse">
                                        <AlertCircle size={10} className="mr-1" /> Over Budget
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Category breakdown */}
                        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black text-white">Category Budgets</CardTitle>
                                <CardDescription className="text-zinc-500">Monitor limits for specific spending types</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {(categoryBudgets || []).length > 0 ? categoryBudgets.map(b => {
                                    const categoryInfo = categoriesList.find(c => c.name === b.category) || { icon: MoreHorizontal };
                                    const Icon = categoryInfo.icon;
                                    return (
                                        <div key={b.category} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-red-500">
                                                        <Icon size={16} />
                                                    </div>
                                                    <span className="font-bold text-sm text-zinc-200">{b.category}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-zinc-500">₹{(b.spent || 0).toLocaleString()} / ₹{(b.budget || 0).toLocaleString()}</span>
                                                    {b.spent > b.budget && b.budget > 0 && (
                                                        <div className="text-[9px] text-red-500 font-black uppercase flex items-center justify-end">
                                                            <AlertCircle size={8} className="mr-1" /> Limit Exceeded
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Progress
                                                value={(b.spent / (b.budget || 1)) * 100}
                                                className="h-1.5 bg-zinc-800"
                                                indicatorClassName={getProgressColor(b.spent, b.budget)}
                                            />
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-10">
                                        <p className="text-zinc-600 text-sm font-bold">No category budgets set yet.</p>
                                        <p className="text-zinc-700 text-xs">Set a budget to start tracking.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Budget vs Actual Chart */}
                        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black text-white">Budget vs Actual</CardTitle>
                                <CardDescription className="text-zinc-500">Visual comparison for this month</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryBudgets} layout="vertical" margin={{ left: -20, right: 30 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} width={80} />
                                        <Tooltip
                                            cursor={{ fill: '#27272a' }}
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                                        />
                                        <Legend iconType="circle" />
                                        <Bar dataKey="budget" name="Budgeted" fill="#27272a" radius={[0, 4, 4, 0]} barSize={12} />
                                        <Bar dataKey="spent" name="Spent" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Spending Trend Line Chart */}
                    <Card className="mt-8 bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden">
                        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black text-white">Spending Trend</CardTitle>
                                <CardDescription className="text-zinc-500">Compare budget limits vs actual spending over time</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Filter Buttons */}
                                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                                    {[
                                        { label: '7D', value: '7d' },
                                        { label: '30D', value: '30d' },
                                        { label: '6M', value: '6m' }
                                    ].map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => setTrendFilter(f.value)}
                                            className={cn(
                                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                                trendFilter === f.value ? "bg-red-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"
                                            )}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Category Selector */}
                                <select
                                    value={trendCategory}
                                    onChange={(e) => setTrendCategory(e.target.value)}
                                    className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:border-red-600 transition-colors"
                                >
                                    {categoriesList.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[400px] pt-6 pb-12">
                            {trendLoading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }}
                                            padding={{ left: 20, right: 20 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }}
                                            tickFormatter={(val) => `₹${val}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            cursor={{ stroke: '#52525b', strokeWidth: 1 }}
                                        />
                                        <Legend iconType="circle" />
                                        <Line
                                            type="monotone"
                                            dataKey="budget"
                                            name="Budget Limit"
                                            stroke="#52525b"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#52525b' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="spent"
                                            name="Actual Spent"
                                            stroke="#ef4444"
                                            strokeWidth={4}
                                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4, stroke: '#18181b' }}
                                            activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Budget History */}
                    <Card className="mt-8 bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <HistoryIcon size={16} className="text-blue-500" /> Budget Performance History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-800">
                                {(history || []).length > 0 ? history.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-zinc-800/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-[10px] text-zinc-500">
                                                {item.month?.slice(0, 3)}
                                            </div>
                                            <div>
                                                <span className="font-bold text-zinc-200 block text-sm">{item.month}</span>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase">₹{(item.budget || 0).toLocaleString()} Budgeted</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-white">₹{(item.spent || 0).toLocaleString()}</div>
                                            {item.spent <= item.budget ? (
                                                <span className="text-[9px] text-emerald-500 font-bold uppercase flex items-center justify-end">
                                                    <CheckCircle2 size={10} className="mr-1" /> Saved ₹{(item.budget - item.spent).toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-red-500 font-bold uppercase flex items-center justify-end">
                                                    <TrendingUp size={10} className="mr-1" /> Exceeded by ₹{(item.spent - item.budget).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-zinc-600 italic text-sm">No historical data available.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

export default Budgets
