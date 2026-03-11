import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from "@/components/MainLayout"
import Signup from "@/pages/Signup"
import Home from "@/pages/Home"
import Dashboard from "@/pages/Dashboard"
import History from "@/pages/History"
import Budgets from "@/pages/Budgets"
import Notifications from "@/pages/Notifications"
import ProtectedRoute from "@/components/ProtectedRoute"
import { isAuthenticated } from '@/lib/auth'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate to="/home" /> : <Signup />} />
        <Route path="/signup" element={isAuthenticated() ? <Navigate to="/home" /> : <Signup />} />
        <Route element={<MainLayout />}>
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

