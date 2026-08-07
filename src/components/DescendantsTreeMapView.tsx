import React, { useState, useEffect, useRef } from 'react';
import { FamilyTreeNode } from '../types.ts';
import { API_BASE_URL } from '../config.ts';
import {
  GitCommit,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  X,
  TreePine,
  Search,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Layers,
  Filter,
} from 'lucide-react';

interface DescendantsTreeMapViewProps {
  rootPersonId: number;
  rootPersonName?: string;
  onSelectPerson: (personId: number) => void;
  onFocusPerson?: (personId: number) => void;
}

export const DescendantsTreeMapView: React.FC<DescendantsTreeMapViewProps> = ({
  rootPersonId,
  rootPersonName,
  onSelectPerson,
  onFocusPerson,
}) => {
  const [treeData, setTreeData] = useState<FamilyTreeNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pan and Zoom states
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generation Display Limit state (0 means unlimited/all generations)
  const [maxGenerationsDisplayed, setMaxGenerationsDisplayed] = useState<number>(0);

  // Node collapse states
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const mainDescContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist: number | null }>({ x: 0, y: 0, dist: null });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [showFullscreenHeaderOverlay, setShowFullscreenHeaderOverlay] = useState<boolean>(false);
  const [fullscreenOrientation, setFullscreenOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      const el = mainDescContainerRef.current;
      if (el) {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        } else if ((el as any).msRequestFullscreen) {
          (el as any).msRequestFullscreen();
        }
      }
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    setShowFullscreenHeaderOverlay(false);
    const doc = document as any;
    if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  const toggleOrientation = async () => {
    const nextOrient = fullscreenOrientation === 'portrait' ? 'landscape' : 'portrait';
    setFullscreenOrientation(nextOrient);
    try {
      const orientObj = (window.screen as any)?.orientation;
      if (orientObj && typeof orientObj.lock === 'function') {
        await orientObj.lock(nextOrient);
      }
    } catch (err) {
      console.log('Descendants tree orientation lock API info:', err);
    }
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  useEffect(() => {
    setShowFullscreenHeaderOverlay(false);
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      const doc = document as any;
      const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
      if (!fsElement) {
        setIsFullscreen(false);
      } else if (fsElement === mainDescContainerRef.current) {
        setIsFullscreen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  useEffect(() => {
    fetchDescendants(rootPersonId);
    setZoom(0.95);
    setPan({ x: 0, y: 0 });
    setMaxGenerationsDisplayed(0);
  }, [rootPersonId]);

  const fetchDescendants = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/people/${id}/descendants`);
      if (!res.ok) throw new Error('فشل جلب شجرة الذرية لهذا الشخص');
      const data: FamilyTreeNode = await res.json();
      setTreeData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تحميل شجرة الذرية');
    } finally {
      setLoading(false);
    }
  };

  // Helper stats
  const countDescendants = (node: FamilyTreeNode): { total: number; males: number; females: number; maxGen: number } => {
    let total = 0;
    let males = 0;
    let females = 0;
    let maxGen = node.generation;

    const traverse = (n: FamilyTreeNode) => {
      if (n.id !== node.id) {
        total++;
        if (n.gender === 'female') females++;
        else males++;
      }
      if (n.generation > maxGen) maxGen = n.generation;
      if (n.children && n.children.length > 0) {
        n.children.forEach(traverse);
      }
    };

    traverse(node);
    return { total, males, females, maxGen: maxGen - node.generation + 1 };
  };

  const toggleCollapse = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mouse pan / drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan & pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
      touchStartRef.current.dist = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = newDist / touchStartRef.current.dist;
      setZoom((prev) => Math.min(Math.max(prev * factor, 0.4), 2.5));
      touchStartRef.current.dist = newDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.dist = null;
  };

  // Directional Navigation Handlers
  const moveMap = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 80;
    setPan((prev) => {
      switch (direction) {
        case 'up':
          return { ...prev, y: prev.y + step };
        case 'down':
          return { ...prev, y: prev.y - step };
        case 'left':
          return { ...prev, x: prev.x + step };
        case 'right':
          return { ...prev, x: prev.x - step };
        default:
          return prev;
      }
    });
  };

  const resetView = () => {
    setZoom(0.95);
    setPan({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-[#1A2A40]">
        <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-sm text-stone-700 font-amiri text-lg">
          جاري بناء شجرة الذرية والخريطة السلالية...
        </p>
      </div>
    );
  }

  if (error || !treeData) {
    return (
      <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
        <p className="font-bold text-red-700 text-sm">{error || 'تعذر جلب البيانات'}</p>
        <button
          onClick={() => fetchDescendants(rootPersonId)}
          className="px-4 py-2 bg-[#1A2A40] text-[#C5A059] rounded-xl text-xs font-bold shadow hover:bg-[#243B55] transition-all"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const stats = countDescendants(treeData);

  // Render recursive node with generation depth check
  const renderNode = (node: FamilyTreeNode, isRoot: boolean = false) => {
    const relativeGen = node.generation - treeData.generation; // 0 for root, 1 for children, 2 for grandchildren
    const isCollapsed = collapsedNodes.has(node.id);

    // Generation limit check: if maxGenerationsDisplayed > 0, don't show children past limit
    const isDepthExceeded = maxGenerationsDisplayed > 0 && relativeGen >= maxGenerationsDisplayed;
    const hasChildren = node.children && node.children.length > 0;
    const shouldShowChildren = hasChildren && !isCollapsed && !isDepthExceeded;

    const isMatchedSearch =
      searchQuery.trim() !== '' &&
      (node.fullLineageName || node.fullName).toLowerCase().includes(searchQuery.trim().toLowerCase());

    const firstName = (node.fullName || '').trim().split(/\s+/)[0] || node.fullName;

    return (
      <div key={node.id} className="flex flex-col items-center relative group">
        {/* Node Card */}
        <div
          className={`relative z-10 transition-all duration-200 rounded-2xl p-4 shadow-lg border flex flex-col items-center min-w-[220px] max-w-[260px] ${
            isRoot
              ? 'bg-gradient-to-b from-[#1A2A40] via-[#243B55] to-[#1A2A40] text-white border-2 border-[#C5A059] shadow-2xl scale-105'
              : isMatchedSearch
              ? 'bg-amber-100 border-2 border-amber-500 text-stone-900 ring-4 ring-amber-300'
              : 'bg-white border-[#C5A059]/40 text-stone-800 hover:border-[#C5A059] hover:shadow-xl'
          }`}
        >
          {/* Badge */}
          {isRoot ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C5A059] text-[#1A2A40] text-[10px] font-extrabold mb-2 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>جذر الذرية</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-300 text-stone-600 text-[10px] font-bold mb-2">
              <span>الجيل {node.generation}</span>
              {node.gender === 'female' ? ' • أنثى' : ' • ذكر'}
            </div>
          )}

          {/* Avatar Photo */}
          <div
            onClick={() => onSelectPerson(node.id)}
            className={`relative w-16 h-16 rounded-full overflow-hidden border-2 cursor-pointer shadow-md transition-transform hover:scale-110 flex items-center justify-center text-xl font-bold ${
              isRoot
                ? 'border-[#C5A059] bg-[#243B55] text-white'
                : 'border-[#C5A059]/60 bg-[#F7F5F2] text-[#1A2A40]'
            }`}
          >
            {node.photoUrl ? (
              <img src={node.photoUrl} alt={node.fullLineageName || node.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{firstName.charAt(0)}</span>
            )}
          </div>

          {/* Name & Dates */}
          <h4
            onClick={() => onSelectPerson(node.id)}
            className={`mt-2 font-bold font-amiri text-base text-center leading-tight cursor-pointer hover:underline ${
              isRoot ? 'text-[#C5A059]' : 'text-[#1A2A40]'
            }`}
          >
            {firstName}
          </h4>

          {/* Birth & Death Info */}
          {(node.birthDate || node.deathDate || node.isDeceased) && (
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-stone-500 font-semibold flex-wrap">
              <Calendar className="w-3 h-3 text-[#C5A059]" />
              <span>
                {node.birthDate ? node.birthDate : '---'}
                {node.isDeceased ? ` - ${node.deathDate || 'متوفى'}` : ''}
              </span>
            </div>
          )}

          {/* Children count label */}
          {hasChildren && (
            <div className="mt-2 text-[11px] font-bold text-stone-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>
                {node.children.length} من الأبناء والذرية
                {isDepthExceeded ? ' (مخفي بحسب مستوى الأجيال المحدد)' : ''}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3 pt-2 border-t border-stone-200/60 w-full flex items-center justify-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => onSelectPerson(node.id)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                isRoot
                  ? 'bg-[#C5A059] text-[#1A2A40] hover:bg-amber-400'
                  : 'bg-[#1A2A40] text-white hover:bg-[#243B55]'
              }`}
              title="عرض الملف الشخصي الكامل"
            >
              <User className="w-3 h-3" />
              <span>الملف</span>
            </button>

            {!isRoot && onFocusPerson && (
              <button
                onClick={() => onFocusPerson(node.id)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-[#1A2A40] border border-stone-300 flex items-center gap-1 transition-all"
                title="جعل هذا الشخص جذراً لشجرة ذريته الخاصة"
              >
                <GitCommit className="w-3 h-3 text-[#C5A059]" />
                <span>شجرة ذريته</span>
              </button>
            )}

            {hasChildren && (
              <button
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors"
                title={isCollapsed ? 'توسيع الفروع' : 'طَي الفروع'}
              >
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Descendants Children Branches */}
        {shouldShowChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical connector line down from parent */}
            <div className="w-0.5 h-6 bg-[#C5A059]"></div>

            {/* Horizontal line across children */}
            {node.children.length > 1 && (
              <div className="w-[calc(100%-80px)] h-0.5 bg-[#C5A059] relative"></div>
            )}

            {/* Children container */}
            <div className="flex items-start justify-center gap-6 pt-0">
              {node.children.map((childNode) => (
                <div key={childNode.id} className="flex flex-col items-center">
                  {/* Vertical line connecting horizontal bar to child node */}
                  {node.children.length > 1 && <div className="w-0.5 h-6 bg-[#C5A059]"></div>}
                  {renderNode(childNode, false)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={mainDescContainerRef}
      data-no-pull-to-refresh="true"
      className={`flex flex-col bg-[#F7F5F2] rounded-2xl border border-[#C5A059]/40 overflow-hidden shadow-inner w-full ${
        isFullscreen ? 'fixed inset-0 z-[9999] bg-[#121E2D] p-1 sm:p-3 h-screen w-screen' : ''
      }`}
    >
      {/* FULLSCREEN TOP FLOATING BAR */}
      {isFullscreen && (
        <div className="absolute top-3 left-3 z-50 flex items-center gap-2">
          {/* Exit Fullscreen Button */}
          <button
            onClick={exitFullscreen}
            title="خروج من وضع ملء الشاشة (Esc)"
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xl border border-rose-400 flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>خروج</span>
          </button>

          {/* Show/Hide Upper Tools Overlay Button */}
          <button
            onClick={() => setShowFullscreenHeaderOverlay(!showFullscreenHeaderOverlay)}
            title="إظهار/إخفاء ترويسة الشجرة والبحث"
            className="px-3 py-1.5 bg-[#1A2A40]/95 hover:bg-[#243B55] text-[#C5A059] font-bold text-xs rounded-xl shadow-xl border border-[#C5A059]/60 flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>خيارات الشجرة</span>
          </button>

          {/* Orientation Control Button (ONLY IN FULLSCREEN) */}
          <button
            onClick={toggleOrientation}
            title="تبديل اتجاه الشاشة بين العمودي والأفقي"
            className="px-3 py-1.5 bg-[#1A2A40]/95 hover:bg-[#243B55] text-[#C5A059] font-bold text-xs rounded-xl shadow-xl border border-[#C5A059]/60 flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden sm:inline">الاتجاه:</span>
            <span>{fullscreenOrientation === 'landscape' ? 'أفقي' : 'عمودي'}</span>
          </button>
        </div>
      )}

      {/* Header Toolbar & Controls:
          - Visible inline in normal mode (!isFullscreen)
          - Shown as floating overlay modal in fullscreen mode ONLY when showFullscreenHeaderOverlay is true
      */}
      {(!isFullscreen || showFullscreenHeaderOverlay) && (
        <div
          className={`shrink-0 border-b border-[#C5A059]/40 ${
            isFullscreen
              ? 'absolute top-14 left-3 right-3 z-50 max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-[#1A2A40]/98 rounded-2xl border-2 border-[#C5A059] shadow-2xl p-2'
              : ''
          }`}
        >
          {/* Header Toolbar */}
          <div className="bg-[#1A2A40] text-white p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#243B55] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
                  <GitCommit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-amiri text-[#C5A059]">
                    شجرة الذرية والخريطة السلالية
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-300">
                    خاصة بـ: <span className="font-bold text-white">{rootPersonName || treeData?.fullName}</span> (تتبع النسب والسلالة)
                  </p>
                </div>
              </div>

              {isFullscreen && (
                <button
                  onClick={() => setShowFullscreenHeaderOverlay(false)}
                  className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer md:hidden"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Stats Summary Badges & Controls */}
            <div className="flex items-center gap-2 text-xs flex-wrap justify-center">
              <span className="px-2.5 py-1 rounded-full bg-[#243B55] text-amber-200 border border-[#C5A059]/30 font-bold text-[11px]">
                إجمالي الذرية: {stats.total} فرداً
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#243B55] text-stone-200 border border-[#C5A059]/30 font-semibold text-[11px]">
                عدد الأجيال: {stats.maxGen}
              </span>

              {/* Full Screen Button */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'خروج من وضع ملء الشاشة (Esc)' : 'توسيع الشجرة بملء الشاشة'}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm active:scale-95 cursor-pointer ${
                  isFullscreen
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400'
                    : 'bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-[#C5A059] border-[#C5A059]/40'
                }`}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-white" />
                    <span>خروج من ملء الشاشة</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>ملء الشاشة</span>
                  </>
                )}
              </button>

              {isFullscreen && (
                <button
                  onClick={() => setShowFullscreenHeaderOverlay(false)}
                  className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق</span>
                </button>
              )}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-auto">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="البحث في الذرية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-[#243B55] text-white placeholder-stone-400 rounded-xl text-xs border border-[#C5A059]/30 focus:outline-none focus:border-[#C5A059] md:w-44"
              />
            </div>
          </div>

          {/* Generation Display Controls Bar */}
          <div className="bg-[#243B55] text-white px-3 py-2 border-t border-[#C5A059]/30 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#C5A059]">
              <Layers className="w-3.5 h-3.5" />
              <span>مستوى الأجيال:</span>
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setMaxGenerationsDisplayed(1)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                  maxGenerationsDisplayed === 1
                    ? 'bg-[#C5A059] text-[#1A2A40] border-[#C5A059] shadow'
                    : 'bg-[#1A2A40] text-stone-200 border-stone-600 hover:bg-[#2C4A6B]'
                }`}
              >
                الأبناء (جيل 1)
              </button>

              <button
                onClick={() => setMaxGenerationsDisplayed(2)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                  maxGenerationsDisplayed === 2
                    ? 'bg-[#C5A059] text-[#1A2A40] border-[#C5A059] shadow'
                    : 'bg-[#1A2A40] text-stone-200 border-stone-600 hover:bg-[#2C4A6B]'
                }`}
              >
                الأحفاد (جيلان)
              </button>

              <button
                onClick={() => setMaxGenerationsDisplayed(3)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                  maxGenerationsDisplayed === 3
                    ? 'bg-[#C5A059] text-[#1A2A40] border-[#C5A059] shadow'
                    : 'bg-[#1A2A40] text-stone-200 border-stone-600 hover:bg-[#2C4A6B]'
                }`}
              >
                3 أجيال
              </button>

              <button
                onClick={() => setMaxGenerationsDisplayed(0)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                  maxGenerationsDisplayed === 0
                    ? 'bg-[#C5A059] text-[#1A2A40] border-[#C5A059] shadow'
                    : 'bg-[#1A2A40] text-stone-200 border-stone-600 hover:bg-[#2C4A6B]'
                }`}
              >
                كل الذرية
              </button>
            </div>

            {/* Manual Selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-stone-300 text-[10px] font-semibold">تحديد:</label>
              <select
                value={maxGenerationsDisplayed}
                onChange={(e) => setMaxGenerationsDisplayed(Number(e.target.value))}
                className="bg-[#1A2A40] text-[#C5A059] font-bold border border-[#C5A059]/40 rounded-lg px-1.5 py-0.5 text-xs focus:outline-none focus:border-[#C5A059]"
              >
                <option value={0}>إظهار كافة الأجيال</option>
                {Array.from({ length: Math.max(stats.maxGen, 6) }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    حتى الجيل {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Drag, Touch & Zoom Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full overflow-hidden cursor-grab active:cursor-grabbing bg-stone-100 flex items-center justify-center p-8 select-none ${
          isFullscreen ? 'flex-1 h-full w-full min-h-0' : 'h-[580px]'
        }`}
      >
        {/* Compact Floating Navigation & Zoom D-Pad Control Panel */}
        {isControlsCollapsed ? (
          <button
            onClick={() => setIsControlsCollapsed(false)}
            title="إظهار لوحة التحكم بالشجرة"
            className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#1A2A40]/95 hover:bg-[#243B55] text-[#C5A059] px-2.5 py-1.5 rounded-xl shadow-xl border border-[#C5A059]/60 backdrop-blur-md text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>التحكم</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
          </button>
        ) : (
          <div className="absolute top-3 right-3 z-20 bg-[#1A2A40]/95 backdrop-blur border border-[#C5A059]/50 shadow-2xl rounded-2xl p-1.5 text-white flex flex-col items-center gap-1 transition-all duration-200 w-[102px] sm:w-[114px]">
            {/* Header with Hide Button */}
            <div className="w-full flex items-center justify-between gap-1 pb-0.5 border-b border-[#C5A059]/30 text-[10px] text-[#C5A059] font-bold">
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-[#C5A059]" />
                <span>التحكم</span>
              </span>
              <button
                onClick={() => setIsControlsCollapsed(true)}
                title="إخفاء لوحة التحكم"
                className="p-0.5 hover:bg-[#243B55] text-gray-300 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>

            {/* Directional Pad */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => moveMap('up')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-stone-200 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow"
                title="تحريك لأعلى"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => moveMap('right')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-stone-200 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow"
                  title="تحريك لليمين"
                >
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={resetView}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#C5A059] text-[#1A2A40] font-bold hover:bg-white transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow"
                  title="إعادة التعيين للوسط"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => moveMap('left')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-stone-200 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow"
                  title="تحريك لليسار"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => moveMap('down')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-stone-200 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow"
                title="تحريك لأسفل"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full h-px bg-[#C5A059]/30 my-0.5" />

            {/* Zoom Buttons Bar */}
            <div className="flex items-center gap-0.5 w-full justify-between">
              <button
                onClick={() => setZoom((prev) => Math.min(prev + 0.15, 2.5))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-white transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                title="تكبير (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] font-bold text-[#C5A059] select-none text-center min-w-[28px]">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.25))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-white transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                title="تصغير (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tree Content Render Canvas */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="inline-block p-12"
        >
          {renderNode(treeData, true)}
        </div>

        {/* Overlay Instruction Footer */}
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between pointer-events-none text-[11px] text-stone-500 bg-white/85 backdrop-blur px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm">
          <span>💡 يمكنك السحب بالأصابع للتحريك والتكبير/التصغير (Pinch to Zoom)، أو استخدام أزرار التحكم باللوحة Floating Panel.</span>
          <span className="font-bold text-[#1A2A40]">احتساب النسب بالروابط الأسرية</span>
        </div>
      </div>
    </div>
  );
};

