import React, { useState, useMemo } from 'react';
import { FamilyTreeNode } from '../types.ts';
import { normalizeArabicText } from '../utils/search.ts';
import { Disc } from 'lucide-react';

export type RadialMode = 'descendants' | 'ancestors' | 'full';

interface RadialFamilyTreeViewerProps {
  treeData: FamilyTreeNode[];
  onSelectPerson: (personId: number) => void;
  focusPersonId?: number | null;
  radialMode: RadialMode;
  centerPersonId?: number | null;
  filterQuery?: string;
  onSetCenterPerson?: (personId: number) => void;
}

interface FlatNode {
  id: number;
  fullName: string;
  fullLineageName?: string | null;
  gender: string;
  fatherId?: number | null;
  motherId?: number | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  isDeceased?: boolean;
  occupation?: string | null;
  generation: number;
  children: FamilyTreeNode[];
}

interface PositionedNode {
  node: FlatNode;
  x: number;
  y: number;
  radius: number;
  angle: number;
  ringLevel: number;
  width: number;
  height: number;
  parentId?: number | null;
  relationType?: 'child' | 'father' | 'mother' | 'spouse' | 'center';
  isCollapsed?: boolean;
  descendantCount?: number;
}

interface RelationshipEdge {
  id: string;
  sourceId: number;
  targetId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'father-child' | 'mother-child' | 'spouse';
  label?: string;
  isHighlighted?: boolean;
}

/**
 * Intelligent Arabic Text Normalization
 */
const normalizeArabic = normalizeArabicText;

export const RadialFamilyTreeViewer: React.FC<RadialFamilyTreeViewerProps> = ({
  treeData,
  onSelectPerson,
  focusPersonId,
  radialMode,
  centerPersonId,
  filterQuery = '',
  onSetCenterPerson,
}) => {
  const [collapsedBranches, setCollapsedBranches] = useState<Set<number>>(new Set());

  // Flatten all nodes into a comprehensive lookup map
  const { allNodesMap, allNodesList } = useMemo(() => {
    const map = new Map<number, FlatNode>();
    const list: FlatNode[] = [];

    const traverse = (node: FamilyTreeNode) => {
      if (!map.has(node.id)) {
        const flat: FlatNode = {
          id: node.id,
          fullName: node.fullName,
          fullLineageName: node.fullLineageName,
          gender: node.gender || 'male',
          fatherId: node.fatherId,
          motherId: node.motherId,
          photoUrl: node.photoUrl,
          birthDate: node.birthDate,
          isDeceased: node.isDeceased,
          occupation: node.occupation,
          generation: node.generation || 1,
          children: node.children || [],
        };
        map.set(node.id, flat);
        list.push(flat);
      }

      if (node.children && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    };

    treeData.forEach(traverse);
    return { allNodesMap: map, allNodesList: list };
  }, [treeData]);

  // Determine Central Person
  const activeCenterPerson = useMemo(() => {
    if (centerPersonId && allNodesMap.has(centerPersonId)) {
      return allNodesMap.get(centerPersonId)!;
    }
    if (focusPersonId && allNodesMap.has(focusPersonId)) {
      return allNodesMap.get(focusPersonId)!;
    }
    if (allNodesList.length > 0) {
      return allNodesList[0];
    }
    return null;
  }, [centerPersonId, focusPersonId, allNodesMap, allNodesList]);

  // Search matches inside Radial Tree
  const matchedPersonIds = useMemo(() => {
    if (!filterQuery.trim()) return new Set<number>();
    const queryNorm = normalizeArabic(filterQuery);
    const matches = new Set<number>();
    allNodesList.forEach((n) => {
      const nameNorm = normalizeArabic(n.fullLineageName || n.fullName);
      if (nameNorm.includes(queryNorm)) {
        matches.add(n.id);
      }
    });
    return matches;
  }, [filterQuery, allNodesList]);

  // Smart compound-aware Arabic first name extractor
  const getFirstName = (name?: string) => {
    if (!name) return '';
    const clean = name.trim();
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

  // Helper: Estimate Node Dimensions based on first name length
  const getNodeDimensions = (node: FlatNode) => {
    const firstName = getFirstName(node.fullName);
    const nameLength = firstName.length;
    const calculatedWidth = Math.max(150, Math.min(280, nameLength * 11 + 80 + (node.photoUrl ? 32 : 0)));
    const calculatedHeight = 56;
    return { width: calculatedWidth, height: calculatedHeight };
  };

  // Compute lineage sets for Focus Mode
  const { focusAncestors, focusDescendants } = useMemo(() => {
    if (!focusPersonId) {
      return { focusAncestors: new Set<number>(), focusDescendants: new Set<number>() };
    }
    const ancestors = new Set<number>();
    let curr = allNodesMap.get(focusPersonId);
    while (curr && curr.fatherId) {
      ancestors.add(curr.fatherId);
      curr = allNodesMap.get(curr.fatherId);
    }

    const descendants = new Set<number>();
    const collectDescendants = (id: number) => {
      const parentNode = allNodesMap.get(id);
      if (parentNode && parentNode.children) {
        for (const child of parentNode.children) {
          descendants.add(child.id);
          collectDescendants(child.id);
        }
      }
    };
    collectDescendants(focusPersonId);

    return { focusAncestors: ancestors, focusDescendants: descendants };
  }, [focusPersonId, allNodesMap]);

  // Helper: Calculate Subtree Weight for smart angular distribution
  const getSubtreeWeight = (node: FlatNode, visited = new Set<number>()): number => {
    if (visited.has(node.id)) return 1;
    visited.add(node.id);
    if (!node.children || node.children.length === 0 || collapsedBranches.has(node.id)) {
      return 1;
    }
    let total = 0;
    for (const childNode of node.children) {
      const flatChild = allNodesMap.get(childNode.id);
      if (flatChild) {
        total += getSubtreeWeight(flatChild, visited);
      } else {
        total += 1;
      }
    }
    return Math.max(total, 1);
  };

  const CANVAS_CENTER_X = 1400;
  const CANVAS_CENTER_Y = 1400;

  // LAYOUT ENGINE: Calculate Radial Positions & Rings with Anti-Collision
  const { layoutNodes, relationshipEdges, ringsList } = useMemo(() => {
    if (!activeCenterPerson) {
      return { layoutNodes: [], relationshipEdges: [], maxRadius: 600, ringsList: [] };
    }

    const positionedMap = new Map<number, PositionedNode>();
    const ringsMap = new Map<number, PositionedNode[]>();

    // Center Node
    const centerDim = getNodeDimensions(activeCenterPerson);
    const centerPosNode: PositionedNode = {
      node: activeCenterPerson,
      x: CANVAS_CENTER_X,
      y: CANVAS_CENTER_Y,
      radius: 0,
      angle: 0,
      ringLevel: 0,
      width: centerDim.width + 20,
      height: centerDim.height + 10,
      relationType: 'center',
    };
    positionedMap.set(activeCenterPerson.id, centerPosNode);
    ringsMap.set(0, [centerPosNode]);

    let calculatedMaxRadius = 300;

    // BUILD LAYOUT BASED ON RADIAL MODE
    if (radialMode === 'descendants') {
      const processDescendantsSubtree = (
        node: FlatNode,
        level: number,
        startAngle: number,
        endAngle: number
      ) => {
        const children = (node.children || [])
          .map((c) => allNodesMap.get(c.id))
          .filter(Boolean) as FlatNode[];

        if (children.length === 0 || collapsedBranches.has(node.id)) return;

        const nextLevel = level + 1;
        const levelWeight = children.reduce((sum, c) => sum + getSubtreeWeight(c), 0);
        let currentStartAngle = startAngle;
        const totalAngleSpan = endAngle - startAngle;

        for (const child of children) {
          const weight = getSubtreeWeight(child);
          const childSpan = (weight / Math.max(levelWeight, 1)) * totalAngleSpan;
          const childMidAngle = currentStartAngle + childSpan / 2;

          const childDim = getNodeDimensions(child);
          const descCount = child.children ? child.children.length : 0;

          const tempPos: PositionedNode = {
            node: child,
            x: 0,
            y: 0,
            radius: 0,
            angle: childMidAngle,
            ringLevel: nextLevel,
            width: childDim.width,
            height: childDim.height,
            parentId: node.id,
            relationType: 'child',
            isCollapsed: collapsedBranches.has(child.id),
            descendantCount: descCount,
          };

          if (!ringsMap.has(nextLevel)) ringsMap.set(nextLevel, []);
          ringsMap.get(nextLevel)!.push(tempPos);
          positionedMap.set(child.id, tempPos);

          processDescendantsSubtree(child, nextLevel, currentStartAngle, currentStartAngle + childSpan);
          currentStartAngle += childSpan;
        }
      };

      processDescendantsSubtree(activeCenterPerson, 0, 0, 2 * Math.PI);
    } else if (radialMode === 'ancestors') {
      const queue: { node: FlatNode; level: number; parentPosNode: PositionedNode; angleSpan: { start: number; end: number } }[] = [];

      const father = activeCenterPerson.fatherId ? allNodesMap.get(activeCenterPerson.fatherId) : null;
      const mother = activeCenterPerson.motherId ? allNodesMap.get(activeCenterPerson.motherId) : null;

      const parentList = [
        { node: father, type: 'father' as const, angle: -Math.PI / 2 - 0.5 },
        { node: mother, type: 'mother' as const, angle: -Math.PI / 2 + 0.5 },
      ].filter((p) => p.node !== null);

      if (!ringsMap.has(1)) ringsMap.set(1, []);

      parentList.forEach((pItem) => {
        const pNode = pItem.node!;
        const pDim = getNodeDimensions(pNode);
        const posNode: PositionedNode = {
          node: pNode,
          x: 0,
          y: 0,
          radius: 0,
          angle: pItem.angle,
          ringLevel: 1,
          width: pDim.width,
          height: pDim.height,
          parentId: activeCenterPerson.id,
          relationType: pItem.type,
        };
        ringsMap.get(1)!.push(posNode);
        positionedMap.set(pNode.id, posNode);

        queue.push({
          node: pNode,
          level: 1,
          parentPosNode: posNode,
          angleSpan: { start: pItem.angle - 0.8, end: pItem.angle + 0.8 },
        });
      });

      while (queue.length > 0) {
        const current = queue.shift()!;
        const nextLevel = current.level + 1;
        if (nextLevel > 6) continue;

        const f = current.node.fatherId ? allNodesMap.get(current.node.fatherId) : null;
        const m = current.node.motherId ? allNodesMap.get(current.node.motherId) : null;

        const ancestors = [
          { node: f, type: 'father' as const },
          { node: m, type: 'mother' as const },
        ].filter((a) => a.node !== null);

        if (ancestors.length > 0) {
          if (!ringsMap.has(nextLevel)) ringsMap.set(nextLevel, []);
          const spanWidth = (current.angleSpan.end - current.angleSpan.start) / ancestors.length;

          ancestors.forEach((anc, idx) => {
            const aNode = anc.node!;
            const aDim = getNodeDimensions(aNode);
            const midAngle = current.angleSpan.start + spanWidth * idx + spanWidth / 2;

            const posNode: PositionedNode = {
              node: aNode,
              x: 0,
              y: 0,
              radius: 0,
              angle: midAngle,
              ringLevel: nextLevel,
              width: aDim.width,
              height: aDim.height,
              parentId: current.node.id,
              relationType: anc.type,
            };

            ringsMap.get(nextLevel)!.push(posNode);
            positionedMap.set(aNode.id, posNode);

            queue.push({
              node: aNode,
              level: nextLevel,
              parentPosNode: posNode,
              angleSpan: { start: current.angleSpan.start + spanWidth * idx, end: current.angleSpan.start + spanWidth * (idx + 1) },
            });
          });
        }
      }
    } else {
      // Full Family Mode
      const father = activeCenterPerson.fatherId ? allNodesMap.get(activeCenterPerson.fatherId) : null;
      const mother = activeCenterPerson.motherId ? allNodesMap.get(activeCenterPerson.motherId) : null;

      if (!ringsMap.has(1)) ringsMap.set(1, []);

      if (father) {
        const dim = getNodeDimensions(father);
        const pNode: PositionedNode = {
          node: father,
          x: 0,
          y: 0,
          radius: 0,
          angle: (5 * Math.PI) / 4,
          ringLevel: 1,
          width: dim.width,
          height: dim.height,
          parentId: activeCenterPerson.id,
          relationType: 'father',
        };
        ringsMap.get(1)!.push(pNode);
        positionedMap.set(father.id, pNode);
      }

      if (mother) {
        const dim = getNodeDimensions(mother);
        const pNode: PositionedNode = {
          node: mother,
          x: 0,
          y: 0,
          radius: 0,
          angle: (7 * Math.PI) / 4,
          ringLevel: 1,
          width: dim.width,
          height: dim.height,
          parentId: activeCenterPerson.id,
          relationType: 'mother',
        };
        ringsMap.get(1)!.push(pNode);
        positionedMap.set(mother.id, pNode);
      }

      const children = (activeCenterPerson.children || [])
        .map((c) => allNodesMap.get(c.id))
        .filter(Boolean) as FlatNode[];

      if (children.length > 0) {
        const startAngle = Math.PI * 0.15;
        const endAngle = Math.PI * 0.85;
        const angleStep = (endAngle - startAngle) / Math.max(children.length, 1);

        children.forEach((child, idx) => {
          const dim = getNodeDimensions(child);
          const childAngle = startAngle + angleStep * idx + angleStep / 2;
          const pNode: PositionedNode = {
            node: child,
            x: 0,
            y: 0,
            radius: 0,
            angle: childAngle,
            ringLevel: 1,
            width: dim.width,
            height: dim.height,
            parentId: activeCenterPerson.id,
            relationType: 'child',
            descendantCount: child.children ? child.children.length : 0,
          };
          ringsMap.get(1)!.push(pNode);
          positionedMap.set(child.id, pNode);
        });
      }
    }

    // RESOLVE RING RADII AND DYNAMIC COLLISION DETECTION
    const ringLevels = Array.from(ringsMap.keys()).sort((a, b) => a - b);
    let previousRadius = 0;

    for (const level of ringLevels) {
      if (level === 0) continue;

      const nodesInRing = ringsMap.get(level)!;
      const count = nodesInRing.length;

      const totalWidthNeeded = nodesInRing.reduce((sum, n) => sum + n.width + 45, 0);
      const isFullCircle = radialMode !== 'full';
      const arcSpan = isFullCircle ? 2 * Math.PI : Math.PI;

      const minPerimeterRadius = totalWidthNeeded / arcSpan;
      let ringRadius = Math.max(previousRadius + 230, minPerimeterRadius, level * 240);

      let hasOverlap = true;
      let passes = 0;

      while (hasOverlap && passes < 12) {
        hasOverlap = false;
        passes++;

        nodesInRing.forEach((pNode) => {
          pNode.radius = ringRadius;
          pNode.x = CANVAS_CENTER_X + ringRadius * Math.cos(pNode.angle);
          pNode.y = CANVAS_CENTER_Y + ringRadius * Math.sin(pNode.angle);
        });

        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const n1 = nodesInRing[i];
            const n2 = nodesInRing[j];

            const dx = Math.abs(n1.x - n2.x);
            const dy = Math.abs(n1.y - n2.y);

            const minDx = (n1.width + n2.width) / 2 + 25;
            const minDy = (n1.height + n2.height) / 2 + 20;

            if (dx < minDx && dy < minDy) {
              hasOverlap = true;
              ringRadius += 45;
              break;
            }
          }
          if (hasOverlap) break;
        }
      }

      previousRadius = ringRadius;
      if (ringRadius > calculatedMaxRadius) {
        calculatedMaxRadius = ringRadius;
      }
    }

    // BUILD RELATIONSHIP EDGES
    const edges: RelationshipEdge[] = [];
    const allPositioned = Array.from(positionedMap.values());

    allPositioned.forEach((pNode) => {
      const node = pNode.node;

      if (node.fatherId && positionedMap.has(node.fatherId)) {
        const fatherPos = positionedMap.get(node.fatherId)!;
        edges.push({
          id: `f-${fatherPos.node.id}-${node.id}`,
          sourceId: fatherPos.node.id,
          targetId: node.id,
          x1: fatherPos.x,
          y1: fatherPos.y,
          x2: pNode.x,
          y2: pNode.y,
          type: 'father-child',
          label: 'والد',
          isHighlighted:
            activeCenterPerson.id === node.id || activeCenterPerson.id === fatherPos.node.id,
        });
      }

      if (node.motherId && positionedMap.has(node.motherId)) {
        const motherPos = positionedMap.get(node.motherId)!;
        edges.push({
          id: `m-${motherPos.node.id}-${node.id}`,
          sourceId: motherPos.node.id,
          targetId: node.id,
          x1: motherPos.x,
          y1: motherPos.y,
          x2: pNode.x,
          y2: pNode.y,
          type: 'mother-child',
          label: 'والدة',
          isHighlighted:
            activeCenterPerson.id === node.id || activeCenterPerson.id === motherPos.node.id,
        });
      }

      if (
        pNode.parentId &&
        !node.fatherId &&
        !node.motherId &&
        positionedMap.has(pNode.parentId)
      ) {
        const parentPos = positionedMap.get(pNode.parentId)!;
        edges.push({
          id: `p-${parentPos.node.id}-${node.id}`,
          sourceId: parentPos.node.id,
          targetId: node.id,
          x1: parentPos.x,
          y1: parentPos.y,
          x2: pNode.x,
          y2: pNode.y,
          type: 'father-child',
          isHighlighted:
            activeCenterPerson.id === node.id || activeCenterPerson.id === parentPos.node.id,
        });
      }
    });

    const ringsListArray = Array.from(ringsMap.entries()).map(([level, nodes]) => ({
      level,
      radius: nodes[0]?.radius || level * 220,
      count: nodes.length,
    }));

    return {
      layoutNodes: allPositioned,
      relationshipEdges: edges,
      maxRadius: calculatedMaxRadius + 300,
      ringsList: ringsListArray,
    };
  }, [activeCenterPerson, radialMode, allNodesMap, collapsedBranches]);

  const toggleBranchCollapse = (personId: number) => {
    setCollapsedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  return (
    <div data-no-pull-to-refresh="true" className="relative w-[2800px] h-[2800px] flex items-center justify-center shrink-0">
      {/* LAYER 1: SVG RINGS & CONNECTIONS */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <linearGradient id="fatherLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C5A059" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1A2A40" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="motherLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0.7" />
          </linearGradient>

          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Circular Rings */}
        {ringsList.map((ring) => {
          if (ring.level === 0) return null;
          return (
            <g key={`ring-${ring.level}`}>
              <circle
                cx={CANVAS_CENTER_X}
                cy={CANVAS_CENTER_Y}
                r={ring.radius}
                fill="none"
                stroke="#C5A059"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                opacity="0.35"
              />
              <text
                x={CANVAS_CENTER_X + 12}
                y={CANVAS_CENTER_Y - ring.radius + 18}
                fill="#C5A059"
                fontSize="12"
                fontWeight="bold"
                fontFamily="amiri"
                opacity="0.85"
              >
                {radialMode === 'descendants'
                  ? `حلقة الجيل ${ring.level} (${ring.count} أفراد)`
                  : radialMode === 'ancestors'
                  ? `طبقة الأجداد ${ring.level}`
                  : `الحلقة العائلية ${ring.level}`}
              </text>
            </g>
          );
        })}

        {/* Relationship Lines */}
        {relationshipEdges.map((edge) => {
          const isMatchSource = matchedPersonIds.has(edge.sourceId);
          const isMatchTarget = matchedPersonIds.has(edge.targetId);
          const isMatchLine = isMatchSource || isMatchTarget;

          const midX = (edge.x1 + edge.x2) / 2;
          const midY = (edge.y1 + edge.y2) / 2;
          const dx = edge.x2 - edge.x1;
          const dy = edge.y2 - edge.y1;
          const ctrlX = midX - dy * 0.12;
          const ctrlY = midY + dx * 0.12;

          const pathData = `M ${edge.x1} ${edge.y1} Q ${ctrlX} ${ctrlY} ${edge.x2} ${edge.y2}`;

          let strokeColor = 'url(#fatherLineGrad)';
          let strokeWidth = '2.5';
          let strokeDash = 'none';

          if (edge.type === 'mother-child') {
            strokeColor = 'url(#motherLineGrad)';
            strokeWidth = '2.5';
          } else if (edge.type === 'spouse') {
            strokeColor = '#059669';
            strokeDash = '4 4';
            strokeWidth = '2';
          }

          if (edge.isHighlighted || isMatchLine) {
            strokeColor = '#F59E0B';
            strokeWidth = '4';
          }

          return (
            <g key={edge.id}>
              <path
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                filter={edge.isHighlighted || isMatchLine ? 'url(#glowGold)' : undefined}
                opacity={edge.isHighlighted || isMatchLine ? 1 : 0.85}
              />
              <circle cx={edge.x1} cy={edge.y1} r="4" fill="#C5A059" />
              <circle cx={edge.x2} cy={edge.y2} r="4" fill="#1A2A40" />
            </g>
          );
        })}
      </svg>

      {/* LAYER 2: INTERACTIVE PERSON NODES */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {layoutNodes.map((pNode) => {
          const node = pNode.node;
          const displayName = node.fullLineageName || node.fullName;
          const firstName = getFirstName(node.fullName);
          const isCenter = pNode.relationType === 'center';
          const isMatched = matchedPersonIds.has(node.id);

          const isFocusActive = Boolean(focusPersonId);
          const isFocusedSelf = focusPersonId === node.id;
          const isFocusAncestor = focusAncestors.has(node.id);
          const isFocusDescendant = focusDescendants.has(node.id);
          const isInFocusLineage = isFocusedSelf || isFocusAncestor || isFocusDescendant;

          let cardStyle =
            'bg-white text-[#1A2A40] border-[#C5A059] hover:border-[#1A2A40] shadow-md';

          if (isFocusActive) {
            if (isFocusedSelf) {
              cardStyle =
                'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-950 border-[#1A2A40] ring-4 ring-amber-400 font-extrabold shadow-2xl scale-110 z-50 animate-pulse';
            } else if (isFocusAncestor) {
              cardStyle =
                'bg-gradient-to-r from-blue-900 to-[#1A2A40] text-amber-300 border-blue-400 ring-2 ring-blue-400/80 shadow-xl font-bold';
            } else if (isFocusDescendant) {
              cardStyle =
                'bg-gradient-to-r from-[#1A2A40] to-emerald-950 text-amber-300 border-emerald-400 ring-2 ring-emerald-400/80 shadow-xl font-bold';
            } else {
              cardStyle =
                'bg-stone-100 text-stone-400 border-stone-300 opacity-30 blur-[0.3px] grayscale';
            }
          } else if (isCenter) {
            cardStyle =
              'bg-gradient-to-r from-[#1A2A40] via-[#243B55] to-[#1A2A40] text-amber-300 border-[#C5A059] ring-4 ring-[#C5A059]/50 shadow-2xl scale-110';
          } else if (isMatched) {
            cardStyle =
              'bg-[#C5A059] text-[#1A2A40] border-[#1A2A40] ring-4 ring-amber-400 font-black shadow-2xl animate-pulse scale-105';
          } else if (pNode.relationType === 'father') {
            cardStyle = 'bg-blue-50/95 text-blue-950 border-blue-400 shadow-lg';
          } else if (pNode.relationType === 'mother') {
            cardStyle = 'bg-rose-50/95 text-rose-950 border-rose-400 shadow-lg';
          }

          return (
            <div
              id={`tree-node-${node.id}`}
              key={`radial-node-${node.id}`}
              style={{
                left: `${pNode.x}px`,
                top: `${pNode.y}px`,
                transform: 'translate(-50%, -50%)',
                width: `${pNode.width}px`,
              }}
              className="absolute pointer-events-auto transition-all duration-300"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPerson(node.id);
                }}
                className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-2xl border-2 cursor-pointer transition-all transform hover:scale-108 hover:z-50 shadow-lg ${cardStyle}`}
              >
                {/* Avatar Photo or Initial */}
                <div className="w-8 h-8 rounded-full bg-[#1A2A40] text-[#C5A059] border border-[#C5A059] overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                  {node.photoUrl ? (
                    <img
                      src={node.photoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-amiri text-sm">{firstName.charAt(0)}</span>
                  )}
                </div>

                {/* Name & Role Label */}
                <div className="text-right overflow-hidden flex-1 min-w-0">
                  <div className="font-bold text-xs sm:text-sm font-amiri leading-tight text-center whitespace-normal break-words">
                    {firstName}
                  </div>
                  <div className="text-[10px] opacity-80 font-semibold text-center truncate mt-0.5">
                    {isCenter
                      ? 'المركز الرئيسي'
                      : pNode.relationType === 'father'
                      ? 'الأب'
                      : pNode.relationType === 'mother'
                      ? 'الأم'
                      : `الجيل ${node.generation}`}
                  </div>
                </div>

                {/* Set Center Button */}
                {onSetCenterPerson && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetCenterPerson(node.id);
                    }}
                    title="تعيين كمركز جديد للشجرة الدائرية"
                    className="opacity-0 group-hover:opacity-100 p-1 bg-[#1A2A40] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#1A2A40] rounded-lg transition-all shadow shrink-0"
                  >
                    <Disc className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Collapse Subtree Toggle Button if node has children */}
                {pNode.descendantCount && pNode.descendantCount > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBranchCollapse(node.id);
                    }}
                    title={pNode.isCollapsed ? 'توسيع الذرية' : 'طي الذرية'}
                    className="px-1.5 py-0.5 bg-[#243B55] text-amber-300 hover:bg-amber-400 hover:text-[#1A2A40] text-[10px] font-bold rounded-md transition-all shrink-0 border border-amber-400/40"
                  >
                    {pNode.isCollapsed ? `+${pNode.descendantCount}` : '−'}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
