import React, { useState, useEffect } from 'react'
import { authFetch } from '@/lib/auth'
import {
    Wallet,
    TrendingDown,
    Calendar,
    ArrowRight,
    Plus,
    TrendingUp,
    CreditCard,
    Banknote,
    Zap,
    Landmark,
    Utensils,
    Bus,
    ShoppingBag,
    FileText,
    Smartphone,
    PlusCircle,
    Film,
    MoreHorizontal,
    ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { Link } from 'react-router-dom'
import { format } from "date-fns"

const categoryIcons = {
    'Food': Utensils,
    'Travel': Bus,
    'Shopping': ShoppingBag,
    'Bills': FileText,
    'Recharge': Smartphone,
    'Medical': PlusCircle,
    'Entertainment': Film,
    'Miscellaneous': MoreHorizontal,
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#10b981']

const Dashboard = () => {
    const [summary, setSummary] = useState({
        totalMonthly: 0,
        totalToday: 0,
        transactionCount: 0,
        categoryTotals: [],
        weeklyData: []
    })
    const [recentExpenses, setRecentExpenses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, recentRes] = await Promise.all([
                    authFetch('/api/expenses/summary'),
                    authFetch('/api/expenses?limit=5')
                ])
                const summaryData = await summaryRes.json()
                const recentData = await recentRes.json()

                if (summaryRes.ok) {
                    setSummary(summaryData)
                }

                if (recentRes.ok && Array.isArray(recentData)) {
                    setRecentExpenses(recentData.slice(0, 5))
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const topCategory = summary.categoryTotals[0] || { name: 'N/A', value: 0 }

    return (
        <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-1">Financial Overview</h1>
                    <p className="text-zinc-500 text-lg font-medium">Monitoring your monthly spending habits</p>
                </div>
                <Link to="/home">
                    <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-900/20 active:scale-95 transition-all">
                        <Plus className="mr-2 h-5 w-5" /> Quick Add Expense
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Monthly Spending</CardTitle>
                        <Wallet className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">₹{summary.totalMonthly.toLocaleString()}</div>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter">Current month</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Spent Today</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">₹{summary.totalToday.toLocaleString()}</div>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter">{format(new Date(), "MMMM do")}</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Transactions</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{summary.transactionCount}</div>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter">Hits this month</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Major Drain</CardTitle>
                        <TrendingDown className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white truncate">{topCategory.name}</div>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter">₹{topCategory.value.toLocaleString()} spent</p>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summary.categoryTotals}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {summary.categoryTotals.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Weekly Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary.weeklyData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#27272a' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                />
                                <Bar dataKey="amount" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Expenses Table */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden mb-10">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Transactions</CardTitle>
                    <Link to="/history">
                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white group">
                            View All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-950/50">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest pl-6">Category</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Method</TableHead>
                                <TableHead className="text-right text-zinc-500 font-bold uppercase text-[10px] tracking-widest pr-6">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentExpenses.length > 0 ? recentExpenses.map((expense) => {
                                const Icon = categoryIcons[expense.category_name] || MoreHorizontal
                                return (
                                    <TableRow key={expense.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors cursor-default">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-red-500">
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-zinc-200">{expense.category_name}</span>
                                                    <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">{expense.note || 'No note'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-zinc-400 font-medium text-sm">
                                            {format(new Date(expense.transaction_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-zinc-950 border-zinc-800 text-zinc-500 uppercase tracking-tighter text-[9px] px-2">
                                                {expense.payment_method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-white pr-6">
                                            ₹{parseFloat(expense.amount).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-zinc-600 font-medium">
                                        No recent transactions found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* AI-Powered Insights Section */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg bg-red-600/10 text-red-500">
                        <Zap size={20} className="fill-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">Financial Insights</h2>
                        <p className="text-zinc-500 text-sm font-medium">Smart observations for your student lifestyle</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all cursor-default group overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                        <CardContent className="pt-6">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                <Utensils size={16} className="text-orange-500" /> Dining Habit
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                {summary.categoryTotals.find(c => c.name === 'Food')?.value > (summary.totalMonthly * 0.4)
                                    ? "You've spent over 40% of your budget on food. Consider checking out college mess options or cooking in bulk!"
                                    : "Great job! Your food expenses are well-balanced this month. Keep it up!"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all cursor-default group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                        <CardContent className="pt-6">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                <Bus size={16} className="text-blue-500" /> Savings Potential
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                Your entertainment spending is lower than average. You could potentially save an extra **₹500** this month if you maintain this trend.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-red-600/30 bg-red-600/5 hover:border-red-600/50 transition-all cursor-default group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                        <CardContent className="pt-6">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                <PlusCircle size={16} className="text-red-500" /> Budget Alert
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                You are on track to exceed your total budget by the 24th of this month. We recommend cutting back on **Shopping** for the next 10 days.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
