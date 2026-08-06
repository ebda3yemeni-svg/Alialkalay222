import React, { useState, useEffect } from 'react';
import { AdminNotification } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Bell,
  X,
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Edit3,
  GitMerge,
  Copy,
  AlertTriangle,
  Bot,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Filter,
  ExternalLink,
  Trash2,
  ShieldAlert,
  User,
} from 'lucide-react';

interface AdminNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPerson: (personId: number) => void;
}

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({
  isOpen,
  onClose,
  onSelectPerson,
}) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/notifications', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (err) {
      console.error('Error loading admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const dispatchUpdateEvent = () => {
    window.dispatchEvent(new CustomEvent('admin_notifications_updated'));
  };

  const toggleRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
      );
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers,
      });
      dispatchUpdateEvent();
    } catch (err) {
      console.error('Failed to toggle read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/admin/notifications/read-all', {
        method: 'PUT',
        headers,
      });
      dispatchUpdateEvent();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers,
      });
      dispatchUpdateEvent();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('هل أنت تأكد من مسح جميع الإشعارات الإدارية؟')) return;
    try {
      setNotifications([]);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers,
      });
      dispatchUpdateEvent();
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'people')
      return (
        n.category === 'person_added' ||
        n.category === 'person_edited' ||
        n.category === 'person_deleted'
      );
    if (activeFilter === 'family')
      return n.category === 'family_added' || n.category === 'family_updated';
    if (activeFilter === 'requests')
      return n.category === 'edit_submitted' || n.category === 'merge_request';
    if (activeFilter === 'media')
      return n.category === 'document_uploaded' || n.category === 'image_uploaded';
    return n.category === activeFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'person_added':
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      case 'person_edited':
        return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'person_deleted':
        return <UserX className="w-4 h-4 text-rose-600" />;
      case 'family_added':
      case 'family_updated':
        return <Users className="w-4 h-4 text-amber-600" />;
      case 'edit_submitted':
        return <Edit3 className="w-4 h-4 text-cyan-600" />;
      case 'merge_request':
        return <GitMerge className="w-4 h-4 text-purple-600" />;
      case 'confidence_changed':
        return <UserCheck className="w-4 h-4 text-teal-600" />;
      case 'duplicate_detected':
        return <Copy className="w-4 h-4 text-rose-600" />;
      case 'missing_info':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'ai_issue':
        return <Bot className="w-4 h-4 text-[#C5A059]" />;
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'image_uploaded':
        return <ImageIcon className="w-4 h-4 text-[#C5A059]" />;
      default:
        return <Bell className="w-4 h-4 text-[#C5A059]" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'person_added':
        return 'إضافة شخص';
      case 'person_edited':
        return 'تعديل شخص';
      case 'person_deleted':
        return 'حذف شخص';
      case 'family_added':
        return 'إضافة عائلة';
      case 'family_updated':
        return 'تحديث عائلة';
      case 'edit_submitted':
        return 'مقترح تعديل';
      case 'merge_request':
        return 'طلب دمج';
      case 'confidence_changed':
        return 'تغيير الموثوقية';
      case 'duplicate_detected':
        return 'سجل مكرر';
      case 'missing_info':
        return 'بيانات ناقصة';
      case 'ai_issue':
        return 'تنبيه ذكي';
      case 'document_uploaded':
        return 'وثيقة جديدة';
      case 'image_uploaded':
        return 'صورة جديدة';
      default:
        return 'إشعار إداري';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start animate-fadeIn">
      <div className="w-full max-w-md bg-[#F7F5F2] h-full shadow-2xl border-l border-[#C5A059]/40 flex flex-col text-right overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1A2A40] text-white p-5 border-b border-[#C5A059]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#243B55] border border-[#C5A059]/40 text-[#C5A059] relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold font-amiri text-lg text-[#C5A059]">مركز إشعارات المشرفين</h3>
              <p className="text-[11px] text-gray-300">متابعة الأنساب، التعديلات وتنبيهات النظام</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#243B55] hover:bg-[#2C4A6B] text-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {[
            { id: 'all', label: 'الكل' },
            { id: 'unread', label: `غير مقروء (${unreadCount})` },
            { id: 'people', label: 'الأشخاص' },
            { id: 'confidence_changed', label: 'الموثوقية' },
            { id: 'duplicate_detected', label: 'المكررات' },
            { id: 'missing_info', label: 'نقص البيانات' },
            { id: 'requests', label: 'الطلبات' },
            { id: 'media', label: 'الوسائط' },
            { id: 'ai_issue', label: 'تنبيهات الذكاء' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-[#1A2A40] text-[#C5A059] border border-[#C5A059]/50 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="px-4 py-2 bg-amber-50/60 border-b border-amber-200/50 flex items-center justify-between text-xs text-stone-700 shrink-0">
          <span className="font-bold">إجمالي الإشعارات: {filteredNotifications.length}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="text-amber-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              تحديد الكل كمقروء
            </button>
            <button
              onClick={clearAllNotifications}
              className="text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              مسح الكل
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-bold text-xs">
              جاري تحميل إشعارات اللوحة الإدارية...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold text-xs space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-600/40 mx-auto" />
              <p>لا توجد إشعارات حالياً في هذه الفئة.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 relative ${
                  item.isRead
                    ? 'bg-white border-gray-200 opacity-80'
                    : 'bg-amber-50/80 border-[#C5A059]/50 shadow-sm ring-1 ring-amber-300/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-xs shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                        {getCategoryLabel(item.category)}
                      </span>
                      <h4 className="font-bold text-xs text-[#1A2A40] mt-0.5">{item.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRead(item.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                        item.isRead
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                      }`}
                    >
                      {item.isRead ? 'تم القراءة' : 'جديد'}
                    </button>
                    <button
                      onClick={() => deleteNotification(item.id)}
                      title="حذف الإشعار"
                      className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-medium">{item.message}</p>

                {(item.personName || item.familyName || item.adminEmail) && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 bg-white/60 p-2 rounded-xl border border-gray-100">
                    {(item.personName || item.familyName) && (
                      <span className="font-bold text-[#1A2A40]">
                        السجل: {item.personName || item.familyName}
                      </span>
                    )}
                    {item.adminEmail && (
                      <span className="text-gray-500 flex items-center gap-1 font-semibold">
                        <User className="w-3 h-3 text-amber-800" />
                        المشرف: {item.adminEmail}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>
                      {new Date(item.timestamp).toLocaleDateString('ar-SA')} -{' '}
                      {new Date(item.timestamp).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {item.personId && (
                    <button
                      onClick={() => {
                        onSelectPerson(item.personId!);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#1A2A40] text-[#C5A059] hover:bg-[#243B55] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>فتح السجل</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

