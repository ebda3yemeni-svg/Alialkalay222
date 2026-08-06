import React, { useState, useEffect, useRef } from 'react';
import { Person, AuditLogItem, AppUser } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { processImageFile } from '../lib/imageUtils.ts';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShieldCheck,
  History,
  FileDown,
  FileUp,
  Image as ImageIcon,
  FileText,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Database,
  Search,
  Camera,
  Upload,
  Plus,
  Mail,
  Power,
  Lock,
  AlertTriangle,
  Ban,
  UserCheck,
  ShieldAlert,
  HardDriveDownload,
  HardDriveUpload,
  Clock,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { GenealogyValidationReport } from './GenealogyValidationReport.tsx';

interface AdminDashboardProps {
  onOpenAddPerson: (person?: Person) => void;
  onRefreshData: () => void;
  onSelectPersonProfile?: (personId: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenAddPerson,
  onRefreshData,
  onSelectPersonProfile,
}) => {
  const { token, dbUser, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<'people' | 'media' | 'audit' | 'users' | 'backup' | 'validation'>('people');

  // State
  const [people, setPeople] = useState<Person[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Photo & Doc upload state
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingMediaPhoto, setUploadingMediaPhoto] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  // Add Administrator by Email state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [newAdminActive, setNewAdminActive] = useState(true);
  const [addAdminError, setAddAdminError] = useState('');
  const [addAdminSuccess, setAddAdminSuccess] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Backup & Restore State
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return localStorage.getItem('last_backup_date') || null;
  });
  const [lastBackupSize, setLastBackupSize] = useState<string | null>(() => {
    return localStorage.getItem('last_backup_size') || null;
  });
  const [backupStatus, setBackupStatus] = useState<string>('جاهز ومؤمن بالكامل');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreFilePayload, setRestoreFilePayload] = useState<any>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string>('');
  const [restoreSuccess, setRestoreSuccess] = useState<string>('');
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBackup = async () => {
    try {
      setIsExporting(true);
      setRestoreError('');
      setRestoreSuccess('');

      const res = await fetch('/api/export/json');
      if (!res.ok) {
        throw new Error('فشل في تصدير النسخة الاحتياطية من الخادم');
      }

      const blob = await res.blob();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateFormatted = `${year}_${month}_${day}`;
      const filename = `Bani_Ali_AlKalai_Backup_${dateFormatted}.json`;

      // Trigger download for Desktop and Mobile (Android / iOS)
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Format size
      const sizeFormatted =
        blob.size > 1024 * 1024
          ? `${(blob.size / (1024 * 1024)).toFixed(2)} ميجابايت`
          : `${(blob.size / 1024).toFixed(1)} كيلوبايت`;

      const timeFormatted = now.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      setLastBackupDate(timeFormatted);
      setLastBackupSize(sizeFormatted);
      setBackupStatus('تم التنزيل وحفظ الملف بنجاح على الجهاز');
      localStorage.setItem('last_backup_date', timeFormatted);
      localStorage.setItem('last_backup_size', sizeFormatted);
      setRestoreSuccess(`تم حفظ النسخة الاحتياطية بملف (${filename}) على جهازك بنجاح.`);
    } catch (err: any) {
      setRestoreError(err.message || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError('');
    setRestoreSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || (!Array.isArray(parsed.people) && !Array.isArray(parsed))) {
          setRestoreError('ملف غير صالح: لا يحتوي على تنسيق النسخة الاحتياطية لـ مشجرة بني علي القلعي.');
          return;
        }

        setRestoreFilePayload(parsed);
        setRestoreFileName(file.name);
        setShowRestoreConfirmModal(true);
      } catch (err) {
        setRestoreError('خطأ في قراءة الملف: الملف المختار ليس ملف JSON صالح.');
      }
    };
    reader.readAsText(file);

    if (e.target) e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restoreFilePayload) return;

    try {
      setIsRestoring(true);
      setRestoreError('');

      const res = await fetch('/api/import/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(restoreFilePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء استعادة النسخة الاحتياطية');
      }

      window.dispatchEvent(
        new CustomEvent('genealogy_data_updated', {
          detail: { action: 'imported' },
        })
      );
      window.dispatchEvent(new CustomEvent('app_global_refresh'));

      setRestoreSuccess(data.message || 'تمت استعادة كافة البيانات والملفات والخصائص بنجاح وتم إنشاء نسخة أمان تلقائية قبل البدء.');
      setShowRestoreConfirmModal(false);
      setRestoreFilePayload(null);
      setBackupStatus('تمت استعادة البيانات بنجاح في ' + new Date().toLocaleTimeString('ar-EG'));

      // Refresh platform data
      onRefreshData();
      fetchPeople();
    } catch (err: any) {
      setRestoreError(err.message || 'فشلت عملية الاستعادة');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleMediaPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingMediaPhoto(true);
      const dataUrl = await processImageFile(file);
      setPhotoUrl(dataUrl);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تحميل الملف');
    } finally {
      setUploadingMediaPhoto(false);
    }
  };

  useEffect(() => {
    fetchPeople();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/people?limit=500');
      if (res.ok) {
        const data = await res.json();
        setPeople(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePerson = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف السجل الخاص بـ (${name}) دائمياً من قاعدة البيانات؟`)) return;

    try {
      const res = await fetch(`/api/people/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        window.dispatchEvent(
          new CustomEvent('genealogy_data_updated', {
            detail: { action: 'deleted', personId: id },
          })
        );
        window.dispatchEvent(new CustomEvent('app_global_refresh'));
        fetchPeople();
        onRefreshData();
      } else {
        alert('فشل عملية الحذف');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (userId: number, role: string, isActive?: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role, isActive }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'فشل تعديل الصلاحية');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentActiveState: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentActiveState }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'فشلت عملية تغيير حالة الحساب');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`هل أنت تأكد من رغبتك في إزالة المشرف (${email}) وسحب جميع صلاحياته؟`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'فشل حذف المشرف');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleAddAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError('');
    setAddAdminSuccess('');

    const emailClean = newAdminEmail.trim().toLowerCase();
    if (!emailClean) {
      setAddAdminError('يرجى إدخال البريد الإلكتروني للمشرف');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      setAddAdminError('صيغة البريد الإلكتروني غير صحيحة (مثال: admin@example.com)');
      return;
    }

    setAddingAdmin(true);
    try {
      const res = await fetch('/api/users/add-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: emailClean,
          role: newAdminRole,
          isActive: newAdminActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAddAdminSuccess(data.message || 'تمت إضافة المشرف بنجاح');
        setNewAdminEmail('');
        setNewAdminRole('admin');
        setNewAdminActive(true);
        fetchUsers();
        setTimeout(() => {
          setShowAddAdminModal(false);
          setAddAdminSuccess('');
        }, 1800);
      } else {
        setAddAdminError(data.error || 'تعذر إضافة البريد الإلكتروني للمشرفين');
      }
    } catch (err) {
      console.error(err);
      setAddAdminError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !photoUrl) return;

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ personId: selectedPersonId, url: photoUrl, caption: photoCaption }),
      });
      if (res.ok) {
        alert('تم رفع الصورة بنجاح');
        setPhotoUrl('');
        setPhotoCaption('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !docTitle || !docUrl) return;

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ personId: selectedPersonId, title: docTitle, fileUrl: docUrl }),
      });
      if (res.ok) {
        alert('تم إرفاق المستند بنجاح');
        setDocTitle('');
        setDocUrl('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPeople = searchQuery.trim()
    ? people.filter((p) => {
        const full = (p.fullLineageName || p.fullName || '').toLowerCase();
        const father = (p.fatherName || '').toLowerCase();
        const tribe = (p.tribe || '').toLowerCase();
        const query = searchQuery.trim().toLowerCase();
        return full.includes(query) || father.includes(query) || tribe.includes(query);
      })
    : people;

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="bg-[#1A2A40] text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-4 border border-[#C5A059]/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#243B55] border border-[#C5A059]/40 text-[#C5A059] text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>نظام إدارة البيانات والإدارة العليا (موقع آمن)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#C5A059]">
              لوحة التحكم الإدارية
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              إدارة الأشخاص، المرفقات التاريخية، سجل العمليات، وصلاحيات الوصول إلى الشجرة العائلية
            </p>
          </div>

          <button
            onClick={() => onOpenAddPerson()}
            className="px-5 py-3 rounded-xl bg-[#C5A059] hover:bg-[#b08e4c] text-[#1A2A40] text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 border border-[#C5A059]/50"
          >
            <UserPlus className="w-5 h-5" />
            <span>إضافة شخص جديد للشجرة</span>
          </button>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 border-t border-[#C5A059]/30 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('people')}
            className={`px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'people' ? 'bg-[#C5A059] text-[#1A2A40] shadow' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة الأشخاص والسجلات ({people.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'media' ? 'bg-[#C5A059] text-[#1A2A40] shadow' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>الصور والوثائق</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'audit' ? 'bg-[#C5A059] text-[#1A2A40] shadow' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل التعديلات والعمليات</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-[#C5A059] text-[#1A2A40] shadow' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>المشرفون والصلاحيات</span>
          </button>

          <button
            onClick={() => setActiveTab('validation')}
            className={`px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'validation' ? 'bg-amber-500 text-white shadow font-bold' : 'bg-[#243B55] text-amber-300 hover:text-amber-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>مراجعة وتدقيق البيانات (Data Review)</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'backup' ? 'bg-[#C5A059] text-[#1A2A40] shadow' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>النسخ الاحتياطي والتصدير</span>
          </button>
        </div>
      </div>

      {/* Tab Validation Audit */}
      {activeTab === 'validation' && (
        <GenealogyValidationReport
          onEditPerson={(pId) => {
            const targetPerson = people.find((p) => p.id === pId);
            if (targetPerson) {
              onOpenAddPerson(targetPerson);
            } else {
              alert(`السجل المعني ID: ${pId}`);
            }
          }}
          onSelectPersonProfile={onSelectPersonProfile}
        />
      )}

      {/* Tab 1: People Manager */}
      {activeTab === 'people' && (
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-stone-900 font-amiri">سجلات السلسلة العائلية</h3>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="تصفية السجلات..."
                className="w-full py-2 pr-9 pl-3 text-xs bg-amber-50 border border-amber-200 rounded-xl focus:outline-none"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-amber-100/70 text-amber-950 font-bold border-b border-amber-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">الاسم الكامل</th>
                  <th className="p-3">اسم الأب</th>
                  <th className="p-3">القبيلة / الفرع</th>
                  <th className="p-3">تاريخ الميلاد</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium text-stone-800">
                {filteredPeople.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/50">
                    <td className="p-3 font-bold text-amber-800">{p.id}</td>
                    <td className="p-3 font-bold text-stone-900">{p.fullLineageName || p.fullName}</td>
                    <td className="p-3 text-stone-600">{p.fatherName || 'غير مربوط'}</td>
                    <td className="p-3 text-stone-600">{p.tribe || p.familyName || '—'}</td>
                    <td className="p-3 text-stone-600">{p.birthDate || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onOpenAddPerson(p)}
                          title="تعديل"
                          className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePerson(p.id, p.fullName)}
                          title="حذف"
                          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Photos & Documents Manager */}
      {activeTab === 'media' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Photo */}
          <form onSubmit={handleAddPhoto} className="bg-white p-6 rounded-3xl border border-amber-200 space-y-4">
            <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-700" />
              <span>إضافة صورة تاريخية لشخص</span>
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">اختر الشخص:</label>
              <select
                value={selectedPersonId || ''}
                onChange={(e) => setSelectedPersonId(parseInt(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-amber-200 text-xs font-semibold"
              >
                <option value="">-- اختر الشخص --</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullLineageName || p.fullName}</option>
                ))}
              </select>
            </div>

            {/* Hidden Input for Media Photo */}
            <input
              ref={mediaFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleMediaPhotoUpload}
              className="hidden"
            />

            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">الصورة:</label>
              {photoUrl ? (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <img src={photoUrl} alt="معاينة" className="w-12 h-12 rounded-lg object-cover border border-amber-400" />
                  <div className="flex-1 text-xs text-amber-900 font-bold">تم اختيار الصورة بنجاح</div>
                  <button
                    type="button"
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold"
                  >
                    تغيير
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold"
                  >
                    حذف
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100/50 rounded-xl text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-amber-700" />
                  <span>{uploadingMediaPhoto ? 'جاري التحميل...' : 'رفع صورة من الاستوديو / الجهاز'}</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">أو أدخل رابط الصورة (URL):</label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">وصف الصورة / التعليق:</label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="مثال: صورة تاريخية عام 1970"
                className="w-full p-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>

            <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-900 text-amber-100 text-xs font-bold">
              رفع الصورة وإرفاقها
            </button>
          </form>

          {/* Add Document */}
          <form onSubmit={handleAddDocument} className="bg-white p-6 rounded-3xl border border-amber-200 space-y-4">
            <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-700" />
              <span>إرفاق وثيقة تاريخية (PDF)</span>
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">اختر الشخص:</label>
              <select
                value={selectedPersonId || ''}
                onChange={(e) => setSelectedPersonId(parseInt(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-amber-200 text-xs font-semibold"
              >
                <option value="">-- اختر الشخص --</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullLineageName || p.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">عنوان الوثيقة:</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="مثال: وثيقة ملكية قديمة / شهادة ميلاد"
                className="w-full p-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">رابط ملف الوثيقة (URL):</label>
              <input
                type="text"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>

            <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-900 text-amber-100 text-xs font-bold">
              إرفاق الوثيقة
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-amber-200 space-y-4">
          <h3 className="text-base font-bold text-amber-950">سجل عمليات وحركات المشرفين</h3>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <div className="text-xs text-stone-500">لا يوجد سجلات بعد</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900">{log.action}: </span>
                    <span className="text-stone-700">{log.details}</span>
                  </div>
                  <div className="text-stone-400 font-mono text-[10px]">
                    بواسطة: {log.adminEmail}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-200 space-y-6">
          {/* Header & Add Admin Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-200">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                <span>إدارة حسابات المشرفين والصلاحيات</span>
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                إضافة مشرفين جدد عبر البريد الإلكتروني، تحديد الأدوار، والتحكم في تجميد أو إيقاف الحسابات.
              </p>
            </div>

            {isOwner ? (
              <button
                onClick={() => {
                  setShowAddAdminModal(true);
                  setAddAdminError('');
                  setAddAdminSuccess('');
                }}
                className="px-4 py-2.5 bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] border border-[#C5A059]/40 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
              >
                <UserPlus className="w-4 h-4 text-[#C5A059]" />
                <span>➕ إضافة مشرف جديد</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>صلاحية المالك فقط تتطلب إضافة أو تعديل المشرفين</span>
              </div>
            )}
          </div>

          {/* Table of Administrators */}
          <div className="overflow-x-auto rounded-2xl border border-amber-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1A2A40] text-[#C5A059] font-bold">
                <tr>
                  <th className="p-3.5">اسم المستخدم</th>
                  <th className="p-3.5">البريد الإلكتروني</th>
                  <th className="p-3.5">المستوى والصلاحية</th>
                  <th className="p-3.5 text-center">حالة الحساب</th>
                  <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 bg-white">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-stone-500 font-medium">
                      لا يوجد حسابات مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const isUserActive = u.isActive !== false;
                    const isSelf = dbUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-amber-50/60 transition-colors">
                        <td className="p-3.5 font-bold text-amber-950 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs border border-amber-300">
                            {(u.name || u.email)?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span>{u.name || 'مستخدم'}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-bold">
                              (أنت)
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 font-mono text-stone-700 dir-ltr text-left" dir="ltr">
                          {u.email}
                        </td>

                        <td className="p-3.5">
                          {u.role === 'owner' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px]">
                              👑 مالك المنصة
                            </span>
                          )}
                          {u.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px]">
                              🛡️ مشرف كامل
                            </span>
                          )}
                          {u.role === 'editor' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 font-bold text-[11px]">
                              ✏️ محرر بيانات
                            </span>
                          )}
                          {u.role === 'viewer' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-300 text-stone-700 font-bold text-[11px]">
                              👁️ زائر (مستعرض)
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          {isUserActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>نشط</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]">
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>معطل مؤقتاً</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          {isOwner ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* Role Selector */}
                              <select
                                value={u.role}
                                disabled={isSelf}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value, u.isActive)}
                                className="p-1.5 rounded-lg border border-amber-300 text-xs font-bold bg-white text-stone-800 disabled:opacity-50"
                              >
                                <option value="owner">مالك (Owner)</option>
                                <option value="admin">مشرف (Admin)</option>
                                <option value="editor">محرر (Editor)</option>
                                <option value="viewer">زائر (Viewer)</option>
                              </select>

                              {/* Toggle Active Status */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u.id, isUserActive)}
                                  title={isUserActive ? 'تجميد الحساب' : 'إعادة تفعيل الحساب'}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                                    isUserActive
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{isUserActive ? 'تجميد' : 'تفعيل'}</span>
                                </button>
                              )}

                              {/* Delete Administrator */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  title="إزالة المشرف"
                                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400 font-semibold text-[11px]">محمي (للمالك فقط)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Administrator Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-amber-300 overflow-hidden space-y-0 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-[#1A2A40] text-white p-5 border-b border-[#C5A059]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#243B55] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#C5A059]">➕ إضافة مشرف جديد عبر البريد</h3>
                  <p className="text-[11px] text-gray-300">منح صلاحيات الإدارة أو التعديل باستخدام البريد الإلكتروني</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddAdminByEmail} className="p-6 space-y-4 text-xs font-semibold">
              
              {/* Error Alert */}
              {addAdminError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{addAdminError}</span>
                </div>
              )}

              {/* Success Alert */}
              {addAdminSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{addAdminSuccess}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-amber-950 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-800" />
                  <span>البريد الإلكتروني للمشرف:</span>
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => {
                    setNewAdminEmail(e.target.value);
                    if (addAdminError) setAddAdminError('');
                  }}
                  placeholder="admin@example.com"
                  required
                  className="w-full p-3 rounded-xl border border-amber-300 bg-amber-50/20 focus:bg-white focus:border-amber-600 text-xs text-left font-mono"
                  dir="ltr"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  سيتم الفحص إذا كان الحساب موجوداً وتعيينه كمشرف فوراً.
                </p>
              </div>

              {/* Role Level */}
              <div className="space-y-1.5">
                <label className="block font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  <span>مستوى الصلاحية (الدور الإداري):</span>
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="w-full p-3 rounded-xl border border-amber-300 bg-white font-bold text-amber-950 focus:border-amber-600"
                >
                  <option value="admin">🛡️ مشرف كامل (إضافة وتعديل وحذف كافة البيانات)</option>
                  <option value="editor">✏️ محرر بيانات (إضافة وتعديل بيانات الأشخاص فقط)</option>
                  <option value="owner">👑 مالك المنصة (صلاحيات كاملة تشمل المشرفين)</option>
                  <option value="viewer">👁️ زائر / مستعرض فقط (عرض بدون صلاحيات تعديل)</option>
                </select>
              </div>

              {/* Account Status Toggle */}
              <div className="pt-2 flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="newAdminActiveCheckbox"
                  checked={newAdminActive}
                  onChange={(e) => setNewAdminActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500 border-amber-300 cursor-pointer"
                />
                <label htmlFor="newAdminActiveCheckbox" className="font-bold text-amber-950 cursor-pointer select-none">
                  تفعيل الحساب فوراً (حساب نشط)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-amber-100">
                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="flex-1 py-3 px-4 bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-[#C5A059]/40 disabled:opacity-50"
                >
                  {addingAdmin ? (
                    <span>جاري التحقق والإضافة...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>حفظ وتعيين الصلاحيات</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Tab 5: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-3xl border border-amber-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-100">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-800" />
                <h3 className="text-base font-bold text-amber-950">تصدير واستعادة النسخ الاحتياطية</h3>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                تضمن هذه الخاصية حفظ كافة سجلات الأنساب والصور والمستندات وإعدادات المنصة بضغطة زر، وإمكانية استعادتها بأمان تام.
              </p>
            </div>

            {isOwner && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shrink-0 self-start md:self-auto">
                👑 صلاحية مالك المنصة
              </span>
            )}
          </div>

          {/* Backup Metadata & Status Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] text-stone-500 font-semibold">تاريخ آخر نسخة احتياطية</p>
                <p className="text-xs font-bold text-amber-950 truncate">{lastBackupDate || 'لم يتم النسخ مؤخراً'}</p>
              </div>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] text-stone-500 font-semibold">حجم النسخة الاحتياطية</p>
                <p className="text-xs font-bold text-amber-950 truncate">{lastBackupSize || 'غير محدد'}</p>
              </div>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] text-stone-500 font-semibold">حالة النسخة الاحتياطية</p>
                <p className="text-xs font-bold text-emerald-800 truncate">{backupStatus}</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {restoreError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{restoreError}</span>
            </div>
          )}

          {restoreSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{restoreSuccess}</span>
            </div>
          )}

          {/* Main Action Buttons Panel */}
          <div className="p-5 bg-gradient-to-br from-amber-50/40 via-stone-50 to-white rounded-2xl border border-amber-200 space-y-4">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              أدوات النسخ الاحتياطي والاستعادة المباشرة
            </h4>

            {isOwner ? (
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                {/* Button 1: Create Backup File */}
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isExporting}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] font-bold text-xs flex items-center justify-center gap-2.5 shadow-md border border-[#C5A059]/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <HardDriveDownload className="w-5 h-5 text-[#C5A059]" />
                  <span>{isExporting ? 'جاري إنشاء وتجهيز الملف...' : 'نسخ احتياطي إلى الجهاز'}</span>
                </button>

                {/* Button 2: Restore Backup File */}
                <button
                  type="button"
                  onClick={() => restoreFileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md border border-amber-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <HardDriveUpload className="w-5 h-5 text-amber-200" />
                  <span>{isRestoring ? 'جاري قراءة واستعادة النسخة...' : 'رفع نسخة احتياطية'}</span>
                </button>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={restoreFileInputRef}
                  onChange={handleRestoreFileSelected}
                  accept=".json,application/json"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-800 shrink-0" />
                <span>
                  خاصية رفع واستعادة النسخ الاحتياطية الشاملة مخصصة حصرياً لمالك المنصة الرئيسي لضمان سلامة وأمان المشجرة.
                </span>
              </div>
            )}

            {/* Standard Exports */}
            <div className="pt-3 border-t border-amber-100 flex flex-wrap gap-3">
              <a
                href="/api/export/gedcom"
                download
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <FileDown className="w-4 h-4 text-stone-600" />
                <span>تصدير بصيغة GEDCOM المعتمدة</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal for Owner */}
      {showRestoreConfirmModal && restoreFilePayload && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-rose-950 text-white p-5 border-b border-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-900 border border-rose-700 flex items-center justify-center text-rose-200 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-rose-100">⚠️ تأكيد استبدال واستعادة البيانات</h3>
                  <p className="text-[11px] text-rose-300">إجراء حساس يتطلب موافقة مالك المنصة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRestoreConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 flex items-center justify-center transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs font-medium text-stone-800">
              <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-900 rounded-2xl font-bold space-y-1">
                <p className="text-sm">سيتم استبدال البيانات الحالية بالنسخة الاحتياطية. هل تريد المتابعة؟</p>
                <p className="text-[11px] font-normal text-rose-800">
                  سيتم تحديث واستبدال الجداول الحالية وإعادة بناء المشجرة بالكامل وفق محتويات الملف المحدد.
                </p>
              </div>

              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>نسخة سلامة تلقائية:</span>
                </p>
                <p className="text-[11px] text-stone-700">
                  سيقوم النظام تلقائياً بإنشاء نسخة أمان احتياطية لقاعدة البيانات الحالية قبل البدء باستبدال البيانات.
                </p>
              </div>

              {/* Summary of File to Restore */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <p className="font-bold text-stone-900 text-xs">تفاصيل ملف النسخة المراد استعادتها:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono dir-rtl text-stone-700">
                  <div>اسم الملف: <span className="font-bold text-stone-900">{restoreFileName}</span></div>
                  <div>عدد الأفراد: <span className="font-bold text-amber-900">{restoreFilePayload?.people?.length || 0}</span></div>
                  <div>تاريخ التصدير: <span className="font-bold text-stone-900">{restoreFilePayload?.exportedAt?.split('T')[0] || 'غير محدد'}</span></div>
                  <div>النسخة: <span className="font-bold text-stone-900">{restoreFilePayload?.version || '1.0'}</span></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="flex-1 py-3.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-rose-500 disabled:opacity-50 cursor-pointer"
                >
                  {isRestoring ? (
                    <span>جاري استعادة النسخة...</span>
                  ) : (
                    <>
                      <HardDriveUpload className="w-4 h-4" />
                      <span>تأكيد واستعادة البيانات الآن</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRestoreConfirmModal(false)}
                  disabled={isRestoring}
                  className="py-3.5 px-5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
