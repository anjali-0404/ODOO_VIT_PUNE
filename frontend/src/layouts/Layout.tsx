import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Receipt, FilePlus, CheckSquare, Users, Settings,
  LogOut, Bell, Search, Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';
import {
  getNotifications,
  getRelativeNotificationTime,
  markAllNotificationsRead,
  subscribeNotifications,
  type AppNotification,
} from '../services/notifications';

export const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications());
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeNotifications(() => {
      setNotifications(getNotifications());
    });

    return unsubscribe;
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based menu items
  const allMenuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard', roles: ['Admin', 'Manager', 'Employee', 'Finance', 'CFO'] },
    { icon: <Receipt size={20} />, label: 'Expenses', path: '/expenses', roles: ['Admin', 'Manager', 'Employee', 'Finance', 'CFO'] },
    { icon: <FilePlus size={20} />, label: 'Submit Expense', path: '/expenses/create', roles: ['Admin', 'Manager', 'Employee'] },
    { icon: <CheckSquare size={20} />, label: 'Approvals', path: '/approvals', roles: ['Admin', 'Manager', 'CFO'] },
    { icon: <Users size={20} />, label: 'Users', path: '/users', roles: ['Admin'] },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings', roles: ['Admin', 'Manager', 'Employee', 'Finance', 'CFO'] },
  ];

  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(user?.role || 'Employee')
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setNotifications(getNotifications());
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col bg-white border-r border-gray-200 shadow-sm z-20 shrink-0"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-xl text-primary"
            >
              ERP Flow
            </motion.span>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                )
              }
            >
              {item.icon}
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10 shadow-sm shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                      <span className="text-[10px] text-primary font-medium bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{unreadCount} New</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">No notifications yet.</div>
                      ) : (
                        notifications.map((item) => (
                          <div key={item.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${item.read ? 'bg-gray-300' : 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]'}`}></div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.message}</p>
                                <p className="text-[10px] font-medium text-gray-400 mt-2 uppercase tracking-wide">{getRelativeNotificationTime(item.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 text-center border-t border-gray-100 bg-gray-50/50">
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary font-medium hover:text-blue-700 transition-colors p-1"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative border-l border-gray-200 pl-4" ref={profileRef}>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user?.role || 'Role'}</p>
                </div>
                <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-[15px] font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{user?.email || 'anjali@example.com'}</p>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={() => { setIsProfileOpen(false); navigate('/settings'); }} 
                        className="w-full text-left px-4 py-3 text-[15px] text-slate-800 hover:bg-gray-50 transition-colors flex items-center gap-3 font-semibold"
                      >
                        <Settings size={20} className="text-slate-400 stroke-2" /> Account Settings
                      </button>
                      <hr className="border-gray-100" />
                      <button 
                        onClick={handleLogout} 
                        className="w-full text-left px-4 py-3 text-[15px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 font-semibold"
                      >
                        <LogOut size={20} className="stroke-2" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
