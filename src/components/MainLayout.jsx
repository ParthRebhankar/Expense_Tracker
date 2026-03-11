import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const MainLayout = () => {
    const location = useLocation()

    // Only show sidebar on non-signup pages
    const showSidebar = location.pathname !== '/'

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            {showSidebar && <Sidebar />}
            <main className={`flex-1 transition-all duration-300 ${showSidebar ? 'pl-20 peer-hover:pl-64' : ''}`}>
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout
