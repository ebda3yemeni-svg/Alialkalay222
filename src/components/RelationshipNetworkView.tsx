import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FamilyTreeNode } from '../types.ts';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  User,
  Heart,
  Sparkles,
  Layers,
  Info,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface RelationshipNetworkViewProps {
  treeData: FamilyTreeNode[];
  onSelectPerson: (personId: number) => void;
}

interface NodePosition {
  id: number;
  fullName: string;
  generation: number;
  gender: string;
  photoUrl?: string | null;
  fatherId?: number | null;
  motherId?: number | null;
  x: number;
  y: number;
}

interface RelationshipLink {
  source: number;
  target: number;
  type: 'parent' | 'sibling' | 'spouse';
}

export const RelationshipNetworkView: React.FC<RelationshipNetworkViewProps> = ({
  treeData,
  onSelectPerson,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Flatten all nodes from treeData
  const allNodes = useMemo(() => {
    const list: FamilyTreeNode[] = [];
    const visited = new Set<number>();

    function traverse(nodes: FamilyTreeNode[]) {
      nodes.forEach((n) => {
        if (!visited.has(n.id)) {
          visited.add(n.id);
          list.push(n);
          if (n.children && n.children.length > 0) {
            traverse(n.children);
          }
        }
      });
    }

    traverse(treeData);
    return list;
  }, [treeData]);

  // Compute relationship links (Parent-Child, Siblings, Spouses)
  const links = useMemo(() => {
    const linkList: RelationshipLink[] = [];
    const linkSet = new Set<string>();

    const addLink = (source: number, target: number, type: 'parent' | 'sibling' | 'spouse') => {
      const key = [Math.min(source, target), Math.max(source, target), type].join('-');
      if (!linkSet.has(key)) {
        linkSet.add(key);
        linkList.push({ source, target, type });
      }
    };

    allNodes.forEach((node) => {
      // Parent -> Child
      if (node.fatherId && allNodes.some((n) => n.id === node.fatherId)) {
        addLink(node.fatherId, node.id, 'parent');
      }
      if (node.motherId && allNodes.some((n) => n.id === node.motherId)) {
        addLink(node.motherId, node.id, 'parent');
      }

      // Siblings (Same father or mother)
      allNodes.forEach((other) => {
        if (node.id !== other.id) {
          if (
            (node.fatherId && node.fatherId === other.fatherId) ||
            (node.motherId && node.motherId === other.motherId)
          ) {
            addLink(node.id, other.id, 'sibling');
          }
        }
      });
    });

    return linkList;
  }, [allNodes]);

  // Auto-arrange layout algorithm to minimize overlaps
  const autoArrange = () => {
    const newPositions: Record<number, { x: number; y: number }> = {};
    const genMap: Record<number, FamilyTreeNode[]> = {};

    allNodes.forEach((n) => {
      const g = n.generation || 1;
      if (!genMap[g]) genMap[g] = [];
      genMap[g].push(n);
    });

    const genKeys = Object.keys(genMap).map(Number).sort((a, b) => a - b);
    const ySpacing = 160;
    const xSpacing = 220;

    genKeys.forEach((g, gIdx) => {
      const row = genMap[g];
      const rowWidth = row.length * xSpacing;
      const startX = -rowWidth / 2 + xSpacing / 2;

      row.forEach((n, nIdx) => {
        newPositions[n.id] = {
          x: startX + nIdx * xSpacing,
          y: gIdx * ySpacing,
        };
      });
    });

    setPositions(newPositions);
  };

  useEffect(() => {
    if (allNodes.length > 0) {
      autoArrange();
    }
  }, [allNodes]);

  // Node Dragging handlers
  const handleNodeMouseDown = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDraggedNodeId(id);
    const pos = positions[id] || { x: 0, y: 0 };
    setDragOffset({
      x: e.clientX - pos.x * zoom,
      y: e.clientY - pos.y * zoom,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId !== null) {
      const newX = (e.clientX - dragOffset.x) / zoom;
      const newY = (e.clientY - dragOffset.y) / zoom;
      setPositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: newX, y: newY },
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // Pan Canvas handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggedNodeId) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  // Determine highlighted node IDs
  const activeFocusId = selectedNodeId || hoveredNodeId;

  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<number>();
    const set = new Set<number>([activeFocusId]);

    links.forEach((l) => {
      if (l.source === activeFocusId) set.add(l.target);
      if (l.target === activeFocusId) set.add(l.source);
    });

    return set;
  }, [activeFocusId, links]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleCanvasMouseDown}
      className="relative w-full h-[650px] bg-[#101A26] rounded-2xl border-2 border-[#C5A059]/40 overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-2xl"
    >
      {/* Network Header & Controls Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2 bg-[#1A2A40]/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#C5A059]/40 text-white shadow-xl">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#243B55] rounded-xl text-xs font-bold text-[#C5A059]">
          <Sparkles className="w-4 h-4" />
          <span>شبكة العلاقات التفاعلية ({allNodes.length} عقداً)</span>
        </div>

        <button
          onClick={autoArrange}
          title="إعادة تنظيم الشبكة تلقائياً"
          className="p-2 rounded-xl bg-[#243B55] hover:bg-[#C5A059] hover:text-[#1A2A40] text-[#C5A059] transition-all font-bold text-xs flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">تنظيم تلقائي</span>
        </button>

        <div className="h-4 w-px bg-[#C5A059]/40 mx-1" />

        {/* Zoom controls */}
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          className="p-2 rounded-xl bg-[#243B55] hover:bg-[#2C4A6B] text-gray-200 transition-all cursor-pointer"
          title="تكبير"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          className="p-2 rounded-xl bg-[#243B55] hover:bg-[#2C4A6B] text-gray-200 transition-all cursor-pointer"
          title="تصغير"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-2 rounded-xl bg-[#243B55] hover:bg-[#2C4A6B] text-gray-200 transition-all cursor-pointer"
          title="إعادة ضبط الرؤية"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Guide Bar */}
      <div className="absolute bottom-4 right-4 z-20 bg-[#1A2A40]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#C5A059]/40 text-xs text-gray-300 flex items-center gap-4 shadow-lg hidden sm:flex">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-3 h-0.5 bg-[#C5A059]" /> خط الأبوة والذرية
        </span>
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-3 h-0.5 bg-blue-400 border border-dashed" /> خط الأشقاء
        </span>
        <span className="text-[11px] text-amber-300 font-medium">💡 يمكنك سحب أي عقدة لتحريكها بحرية</span>
      </div>

      {/* SVG Canvas Stage */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <svg className="w-[3000px] h-[2000px] absolute overflow-visible pointer-events-none">
          {/* Render Relationship Lines */}
          {links.map((link, idx) => {
            const p1 = positions[link.source];
            const p2 = positions[link.target];
            if (!p1 || !p2) return null;

            const isHighlighted =
              activeFocusId !== null &&
              (link.source === activeFocusId || link.target === activeFocusId);

            const isDimmed = activeFocusId !== null && !isHighlighted;

            let strokeColor = link.type === 'sibling' ? '#60A5FA' : '#C5A059';
            let strokeDash = link.type === 'sibling' ? '4 4' : 'none';

            if (isHighlighted) strokeColor = '#F59E0B';

            return (
              <line
                key={idx}
                x1={p1.x + 1500}
                y1={p1.y + 1000}
                x2={p2.x + 1500}
                y2={p2.y + 1000}
                stroke={strokeColor}
                strokeWidth={isHighlighted ? 3.5 : 1.8}
                strokeDasharray={strokeDash}
                opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.65}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Render Node Cards */}
        <div className="relative w-0 h-0">
          {allNodes.map((node) => {
            const pos = positions[node.id] || { x: 0, y: 0 };
            const isSelected = selectedNodeId === node.id;
            const isConnected = connectedNodeIds.has(node.id);
            const isDimmed = activeFocusId !== null && !isConnected;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                  onSelectPerson(node.id);
                }}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
                className={`absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-48 p-2.5 rounded-2xl border-2 transition-all cursor-pointer shadow-lg flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-[#C5A059] border-white ring-4 ring-amber-400 text-[#1A2A40] scale-110 z-30 font-bold'
                    : isConnected
                    ? 'bg-[#1A2A40] border-[#C5A059] text-white ring-2 ring-[#C5A059]/50 scale-105 z-20'
                    : isDimmed
                    ? 'bg-[#1A2A40]/40 border-gray-700 text-gray-500 opacity-30 z-0'
                    : 'bg-[#1A2A40] border-[#243B55] hover:border-[#C5A059] text-white hover:scale-105 z-10'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#243B55] border border-[#C5A059] text-[#C5A059] font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-inner">
                  {node.photoUrl ? (
                    <img src={node.photoUrl} alt={node.fullName} className="w-full h-full object-cover" />
                  ) : (
                    node.fullName.charAt(0)
                  )}
                </div>

                <div className="overflow-hidden text-right leading-tight">
                  <div className="font-bold text-xs truncate font-amiri">{node.fullName}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">الجيل {node.generation}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
