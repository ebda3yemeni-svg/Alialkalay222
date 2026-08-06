import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FamilyTreeNode } from '../types.ts';
import { normalizeArabicText } from '../utils/search.ts';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Search,
  TreePine,
  Layers,
  Network,
  Clock,
  BarChart2,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Focus,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Award,
  GitCommit,
  Palette,
  Eye,
  Compass,
  Disc,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { VoiceSearchButton } from './VoiceSearchButton.tsx';
import { RelationshipNetworkView } from './RelationshipNetworkView.tsx';
import { PrintFamilyTreeModal } from './PrintFamilyTreeModal.tsx';
import { RadialFamilyTreeViewer } from './RadialFamilyTreeViewer.tsx';

interface FamilyTreeViewerProps {
  onSelectPerson: (personId: number) => void;
}

type TreeViewMode =
  | 'classic'
  | 'traditional'
  | 'horizontal'
  | 'heritage'
  | 'network'
  | 'timeline'
  | 'radial';

/**
 * Intelligent Arabic Text Normalization for High-Precision Genealogy Search
 */
const normalizeArabic = normalizeArabicText;

/**
 * Soft Professional Branch Color Palettes for Tree Visualization
 */
const BRANCH_PALETTES = [
  {
    name: 'emerald',
    border: 'border-emerald-500',
    bg: 'bg-emerald-50/90 hover:bg-emerald-100',
    text: 'text-emerald-900',
    line: '#10B981',
    badge: 'bg-emerald-600 text-white',
    ring: 'ring-emerald-400',
  },
  {
    name: 'sapphire',
    border: 'border-blue-500',
    bg: 'bg-blue-50/90 hover:bg-blue-100',
    text: 'text-blue-900',
    line: '#3B82F6',
    badge: 'bg-blue-600 text-white',
    ring: 'ring-blue-400',
  },
  {
    name: 'amber',
    border: 'border-amber-500',
    bg: 'bg-amber-50/90 hover:bg-amber-100',
    text: 'text-amber-900',
    line: '#F59E0B',
    badge: 'bg-amber-600 text-white',
    ring: 'ring-amber-400',
  },
  {
    name: 'rose',
    border: 'border-rose-500',
    bg: 'bg-rose-50/90 hover:bg-rose-100',
    text: 'text-rose-900',
    line: '#F43F5E',
    badge: 'bg-rose-600 text-white',
    ring: 'ring-rose-400',
  },
  {
    name: 'purple',
    border: 'border-purple-500',
    bg: 'bg-purple-50/90 hover:bg-purple-100',
    text: 'text-purple-900',
    line: '#8B5CF6',
    badge: 'bg-purple-600 text-white',
    ring: 'ring-purple-400',
  },
  {
    name: 'teal',
    border: 'border-teal-500',
    bg: 'bg-teal-50/90 hover:bg-teal-100',
    text: 'text-teal-900',
    line: '#14B8A6',
    badge: 'bg-teal-600 text-white',
    ring: 'ring-teal-400',
  },
  {
    name: 'indigo',
    border: 'border-indigo-500',
    bg: 'bg-indigo-50/90 hover:bg-indigo-100',
    text: 'text-indigo-900',
    line: '#6366F1',
    badge: 'bg-indigo-600 text-white',
    ring: 'ring-indigo-400',
  },
];

export const FamilyTreeViewer: React.FC<FamilyTreeViewerProps> = ({
  onSelectPerson,
}) => {
  const [treeData, setTreeData] = useState<FamilyTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setModeState] = useState<TreeViewMode>(() => {
    try {
      const saved = localStorage.getItem('family_tree_visualization_mode');
      if (
        saved === 'radial' ||
        saved === 'classic' ||
        saved === 'traditional' ||
        saved === 'horizontal' ||
        saved === 'heritage' ||
        saved === 'network' ||
        saved === 'timeline'
      ) {
        return saved as TreeViewMode;
      }
    } catch {
      // ignore storage errors
    }
    return 'radial';
  });

  const setMode = (newMode: TreeViewMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('family_tree_visualization_mode', newMode);
    } catch {
      // ignore storage errors
    }
  };

  // Pan and Zoom states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch Pinch state
  const touchStartDist = useRef<number | null>(null);

  // Search & Navigation inside open tree
  const [filterSearch, setFilterSearch] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Features state
  const [useBranchColors, setUseBranchColors] = useState(false);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);

  // Radial Circular Tree state
  const [radialCenterId, setRadialCenterId] = useState<number | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [showFullscreenHeaderOverlay, setShowFullscreenHeaderOverlay] = useState(false);
  const [fullscreenOrientation, setFullscreenOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Compute Ancestors, Descendants and Focused sets for Focus Mode
  const { focusedIds, ancestorIds, descendantIds, focusPersonNode } = useMemo(() => {
    if (!focusPersonId) {
      return {
        focusedIds: new Set<number>(),
        ancestorIds: new Set<number>(),
        descendantIds: new Set<number>(),
        focusPersonNode: null as FamilyTreeNode | null,
      };
    }

    const parentMap = new Map<number, number>();
    const childrenMap = new Map<number, number[]>();
    let targetNode: FamilyTreeNode | null = null;

    const traverse = (nodes: FamilyTreeNode[]) => {
      for (const node of nodes) {
        if (node.id === focusPersonId) targetNode = node;
        if (!childrenMap.has(node.id)) childrenMap.set(node.id, []);
        if (node.children) {
          for (const child of node.children) {
            parentMap.set(child.id, node.id);
            childrenMap.get(node.id)!.push(child.id);
            traverse([child]);
          }
        }
      }
    };
    traverse(treeData);

    const ancestors = new Set<number>();
    let curr = parentMap.get(focusPersonId);
    while (curr !== undefined) {
      ancestors.add(curr);
      curr = parentMap.get(curr);
    }

    const descendants = new Set<number>();
    const collectDescendants = (id: number) => {
      const children = childrenMap.get(id) || [];
      for (const c of children) {
        descendants.add(c);
        collectDescendants(c);
      }
    };
    collectDescendants(focusPersonId);

    const focused = new Set<number>([focusPersonId, ...ancestors, ...descendants]);

    return {
      focusedIds: focused,
      ancestorIds: ancestors,
      descendantIds: descendants,
      focusPersonNode: targetNode,
    };
  }, [focusPersonId, treeData]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      const el = mainContainerRef.current;
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
      console.log('Orientation lock API info:', err);
    }
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  useEffect(() => {
    setShowFullscreenHeaderOverlay(false);
    // Recalculate tree canvas viewport when entering or leaving fullscreen
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
      } else if (fsElement === mainContainerRef.current) {
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
    fetchTree();

    const handleDataUpdate = () => {
      fetchTree();
    };

    window.addEventListener('genealogy_data_updated', handleDataUpdate);
    window.addEventListener('app_global_refresh', handleDataUpdate);
    return () => {
      window.removeEventListener('genealogy_data_updated', handleDataUpdate);
      window.removeEventListener('app_global_refresh', handleDataUpdate);
    };
  }, []);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tree');
      if (!res.ok) throw new Error('فشل تحميل شجرة العائلة من الخادم');
      const data = await res.json();
      setTreeData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطأ أثناء جلب بيانات الشجرة');
    } finally {
      setLoading(false);
    }
  };

  // Flatten tree nodes for fast search indexing & mini map
  const allNodes = useMemo(() => {
    const list: FamilyTreeNode[] = [];
    const traverse = (n: FamilyTreeNode) => {
      list.push(n);
      if (n.children && n.children.length > 0) {
        n.children.forEach(traverse);
      }
    };
    treeData.forEach(traverse);
    return list;
  }, [treeData]);

  // Search inside open tree with normalized Arabic logic
  const matchedNodes = useMemo(() => {
    if (!filterSearch.trim()) return [];
    const queryNorm = normalizeArabic(filterSearch);
    return allNodes.filter((n) => {
      const nameNorm = normalizeArabic(n.fullLineageName || n.fullName);
      const tribeNorm = normalizeArabic(n.tribe || '');
      return nameNorm.includes(queryNorm) || tribeNorm.includes(queryNorm);
    });
  }, [allNodes, filterSearch]);

  // Center view on target matched person
  const centerOnPerson = (personId: number) => {
    const el = document.getElementById(`tree-node-${personId}`);
    if (el && containerRef.current && canvasRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const nodeRect = el.getBoundingClientRect();

      const nodeCenterX = nodeRect.left + nodeRect.width / 2;
      const nodeCenterY = nodeRect.top + nodeRect.height / 2;
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;

      const deltaX = containerCenterX - nodeCenterX;
      const deltaY = containerCenterY - nodeCenterY;

      setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    }
  };

  // Reset match index when query changes
  useEffect(() => {
    setCurrentMatchIndex(0);
    if (matchedNodes.length > 0) {
      setTimeout(() => centerOnPerson(matchedNodes[0].id), 50);
    }
  }, [filterSearch]);

  const goToNextMatch = () => {
    if (matchedNodes.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchedNodes.length;
    setCurrentMatchIndex(nextIdx);
    centerOnPerson(matchedNodes[nextIdx].id);
  };

  const goToPrevMatch = () => {
    if (matchedNodes.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchedNodes.length) % matchedNodes.length;
    setCurrentMatchIndex(prevIdx);
    centerOnPerson(matchedNodes[prevIdx].id);
  };

  // Mouse Drag / Pan handlers
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 3.5));
  };

  // Touch handlers for Mobile Pan and Pinch-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    } else if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      setZoom((prev) => Math.min(Math.max(prev * factor, 0.25), 3.5));
      touchStartDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  // Directional Pan Controls
  const panBy = (dx: number, dy: number) => {
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export handlers
  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2.5,
        backgroundColor: '#FCF9F2',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `tree_bni_ali_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export PNG error:', err);
      alert('حدث خطأ أثناء تصدير الصورة');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPEG = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2.5,
        backgroundColor: '#FCF9F2',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `tree_bni_ali_${new Date().toISOString().slice(0, 10)}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Export JPEG error:', err);
      alert('حدث خطأ أثناء تصدير الصورة');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2.5,
        backgroundColor: '#FCF9F2',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const isLandscape = canvas.width > canvas.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a3',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`genealogy_tree_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('حدث خطأ أثناء تصدير PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = () => {
    try {
      setShowExportMenu(false);
      if (treeData.length === 0) return;

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" width="1600" height="1200" style="background:#FCF9F2; font-family: sans-serif;">`;
      svgContent += `<style>
        .title { font-size: 28px; font-weight: bold; fill: #1A2A40; text-anchor: middle; }
        .subtitle { font-size: 16px; fill: #C5A059; text-anchor: middle; }
        .node-box { fill: #ffffff; stroke: #C5A059; stroke-width: 2; rx: 12; }
        .node-name { font-size: 14px; font-weight: bold; fill: #1A2A40; text-anchor: middle; }
        .line { stroke: #C5A059; stroke-width: 2.5; }
      </style>`;
      svgContent += `<text x="800" y="50" class="title">موسوعة الأنساب لبني علي الكلعي</text>`;
      svgContent += `<text x="800" y="80" class="subtitle">الشجرة العائلية والتوثيق المعتمد</text>`;

      const renderSvgNodes = (
        nodes: FamilyTreeNode[],
        startX: number,
        startY: number,
        levelWidth: number
      ) => {
        const count = nodes.length;
        const step = levelWidth / (count + 1);
        nodes.forEach((node, idx) => {
          const x = startX - levelWidth / 2 + step * (idx + 1);
          const y = startY;

          svgContent += `<rect x="${x - 80}" y="${y}" width="160" height="50" class="node-box" />`;
          svgContent += `<text x="${x}" y="${y + 30}" class="node-name">${node.fullName}</text>`;

          if (node.children && node.children.length > 0) {
            const nextY = y + 100;
            svgContent += `<line x1="${x}" y1="${y + 50}" x2="${x}" y2="${nextY - 20}" class="line" />`;
            renderSvgNodes(node.children, x, nextY, levelWidth / Math.max(count, 1.5));
          }
        });
      };

      renderSvgNodes(treeData, 800, 150, 1200);
      svgContent += `</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `genealogy_tree_${new Date().toISOString().slice(0, 10)}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export SVG error:', err);
      alert('حدث خطأ أثناء تصدير SVG');
    }
  };

  const getFirstName = (fullName?: string) => {
    if (!fullName) return '';
    const clean = fullName.trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      const prefix = parts[0];
      const second = parts[1];
      if (/^(عبد|ابو|أبو|ام|أم|زين|صلاح|عز|نور|محيي|سيف|تاج|شمس|بدر)$/i.test(prefix)) {
        if (parts.length >= 3 && /^(الدين|الإسلام|الله|الحق|العالمين)$/i.test(parts[2])) {
          return `${prefix} ${second} ${parts[2]}`;
        }
        return `${prefix} ${second}`;
      }
    }
    return parts[0];
  };

  // Helper for active node search matching
  const checkIsMatched = (node: FamilyTreeNode) => {
    if (!filterSearch.trim()) return false;
    const queryNorm = normalizeArabic(filterSearch);
    const nameNorm = normalizeArabic(node.fullLineageName || node.fullName);
    const tribeNorm = normalizeArabic(node.tribe || '');
    return nameNorm.includes(queryNorm) || tribeNorm.includes(queryNorm);
  };

  const checkIsActiveMatch = (node: FamilyTreeNode) => {
    if (matchedNodes.length === 0) return false;
    return matchedNodes[currentMatchIndex]?.id === node.id;
  };

  // RENDER MODES

  // 1. Classic Natural Genealogy Tree
  const renderClassicTreeNode = (
    node: FamilyTreeNode,
    level = 0,
    branchColorIndex = 0
  ) => {
    const displayName = node.fullLineageName || node.fullName;
    const firstName = getFirstName(node.fullName);
    const isMatched = checkIsMatched(node);
    const isActiveMatch = checkIsActiveMatch(node);
    const isRoot = level === 0;

    const palette = BRANCH_PALETTES[branchColorIndex % BRANCH_PALETTES.length];

    let cardStyle =
      'bg-gradient-to-b from-amber-50 to-amber-100/80 border-[#C5A059]/60 text-[#1A2A40] hover:border-[#C5A059]';
    if (useBranchColors && !isRoot) {
      cardStyle = `${palette.bg} ${palette.border} ${palette.text}`;
    } else if (node.gender === 'female') {
      cardStyle =
        'bg-gradient-to-b from-rose-50 to-pink-100 border-rose-300 text-rose-950 hover:border-rose-500';
    }

    if (isRoot) {
      cardStyle =
        'bg-gradient-to-b from-[#1A2A40] to-[#243B55] text-white border-[#C5A059] ring-2 ring-[#C5A059]/40';
    }

    if (isActiveMatch) {
      cardStyle =
        'bg-[#C5A059] border-[#1A2A40] text-[#1A2A40] ring-4 ring-amber-400 font-black shadow-2xl animate-pulse scale-105';
    } else if (isMatched) {
      cardStyle =
        'bg-[#C5A059]/90 border-[#1A2A40] text-[#1A2A40] ring-2 ring-[#C5A059] font-bold shadow-lg';
    }

    const lineColor = useBranchColors ? palette.line : '#C5A059';

    return (
      <div
        id={`tree-node-${node.id}`}
        key={node.id}
        className="flex flex-col items-center relative group"
      >
        {/* Person Emblem Card */}
        <div
          onClick={() => onSelectPerson(node.id)}
          className={`relative z-10 px-4 py-3 rounded-2xl min-w-[180px] max-w-[240px] text-center cursor-pointer transition-all transform hover:scale-105 shadow-lg border-2 ${cardStyle}`}
        >
          {/* Decorative Branch Leaf Tag */}
          <div
            className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow flex items-center gap-1 border border-white ${
              useBranchColors && !isRoot ? palette.badge : 'bg-[#C5A059] text-[#1A2A40]'
            }`}
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>{isRoot ? 'أصل النسب' : `الجيل ${node.generation}`}</span>
          </div>

          <div className="w-13 h-13 mx-auto mt-1.5 rounded-full bg-white border-2 border-[#C5A059] overflow-hidden shadow-inner flex items-center justify-center font-bold text-[#1A2A40]">
            {node.photoUrl ? (
              <img src={node.photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-amiri text-lg font-bold text-[#1A2A40]">
                {firstName.charAt(0)}
              </span>
            )}
          </div>

          <div
            className={`font-bold text-sm sm:text-base leading-tight mt-1.5 font-amiri ${
              isRoot ? 'text-[#C5A059]' : 'text-[#1A2A40]'
            }`}
          >
            {firstName}
          </div>

          <div className="text-[11px] opacity-80 font-medium mt-1">
            {node.birthDate ? `مواليد ${node.birthDate}` : ''}
            {node.isDeceased ? ' (رحمه الله)' : ''}
          </div>

          {node.occupation && (
            <div className="text-[10px] text-[#C5A059] font-semibold mt-0.5">
              {node.occupation}
            </div>
          )}
        </div>

        {/* Children Branch Lines */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div
              style={{ backgroundColor: lineColor }}
              className="w-1.5 h-8 shadow-sm rounded-full"
            />
            <div
              style={{ borderColor: lineColor }}
              className="flex items-start justify-center gap-8 pt-2 border-t-4 rounded-t-lg relative"
            >
              {node.children.map((child, idx) => (
                <div key={child.id} className="relative pt-4">
                  <div
                    style={{ backgroundColor: lineColor }}
                    className="absolute top-0 right-1/2 left-1/2 w-1 h-4 -translate-x-1/2"
                  />
                  {renderClassicTreeNode(
                    child,
                    level + 1,
                    isRoot ? idx % BRANCH_PALETTES.length : branchColorIndex
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 2. Traditional Vertical Tree
  const renderTraditionalTree = (
    node: FamilyTreeNode,
    level = 0,
    branchColorIndex = 0
  ) => {
    const displayName = node.fullLineageName || node.fullName;
    const firstName = getFirstName(node.fullName);
    const isMatched = checkIsMatched(node);
    const isActiveMatch = checkIsActiveMatch(node);
    const isRoot = level === 0;

    const palette = BRANCH_PALETTES[branchColorIndex % BRANCH_PALETTES.length];

    let cardStyle =
      node.gender === 'female'
        ? 'bg-rose-50 border-rose-300 text-rose-950 hover:border-rose-500'
        : 'bg-white border-[#C5A059]/40 text-[#1A2A40] hover:border-[#C5A059]';

    if (useBranchColors && !isRoot) {
      cardStyle = `${palette.bg} ${palette.border} ${palette.text}`;
    }

    if (isActiveMatch) {
      cardStyle =
        'bg-[#C5A059] border-[#1A2A40] ring-4 ring-amber-400 text-[#1A2A40] scale-105 font-bold shadow-2xl animate-pulse';
    } else if (isMatched) {
      cardStyle =
        'bg-[#C5A059]/90 border-[#1A2A40] ring-2 ring-[#C5A059] text-[#1A2A40] scale-105 font-bold';
    }

    const lineColor = useBranchColors ? palette.line : '#C5A059';

    return (
      <div id={`tree-node-${node.id}`} key={node.id} className="flex flex-col items-center">
        <div
          onClick={() => onSelectPerson(node.id)}
          className={`relative p-3.5 rounded-xl min-w-[170px] max-w-[220px] text-center cursor-pointer transition-all border shadow-md hover:shadow-xl hover:-translate-y-1 ${cardStyle}`}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-[#F0F4F8] border-2 border-[#C5A059] overflow-hidden shadow-inner flex items-center justify-center font-bold text-[#1A2A40] mb-2">
            {node.photoUrl ? (
              <img src={node.photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              firstName.charAt(0)
            )}
          </div>

          <div className="font-bold text-sm leading-tight text-[#1A2A40] font-amiri">
            {firstName}
          </div>

          <div className="text-[11px] text-gray-600 font-semibold mt-1">
            {node.birthDate ? `مواليد ${node.birthDate}` : ''}
            {node.isDeceased ? ' (متوفى)' : ''}
          </div>

          <div className="text-[10px] text-[#C5A059] font-bold mt-0.5">
            الجيل: {node.generation}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div style={{ backgroundColor: lineColor }} className="w-0.5 h-6" />
            <div
              style={{ borderColor: lineColor }}
              className="flex items-start justify-center gap-6 pt-1 border-t-2 relative"
            >
              {node.children.map((child, idx) => (
                <div key={child.id} className="relative pt-4">
                  <div
                    style={{ backgroundColor: lineColor }}
                    className="absolute top-0 right-1/2 left-1/2 w-0.5 h-4 -translate-x-1/2"
                  />
                  {renderTraditionalTree(
                    child,
                    level + 1,
                    isRoot ? idx % BRANCH_PALETTES.length : branchColorIndex
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. Horizontal Tree
  const renderHorizontalTree = (
    node: FamilyTreeNode,
    level = 0,
    branchColorIndex = 0
  ) => {
    const displayName = node.fullLineageName || node.fullName;
    const firstName = getFirstName(node.fullName);
    const isMatched = checkIsMatched(node);
    const isActiveMatch = checkIsActiveMatch(node);
    const isRoot = level === 0;

    const palette = BRANCH_PALETTES[branchColorIndex % BRANCH_PALETTES.length];

    let cardStyle =
      'bg-white border-[#C5A059]/60 hover:border-[#C5A059] shadow hover:shadow-md';
    if (useBranchColors && !isRoot) {
      cardStyle = `${palette.bg} ${palette.border}`;
    }

    if (isActiveMatch) {
      cardStyle = 'bg-[#C5A059] border-[#1A2A40] ring-4 ring-amber-400 font-bold shadow-xl';
    } else if (isMatched) {
      cardStyle = 'bg-[#C5A059]/90 border-[#1A2A40] ring-2 ring-[#C5A059] font-bold';
    }

    return (
      <div key={node.id} className="flex items-center gap-6 my-3">
        <div
          id={`tree-node-${node.id}`}
          onClick={() => onSelectPerson(node.id)}
          className={`p-3.5 rounded-xl border cursor-pointer min-w-[200px] text-right flex items-center gap-3 transition-all ${cardStyle}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#1A2A40] text-[#C5A059] flex items-center justify-center font-bold text-sm shrink-0">
            {node.photoUrl ? (
              <img
                src={node.photoUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              firstName.charAt(0)
            )}
          </div>
          <div>
            <div className="font-bold text-[#1A2A40] text-sm font-amiri">{firstName}</div>
            <div className="text-xs text-gray-500">
              {node.birthDate ? `مواليد ${node.birthDate}` : 'غير مدون'}
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col border-r-2 border-[#C5A059] pr-6 gap-2">
            {node.children.map((child, idx) =>
              renderHorizontalTree(
                child,
                level + 1,
                isRoot ? idx % BRANCH_PALETTES.length : branchColorIndex
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // 4. Heritage Tree
  const renderHeritageTree = (
    node: FamilyTreeNode,
    level = 0,
    branchColorIndex = 0
  ) => {
    const displayName = node.fullLineageName || node.fullName;
    const firstName = getFirstName(node.fullName);
    const isMatched = checkIsMatched(node);
    const isActiveMatch = checkIsActiveMatch(node);
    const isRoot = level === 0;

    const palette = BRANCH_PALETTES[branchColorIndex % BRANCH_PALETTES.length];

    let cardStyle =
      node.gender === 'female'
        ? 'bg-amber-50/90 border-amber-300 text-stone-950 hover:border-amber-500'
        : 'bg-[#FCF9F2] border-[#C5A059] text-[#1A2A40] hover:border-[#1A2A40]';

    if (useBranchColors && !isRoot) {
      cardStyle = `${palette.bg} ${palette.border} ${palette.text}`;
    }

    if (isRoot) {
      cardStyle =
        'bg-gradient-to-b from-[#1A2A40] via-[#243B55] to-[#1A2A40] text-[#C5A059] border-[#C5A059] ring-2 ring-[#C5A059]/40';
    }

    if (isActiveMatch) {
      cardStyle =
        'bg-[#C5A059] border-[#1A2A40] text-[#1A2A40] ring-4 ring-amber-400 scale-105 shadow-2xl animate-pulse';
    } else if (isMatched) {
      cardStyle = 'bg-[#C5A059] border-[#1A2A40] text-[#1A2A40] ring-2 ring-[#C5A059]';
    }

    const lineColor = useBranchColors ? palette.line : '#C5A059';

    return (
      <div
        id={`tree-node-${node.id}`}
        key={node.id}
        className="flex flex-col items-center relative my-2"
      >
        <div
          onClick={() => onSelectPerson(node.id)}
          className={`relative z-10 p-5 rounded-3xl min-w-[210px] max-w-[260px] text-center cursor-pointer transition-all transform hover:scale-105 shadow-2xl border-4 ${cardStyle}`}
        >
          <div
            className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black shadow-md border-2 border-[#1A2A40] whitespace-nowrap ${
              useBranchColors && !isRoot ? palette.badge : 'bg-[#C5A059] text-[#1A2A40]'
            }`}
          >
            📜 {isRoot ? 'العميد والمؤسس' : `سليل الجيل ${node.generation}`}
          </div>

          <div className="w-16 h-16 mx-auto mt-1 rounded-full bg-white border-2 border-[#C5A059] overflow-hidden shadow-md flex items-center justify-center font-bold text-[#1A2A40] text-xl">
            {node.photoUrl ? (
              <img src={node.photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              firstName.charAt(0)
            )}
          </div>

          <div
            className={`font-black text-base leading-snug mt-2 font-amiri ${
              isRoot ? 'text-[#C5A059]' : 'text-[#1A2A40]'
            }`}
          >
            {firstName}
          </div>

          <div className="text-[11px] font-bold opacity-80 mt-1 text-[#C5A059]">
            {node.birthDate ? `تاريخ الميلاد: ${node.birthDate}` : ''}
            {node.isDeceased ? ' (رحمه الله)' : ''}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div style={{ backgroundColor: lineColor }} className="w-1.5 h-8" />
            <div
              style={{ borderColor: lineColor }}
              className="flex items-start justify-center gap-8 pt-2 border-t-4 rounded-t-xl relative"
            >
              {node.children.map((child, idx) => (
                <div key={child.id} className="relative pt-4">
                  <div
                    style={{ backgroundColor: lineColor }}
                    className="absolute top-0 right-1/2 left-1/2 w-1 h-4 -translate-x-1/2"
                  />
                  {renderHeritageTree(
                    child,
                    level + 1,
                    isRoot ? idx % BRANCH_PALETTES.length : branchColorIndex
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5. Network Tree
  const renderNetworkTree = (
    node: FamilyTreeNode,
    level = 0,
    branchColorIndex = 0
  ) => {
    const displayName = node.fullLineageName || node.fullName;
    const firstName = getFirstName(node.fullName);
    const isMatched = checkIsMatched(node);
    const isActiveMatch = checkIsActiveMatch(node);
    const isRoot = level === 0;

    const palette = BRANCH_PALETTES[branchColorIndex % BRANCH_PALETTES.length];

    let cardStyle =
      'bg-white border-[#243B55] text-[#1A2A40] hover:border-[#C5A059]';
    if (useBranchColors && !isRoot) {
      cardStyle = `${palette.bg} ${palette.border} ${palette.text}`;
    }

    if (isActiveMatch) {
      cardStyle = 'bg-[#C5A059] border-[#1A2A40] ring-4 ring-amber-400 text-[#1A2A40] animate-pulse';
    } else if (isMatched) {
      cardStyle = 'bg-[#C5A059] border-[#1A2A40] text-[#1A2A40]';
    }

    const lineColor = useBranchColors ? palette.line : '#243B55';

    return (
      <div
        id={`tree-node-${node.id}`}
        key={node.id}
        className="flex flex-col items-center relative my-2"
      >
        <div
          onClick={() => onSelectPerson(node.id)}
          className={`relative z-10 px-4 py-2.5 rounded-2xl min-w-[190px] max-w-[230px] flex items-center gap-3 cursor-pointer transition-all border-2 shadow-md hover:shadow-xl hover:scale-105 ${cardStyle}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#1A2A40] text-[#C5A059] font-bold flex items-center justify-center text-sm shrink-0 border border-[#C5A059]">
            {node.photoUrl ? (
              <img
                src={node.photoUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              firstName.charAt(0)
            )}
          </div>
          <div className="overflow-hidden text-right">
            <div className="font-bold text-xs font-amiri text-[#1A2A40] leading-snug truncate">
              {firstName}
            </div>
            <div className="text-[10px] text-[#C5A059] font-bold">
              عقدة الجيل {node.generation}
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div style={{ backgroundColor: lineColor }} className="w-0.5 h-6" />
            <div
              style={{ borderColor: lineColor }}
              className="flex items-start justify-center gap-6 pt-1 border-t-2 relative"
            >
              {node.children.map((c, idx) => (
                <div key={c.id} className="relative pt-3">
                  <div
                    style={{ backgroundColor: lineColor }}
                    className="absolute top-0 right-1/2 left-1/2 w-0.5 h-3 -translate-x-1/2"
                  />
                  {renderNetworkTree(
                    c,
                    level + 1,
                    isRoot ? idx % BRANCH_PALETTES.length : branchColorIndex
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 6. Timeline View
  const renderTimelineTree = () => {
    const flattenNodes = (nodes: FamilyTreeNode[]): FamilyTreeNode[] => {
      let list: FamilyTreeNode[] = [];
      nodes.forEach((n) => {
        list.push(n);
        if (n.children) list = list.concat(flattenNodes(n.children));
      });
      return list;
    };

    const all = flattenNodes(treeData);
    const generationsMap: Record<number, FamilyTreeNode[]> = {};
    all.forEach((n) => {
      const g = n.generation || 1;
      if (!generationsMap[g]) generationsMap[g] = [];
      generationsMap[g].push(n);
    });

    const genKeys = Object.keys(generationsMap)
      .map(Number)
      .sort((a, b) => a - b);

    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        {genKeys.map((g) => (
          <div key={g} className="relative pr-8 border-r-4 border-[#C5A059] space-y-3">
            <div className="absolute -right-3 top-0 w-5 h-5 rounded-full bg-[#1A2A40] border-2 border-[#C5A059]" />
            <div className="text-lg font-bold font-amiri text-[#C5A059] bg-[#1A2A40] text-white px-4 py-1.5 rounded-xl inline-block shadow">
              الجيل {g} (طبقة {g})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {generationsMap[g].map((p) => {
                const isActiveMatch = checkIsActiveMatch(p);
                const isMatched = checkIsMatched(p);

                return (
                  <div
                    id={`tree-node-${p.id}`}
                    key={p.id}
                    onClick={() => onSelectPerson(p.id)}
                    className={`p-3 rounded-xl border bg-white shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-3 ${
                      isActiveMatch
                        ? 'border-[#C5A059] ring-4 ring-amber-400 bg-amber-50 font-bold'
                        : isMatched
                        ? 'border-[#C5A059] bg-amber-50/60'
                        : 'border-amber-200/80 hover:border-[#C5A059]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1A2A40] text-[#C5A059] font-bold flex items-center justify-center text-sm shrink-0">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        p.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#1A2A40] font-amiri">
                        {p.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.birthDate ? `مواليد ${p.birthDate}` : 'تاريخ غير مدون'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 7. Radial Circular Family Tree
  const renderRadialTree = () => {
    return (
      <RadialFamilyTreeViewer
        treeData={treeData}
        onSelectPerson={onSelectPerson}
        focusPersonId={focusPersonId}
        radialMode="descendants"
        centerPersonId={radialCenterId || focusPersonId}
        filterQuery={filterSearch}
        onSetCenterPerson={(id) => setRadialCenterId(id)}
      />
    );
  };

  return (
    <div
      ref={mainContainerRef}
      className={`space-y-4 ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-[#121E2D] p-1 sm:p-3 flex flex-col h-screen w-screen overflow-hidden'
          : ''
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
            title="إظهار/إخفاء أزرار وأنماط الشجرة والبحث"
            className="px-3 py-1.5 bg-[#1A2A40]/95 hover:bg-[#243B55] text-[#C5A059] font-bold text-xs rounded-xl shadow-xl border border-[#C5A059]/60 flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>أدوات الشجرة</span>
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

      {/* Control Header & Mode Switcher:
          - Always visible in normal mode (!isFullscreen)
          - Shown as floating overlay modal in fullscreen mode ONLY when showFullscreenHeaderOverlay is true
      */}
      {(!isFullscreen || showFullscreenHeaderOverlay) && (
        <div
          className={`bg-[#1A2A40] text-white p-3 sm:p-5 rounded-2xl shadow-2xl space-y-3.5 border border-[#C5A059]/50 shrink-0 ${
            isFullscreen
              ? 'absolute top-14 left-3 right-3 z-50 max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-[#1A2A40]/98 border-2 border-[#C5A059]'
              : ''
          }`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-3 border-b border-[#C5A059]/30">
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#243B55] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
                  <TreePine className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold font-amiri text-[#C5A059] leading-tight">
                    استعراض وملاحة الشجرة العائلية لبني علي الكلعي
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-300">
                    استعراض السلسلة الذهبية للأنساب بمختلف الأنماط والتوجيه البصري الفائق
                  </p>
                </div>
              </div>

              {isFullscreen && (
                <button
                  onClick={() => setShowFullscreenHeaderOverlay(false)}
                  className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer lg:hidden"
                  title="إغلاق القائمة"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Full Screen Mode Toggle Button */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'خروج من وضع ملء الشاشة (Esc)' : 'توسيع الشجرة بملء الشاشة الشامل'}
                className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-md active:scale-95 cursor-pointer ${
                  isFullscreen
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400'
                    : 'bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-[#C5A059] border-[#C5A059]/50'
                }`}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-white" />
                    <span>خروج من ملء الشاشة</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-[#C5A059]" />
                    <span>ملء الشاشة</span>
                  </>
                )}
              </button>

              {/* Toggle Branch Color Highlighting */}
              <button
                onClick={() => setUseBranchColors(!useBranchColors)}
                title="تفعيل/إلغاء تلوين الأفرع العائلية"
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                  useBranchColors
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400'
                    : 'bg-[#243B55] text-gray-300 hover:text-[#C5A059] border-[#C5A059]/30'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>{useBranchColors ? 'تلوين الفروع: مفعل' : 'تلوين الفروع'}</span>
              </button>

              {/* Print Tree Dedicated Button */}
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-1.5 sm:py-2 bg-[#C5A059] hover:bg-[#D4B16A] text-[#1A2A40] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>طباعة الشجرة</span>
              </button>

              {/* Export Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="px-3.5 py-1.5 sm:py-2 bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-[#C5A059]/40 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'جاري التصدير...' : 'تصدير'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showExportMenu && (
                  <div className="absolute left-0 mt-2 w-52 bg-[#1A2A40] border-2 border-[#C5A059] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
                    <button
                      onClick={handleExportPNG}
                      className="w-full text-right px-4 py-3 hover:bg-[#243B55] text-gray-200 flex items-center gap-2.5 border-b border-gray-700/50"
                    >
                      <FileImage className="w-4 h-4 text-emerald-400" />
                      <span>تصدير صورة PNG عالية الدقة</span>
                    </button>
                    <button
                      onClick={handleExportJPEG}
                      className="w-full text-right px-4 py-3 hover:bg-[#243B55] text-gray-200 flex items-center gap-2.5 border-b border-gray-700/50"
                    >
                      <FileImage className="w-4 h-4 text-blue-400" />
                      <span>تصدير صورة JPG عالية الجودة</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full text-right px-4 py-3 hover:bg-[#243B55] text-gray-200 flex items-center gap-2.5 border-b border-gray-700/50"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-red-400" />
                      <span>تصدير مستند PDF جاهز للطباعة</span>
                    </button>
                    <button
                      onClick={handleExportSVG}
                      className="w-full text-right px-4 py-3 hover:bg-[#243B55] text-gray-200 flex items-center gap-2.5"
                    >
                      <FileCode className="w-4 h-4 text-amber-400" />
                      <span>تصدير ملف SVG متجهات رسم</span>
                    </button>
                  </div>
                )}
              </div>

              {isFullscreen && (
                <button
                  onClick={() => setShowFullscreenHeaderOverlay(false)}
                  className="hidden lg:flex items-center gap-1 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق</span>
                </button>
              )}
            </div>
          </div>

          {/* View Mode Buttons & Live Tree Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs font-semibold scrollbar-none">
              <button
                onClick={() => setMode('radial')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  mode === 'radial'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow-md font-bold ring-2 ring-amber-300'
                    : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>الشجرة الدائرية الشعاعية (افتراضي)</span>
              </button>

              <button
                onClick={() => setMode('classic')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  mode === 'classic'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow-md font-bold'
                    : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                <TreePine className="w-3.5 h-3.5" />
                <span>الشجرة الطبيعية الكبيرة</span>
              </button>

              <button
                onClick={() => setMode('traditional')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  mode === 'traditional'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow-md font-bold'
                    : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>الشجرة العمودية القياسية</span>
              </button>

              <button
                onClick={() => setMode('horizontal')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  mode === 'horizontal'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow-md font-bold'
                    : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>الشجرة الأفقية</span>
              </button>

              <button
                onClick={() => setMode('heritage')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  mode === 'heritage'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow-md font-bold'
                    : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>الشجرة التاريخية الأصيلة</span>
              </button>

              <button
                onClick={() => setMode('network')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  mode === 'network'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow-md font-bold'
                    : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>الشجرة الشبكية المفرعة</span>
              </button>

              <button
                onClick={() => setMode('timeline')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  mode === 'timeline'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow-md font-bold'
                    : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>سلسلة الأجيال الزمانية</span>
              </button>
            </div>

            {/* Intelligent Live Search Inside Open Family Tree with Match Stepper */}
            <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0">
              <div className="relative flex-1 md:w-60">
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="ابحث داخل هذه الشجرة..."
                  className="w-full py-1.5 pr-8 pl-3 bg-[#243B55] text-white placeholder-gray-400 text-xs rounded-xl border border-[#C5A059]/40 focus:outline-none focus:border-[#C5A059]"
                />
                <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-[#C5A059]" />
              </div>

              <VoiceSearchButton size="sm" onSpeechResult={(res) => setFilterSearch(res)} />

              {/* Matches Navigation Stepper */}
              {filterSearch.trim() !== '' && (
                <div className="flex items-center gap-1 bg-[#243B55] px-2 py-1 rounded-xl border border-[#C5A059]/40 text-xs text-gray-200">
                  <button
                    onClick={goToPrevMatch}
                    disabled={matchedNodes.length === 0}
                    title="النتيجة السابقة"
                    className="p-1 hover:bg-[#C5A059] hover:text-[#1A2A40] rounded transition-colors disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-[#C5A059] text-[11px] whitespace-nowrap px-1">
                    {matchedNodes.length > 0
                      ? `${currentMatchIndex + 1} / ${matchedNodes.length}`
                      : '0'}
                  </span>
                  <button
                    onClick={goToNextMatch}
                    disabled={matchedNodes.length === 0}
                    title="النتيجة التالية"
                    className="p-1 hover:bg-[#C5A059] hover:text-[#1A2A40] rounded transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Canvas View Area */}
      <div
        ref={containerRef}
        data-no-pull-to-refresh="true"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-[#FCF9F2] rounded-3xl border-2 border-[#C5A059]/50 shadow-inner overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
          isFullscreen ? 'flex-1 h-full w-full min-h-0' : 'min-h-[580px] h-[72vh]'
        }`}
      >
        {/* Compact Floating Navigation & Directional Pad Overlay */}
        {isControlsCollapsed ? (
          <button
            onClick={() => setIsControlsCollapsed(false)}
            title="إظهار لوحة التحكم بالشجرة"
            className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#1A2A40]/95 hover:bg-[#243B55] text-[#C5A059] px-2.5 py-1.5 rounded-xl shadow-xl border border-[#C5A059]/60 backdrop-blur-md text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>التحكم</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
          </button>
        ) : (
          <div className="absolute top-3 right-3 z-30 flex flex-col items-center gap-1 bg-[#1A2A40]/95 text-white p-1.5 sm:p-2 rounded-2xl shadow-2xl backdrop-blur-md border border-[#C5A059]/50 transition-all duration-200 w-[102px] sm:w-[114px]">
            {/* Panel Header with Collapse Button */}
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

            {/* Directional Arrows */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => panBy(0, 100)}
                title="تحريك لأعلى"
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#243B55] hover:bg-[#C5A059] text-gray-200 hover:text-[#1A2A40] rounded-lg transition-colors shadow active:scale-95 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => panBy(100, 0)}
                  title="تحريك لليمين"
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#243B55] hover:bg-[#C5A059] text-gray-200 hover:text-[#1A2A40] rounded-lg transition-colors shadow active:scale-95 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetView}
                  title="توسيط الخريطة"
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#C5A059] text-[#1A2A40] hover:bg-white rounded-lg transition-colors shadow font-bold active:scale-95 cursor-pointer"
                >
                  <Focus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => panBy(-100, 0)}
                  title="تحريك لليسار"
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#243B55] hover:bg-[#C5A059] text-gray-200 hover:text-[#1A2A40] rounded-lg transition-colors shadow active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => panBy(0, -100)}
                title="تحريك لأسفل"
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#243B55] hover:bg-[#C5A059] text-gray-200 hover:text-[#1A2A40] rounded-lg transition-colors shadow active:scale-95 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full h-px bg-[#C5A059]/30 my-0.5" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 w-full justify-between">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 3.5))}
                title="تكبير"
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#243B55] hover:bg-[#C5A059] text-gray-200 hover:text-[#1A2A40] rounded-lg transition-colors active:scale-95 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] font-bold text-[#C5A059] select-none text-center min-w-[28px]">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.25))}
                title="تصغير"
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#243B55] hover:bg-[#C5A059] text-gray-200 hover:text-[#1A2A40] rounded-lg transition-colors active:scale-95 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Focus Mode Banner Overlay */}
        {focusPersonId && (
          <div className="absolute top-4 left-4 z-30 bg-[#1A2A40]/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-[#C5A059] flex items-center gap-3 backdrop-blur-md text-xs">
            <div className="p-1.5 bg-[#C5A059] text-[#1A2A40] rounded-xl font-bold">
              <Focus className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#C5A059]">وضع التركيز (Focus Mode)</div>
              <div className="text-[11px] text-gray-300">
                {focusPersonNode ? (focusPersonNode.fullLineageName || focusPersonNode.fullName) : ''}
              </div>
            </div>
            <button
              onClick={() => setFocusPersonId(null)}
              className="mr-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow text-[11px]"
            >
              إلغاء التركيز
            </button>
          </div>
        )}

        {/* Tree Content Render Canvas */}
        <div
          ref={canvasRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: mode === 'radial' ? 'center center' : 'top center',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
          }}
          className={
            mode === 'radial'
              ? 'w-full h-full flex items-center justify-center shrink-0'
              : 'p-12 sm:p-20 min-w-full min-h-full flex justify-center items-start'
          }
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-[#1A2A40] space-y-3">
              <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
              <div className="font-bold font-amiri text-lg">جاري تحميل شجرة أنساب بني علي الكلعي...</div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-2xl border border-red-200">
              {error}
            </div>
          ) : treeData.length === 0 ? (
            <div className="p-12 text-center text-[#1A2A40] font-bold font-amiri text-lg">
              لا يوجد سجلات شجرة حتى الآن. يمكنك إضافة الجد الأكبر والمقبولين عبر لوحة التحكم.
            </div>
          ) : (
            <div className="space-y-16">
              {mode === 'classic' ? (
                <div className="flex flex-wrap items-start justify-center gap-20">
                  {treeData.map((rootNode) => renderClassicTreeNode(rootNode))}
                </div>
              ) : mode === 'traditional' ? (
                <div className="flex flex-wrap items-start justify-center gap-16">
                  {treeData.map((rootNode) => renderTraditionalTree(rootNode))}
                </div>
              ) : mode === 'horizontal' ? (
                <div className="flex flex-col items-start gap-4">
                  {treeData.map((rootNode) => renderHorizontalTree(rootNode))}
                </div>
              ) : mode === 'heritage' ? (
                <div className="flex flex-wrap items-start justify-center gap-20">
                  {treeData.map((rootNode) => renderHeritageTree(rootNode))}
                </div>
              ) : mode === 'network' ? (
                <RelationshipNetworkView treeData={treeData} onSelectPerson={onSelectPerson} />
              ) : mode === 'radial' ? (
                renderRadialTree()
              ) : (
                renderTimelineTree()
              )}
            </div>
          )}
        </div>
      </div>

      {/* Helpful Hint Footer */}
      <div className="text-center text-xs text-[#1A2A40] font-semibold flex items-center justify-center gap-2 bg-amber-100/60 p-2.5 rounded-xl border border-[#C5A059]/30">
        <Sparkles className="w-4 h-4 text-[#C5A059]" />
        <span>
          نصائح التنقل: اسحب الشاشة للتنقل واستخدم أدوات التكبير والتوجيه للتركيز على الفروع العائلية.
        </span>
      </div>

      {/* Printable Family Tree Modal */}
      <PrintFamilyTreeModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        treeData={treeData}
      />
    </div>
  );
};
