import React, { useState, useEffect } from 'react';
import { Person } from '../types.ts';
import { API_BASE_URL } from '../config.ts';
import { Search, Filter, Users, User, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { VoiceSearchButton } from './VoiceSearchButton.tsx';

interface SearchAndDirectoryProps {
  onSelectPerson: (personId: number) => void;
}

export const SearchAndDirectory: React.FC<SearchAndDirectoryProps> = ({ onSelectPerson }) => {
  const [peopleList, setPeopleList] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTribe, setSelectedTribe] = useState('');
  const [selectedGender, setSelectedGender] = useState<'' | 'male' | 'female'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'living' | 'deceased'>('');
  const [displayCount, setDisplayCount] = useState(60);

  useEffect(() => {
    fetchPeople();

    const handleDataUpdate = () => {
      fetchPeople();
    };

    window.addEventListener('genealogy_data_updated', handleDataUpdate);
    window.addEventListener('app_global_refresh', handleDataUpdate);
    return () => {
      window.removeEventListener('genealogy_data_updated', handleDataUpdate);
      window.removeEventListener('app_global_refresh', handleDataUpdate);
    };
  }, [searchTerm, selectedTribe]);

  useEffect(() => {
    setDisplayCount(60);
  }, [searchTerm, selectedTribe, selectedGender, statusFilter]);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/people?limit=100000`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      if (selectedTribe.trim()) url += `&tribe=${encodeURIComponent(selectedTribe.trim())}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPeopleList(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter client-side for gender and living/deceased
  const filteredList = peopleList.filter((p) => {
    if (selectedGender && p.gender !== selectedGender) return false;
    if (statusFilter === 'living' && p.isDeceased) return false;
    if (statusFilter === 'deceased' && !p.isDeceased) return false;
    return true;
  });

  // Extract tribes for filter dropdown
  const tribesList = Array.from(new Set(peopleList.map((p) => p.tribe).filter(Boolean)));

  return (
    <div className="space-y-6">
      
      {/* Header & Search Banner */}
      <div className="bg-[#1A2A40] text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-4 border border-[#C5A059]/40">
        <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#C5A059] flex items-center gap-3">
          <Search className="w-7 h-7 text-[#C5A059]" />
          دليل الأشخاص والبحث الشامل
        </h2>
        <p className="text-xs sm:text-sm text-gray-300">
          استكشف سجلات الأفراد بالاسم الكامل، اللقب، القبيلة، والفرع العائلي مع نتائج فورية ومباشرة.
        </p>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="اكتب اسماً، لقباً، أو فرعاً للبحث..."
                className="w-full py-3.5 pr-11 pl-4 bg-[#243B55] text-white placeholder-gray-400 rounded-xl border border-[#C5A059]/40 focus:outline-none focus:border-[#C5A059] shadow-inner"
              />
              <Search className="absolute right-3.5 top-3.5 w-5 h-5 text-[#C5A059]" />
            </div>
            <VoiceSearchButton onSpeechResult={(res) => setSearchTerm(res)} />
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTribe('');
              setSelectedGender('');
              setStatusFilter('');
            }}
            className="px-4 py-3.5 rounded-xl bg-[#243B55] hover:bg-[#2C4A6B] text-[#C5A059] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border border-[#C5A059]/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة ضبط الفلاتر</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#C5A059]/30 text-xs">
          <div>
            <label className="block text-[#C5A059] font-bold mb-1">تصفية حسب القبيلة:</label>
            <select
              value={selectedTribe}
              onChange={(e) => setSelectedTribe(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#243B55] text-white border border-[#C5A059]/30 focus:outline-none"
            >
              <option value="">جميع القبائل</option>
              {tribesList.map((tr) => (
                <option key={tr} value={tr!}>{tr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#C5A059] font-bold mb-1">الجنس:</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as any)}
              className="w-full p-2.5 rounded-lg bg-[#243B55] text-white border border-[#C5A059]/30 focus:outline-none"
            >
              <option value="">الكل (ذكور وإناث)</option>
              <option value="male">ذكور فقط</option>
              <option value="female">إناث فقط</option>
            </select>
          </div>

          <div>
            <label className="block text-[#C5A059] font-bold mb-1">الحالة الحياتية:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2.5 rounded-lg bg-[#243B55] text-white border border-[#C5A059]/30 focus:outline-none"
            >
              <option value="">الكل</option>
              <option value="living">على قيد الحياة</option>
              <option value="deceased">متوفى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Results Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-[#1A2A40] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C5A059]" />
            <span>عدد النتائج: ({filteredList.length}) سجل</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[#1A2A40] font-bold">جاري البحث في السجلات...</div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white border border-[#C5A059]/30 rounded-2xl p-12 text-center text-[#1A2A40] font-bold space-y-2">
            <div>لم يتم العثور على أشخاص يطابقون خيارات البحث.</div>
            <p className="text-xs text-gray-500">جرب تغيير الكلمات المفتاحية أو إزالة الفلاتر.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.slice(0, displayCount).map((p) => {
                const displayName = p.fullLineageName || p.fullName;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPerson(p.id)}
                    className="p-5 rounded-xl bg-white border border-[#C5A059]/30 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#C5A059] group space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#F0F4F8] text-[#1A2A40] font-bold flex items-center justify-center text-xl overflow-hidden border-2 border-[#C5A059]/40 shadow-inner shrink-0 mt-0.5">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          displayName.charAt(0)
                        )}
                      </div>

                      <div className="overflow-hidden space-y-1 min-w-0">
                        <h3 className="font-bold text-[#1A2A40] text-base group-hover:text-[#C5A059] transition-colors leading-snug break-words">
                          {displayName}
                        </h3>
                        <p className="text-xs text-[#C5A059] font-medium truncate">
                          {[
                            p.fatherName ? `الأب: ${p.fatherName}` : null,
                            p.familyName ? `عائلة ${p.familyName}` : null,
                            p.tribe ? `قبيلة ${p.tribe}` : null,
                            p.branch ? `فرع ${p.branch}` : null,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-700 bg-[#F0F4F8] p-3 rounded-lg border border-[#C5A059]/20">
                      {p.fatherName && (
                        <div>
                          • اسم الأب: <span className="font-semibold text-[#1A2A40]">{p.fatherName}</span>
                        </div>
                      )}
                      {p.grandfatherName && (
                        <div>
                          • اسم الجد: <span className="font-semibold text-[#1A2A40]">{p.grandfatherName}</span>
                        </div>
                      )}
                      {p.birthDate && (
                        <div>
                          • سنة/تاريخ الميلاد: <span className="font-semibold text-[#1A2A40]">{p.birthDate}</span>
                        </div>
                      )}
                      {p.birthPlace && (
                        <div>
                          • مكان الميلاد/الإقامة: <span className="font-semibold text-[#1A2A40]">{p.birthPlace}</span>
                        </div>
                      )}
                      {(p.familyName || p.tribe || p.branch) && (
                        <div>
                          • الانتماء: {' '}
                          <span className="font-semibold text-[#1A2A40]">
                            {[
                              p.familyName ? `عائلة ${p.familyName}` : null,
                              p.tribe ? `قبيلة ${p.tribe}` : null,
                              p.branch ? `فرع ${p.branch}` : null,
                            ]
                              .filter(Boolean)
                              .join(' - ')}
                          </span>
                        </div>
                      )}
                      {p.occupation && (
                        <div>
                          • المهنة: <span className="font-semibold text-[#1A2A40]">{p.occupation}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          p.isDeceased ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.isDeceased ? 'متوفى' : 'على قيد الحياة'}
                      </span>

                      <span className="text-[#C5A059] font-bold group-hover:underline flex items-center gap-1">
                        الملف الشامل
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredList.length > displayCount && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 60)}
                  className="px-6 py-2.5 bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] border border-[#C5A059]/50 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  عرض المزيد من النتائج ({filteredList.length - displayCount} متبقٍ)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
