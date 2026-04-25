import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-5 lg:p-8 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
