import React, { useState } from 'react'
import { authFetch } from '@/lib/auth'
import {
    Utensils,
    Bus,
    ShoppingBag,
    FileText,
    Smartphone,
    PlusCircle,
    Film,
    MoreHorizontal,
    Zap,
    Banknote,
    CreditCard,
    Landmark,
    Calendar as CalendarIcon,
    Trash2,
    Save
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"

const categories = [
    { id: 1, name: 'Food', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 2, name: 'Travel', icon: Bus, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 3, name: 'Shopping', icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    { id: 4, name: 'Bills', icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { id: 5, name: 'Recharge', icon: Smartphone, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { id: 6, name: 'Medical', icon: PlusCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 7, name: 'Entertainment', icon: Film, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { id: 8, name: 'Miscellaneous', icon: MoreHorizontal, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
]

const paymentMethods = [
    { name: 'UPI', icon: Zap },
    { name: 'Cash', icon: Banknote },
    { name: 'Card', icon: CreditCard },
    { name: 'Net Banking', icon: Landmark },
]

const Home = () => {
    const [amount, setAmount] = useState('')
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [note, setNote] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('UPI')
    const [date, setDate] = useState(new Date())

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!amount || !selectedCategory) return;

        setIsSaving(true)
        const expenseData = {
            categoryId: selectedCategory?.id,
            categoryName: selectedCategory?.name,
            amount: parseFloat(amount),
            note,
            paymentMethod,
            transactionDate: date.toISOString(),
        }

        try {
            const response = await authFetch('/api/expenses', {
                method: 'POST',
                body: JSON.stringify(expenseData),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Expense saved successfully!');
                handleClear();
                // Trigger notification check (budget/spending alerts)
                authFetch('/api/notifications/check', { method: 'POST' }).catch(() => { });
            } else {
                alert('Error: ' + (result.error || 'Check backend connection'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Network error. Ensure your backend is running on port 5000.');
        } finally {
            setIsSaving(false)
        }
    }

    const handleClear = () => {
        setAmount('')
        setSelectedCategory(null)
        setNote('')
        setPaymentMethod('UPI')
        setDate(new Date())
    }

    return (
        <div className="p-6 md:p-12 bg-zinc-950 min-h-screen text-zinc-100 flex flex-col items-center">
            {/* Header Section */}
            <div className="w-full max-w-2xl mb-10 text-left">
                <h1 className="text-4xl font-black tracking-tight text-white mb-1">Expenses</h1>
                <p className="text-zinc-500 text-lg font-medium">Add a new expense entry</p>
            </div>

            {/* Main Entry Card */}
            <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                <div className="space-y-10">

                    {/* Amount Field - High Focus */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Amount</span>
                        <div className="relative w-full max-w-sm">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-zinc-700 ml-4">₹</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-24 bg-zinc-950/50 border-2 border-zinc-800 focus-visible:ring-red-600 focus-visible:border-red-600 rounded-2xl text-5xl font-black text-center pl-12 transition-all"
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-4">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-1">Select Category</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 group active:scale-95",
                                        selectedCategory?.id === cat.id
                                            ? cn(cat.bg, cat.border, "border-opacity-100 scale-105")
                                            : "bg-zinc-900 border-transparent hover:border-zinc-800 hover:bg-zinc-800/50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-xl mb-2 transition-transform group-hover:scale-110",
                                        selectedCategory?.id === cat.id ? "bg-white text-zinc-950" : cn(cat.bg, cat.color)
                                    )}>
                                        <cat.icon size={20} />
                                    </div>
                                    <span className={cn(
                                        "text-[13px] font-bold tracking-wide",
                                        selectedCategory?.id === cat.id ? "text-white" : "text-zinc-400"
                                    )}>
                                        {cat.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note Field */}
                    <div className="space-y-4">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-1">Note (Optional)</span>
                        <Input
                            type="text"
                            placeholder="What was this for? (e.g. Lunch, Bus ticket)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="h-14 bg-zinc-950/50 border-2 border-zinc-800 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 rounded-xl font-medium px-5 text-lg"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Payment Method */}
                        <div className="space-y-4">
                            <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-1">Payment Method</span>
                            <div className="flex flex-wrap gap-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.name}
                                        onClick={() => setPaymentMethod(method.name)}
                                        className={cn(
                                            "flex-1 min-w-[100px] flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-bold text-sm transition-all active:scale-95",
                                            paymentMethod === method.name
                                                ? "bg-zinc-100 text-zinc-950 border-zinc-100 scale-105 shadow-lg shadow-zinc-100/10"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                        )}
                                    >
                                        <method.icon size={16} />
                                        {method.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-4">
                            <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-1">Transaction Date</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-12 justify-start text-left font-bold rounded-xl border-2 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-5 w-5 text-zinc-500" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        className="p-3 bg-zinc-900 text-zinc-100"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleClear}
                            className="flex-1 h-14 rounded-2xl border-2 border-zinc-800 text-zinc-500 font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-zinc-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Trash2 size={20} />
                            Clear
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!amount || !selectedCategory || isSaving}
                            className={cn(
                                "flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl",
                                !amount || !selectedCategory || isSaving
                                    ? "bg-zinc-800 text-zinc-600 border-2 border-transparent cursor-not-allowed opacity-50"
                                    : "bg-red-600 text-white border-2 border-red-500 hover:bg-red-700 shadow-red-900/40"
                            )}
                        >
                            {isSaving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </div>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Expense
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
