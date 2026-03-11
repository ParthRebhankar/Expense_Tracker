import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { authFetch } from '@/lib/auth'
import {
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    Calendar as CalendarIcon,
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
    ChevronDown,
    X,
    CalendarDays,
    ArrowUpRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns"

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

const paymentIcons = {
    'UPI': Zap,
    'Cash': Banknote,
    'Card': CreditCard,
    'Net Banking': Landmark,
}

const History = () => {
    const [expenses, setExpenses] = useState([])
    const [summary, setSummary] = useState({ totalMonthly: 0, categoryTotals: [] })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterPayment, setFilterPayment] = useState('all')
    const [filterTime, setFilterTime] = useState('thisMonth')

    // Edit State
    const [editingExpense, setEditingExpense] = useState(null)
    const [editAmount, setEditAmount] = useState('')
    const [editNote, setEditNote] = useState('')
    const [editCategory, setEditCategory] = useState('')
    const [editPayment, setEditPayment] = useState('')
    const [editDate, setEditDate] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const queryParams = new URLSearchParams()
            if (filterCategory !== 'all') queryParams.append('category', filterCategory)
            if (filterPayment !== 'all') queryParams.append('paymentMethod', filterPayment)
            if (search) queryParams.append('search', search)

            // Date filtering
            let startDate, endDate
            const now = new Date()
            if (filterTime === 'thisMonth') {
                startDate = format(startOfMonth(now), 'yyyy-MM-dd')
                endDate = format(endOfMonth(now), 'yyyy-MM-dd')
            } else if (filterTime === 'lastMonth') {
                const lastMonth = subMonths(now, 1)
                startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd')
                endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd')
            } else if (filterTime === 'today') {
                startDate = format(startOfDay(now), 'yyyy-MM-dd')
                endDate = format(endOfDay(now), 'yyyy-MM-dd')
            }

            if (startDate) queryParams.append('startDate', startDate)
            if (endDate) queryParams.append('endDate', endDate)

            const [expensesRes, summaryRes] = await Promise.all([
                authFetch(`/api/expenses?${queryParams.toString()}`),
                authFetch('/api/expenses/summary')
            ])

            if (expensesRes.ok && summaryRes.ok) {
                const expensesData = await expensesRes.json()
                const summaryData = await summaryRes.json()
                setExpenses(expensesData)
                setSummary(summaryData)
            }
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }, [search, filterCategory, filterPayment, filterTime])

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData()
        }, 300)
        return () => clearTimeout(handler)
    }, [fetchData])

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return
        try {
            const res = await authFetch(`/api/expenses/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            }
        } catch (err) {
            console.error('Error deleting expense:', err)
        }
    }

    const handleUpdate = async () => {
        try {
            const res = await authFetch(`/api/expenses/${editingExpense.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...editingExpense,
                    amount: parseFloat(editAmount),
                    note: editNote,
                    category_name: editCategory,
                    payment_method: editPayment,
                    transaction_date: editDate
                })
            })
            if (res.ok) {
                setEditingExpense(null)
                fetchData()
            }
        } catch (err) {
            console.error('Error updating expense:', err)
        }
    }

    const startEdit = (expense) => {
        setEditingExpense(expense)
        setEditAmount(expense.amount)
        setEditNote(expense.note)
        setEditCategory(expense.category_name)
        setEditPayment(expense.payment_method)
        setEditDate(expense.transaction_date ? format(new Date(expense.transaction_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
    }

    return (
        <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100 flex flex-col items-center pb-20">
            <div className="w-full max-w-5xl">
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div>
                        <h1 className="text-5xl font-black tracking-tight text-white mb-2 leading-none">Transactions</h1>
                        <p className="text-zinc-500 text-lg font-medium">Analyze your spending history with precision</p>
                    </div>
                    <div className="flex gap-4">
                        <Card className="bg-zinc-900 border-zinc-800 px-6 py-3 flex items-center gap-4 shadow-xl">
                            <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                                <ArrowUpRight size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Filtered Total</p>
                                <p className="text-xl font-black text-white">₹{expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0).toLocaleString()}</p>
                            </div>
                        </Card>
                    </div>
                </motion.header>

                {/* Filters Row */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col gap-4 mb-4 bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 shadow-2xl backdrop-blur-xl"
                >
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <Input
                                placeholder="Search notes or categories..."
                                className="pl-12 h-14 bg-zinc-950 border-zinc-800 focus:border-red-600 transition-all text-zinc-100 rounded-xl font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <Select value={filterTime} onValueChange={setFilterTime}>
                                <SelectTrigger className="h-14 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl font-bold">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays size={16} className="text-red-500" />
                                        <SelectValue placeholder="Period" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                    <SelectItem value="lastMonth">Last Month</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="h-14 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl font-bold">
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-red-500" />
                                        <SelectValue placeholder="Category" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {Object.keys(categoryIcons).map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterPayment} onValueChange={setFilterPayment}>
                                <SelectTrigger className="h-14 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl font-bold md:col-span-1 col-span-2">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={16} className="text-red-500" />
                                        <SelectValue placeholder="Payment" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="all">All Methods</SelectItem>
                                    {Object.keys(paymentIcons).map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </motion.div>

                {/* List Body */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Ledger</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {expenses.length > 0 ? (
                                expenses.map((expense, idx) => {
                                    const Icon = categoryIcons[expense.category_name] || MoreHorizontal
                                    const PayIcon = paymentIcons[expense.payment_method] || Banknote

                                    return (
                                        <motion.div
                                            key={expense.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.03 }}
                                        >
                                            <Card className="group bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
                                                <div className="flex items-center p-5">
                                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 text-red-500 mr-5 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 group-hover:rounded-[1.5rem]">
                                                        <Icon size={24} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1.5 text-zinc-400">
                                                            <span className="font-black text-white text-lg leading-none">{expense.category_name}</span>
                                                            <div className="h-1 w-1 rounded-full bg-zinc-700" />
                                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-zinc-950 border-zinc-800 text-zinc-500 group-hover:text-red-400 border-dashed">
                                                                {expense.payment_method}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors truncate">
                                                            {expense.note || 'No description added'}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col items-end mr-8">
                                                        <div className="text-2xl font-black text-white group-hover:text-red-500 transition-colors duration-300">
                                                            ₹{parseFloat(expense.amount).toLocaleString()}
                                                        </div>
                                                        <div className="flex items-center text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                                                            <CalendarIcon size={12} className="mr-1.5 opacity-50" />
                                                            {format(new Date(expense.transaction_date), "dd MMM, yyyy")}
                                                        </div>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-12 w-12 rounded-xl text-zinc-600 hover:text-white hover:bg-zinc-800">
                                                                <MoreVertical size={20} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl p-2 w-40">
                                                            <DropdownMenuItem
                                                                className="rounded-lg h-10 font-bold"
                                                                onClick={() => startEdit(expense)}
                                                            >
                                                                <Edit2 size={14} className="mr-3 text-blue-500" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="rounded-lg h-10 font-bold text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                                                onClick={() => handleDelete(expense.id)}
                                                            >
                                                                <Trash2 size={14} className="mr-3" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )
                                })
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-40 text-zinc-500"
                                >
                                    <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                                        <Filter size={40} className="text-zinc-800" />
                                    </div>
                                    <p className="text-xl font-black text-zinc-400">Zero matches found</p>
                                    <p className="text-sm font-medium text-zinc-600 max-w-[200px] text-center mt-2">Try adjusting your spectral filters or search terms</p>
                                    <Button
                                        variant="link"
                                        className="mt-4 text-red-500 font-black h-auto p-0"
                                        onClick={() => { setSearch(''); setFilterCategory('all'); setFilterPayment('all'); setFilterTime('thisMonth'); }}
                                    >
                                        RESET ALL FILTERS
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-3xl rounded-[2rem] max-w-md p-8">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black leading-none">Modify Record</DialogTitle>
                        <CardDescription className="text-zinc-500 font-medium">Update the details of this transaction</CardDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6 font-bold">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Amount (₹)</label>
                            <Input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 h-14 text-2xl font-black rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Category</label>
                                <Select value={editCategory} onValueChange={setEditCategory}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                        {Object.keys(categoryIcons).map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment</label>
                                <Select value={editPayment} onValueChange={setEditPayment}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                        {Object.keys(paymentIcons).map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Transaction Date</label>
                            <Input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 h-14 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Note</label>
                            <Input
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="What was this for?"
                                className="bg-zinc-950 border-zinc-800 h-14 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-14 border-zinc-800 rounded-xl font-black text-zinc-500"
                            onClick={() => setEditingExpense(null)}
                        >
                            DISCARD
                        </Button>
                        <Button
                            className="flex-1 h-14 bg-red-600 hover:bg-red-700 font-black text-white rounded-xl shadow-lg shadow-red-900/20"
                            onClick={handleUpdate}
                        >
                            SAVE CHANGES
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default History
