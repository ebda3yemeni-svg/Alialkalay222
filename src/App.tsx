import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HomePage } from './components/HomePage.tsx';
import { FamilyTreeViewer } from './components/FamilyTreeViewer.tsx';
import { SearchAndDirectory } from './components/SearchAndDirectory.tsx';
import { StatisticsView } from './components/StatisticsView.tsx';
import { AboutPage } from './components/AboutPage.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { PersonProfileModal } from './components/PersonProfileModal.tsx';
import { AddPersonModal } from './components/AddPersonModal.tsx';
import { RelationshipComparator } from './components/RelationshipComparator.tsx';
import { AIGenealogyAssistant } from './components/AIGenealogyAssistant.tsx';
import { AdminNotificationCenter } from './components/AdminNotificationCenter.tsx';
import { GlobalPullToRefresh } from './components/GlobalPullToRefresh.tsx';
import { Person } from './types.ts';
import { TreePine, UserPlus, Bot } from 'lucide-react';
import { updateSEO } from './utils/seo.ts';
import { API_BASE_URL } from './config.ts';

function AppContent() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [comparePerson1Id, setComparePerson1Id] = useState<number | null>(null);
  const [comparePerson2Id, setComparePerson2Id] = useState<number | null>(null);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState<boolean>(false);
  const [isAdminNotificationsOpen, setIsAdminNotificationsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check URL params for tab & compare IDs
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const p1Param = params.get('p1');
    const p2Param = params.get('p2');

    if (tabParam === 'compare') {
      setActiveTab('compare');
    }
    if (p1Param) setComparePerson1Id(parseInt(p1Param));
    if (p2Param) setComparePerson2Id(parseInt(p2Param));

    // Fetch all people for comparison dropdown lists
    fetch(`${API_BASE_URL}/api/people?limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllPeople(data);
      })
      .catch((err) => console.error('Error fetching people list:', err));
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedPersonId) return; // Modal manages its own SEO

    switch (activeTab) {
      case 'home':
        updateSEO({
          title: 'الرئيسية',
          description: 'الصفحة الرئيسية لموسوعة الأنساب لبني علي الكلعي - المرجع التاريخي والجينيولوجي لتوثيق السلالة والنسب الشامل.',
        });
        break;
      case 'tree':
        updateSEO({
          title: 'شجرة العائلة التفاعلية',
          description: 'تصفح شجرة العائلة التفاعلية لبني علي الكلعي مع التدرج النسبي والأجيال والأبناء.',
        });
        break;
      case 'search':
        updateSEO({
          title: 'دليل الأنساب والبحث الشامل',
          description: 'البحث الشامل في دليل عائلات وسلالات بني علي الكلعي وتصفح السجلات بالأسماء الرباعية والمواقع.',
        });
        break;
      case 'compare':
        updateSEO({
          title: 'مقارنة صلة القرابة بين شخصين',
          description: 'أداة تحليل صلة القرابة التفاعلية والبحث عن الجد المشترك بين أي شخصين في مشجرة العائلة.',
        });
        break;
      case 'aiAssistant':
        updateSEO({
          title: 'مساعد الأنساب الذكي',
          description: 'المساعد التفاعلي القائم على الذكاء الاصطناعي للإجابة عن أسئلة السلالات وعلاقات الأنساب وحساب القرابة.',
        });
        break;
      case 'stats':
        updateSEO({
          title: 'الإحصائيات الجينيوولوجية',
          description: 'إحصائيات الأنساب وتوزيع السلالات والأجيال والعائلات في موسوعة بني علي الكلعي.',
        });
        break;
      case 'about':
        updateSEO({
          title: 'عن الموسوعة والتوثيق',
          description: 'توثيق شجرة العائلة والمراجع التاريخية لموسوعة الأنساب لبني علي الكلعي.',
        });
        break;
      case 'admin':
        updateSEO({
          title: 'لوحة التحكم والإدارة',
          description: 'لوحة التحكم الخاصة بإدارة الأشخاص والسجلات والمستخدمين.',
        });
        break;
      default:
        updateSEO({});
        break;
    }
  }, [activeTab, selectedPersonId]);

  const handleOpenAddModal = (person?: Person) => {
    setEditPerson(person || null);
    setIsAddModalOpen(true);
  };

  const handleStartCompare = (personId: number) => {
    setComparePerson1Id(personId);
    setComparePerson2Id(null);
    setActiveTab('compare');
  };

  useEffect(() => {
    const handleGlobalRefresh = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('app_global_refresh', handleGlobalRefresh);
    window.addEventListener('genealogy_data_updated', handleGlobalRefresh);
    return () => {
      window.removeEventListener('app_global_refresh', handleGlobalRefresh);
      window.removeEventListener('genealogy_data_updated', handleGlobalRefresh);
    };
  }, []);

  const handleGlobalRefreshData = async () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <GlobalPullToRefresh onRefresh={handleGlobalRefreshData}>
      <div className="min-h-screen bg-[#F7F5F2] text-[#1A2A40] flex flex-col font-['Noto_Kufi_Arabic','Cairo',sans-serif] selection:bg-[#C5A059]/30">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminModal={() => setActiveTab('admin')}
        openNotifications={() => setIsAdminNotificationsOpen(true)}
      />

      {/* Main Container - Optimized for Android Mobile & Desktop */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'home' && (
          <HomePage
            setActiveTab={setActiveTab}
            onSelectPerson={(id) => setSelectedPersonId(id)}
            onOpenAddPersonModal={() => handleOpenAddModal()}
          />
        )}

        {activeTab === 'tree' && (
          <FamilyTreeViewer
            key={refreshTrigger}
            onSelectPerson={(id) => setSelectedPersonId(id)}
          />
        )}

        {activeTab === 'search' && (
          <SearchAndDirectory
            onSelectPerson={(id) => setSelectedPersonId(id)}
          />
        )}

        {activeTab === 'compare' && (
          <RelationshipComparator
            initialPerson1Id={comparePerson1Id}
            initialPerson2Id={comparePerson2Id}
            allPeople={allPeople}
            onSelectPersonProfile={(id) => setSelectedPersonId(id)}
          />
        )}

        {activeTab === 'aiAssistant' && (
          <AIGenealogyAssistant
            onSelectPerson={(id) => setSelectedPersonId(id)}
            onOpenEditPerson={(person) => handleOpenAddModal(person)}
          />
        )}

        {activeTab === 'stats' && <StatisticsView />}

        {activeTab === 'about' && <AboutPage />}

        {activeTab === 'admin' && (
          <AdminDashboard
            onOpenAddPerson={(person) => handleOpenAddModal(person)}
            onRefreshData={() => setRefreshTrigger((prev) => prev + 1)}
            onSelectPersonProfile={(id) => setSelectedPersonId(id)}
          />
        )}
      </main>

      {/* Android Floating Action Button (FAB) for Quick Add Person */}
      {isAdmin && (
        <button
          onClick={() => handleOpenAddModal()}
          title="إضافة شخص جديد"
          className="fixed bottom-20 left-5 z-40 md:hidden w-14 h-14 rounded-2xl bg-[#C5A059] text-[#1A2A40] shadow-2xl flex items-center justify-center border-2 border-white active:scale-90 transition-transform"
        >
          <UserPlus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Floating Action Button for AI Genealogy Assistant */}
      {activeTab !== 'aiAssistant' && (
        <button
          onClick={() => setIsAIAssistantModalOpen(true)}
          title="مساعد الأنساب الذكي"
          className="fixed bottom-20 md:bottom-8 right-5 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#1A2A40] to-[#243B55] text-[#C5A059] border-2 border-[#C5A059] shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all font-bold text-xs font-['Noto_Kufi_Arabic']"
        >
          <Bot className="w-5 h-5 text-[#C5A059]" />
          <span className="hidden sm:inline">مساعد الأنساب الذكي</span>
        </button>
      )}

      {/* AI Genealogy Assistant Modal View */}
      {isAIAssistantModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAIAssistantModalOpen(false);
          }}
        >
          <AIGenealogyAssistant
            isModal={true}
            onCloseModal={() => setIsAIAssistantModalOpen(false)}
            onSelectPerson={(id) => {
              setIsAIAssistantModalOpen(false);
              setSelectedPersonId(id);
            }}
            onOpenEditPerson={(person) => {
              setIsAIAssistantModalOpen(false);
              handleOpenAddModal(person);
            }}
          />
        </div>
      )}

      {/* Person Profile Modal View */}
      {selectedPersonId && (
        <PersonProfileModal
          personId={selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
          onSelectPerson={(id) => setSelectedPersonId(id)}
          onStartCompare={handleStartCompare}
          onOpenEditPerson={(person) => handleOpenAddModal(person)}
        />
      )}

      {/* Add / Edit Person Modal View */}
      {isAddModalOpen && (
        <AddPersonModal
          editPerson={editPerson}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditPerson(null);
          }}
          onSaved={() => {
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {/* Admin Notification Center Drawer Modal */}
      <AdminNotificationCenter
        isOpen={isAdminNotificationsOpen}
        onClose={() => setIsAdminNotificationsOpen(false)}
        onSelectPerson={(id) => setSelectedPersonId(id)}
      />

      {/* Footer */}
      <footer className="bg-[#1A2A40] text-gray-300 border-t border-[#C5A059]/30 py-8 mb-16 md:mb-0 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-[#C5A059] font-bold font-amiri text-xl">
            <TreePine className="w-5 h-5 text-[#C5A059]" />
            <span>موسوعة الأنساب لبني علي الكلعي</span>
          </div>

          <p className="text-gray-400">
            المنصة الاحترافية لإدارة وتوثيق السلالات والبيانات التاريخية وحفظ الأنساب عبر الأجيال
          </p>

          <div className="text-[#C5A059] font-semibold pt-2 border-t border-[#243B55] max-w-md mx-auto">
            إعداد وإشراف: د. أشرف عارف • د. تميم بكيّل
          </div>

          <div className="text-[10px] text-gray-500 pt-1">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
    </GlobalPullToRefresh>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

