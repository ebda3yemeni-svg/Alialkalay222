import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { TreePine, Search, BarChart3, Info, Shield, LogIn, LogOut, LayoutDashboard, Home, GitCompare, Bot, Bell } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminModal: () => void;
  openNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openNotifications }) => {
  const { user, dbUser, isAdmin, token, signInWithGoogle, signOutUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadUnreadCount = () => {
    if (isAdmin) {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch('/api/admin/notifications', { headers })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const unread = data.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const handleUpdate = () => loadUnreadCount();
    window.addEventListener('admin_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('admin_notifications_updated', handleUpdate);
    };
  }, [isAdmin, token]);

  return (
    <>
      {/* Top Android / Web App Bar */}
      <header className="sticky top-0 z-40 bg-[#1A2A40] text-white shadow-lg border-b border-[#C5A059]/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo & Android Title */}
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 cursor-pointer group transition-transform active:scale-95"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#243B55] border border-[#C5A059] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-[#C5A059]" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold font-amiri text-[#C5A059] tracking-tight leading-tight group-hover:text-[#D4B16A] transition-colors">
                  موسوعة الأنساب لبني علي الكلعي
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-300 opacity-80 font-medium hidden sm:block">
                  تطبيق إدارة وتوثيق السلالات العائلية
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 text-sm">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 lg:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'home'
                    ? 'bg-[#243B55] text-[#C5A059] border-b-2 border-[#C5A059] shadow-sm'
                    : 'text-gray-200 hover:text-[#C5A059] hover:bg-[#243B55]/50'
                }`}
              >
                الرئيسية
              </button>

              <button
                onClick={() => setActiveTab('tree')}
                className={`px-3 lg:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'tree'
                    ? 'bg-[#243B55] text-[#C5A059] border-b-2 border-[#C5A059] shadow-sm'
                    : 'text-gray-200 hover:text-[#C5A059] hover:bg-[#243B55]/50'
                }`}
              >
                <TreePine className="w-4 h-4 text-[#C5A059]" />
                تصفح الشجرة
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 lg:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'search'
                    ? 'bg-[#243B55] text-[#C5A059] border-b-2 border-[#C5A059] shadow-sm'
                    : 'text-gray-200 hover:text-[#C5A059] hover:bg-[#243B55]/50'
                }`}
              >
                <Search className="w-4 h-4 text-[#C5A059]" />
                دليل البحث
              </button>

              <button
                onClick={() => setActiveTab('compare')}
                className={`px-3 lg:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'compare'
                    ? 'bg-[#243B55] text-[#C5A059] border-b-2 border-[#C5A059] shadow-sm'
                    : 'text-gray-200 hover:text-[#C5A059] hover:bg-[#243B55]/50'
                }`}
              >
                <GitCompare className="w-4 h-4 text-[#C5A059]" />
                مقارنة صلة القرابة
              </button>

              <button
                onClick={() => setActiveTab('aiAssistant')}
                className={`px-3 lg:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'aiAssistant'
                    ? 'bg-[#243B55] text-[#C5A059] border-b-2 border-[#C5A059] shadow-sm'
                    : 'text-gray-200 hover:text-[#C5A059] hover:bg-[#243B55]/50'
                }`}
              >
                <Bot className="w-4 h-4 text-[#C5A059]" />
                مساعد الأنساب الذكي
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 lg:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'stats'
                    ? 'bg-[#243B55] text-[#C5A059] border-b-2 border-[#C5A059] shadow-sm'
                    : 'text-gray-200 hover:text-[#C5A059] hover:bg-[#243B55]/50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#C5A059]" />
                الإحصائيات
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`px-3 lg:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'about'
                    ? 'bg-[#243B55] text-[#C5A059] border-b-2 border-[#C5A059] shadow-sm'
                    : 'text-gray-200 hover:text-[#C5A059] hover:bg-[#243B55]/50'
                }`}
              >
                <Info className="w-4 h-4 text-[#C5A059]" />
                عن المشروع
              </button>
            </nav>

            {/* User / Admin Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#243B55] border border-[#C5A059]/40 text-[#C5A059]">
                    <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                    {dbUser?.role === 'owner' ? 'مالك المنصة' : isAdmin ? 'مشرف معتمد' : 'مستخدم'}
                  </span>

                  {isAdmin && (
                    <>
                      {openNotifications && (
                        <button
                          onClick={openNotifications}
                          title="مركز إشعارات المشرفين"
                          className="relative p-2 rounded-xl bg-[#243B55] hover:bg-[#2C4A6B] text-[#C5A059] transition-all border border-[#C5A059]/40 cursor-pointer active:scale-95"
                        >
                          <Bell className="w-4 h-4" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTab('admin')}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shadow-md ${
                          activeTab === 'admin'
                            ? 'bg-[#C5A059] text-[#1A2A40] border border-[#D4B16A]'
                            : 'bg-[#C5A059] text-[#1A2A40] hover:bg-[#D4B16A]'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="hidden sm:inline">لوحة الإدارة</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={signOutUser}
                    title="تسجيل الخروج"
                    className="p-2 rounded-xl bg-[#243B55] hover:bg-red-900/60 text-gray-300 hover:text-white transition-colors border border-gray-700 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#C5A059] text-[#1A2A40] hover:bg-[#D4B16A] shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>دخول المشرفين</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Android Bottom Navigation Bar (Fixed for Mobile Screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#1A2A40]/95 backdrop-blur-xl border-t border-[#C5A059]/40 text-white flex items-center justify-around h-16 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-safe">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
            activeTab === 'home' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            activeTab === 'home' ? 'bg-[#C5A059]/20' : ''
          }`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
            activeTab === 'tree' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            activeTab === 'tree' ? 'bg-[#C5A059]/20' : ''
          }`}>
            <TreePine className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">الشجرة</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
            activeTab === 'search' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            activeTab === 'search' ? 'bg-[#C5A059]/20' : ''
          }`}>
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">الدليل</span>
        </button>

        <button
          onClick={() => setActiveTab('aiAssistant')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
            activeTab === 'aiAssistant' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className={`px-3 py-1 rounded-full transition-all ${
            activeTab === 'aiAssistant' ? 'bg-[#C5A059]/20' : ''
          }`}>
            <Bot className="w-5 h-5 text-[#C5A059]" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">مساعد الأنساب</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
            activeTab === 'compare' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            activeTab === 'compare' ? 'bg-[#C5A059]/20' : ''
          }`}>
            <GitCompare className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">القرابة</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
            activeTab === 'stats' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            activeTab === 'stats' ? 'bg-[#C5A059]/20' : ''
          }`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">الإحصائيات</span>
        </button>

        {isAdmin ? (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
              activeTab === 'admin' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className={`px-4 py-1 rounded-full transition-all ${
              activeTab === 'admin' ? 'bg-[#C5A059]/20' : ''
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-0.5">الإدارة</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('about')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all active:scale-95 ${
              activeTab === 'about' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className={`px-4 py-1 rounded-full transition-all ${
              activeTab === 'about' ? 'bg-[#C5A059]/20' : ''
            }`}>
              <Info className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-0.5">عن المنصة</span>
          </button>
        )}
      </nav>
    </>
  );
};

