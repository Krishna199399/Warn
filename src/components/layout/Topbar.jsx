import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES, ROLE_LABELS, isEmployeeRole } from '../../contexts/AuthContext';
import { notificationsApi } from '../../api/notifications.api';
import {
  Bell, ChevronDown, LogOut, User, Settings, Menu, Leaf,
  Briefcase, Archive, ShoppingCart, DollarSign,
  Award, CheckSquare, Zap, Info
} from 'lucide-react';

const NOTIF_ICON = {
  ORDER:      ShoppingCart,
  COMMISSION: DollarSign,
  PROMOTION:  Award,
  TASK:       CheckSquare,
  MILESTONE:  Zap,
  SYSTEM:     Info,
};

const NOTIF_COLOR = {
  ORDER:      'bg-blue-100 text-blue-600',
  COMMISSION: 'bg-green-100 text-green-600',
  PROMOTION:  'bg-amber-100 text-amber-600',
  TASK:       'bg-purple-100 text-purple-600',
  MILESTONE:  'bg-orange-100 text-orange-600',
  SYSTEM:     'bg-slate-100 text-slate-600',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Topbar({ onMenuClick }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const isEmployee = isEmployeeRole(user?.role);
  const close = () => { setProfileOpen(false); setNotifOpen(false); };

  // Fetch notifications
  useEffect(() => {
    let mounted = true;
    const fetchNotifications = () => {
      notificationsApi.getAll()
        .then(r => {
          if (!mounted) return;
          setNotifications(r.data.data?.notifications || []);
          setUnreadCount(r.data.data?.unreadCount || 0);
        })
        .catch(() => {});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => { mounted = false; clearInterval(interval); };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead().then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-sm" ref={dropdownRef}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <Leaf size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800">WANS</span>
          <span className="text-slate-300 mx-0.5">/</span>
          <span className="text-sm text-slate-500 capitalize font-medium">
            {window.location.pathname.split('/')[1] || 'dashboard'}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-all hover:shadow-sm"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200/60 z-50 overflow-hidden backdrop-blur-sm" style={{width: 360}}>
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                <button onClick={handleMarkAllRead} className="text-xs text-green-600 hover:text-green-700 cursor-pointer font-medium">Mark all read</button>
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => {
                    const Icon = NOTIF_ICON[n.type] || Info;
                    const colorCls = NOTIF_COLOR[n.type] || NOTIF_COLOR.SYSTEM;
                    return (
                      <div key={n._id} className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-green-50/40' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all hover:shadow-sm"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.avatar}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name?.split(' ')[0]}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role]}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200/60 z-50 overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <User size={14} /> Profile & Settings
                </button>
                <div className="border-t border-slate-50 my-1" />
                <button onClick={() => { logout(); navigate('/'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut size={14} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
