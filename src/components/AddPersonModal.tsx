import React, { useState, useEffect, useRef } from 'react';
import { Person, MergeSuggestion } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { X, UserPlus, Search, AlertTriangle, Check, ArrowRight, UserCheck, Camera, Upload, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { processImageFile } from '../lib/imageUtils.ts';

interface AddPersonModalProps {
  editPerson?: Person | null;
  onClose: () => void;
  onSaved: () => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  editPerson,
  onClose,
  onSaved,
}) => {
  const { token } = useAuth();
  const [fullName, setFullName] = useState(editPerson?.fullName || '');
  const [gender, setGender] = useState<'male' | 'female'>(editPerson?.gender || 'male');
  const [fatherId, setFatherId] = useState<number | null>(editPerson?.fatherId || null);
  const [fatherSearchTerm, setFatherSearchTerm] = useState(editPerson?.fatherName || '');
  const [fatherSearchResults, setFatherSearchResults] = useState<Person[]>([]);
  const [selectedFather, setSelectedFather] = useState<Person | null>(null);

  const [familyName, setFamilyName] = useState(editPerson?.familyName || '');
  const [tribe, setTribe] = useState(editPerson?.tribe || '');
  const [branch, setBranch] = useState(editPerson?.branch || '');
  const [birthDate, setBirthDate] = useState(editPerson?.birthDate || '');
  const [deathDate, setDeathDate] = useState(editPerson?.deathDate || '');
  const [birthPlace, setBirthPlace] = useState(editPerson?.birthPlace || '');
  const [deathPlace, setDeathPlace] = useState(editPerson?.deathPlace || '');
  const [isDeceased, setIsDeceased] = useState<boolean>(editPerson?.isDeceased || false);
  const [biography, setBiography] = useState(editPerson?.biography || '');
  const [occupation, setOccupation] = useState(editPerson?.occupation || '');
  const [phone, setPhone] = useState(editPerson?.phone || '');
  const [email, setEmail] = useState(editPerson?.email || '');
  const [photoUrl, setPhotoUrl] = useState(editPerson?.photoUrl || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlOption, setShowUrlOption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const dataUrl = await processImageFile(file);
      setPhotoUrl(dataUrl);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء قراءة الملف من الجهاز');
    } finally {
      setUploadingImage(false);
    }
  };
  const [notes, setNotes] = useState(editPerson?.notes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateSuggestions, setDuplicateSuggestions] = useState<MergeSuggestion[]>([]);

  // Fetch father details if editing existing person with fatherId
  useEffect(() => {
    if (editPerson?.fatherId) {
      fetch(`/api/people/${editPerson.fatherId}`)
        .then((res) => res.json())
        .then((fatherData: Person) => {
          if (fatherData && fatherData.id) {
            setSelectedFather(fatherData);
            setFatherSearchTerm(fatherData.fullLineageName || fatherData.fullName);
          }
        })
        .catch((err) => console.error('Error fetching father details:', err));
    }
  }, [editPerson?.fatherId]);

  // Search father records in DB
  useEffect(() => {
    if (!fatherSearchTerm.trim()) {
      setFatherSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/people?search=${encodeURIComponent(fatherSearchTerm.trim())}&limit=10`)
        .then((res) => res.json())
        .then((data: Person[]) => {
          // Filter to males
          setFatherSearchResults(data.filter((p) => p.gender === 'male'));
        })
        .catch((err) => console.error(err));
    }, 200);

    return () => clearTimeout(timer);
  }, [fatherSearchTerm]);

  // Check duplicates
  useEffect(() => {
    if (fullName.trim().length > 4) {
      const timer = setTimeout(() => {
        fetch('/api/duplicates/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fullName, fatherId }),
        })
          .then((res) => res.json())
          .then((suggestions) => {
            if (Array.isArray(suggestions)) {
              setDuplicateSuggestions(suggestions.filter((s) => s.person2.id !== editPerson?.id));
            }
          })
          .catch((err) => console.error('Duplicate check failed:', err));
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setDuplicateSuggestions([]);
    }
  }, [fullName, fatherId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('الاسم الكامل مطلوب');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        fullName: fullName.trim(),
        gender,
        fatherId,
        familyName: familyName.trim() || null,
        tribe: tribe.trim() || null,
        branch: branch.trim() || null,
        birthDate: birthDate.trim() || null,
        deathDate: deathDate.trim() || null,
        birthPlace: birthPlace.trim() || null,
        deathPlace: deathPlace.trim() || null,
        isDeceased,
        biography: biography.trim() || null,
        occupation: occupation.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        photoUrl: photoUrl.trim() || null,
        notes: notes.trim() || null,
      };

      const url = editPerson ? `/api/people/${editPerson.id}` : '/api/people';
      const method = editPerson ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشل حفظ البيانات في قاعدة البيانات');
      }

      window.dispatchEvent(
        new CustomEvent('genealogy_data_updated', {
          detail: { action: 'saved', personId: editPerson?.id },
        })
      );
      window.dispatchEvent(new CustomEvent('app_global_refresh'));

      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A2A40]/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#F7F5F2] rounded-2xl shadow-2xl border border-[#C5A059]/40 overflow-hidden my-8 max-h-[90vh] flex flex-col text-right">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A2A40] via-[#243B55] to-[#1A2A40] text-white p-6 flex items-center justify-between shrink-0 border-b border-[#C5A059]/30">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-[#C5A059]" />
            <h2 className="text-xl sm:text-2xl font-bold font-amiri text-[#C5A059]">
              {editPerson ? 'تعديل بيانات فرد' : 'إضافة فرد جديد للشجرة'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#243B55] hover:bg-[#2C4A6B] text-gray-200 transition-colors border border-[#C5A059]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-2xl text-xs sm:text-sm font-bold">
              {error}
            </div>
          )}

          {/* Duplicate Detection Alert */}
          {duplicateSuggestions.length > 0 && (
            <div className="p-4 bg-amber-100 border-2 border-amber-400 text-amber-950 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>تحذير: تم اكتشاف أسماء مشابهاً قد تكوّن سجلاً مكرراً!</span>
              </div>
              <div className="text-xs text-amber-800">
                {duplicateSuggestions.map((s, idx) => (
                  <div key={idx} className="bg-white/80 p-2 rounded-xl mt-1 font-semibold">
                    • {s.person2.fullName} ({s.reason})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Name & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-amber-950">الاسم الكامل (مطلوب):</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد عبد الله عارف الهاشمي"
                className="w-full p-3 rounded-xl bg-white border border-amber-300 focus:outline-none focus:border-amber-600 text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-amber-950">النوع:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-white border border-amber-300 focus:outline-none focus:border-amber-600 text-sm font-bold"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>

          {/* Smart Father Connection Search */}
          <div className="bg-amber-100/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
            <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
              <span>ربط الأب الذكي (البحث في الشجرة):</span>
              <span className="text-[10px] text-amber-800 font-normal">ابحث عن اسم الأب لربطه تلقائياً</span>
            </label>

            {selectedFather ? (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {selectedFather.photoUrl ? (
                      <img
                        src={selectedFather.photoUrl}
                        alt={selectedFather.fullLineageName || selectedFather.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-emerald-950 truncate">
                      تم الربط بالأب: {selectedFather.fullLineageName || selectedFather.fullName}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-medium truncate">
                      {[
                        selectedFather.birthDate ? `مواليد ${selectedFather.birthDate.substring(0, 4)}` : null,
                        selectedFather.birthPlace ? selectedFather.birthPlace : null,
                        selectedFather.familyName || selectedFather.tribe ? `عائلة/قبيلة: ${selectedFather.familyName || selectedFather.tribe}` : null,
                        selectedFather.branch ? `فرع: ${selectedFather.branch}` : null,
                      ].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFather(null);
                    setFatherId(null);
                    setFatherSearchTerm('');
                  }}
                  className="px-2.5 py-1 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold transition-colors shrink-0 mr-2"
                >
                  إلغاء الربط
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={fatherSearchTerm}
                    onChange={(e) => setFatherSearchTerm(e.target.value)}
                    placeholder="ابحث عن اسم الأب (مثال: عارف، أحمد، الهاشمي...)"
                    className="w-full py-2.5 pr-10 pl-3 bg-white text-stone-900 text-xs rounded-xl border border-amber-300 focus:outline-none focus:border-amber-600 font-medium"
                  />
                  <Search className="absolute right-3 top-3 w-4 h-4 text-amber-600" />
                </div>

                {/* Search Results for Father */}
                {fatherSearchResults.length > 0 && (
                  <div className="bg-white rounded-2xl border border-amber-300 shadow-xl divide-y divide-amber-100 max-h-64 overflow-y-auto text-xs">
                    {fatherSearchResults.map((f) => {
                      const displayName = f.fullLineageName || f.fullName;
                      const birthYear = f.birthDate ? f.birthDate.substring(0, 4) : '';
                      const familyOrTribe = f.familyName || f.tribe;

                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedFather(f);
                            setFatherId(f.id);
                            setFatherSearchTerm(displayName);
                            setFatherSearchResults([]);
                          }}
                          className="p-3 hover:bg-amber-50 cursor-pointer transition-colors flex items-center justify-between gap-3 text-right"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm mt-0.5">
                              {f.photoUrl ? (
                                <img src={f.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{displayName[0]?.toUpperCase() || 'أ'}</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="space-y-1 min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-amber-950 truncate leading-snug">
                                {displayName}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600 font-medium">
                                {birthYear && (
                                  <span className="bg-amber-100/80 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                                    📅 مواليد {birthYear} {f.birthPlace ? `(${f.birthPlace})` : ''}
                                  </span>
                                )}

                                {!birthYear && f.birthPlace && (
                                  <span className="bg-amber-100/80 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                                    📍 {f.birthPlace}
                                  </span>
                                )}

                                {familyOrTribe && (
                                  <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                                    🏛️ {familyOrTribe}
                                  </span>
                                )}

                                {f.branch && (
                                  <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                                    🌿 فرع {f.branch}
                                  </span>
                                )}

                                {f.isDeceased && (
                                  <span className="bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded-md text-[10px]">
                                    متوفى
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="px-3 py-1.5 bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] border border-[#C5A059]/40 rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm"
                          >
                            اختيار كـ أب
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Prompt if father not found */}
                {fatherSearchTerm.trim().length >= 2 && fatherSearchResults.length === 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-amber-900">
                      لم يتم العثور على الأب في الشجرة بهذا الاسم!
                    </div>
                    <p className="text-stone-600">
                      يمكنك حفظ هذا الفرد حالياً، أو إضافة الأب أولاً في الشجرة ثم ربطه لاحقاً.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Family, Tribe, Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-amber-950">اسم العائلة / اللقب:</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="مثال: الهاشمي"
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-amber-950">القبيلة:</label>
              <input
                type="text"
                value={tribe}
                onChange={(e) => setTribe(e.target.value)}
                placeholder="مثال: أزد"
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-amber-950">الفرع العائلي:</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="مثال: العوارف"
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>
          </div>

          {/* Dates & Places */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-amber-950">تاريخ الميلاد:</label>
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="مثال: 1980 أو 1395 هـ"
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-amber-950">مكان الميلاد:</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="مثال: صنعاء"
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>
          </div>

          {/* Is Deceased & Death info */}
          <div className="p-4 bg-white rounded-2xl border border-amber-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
              <input
                type="checkbox"
                checked={isDeceased}
                onChange={(e) => setIsDeceased(e.target.checked)}
                className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
              />
              <span>توفاه الله (متوفى)</span>
            </label>

            {isDeceased && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-amber-950">تاريخ الوفاة:</label>
                  <input
                    type="text"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    placeholder="تاريخ الوفاة"
                    className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-amber-950">مكان الوفاة:</label>
                  <input
                    type="text"
                    value={deathPlace}
                    onChange={(e) => setDeathPlace(e.target.value)}
                    placeholder="مكان الوفاة"
                    className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Occupation & Direct Device Photo Upload */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-amber-950">المهنة / الوظيفة:</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="مثال: أستاذ جامعي / مهندس"
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>

            {/* Direct Photo Upload Card */}
            <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-800" />
                  <span>الصورة الشخصية (رفع من الاستوديو أو الجهاز مباشرة):</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setShowUrlOption(!showUrlOption)}
                  className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{showUrlOption ? 'إخفاء الرابط الخارجي' : 'استخدام رابط URL خارجي'}</span>
                </button>
              </div>

              {/* Hidden HTML File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Box / Image Preview */}
              {photoUrl ? (
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-amber-300 shadow-sm">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C5A059] bg-stone-100 shrink-0 shadow">
                    <img src={photoUrl} alt="معاينة الصورة" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>تمت إضافة الصورة بنجاح</span>
                    </div>
                    <p className="text-stone-500 text-[11px]">ستحفظ الصورة دائمياً وتظهر في الشجرة العائلية والملف الشخصي.</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>تغيير الصورة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-amber-400 hover:border-amber-600 bg-white hover:bg-amber-50 rounded-2xl cursor-pointer text-center space-y-2 transition-all group"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-xs text-amber-950">
                    {uploadingImage ? 'جاري قراءة ومعالجة الصورة من الجهاز...' : 'اضغط هنا لاختيار صورة شخصية من الاستوديو / الجهاز'}
                  </div>
                  <p className="text-[11px] text-stone-500">يدعم صور JPG, PNG, WEBP من الهاتف المحمول أو الكمبيوتر</p>
                </div>
              )}

              {/* Optional URL input fallback */}
              {showUrlOption && (
                <div className="pt-2 border-t border-amber-200 space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700">رابط صورة خارجي (URL):</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 rounded-xl bg-white border border-amber-300 text-xs font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-amber-950">السيرة الذاتية والمحطات التاريخية:</label>
            <textarea
              rows={3}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="اكتب موجزاً تاريخياً عن حياة هذا الفرد ومساهماته..."
              className="w-full p-3 rounded-xl bg-white border border-amber-300 text-xs font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#C5A059]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-all"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] border border-[#C5A059]/40 text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {saving ? 'جاري الحفظ إلى PostgreSQL...' : editPerson ? 'حفظ التعديلات' : 'حفظ الفرد دائمياً'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
