import React, { useState, useEffect } from 'react';
import { Person, GenealogyStatistics } from '../types.ts';
import { Search, TreePine, UserPlus, BarChart3, Info, Users, Sparkles, BookOpen, Layers, Award, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { API_BASE_URL, safeApiFetch } from '../config.ts';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  onSelectPerson: (personId: number) => void;
  onOpenAddPersonModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setActiveTab,
  onSelectPerson,
  onOpenAddPersonModal,
}) => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<GenealogyStatistics | null>(null);

  const loadStats = () => {
    safeApiFetch('/api/statistics')
      .then((res) => res.text())
      .then((text) => setStats(JSON.parse(text)))
      .catch((err) => console.error('Failed to load stats:', err));
  };

  useEffect(() => {
    loadStats();

    const handleDataUpdate = () => {
      loadStats();
      if (searchQuery.trim()) {
        fetch(`${API_BASE_URL}/api/people?search=${encodeURIComponent(searchQuery.trim())}&limit=8`)
          .then((res) => res.json())
          .then((data) => setSearchResults(data))
          .catch((err) => console.error('Search error:', err));
      }
    };

    window.addEventListener('genealogy_data_updated', handleDataUpdate);
    window.addEventListener('app_global_refresh', handleDataUpdate);
    return () => {
      window.removeEventListener('genealogy_data_updated', handleDataUpdate);
      window.removeEventListener('app_global_refresh', handleDataUpdate);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`${API_BASE_URL}/api/people?search=${encodeURIComponent(searchQuery.trim())}&limit=8`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data))
        .catch((err) => console.error('Search error:', err))
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A2A40] via-[#243B55] to-[#1A2A40] text-white p-8 sm:p-12 md:p-14 border border-[#C5A059]/40 shadow-2xl">
        {/* Geometric Balance subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#243B55]/80 border border-[#C5A059]/40 text-[#C5A059] text-xs sm:text-sm font-semibold backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span>موسوعة رقمية معتمدة لتوثيق أنساب بني علي الكلعي</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-amiri tracking-tight text-[#C5A059] leading-tight">
            موسوعة الأنساب لبني علي الكلعي
          </h1>

          <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-light max-w-2xl mx-auto">
            منظومة وثائقية تفاعلية تعتمد على قواعد بيانات هرمية دقيقة لربط الأجيال وتوثيق السلسلة التاريخية.
          </p>

          {/* Quick Search Box */}
          <div className="relative max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن اسم، لقب، أو قبيلة..."
                className="w-full py-4 pr-12 pl-4 text-base sm:text-lg bg-[#243B55]/90 text-white placeholder-gray-400 rounded-xl border-2 border-[#C5A059]/50 focus:border-[#C5A059] focus:outline-none focus:ring-4 focus:ring-[#C5A059]/20 shadow-xl backdrop-blur-md transition-all"
              />
              <Search className="absolute right-4 w-6 h-6 text-[#C5A059]" />
            </div>

            {/* Instant Search Suggestions Dropdown */}
            {searchQuery.trim() !== '' && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-[#1A2A40] border border-[#C5A059]/50 rounded-xl shadow-2xl overflow-hidden z-50 text-right backdrop-blur-lg">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-[#C5A059]">جاري البحث في قاعدة البيانات...</div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
                    {searchResults.map((p) => {
                      const displayName = p.fullLineageName || p.fullName;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSearchQuery('');
                            onSelectPerson(p.id);
                          }}
                          className="w-full p-3.5 flex items-center justify-between hover:bg-[#243B55] transition-colors text-right gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#243B55] border border-[#C5A059]/50 text-[#C5A059] font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-sm">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                              ) : (
                                displayName[0]?.toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm sm:text-base truncate">
                                {displayName}
                              </div>
                              <div className="text-xs text-[#C5A059] mt-0.5 truncate font-medium">
                                {[
                                  p.fatherName ? `الأب: ${p.fatherName}` : null,
                                  p.familyName ? `عائلة ${p.familyName}` : null,
                                  p.tribe ? `قبيلة ${p.tribe}` : null,
                                  p.birthDate ? `مواليد ${p.birthDate.substring(0, 4)}` : null,
                                  p.birthPlace ? p.birthPlace : null,
                                ]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </div>
                            </div>
                          </div>

                          <span className="text-xs px-2.5 py-1 rounded-md bg-[#243B55] text-gray-200 border border-[#C5A059]/30 shrink-0">
                            {p.gender === 'female' ? 'أنثى' : 'ذكر'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-300">لم يتم العثور على نتائج مطابقة</div>
                )}
              </div>
            )}
          </div>

          {/* Core Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
            <button
              onClick={() => setActiveTab('tree')}
              className="px-6 py-3.5 rounded-xl font-bold bg-[#C5A059] hover:bg-[#D4B16A] text-[#1A2A40] shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm sm:text-base active:scale-95"
            >
              <TreePine className="w-5 h-5 text-[#1A2A40]" />
              <span>استعراض شجرة العائلة</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className="px-6 py-3.5 rounded-xl font-bold bg-[#243B55] hover:bg-[#2C4A6B] text-white border border-[#C5A059]/40 shadow-md transition-all flex items-center gap-2 text-sm sm:text-base active:scale-95"
            >
              <Search className="w-5 h-5 text-[#C5A059]" />
              <span>دليل الأشخاص</span>
            </button>

            {isAdmin && (
              <button
                onClick={onOpenAddPersonModal}
                className="px-6 py-3.5 rounded-xl font-bold bg-[#C5A059] hover:bg-[#D4B16A] text-[#1A2A40] shadow-lg transition-all flex items-center gap-2 text-sm sm:text-base active:scale-95 border border-[#D4B16A]"
              >
                <UserPlus className="w-5 h-5" />
                <span>إضافة فرد جديد</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('stats')}
              className="px-5 py-3.5 rounded-xl font-semibold bg-[#243B55]/60 hover:bg-[#243B55] text-[#C5A059] border border-[#C5A059]/30 transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <BarChart3 className="w-5 h-5" />
              <span>الإحصائيات</span>
            </button>
          </div>

        </div>
      </section>

      {/* Quick Statistics Highlights Grid */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-[#C5A059]/30 rounded-xl p-5 text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
            <Users className="w-8 h-8 mx-auto text-[#C5A059] mb-2" />
            <div className="text-2xl sm:text-4xl font-extrabold text-[#1A2A40] font-amiri">{stats.totalPeople}</div>
            <div className="text-xs sm:text-sm font-bold text-gray-600">الشخصيات الموثقة</div>
          </div>

          <div className="bg-white border border-[#C5A059]/30 rounded-xl p-5 text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
            <Layers className="w-8 h-8 mx-auto text-[#C5A059] mb-2" />
            <div className="text-2xl sm:text-4xl font-extrabold text-[#1A2A40] font-amiri">{stats.totalGenerations}</div>
            <div className="text-xs sm:text-sm font-bold text-gray-600">الأجيال المتعاقبة</div>
          </div>

          <div className="bg-white border border-[#C5A059]/30 rounded-xl p-5 text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
            <BookOpen className="w-8 h-8 mx-auto text-[#C5A059] mb-2" />
            <div className="text-2xl sm:text-4xl font-extrabold text-[#1A2A40] font-amiri">{stats.totalTribes}</div>
            <div className="text-xs sm:text-sm font-bold text-gray-600">القبائل والفروع</div>
          </div>

          <div className="bg-white border border-[#C5A059]/30 rounded-xl p-5 text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
            <Award className="w-8 h-8 mx-auto text-[#C5A059] mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-[#1A2A40] truncate">{stats.largestBranch?.ancestorName || 'غير محدد'}</div>
            <div className="text-xs sm:text-sm font-bold text-gray-600">أكبر فرع عائلي ({stats.largestBranch?.descendantsCount || 0} فرد)</div>
          </div>
        </section>
      )}

      {/* Supervision & Goal Card */}
      <section className="bg-white border border-[#C5A059]/40 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-right">
          <h2 className="text-xl sm:text-2xl font-bold font-amiri text-[#1A2A40]">
            الإشراف والأرشيف التوثيقي
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">
            نظام موحد ومستدام لحفظ السجلات وتوثيق السلالات وتاريخ الأسر بأسلوب علمي ومنهجي دقيق.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-xs font-bold text-[#1A2A40]">
            <span className="px-3 py-1 bg-[#F0F4F8] rounded-md border border-[#C5A059]/30">إشراف: د. أشرف عارف</span>
            <span className="px-3 py-1 bg-[#F0F4F8] rounded-md border border-[#C5A059]/30">إشراف: د. تميم بكيّل</span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('about')}
          className="px-5 py-2.5 rounded-xl bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] text-sm font-bold shadow transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span>تفاصيل المشروع</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </section>

      {/* Recent Additions Grid */}
      {stats && stats.recentAdditions && stats.recentAdditions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#1A2A40]">أحدث الشخصيات المضافة</h3>
            <button
              onClick={() => setActiveTab('search')}
              className="text-xs sm:text-sm font-bold text-[#C5A059] hover:text-[#A8823E] flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentAdditions.map((person) => {
              const displayName = person.fullLineageName || person.fullName;
              return (
                <div
                  key={person.id}
                  onClick={() => onSelectPerson(person.id)}
                  className="p-4 rounded-xl bg-white border border-[#C5A059]/30 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#C5A059] group space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#F0F4F8] text-[#1A2A40] font-bold flex items-center justify-center text-lg shadow-inner overflow-hidden border border-[#C5A059]/40 shrink-0">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        displayName.charAt(0)
                      )}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <h4 className="font-bold text-[#1A2A40] group-hover:text-[#C5A059] transition-colors text-base truncate">
                        {displayName}
                      </h4>
                      <p className="text-xs text-gray-500 truncate font-medium">
                        {[
                          person.fatherName ? `الأب: ${person.fatherName}` : null,
                          person.familyName ? `عائلة ${person.familyName}` : person.tribe || 'عضو عائلة',
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>{person.birthDate ? `تاريخ الميلاد: ${person.birthDate}` : 'تاريخ الميلاد غير مسجل'}</span>
                    <span className="text-[#C5A059] font-bold group-hover:underline">عرض الملف ←</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
};
