import { db } from '../db/index.ts';
import { people, photos, documents, auditLogs, users, duplicateReviews } from '../db/schema.ts';
import { eq, or, and, ilike, sql, inArray } from 'drizzle-orm';
import {
  Person,
  PersonDetail,
  FamilyTreeNode,
  GenealogyStatistics,
  MergeSuggestion,
  GenealogyValidationIssue,
  FourPartDuplicateWarning,
  DataReviewDashboardPayload,
} from '../types.ts';

// Enrich people records with resolved fatherName, grandfatherName, and fullLineageName
export function enrichPeopleWithLineage(peopleList: Person[]): Person[] {
  const map = new Map<number, Person>();
  for (const p of peopleList) {
    map.set(p.id, p);
  }

  return peopleList.map((p) => {
    let fatherName: string | null = null;
    let motherName: string | null = null;
    let grandfatherName: string | null = null;

    const father = p.fatherId ? map.get(p.fatherId) : null;
    const mother = p.motherId ? map.get(p.motherId) : null;

    if (father) {
      fatherName = father.fullName;
      const grandfather = father.fatherId ? map.get(father.fatherId) : null;
      if (grandfather) {
        grandfatherName = grandfather.fullName;
      }
    }

    if (mother) {
      motherName = mother.fullName;
    }

    // Traverse paternal ancestors up to 10 generations to construct comprehensive lineage
    const lineageAncestors: Person[] = [];
    let currentFatherId = p.fatherId;
    let depth = 0;
    const visited = new Set<number>([p.id]);

    while (currentFatherId && !visited.has(currentFatherId) && depth < 10) {
      visited.add(currentFatherId);
      const ancestor = map.get(currentFatherId);
      if (!ancestor) break;
      lineageAncestors.push(ancestor);
      currentFatherId = ancestor.fatherId;
      depth++;
    }

    let pName = (p.fullName || '').trim();
    if (!pName) {
      pName = `سجل #${p.id}`;
    }

    // Build multi-generational lineage chain without truncation or missing ancestors
    const parts: string[] = [pName];

    for (const anc of lineageAncestors) {
      if (!anc.fullName) continue;
      
      // Split ancestor full name into components separated by 'بن' or 'ابن'
      const ancSegments = anc.fullName
        .split(/\s+(?:بن|ابن)\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const seg of ancSegments) {
        // Skip family/tribe prefixes if already handled
        if (seg.startsWith('آل ') || seg.startsWith('ال')) {
          if (!parts.join(' ').includes(seg)) {
            parts.push(seg);
          }
          continue;
        }

        if (!parts.join(' ').includes(seg)) {
          parts.push(`بن ${seg}`);
        }
      }
    }

    const famOrTribe =
      p.familyName || (father ? father.familyName : null) || p.tribe || (father ? father.tribe : null);
    if (famOrTribe && !parts.join(' ').includes(famOrTribe)) {
      parts.push(famOrTribe);
    }

    const fullLineageName = parts.join(' ');

    return {
      ...p,
      fullName: pName,
      fatherName,
      motherName,
      grandfatherName,
      fullLineageName,
    };
  });
}

/**
 * Arabic Text Normalization for High Precision Search
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  let normalized = text.toLowerCase();

  // 1. Remove Tatweel / Kashida (\u0640)
  normalized = normalized.replace(/\u0640/g, '');

  // 2. Remove zero-width spaces & non-printable formatting characters
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 3. Remove Arabic diacritics / tashkeel (\u064B-\u065F, \u0670)
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // 4. Normalize Persian/Arabic character variants
  normalized = normalized.replace(/\u06A9/g, 'ك'); // Persian Kaf -> Arabic Kaf
  normalized = normalized.replace(/\u06CC/g, 'ي'); // Persian Ya -> Arabic Ya

  // 5. Normalize Hamza variations (أ, إ, آ, ء, ئ, ؤ -> ا)
  normalized = normalized.replace(/[أإآءئؤ]/g, 'ا');

  // 6. Normalize Ta Marbuta (ة -> ه) and Alef Maqsura (ى -> ي)
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');

  // 7. Convert Arabic/Persian digits to ASCII digits
  normalized = normalized
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');

  // 8. Normalize compound prefixes and spacing
  normalized = normalized.replace(/عبد\s+/g, 'عبد');
  normalized = normalized.replace(/ابن\s+/g, 'ابن');
  normalized = normalized.replace(/بن\s+/g, 'بن');
  normalized = normalized.replace(/ابو\s+/g, 'ابو');
  normalized = normalized.replace(/آل\s+/g, 'ال');
  normalized = normalized.replace(/ال\s+/g, 'ال');

  // 9. Collapse extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

/**
 * Intelligent Ranking & Scoring Algorithm for Search
 */
export function scorePersonMatch(person: Person, searchQuery: string): number {
  if (!searchQuery || !searchQuery.trim()) return 1;

  const normQuery = normalizeArabicText(searchQuery);
  if (!normQuery) return 0;

  const normFullName = normalizeArabicText(person.fullName || '');
  const normLineage = normalizeArabicText(person.fullLineageName || '');
  const normFather = normalizeArabicText(person.fatherName || '');
  const normGrandfather = normalizeArabicText(person.grandfatherName || '');
  const normMother = normalizeArabicText(person.motherName || '');
  const normFamily = normalizeArabicText(person.familyName || '');
  const normTribe = normalizeArabicText(person.tribe || '');
  const normBranch = normalizeArabicText(person.branch || '');

  const searchableText = normalizeArabicText(
    [
      person.id?.toString(),
      person.fullName,
      person.fullLineageName,
      person.fatherName,
      person.grandfatherName,
      person.motherName,
      person.familyName,
      person.tribe,
      person.branch,
      person.birthPlace,
      person.deathPlace,
      person.birthDate,
      person.deathDate,
      person.occupation,
      person.biography,
      person.notes,
    ]
      .filter(Boolean)
      .join(' ')
  );

  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return 0;

  // Rank 1: Exact full match on fullName or fullLineageName
  if (normFullName === normQuery || normLineage === normQuery) {
    return 100000;
  }

  // Rank 2: Name or lineage starts with exact query phrase
  if (normFullName.startsWith(normQuery) || normLineage.startsWith(normQuery)) {
    return 50000 + queryTokens.length * 1000;
  }

  // Rank 3: Exact first name match
  const firstWordName = normFullName.split(/\s+/)[0];
  if (queryTokens.length === 1 && firstWordName === normQuery) {
    return 40000;
  }

  // Rank 4: Exact First + Second Name match
  if (queryTokens.length >= 2) {
    const nameWords = normFullName.split(/\s+/);
    if (nameWords.length >= 2 && nameWords[0] === queryTokens[0] && nameWords[1] === queryTokens[1]) {
      return 35000;
    }
  }

  // Rank 5: Direct phrase substring match in full name or lineage
  if (normFullName.includes(normQuery) || normLineage.includes(normQuery)) {
    return 20000;
  }

  // Rank 6: Direct phrase substring match in general searchable text
  if (searchableText.includes(normQuery)) {
    return 15000;
  }

  // Rank 7: All query tokens exist in full name or lineage
  const allTokensInName = queryTokens.every(
    (token) => normFullName.includes(token) || normLineage.includes(token)
  );
  if (allTokensInName) {
    return 10000;
  }

  // Rank 8: All tokens found in general searchable fields
  const allTokensInSearchable = queryTokens.every((token) => searchableText.includes(token));
  if (allTokensInSearchable) {
    return 5000;
  }

  // Rank 9: Partial token match
  const matchingTokensCount = queryTokens.filter((token) => searchableText.includes(token)).length;
  if (matchingTokensCount > 0) {
    return matchingTokensCount * 100;
  }

  return 0;
}

// Sanitize & wrap DB queries with robust two-layer error handling
export async function getAllPeople(search?: string, tribe?: string, limit = 100000) {
  try {
    const allRecords = await db.select().from(people);
    const enriched = enrichPeopleWithLineage(allRecords as Person[]);

    let filtered = enriched;

    if (tribe && tribe.trim() !== '') {
      filtered = filtered.filter((p) => p.tribe === tribe.trim());
    }

    if (search && search.trim() !== '') {
      const scoredList = filtered.map((person) => ({
        person,
        score: scorePersonMatch(person, search),
      }));

      filtered = scoredList
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.person);
    }

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Database query failed in getAllPeople:', error);
    throw new Error('فشل جلب قائمة الأشخاص من قاعدة البيانات.', { cause: error });
  }
}

export async function getPersonById(id: number): Promise<Person | null> {
  try {
    const allRecords = await db.select().from(people);
    const enriched = enrichPeopleWithLineage(allRecords as Person[]);
    const person = enriched.find((p) => p.id === id);
    return person || null;
  } catch (error) {
    console.error('Failed to fetch person by ID:', error);
    throw new Error('فشل جلب بيانات الشخص من قاعدة البيانات.', { cause: error });
  }
}

export async function getPersonDetail(id: number, isPublicOnly = true): Promise<PersonDetail | null> {
  try {
    const person = await getPersonById(id);
    if (!person) return null;

    // Build Lineage Chain (traverse fatherId upwards)
    const lineageChain: Person[] = [person];
    let currentFatherId = person.fatherId;
    const visitedIds = new Set<number>([person.id]);

    while (currentFatherId && !visitedIds.has(currentFatherId)) {
      visitedIds.add(currentFatherId);
      const fatherNode = await getPersonById(currentFatherId);
      if (!fatherNode) break;
      lineageChain.unshift(fatherNode); // Ancestors at front
      currentFatherId = fatherNode.fatherId;
    }

    // Direct ancestors
    const father = person.fatherId ? await getPersonById(person.fatherId) : null;
    const mother = person.motherId ? await getPersonById(person.motherId) : null;
    const grandfather = father?.fatherId ? await getPersonById(father.fatherId) : null;
    const greatGrandfather = grandfather?.fatherId ? await getPersonById(grandfather.fatherId) : null;

    // Children
    const children = await db
      .select()
      .from(people)
      .where(or(eq(people.fatherId, person.id), eq(people.motherId, person.id)));

    // Grandchildren
    const childIds = children.map((c) => c.id);
    let grandchildren: Person[] = [];
    if (childIds.length > 0) {
      grandchildren = await db
        .select()
        .from(people)
        .where(or(inArray(people.fatherId, childIds), inArray(people.motherId, childIds)));
    }

    // Siblings
    let siblings: Person[] = [];
    if (person.fatherId || person.motherId) {
      const siblingConditions = [];
      if (person.fatherId) siblingConditions.push(eq(people.fatherId, person.fatherId));
      if (person.motherId) siblingConditions.push(eq(people.motherId, person.motherId));

      const rawSiblings = await db
        .select()
        .from(people)
        .where(or(...siblingConditions));
      
      siblings = rawSiblings.filter((s) => s.id !== person.id);
    }

    // Uncles (Father's brothers)
    let uncles: Person[] = [];
    if (father && father.fatherId) {
      const fatherBrothers = await db
        .select()
        .from(people)
        .where(and(eq(people.fatherId, father.fatherId), eq(people.gender, 'male')));
      uncles = fatherBrothers.filter((u) => u.id !== father.id);
    }

    // Cousins (Children of Uncles)
    let cousins: Person[] = [];
    const uncleIds = uncles.map((u) => u.id);
    if (uncleIds.length > 0) {
      cousins = await db.select().from(people).where(inArray(people.fatherId, uncleIds));
    }

    // Calculate total descendants, descending generations, direct family branches
    const rawAll = await db.select().from(people);
    const allPeople = rawAll as Person[];

    let totalDescendantsCount = 0;
    let maxGenDepth = 0;

    const computeDescendants = (rootId: number, depth: number, visited: Set<number>) => {
      visited.add(rootId);
      const direct = allPeople.filter((p) => (p.fatherId === rootId || p.motherId === rootId) && !visited.has(p.id));
      if (direct.length > 0) {
        if (depth > maxGenDepth) maxGenDepth = depth;
        for (const child of direct) {
          totalDescendantsCount++;
          computeDescendants(child.id, depth + 1, new Set(visited));
        }
      }
    };

    computeDescendants(person.id, 1, new Set());

    // Direct family branches: children who have children
    const directBranchesCount = children.filter((c) =>
      allPeople.some((p) => p.fatherId === c.id || p.motherId === c.id)
    ).length;

    const brothersCount = siblings.filter((s) => s.gender === 'male').length;
    const sistersCount = siblings.filter((s) => s.gender === 'female').length;

    // Photos
    let photosList = await db.select().from(photos).where(eq(photos.personId, person.id));
    if (isPublicOnly) {
      photosList = photosList.filter((p) => p.isPublic !== false);
    }

    // Documents
    let documentsList = await db.select().from(documents).where(eq(documents.personId, person.id));
    if (isPublicOnly) {
      documentsList = documentsList.filter((d) => d.isPublic !== false);
    }

    return {
      person,
      father,
      mother,
      grandfather,
      greatGrandfather,
      lineageChain,
      children,
      grandchildren,
      siblings,
      uncles,
      cousins,
      photos: photosList,
      documents: documentsList,
      totalDescendantsCount,
      generationsCount: maxGenDepth,
      directBranchesCount,
      brothersCount,
      sistersCount,
    };
  } catch (error) {
    console.error('Failed to compute person details:', error);
    throw new Error('فشل إعداد التفاصيل والأقارب للشخص المطلوب.', { cause: error });
  }
}

export async function getFullFamilyTree(rootId?: number): Promise<FamilyTreeNode[]> {
  try {
    const rawAll = await db.select().from(people);
    if (rawAll.length === 0) return [];
    const all = enrichPeopleWithLineage(rawAll as Person[]);

    // Map for fast lookup
    const personMap = new Map<number, Person>();
    all.forEach((p) => personMap.set(p.id, p));

    // Find root nodes
    let roots: Person[] = [];

    if (rootId) {
      const target = personMap.get(rootId);
      if (target) {
        // Trace up to the oldest patriarch root
        let curr = target;
        const visited = new Set<number>([curr.id]);
        while (curr.fatherId && personMap.has(curr.fatherId) && !visited.has(curr.fatherId)) {
          visited.add(curr.fatherId);
          curr = personMap.get(curr.fatherId)!;
        }
        roots = [curr];
      }
    }

    if (roots.length === 0) {
      // Pick all nodes without a father in the database
      roots = all.filter((p) => !p.fatherId || !personMap.has(p.fatherId));
    }

    // Helper to build recursive node
    function buildNode(p: Person, gen: number, visited: Set<number>): FamilyTreeNode {
      visited.add(p.id);
      const childrenNodes = all
        .filter((c) => (c.fatherId === p.id || c.motherId === p.id) && !visited.has(c.id))
        .map((c) => buildNode(c, gen + 1, new Set(visited)));

      return {
        id: p.id,
        fullName: p.fullName,
        fullLineageName: p.fullLineageName || p.fullName,
        gender: (p.gender as 'male' | 'female') || 'male',
        fatherId: p.fatherId,
        motherId: p.motherId,
        familyName: p.familyName,
        tribe: p.tribe,
        branch: p.branch,
        photoUrl: p.photoUrl,
        birthDate: p.birthDate,
        deathDate: p.deathDate,
        isDeceased: p.isDeceased || false,
        generation: gen,
        children: childrenNodes,
      };
    }

    return roots.map((root) => buildNode(root, 1, new Set()));
  } catch (error) {
    console.error('Failed to construct family tree graph:', error);
    throw new Error('فشل بناء شجرة العائلة من قاعدة البيانات.', { cause: error });
  }
}

export async function getDescendantsTree(rootId: number): Promise<FamilyTreeNode | null> {
  try {
    const rawAll = await db.select().from(people);
    if (rawAll.length === 0) return null;
    const all = enrichPeopleWithLineage(rawAll as Person[]);

    const personMap = new Map<number, Person>();
    all.forEach((p) => personMap.set(p.id, p));

    const rootPerson = personMap.get(rootId);
    if (!rootPerson) return null;

    function buildDescendantNode(p: Person, gen: number, visited: Set<number>): FamilyTreeNode {
      visited.add(p.id);

      const children = all.filter(
        (c) => (c.fatherId === p.id || c.motherId === p.id) && !visited.has(c.id)
      );

      const childrenNodes = children.map((c) =>
        buildDescendantNode(c, gen + 1, new Set(visited))
      );

      return {
        id: p.id,
        fullName: p.fullName,
        fullLineageName: p.fullLineageName || p.fullName,
        gender: (p.gender as 'male' | 'female') || 'male',
        fatherId: p.fatherId,
        motherId: p.motherId,
        familyName: p.familyName,
        tribe: p.tribe,
        branch: p.branch,
        photoUrl: p.photoUrl,
        birthDate: p.birthDate,
        deathDate: p.deathDate,
        isDeceased: p.isDeceased || false,
        generation: gen,
        children: childrenNodes,
      };
    }

    return buildDescendantNode(rootPerson, 1, new Set());
  } catch (error) {
    console.error('Failed to construct descendants tree graph:', error);
    throw new Error('فشل بناء شجرة الذرية من قاعدة البيانات.', { cause: error });
  }
}

export async function getStatistics(): Promise<GenealogyStatistics> {
  try {
    const all = await db.select().from(people);
    const totalPeople = all.length;
    const totalMales = all.filter((p) => p.gender === 'male').length;
    const totalFemales = all.filter((p) => p.gender === 'female').length;
    const totalLiving = all.filter((p) => !p.isDeceased).length;
    const totalDeceased = all.filter((p) => p.isDeceased).length;

    const familySet = new Set(all.map((p) => p.familyName).filter(Boolean));
    const tribeSet = new Set(all.map((p) => p.tribe).filter(Boolean));

    // Calculate maximum generation depth
    const personMap = new Map<number, Person>();
    all.forEach((p) => personMap.set(p.id, p as Person));

    function getDepth(p: Person, visited = new Set<number>()): number {
      if (visited.has(p.id)) return 1;
      visited.add(p.id);
      const children = all.filter((c) => c.fatherId === p.id || c.motherId === p.id);
      if (children.length === 0) return 1;
      let maxChild = 0;
      for (const child of children) {
        maxChild = Math.max(maxChild, getDepth(child as Person, new Set(visited)));
      }
      return 1 + maxChild;
    }

    let maxGen = 1;
    const roots = all.filter((p) => !p.fatherId || !personMap.has(p.fatherId));
    roots.forEach((r) => {
      maxGen = Math.max(maxGen, getDepth(r as Person));
    });

    // Largest branch count & person with most descendants
    let largestBranch = { ancestorName: 'غير محدد', descendantsCount: 0 };
    let mostDescendantsPerson = { id: 0, fullName: 'غير محدد', descendantsCount: 0 };

    all.forEach((p) => {
      const descendantsCount = getDepthCount(p as Person, all as Person[]);
      if (descendantsCount > mostDescendantsPerson.descendantsCount) {
        mostDescendantsPerson = { id: p.id, fullName: p.fullName, descendantsCount };
      }
    });

    roots.forEach((r) => {
      const descendantsCount = getDepthCount(r as Person, all as Person[]);
      if (descendantsCount > largestBranch.descendantsCount) {
        largestBranch = { ancestorName: r.fullName, descendantsCount };
      }
    });

    // Largest family by number of members
    const familyCounts: Record<string, number> = {};
    all.forEach((p) => {
      const fam = p.familyName || p.tribe || 'عائلة عامة';
      familyCounts[fam] = (familyCounts[fam] || 0) + 1;
    });

    let largestFamilyByMembers = { familyName: 'بني علي الكلعي', count: totalPeople };
    const sortedFamilies = Object.entries(familyCounts).sort((a, b) => b[1] - a[1]);
    if (sortedFamilies.length > 0) {
      largestFamilyByMembers = { familyName: sortedFamilies[0][0], count: sortedFamilies[0][1] };
    }

    // Photos count & Missing info count
    const withPhotosCount = all.filter((p) => p.photoUrl && p.photoUrl.trim() !== '').length;
    const missingInfoCount = all.filter(
      (p) => !p.birthDate || (!p.fatherId && !p.motherId) || (!p.familyName && !p.tribe)
    ).length;

    // Confidence Level counts
    const verifiedCount = all.filter((p) => !p.confidenceLevel || p.confidenceLevel === 'verified').length;
    const reviewCount = all.filter((p) => p.confidenceLevel === 'review').length;
    const unverifiedCount = all.filter((p) => p.confidenceLevel === 'unverified').length;

    // Most common first names
    const firstNameCounts: Record<string, number> = {};
    const tribeCounts: Record<string, number> = {};

    all.forEach((p) => {
      const firstName = p.fullName.trim().split(' ')[0];
      if (firstName) {
        firstNameCounts[firstName] = (firstNameCounts[firstName] || 0) + 1;
      }
      if (p.tribe && p.tribe.trim()) {
        const tr = p.tribe.trim();
        tribeCounts[tr] = (tribeCounts[tr] || 0) + 1;
      }
    });

    const mostCommonNames = Object.entries(firstNameCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostCommonTribes = Object.entries(tribeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const enrichedAll = enrichPeopleWithLineage(all as Person[]);
    const recentAdditions = [...enrichedAll].reverse().slice(0, 6);

    return {
      totalPeople,
      totalMales,
      totalFemales,
      totalLiving,
      totalDeceased,
      totalFamilies: familySet.size || 1,
      totalTribes: tribeSet.size || 1,
      totalGenerations: maxGen,
      largestBranch,
      mostDescendantsPerson,
      largestFamilyByMembers,
      withPhotosCount,
      missingInfoCount,
      verifiedCount,
      reviewCount,
      unverifiedCount,
      mostCommonNames,
      mostCommonTribes,
      recentAdditions,
    };
  } catch (error) {
    console.error('Failed to compute statistics:', error);
    throw new Error('فشل احتساب الإحصائيات.', { cause: error });
  }
}

function getDepthCount(p: Person, all: Person[], visited = new Set<number>()): number {
  if (visited.has(p.id)) return 0;
  visited.add(p.id);
  const children = all.filter((c) => c.fatherId === p.id || c.motherId === p.id);
  let count = children.length;
  for (const c of children) {
    count += getDepthCount(c, all, visited);
  }
  return count;
}

export async function detectDuplicates(fullName: string, fatherId?: number | null): Promise<MergeSuggestion[]> {
  try {
    const all = await db.select().from(people);
    const suggestions: MergeSuggestion[] = [];

    const cleanName = fullName.trim();
    if (!cleanName) return [];

    for (const p of all) {
      let score = 0;
      let reasons: string[] = [];

      if (p.fullName.trim() === cleanName) {
        score += 60;
        reasons.push('اسم مطابق تماماً');
      } else if (p.fullName.includes(cleanName) || cleanName.includes(p.fullName)) {
        score += 40;
        reasons.push('تشابه في الأجزاء الرئيسية من الاسم');
      }

      if (fatherId && p.fatherId === fatherId) {
        score += 40;
        reasons.push('نفس الأب المسجل');
      }

      if (score >= 50) {
        suggestions.push({
          person1: { fullName, fatherId } as Person,
          person2: p,
          matchScore: score,
          reason: reasons.join(' + '),
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Duplicate search error:', error);
    return [];
  }
}

function getArabicOrdinal(num: number): string {
  const ordinals: Record<number, string> = {
    1: 'الوالد / الأب',
    2: 'الجد الثاني',
    3: 'الجد الثالث',
    4: 'الجد الرابع',
    5: 'الجد الخامس',
    6: 'الجد السادس',
    7: 'الجد السابع',
    8: 'الجد الثامن',
    9: 'الجد التاسع',
    10: 'الجد العاشر',
  };
  return ordinals[num] || `الجد رقم ${num}`;
}

function getArabicDegreeWord(num: number): string {
  const degrees: Record<number, string> = {
    1: 'الأولى',
    2: 'الثانية',
    3: 'الثالثة',
    4: 'الرابعة',
    5: 'الخامسة',
    6: 'السادسة',
    7: 'السابعة',
    8: 'الثامنة',
    9: 'التاسعة',
    10: 'العاشرة',
  };
  return degrees[num] || `${num}`;
}

export async function analyzeRelationship(person1Id: number, person2Id: number) {
  try {
    const p1Id = Number(person1Id);
    const p2Id = Number(person2Id);
    if (isNaN(p1Id) || isNaN(p2Id)) {
      throw new Error('معرفات الأشخاص غير صالحة');
    }

    const rawAll = await db.select().from(people);
    if (rawAll.length === 0) return null;
    const all = enrichPeopleWithLineage(rawAll as Person[]);

    const personMap = new Map<number, Person>();
    all.forEach((p) => personMap.set(Number(p.id), p));

    const person1 = personMap.get(p1Id);
    const person2 = personMap.get(p2Id);

    if (!person1 || !person2) return null;

    const name1 = person1.fullLineageName || person1.fullName;
    const name2 = person2.fullLineageName || person2.fullName;

    // Helper to traverse ancestors chain (paternal primary, fallback to maternal)
    const getAncestorsChain = (startPerson: Person) => {
      const chain: { person: Person; relationshipToTarget: string; distanceFromTarget: number }[] = [];
      let curr: Person | undefined = startPerson;
      let depth = 0;
      const visited = new Set<number>();

      while (curr && !visited.has(curr.id)) {
        visited.add(curr.id);

        let stepName = 'الشخص نفسه';
        if (depth === 1) stepName = 'الأب / الوالد';
        else if (depth === 2) stepName = 'الجد المباشر';
        else if (depth >= 3) stepName = getArabicOrdinal(depth);

        chain.push({
          person: curr,
          relationshipToTarget: stepName,
          distanceFromTarget: depth,
        });

        // Follow fatherId first, then motherId if fatherId is missing
        const nextFatherId = curr.fatherId ? Number(curr.fatherId) : null;
        const nextMotherId = curr.motherId ? Number(curr.motherId) : null;

        if (nextFatherId && personMap.has(nextFatherId)) {
          curr = personMap.get(nextFatherId);
          depth++;
        } else if (nextMotherId && personMap.has(nextMotherId)) {
          curr = personMap.get(nextMotherId);
          depth++;
        } else {
          break;
        }
      }

      return chain;
    };

    const chain1 = getAncestorsChain(person1);
    const chain2 = getAncestorsChain(person2);

    // Find closest common ancestor
    let commonAncestor: Person | null = null;
    let dist1 = -1;
    let dist2 = -1;

    for (let i = 0; i < chain1.length; i++) {
      const p1Node = chain1[i];
      const matchIndexInChain2 = chain2.findIndex((c2) => Number(c2.person.id) === Number(p1Node.person.id));
      if (matchIndexInChain2 !== -1) {
        commonAncestor = p1Node.person;
        dist1 = i;
        dist2 = matchIndexInChain2;
        break;
      }
    }

    if (!commonAncestor || dist1 === -1 || dist2 === -1) {
      return {
        person1,
        person2,
        commonAncestor: null,
        path1: chain1,
        path2: chain2,
        distance1: -1,
        distance2: -1,
        relationshipDegree: 'لا توجد صلة قرابة موثقة',
        relationshipType: 'لم يتم العثور على جد مشترك',
        explanation: 'لم يتم العثور على جد مشترك مسجل بين الشخصين في قاعدة البيانات الحالية. قد يتصل النسب عبر فروع تاريخية أقدم لم تُوثق بعد.',
        formattedSummary: `${name1} و${name2}: لا توجد صلة قرابة مسجلة حالياً في قاعدة البيانات.`,
      };
    }

    const ancestorName = commonAncestor.fullLineageName || commonAncestor.fullName;
    const path1 = chain1.slice(0, dist1 + 1);
    const path2 = chain2.slice(0, dist2 + 1);

    let relationshipDegree = '';
    let relationshipType = '';
    let explanation = '';

    if (person1.id === person2.id) {
      relationshipDegree = 'الشخص نفسه';
      relationshipType = 'تطابق كامل للسجل';
      explanation = 'تم اختيار نفس الشخص في كلا طرفي المقارنة.';
    } else if (dist1 === 0 && dist2 === 1) {
      relationshipDegree = 'أب / والِد مباشر';
      relationshipType = 'علاقة أب وابنه';
      explanation = `${name1} هو والد ${name2} المباشر.`;
    } else if (dist1 === 1 && dist2 === 0) {
      relationshipDegree = 'ابن / ابنة مباشرة';
      relationshipType = 'علاقة ابن وأبيه';
      explanation = `${name1} هو ابن ${name2} المباشر.`;
    } else if (dist1 === 0 && dist2 === 2) {
      relationshipDegree = 'جد مباشر';
      relationshipType = 'علاقة جد وحفيد';
      explanation = `${name1} هو جد ${name2} المباشر.`;
    } else if (dist1 === 2 && dist2 === 0) {
      relationshipDegree = 'حفيد مباشر';
      relationshipType = 'علاقة حفيد وجد';
      explanation = `${name1} هو حفيد ${name2} المباشر.`;
    } else if (dist1 === 0 && dist2 > 2) {
      relationshipDegree = `جد من الجيل ${dist2}`;
      relationshipType = 'نسب صاعد مباشر';
      explanation = `${name1} هو جد مباشر في الجيل ${dist2} لـ ${name2}.`;
    } else if (dist1 > 2 && dist2 === 0) {
      relationshipDegree = `حفيد من الجيل ${dist1}`;
      relationshipType = 'نسب نازل مباشر';
      explanation = `${name1} هو حفيد مباشر في الجيل ${dist1} لـ ${name2}.`;
    } else if (dist1 === 1 && dist2 === 1) {
      relationshipDegree = 'إخوة أشقاء / لأب';
      relationshipType = 'إخوة من نفس الوالد';
      explanation = `${name1} و${name2} شقيقان يشتركان في الأب المباشر (${ancestorName}).`;
    } else if (dist1 === 1 && dist2 === 2) {
      relationshipDegree = 'عم وابن أخ';
      relationshipType = 'قرابة الأعمام المباشرة';
      explanation = `${name1} هو عم ${name2} (أخو أبيه).`;
    } else if (dist1 === 2 && dist2 === 1) {
      relationshipDegree = 'ابن أخ وعم';
      relationshipType = 'قرابة أبناء الأخوة';
      explanation = `${name1} هو ابن أخ ${name2}.`;
    } else if (dist1 === 2 && dist2 === 2) {
      relationshipDegree = 'أبناء عمومة من الدرجة الأولى';
      relationshipType = 'أبناء عمومة شقيقين';
      explanation = `${name1} و${name2} يلتقيان في الجد الثاني (${ancestorName})، فهما أبناء عمومة مباشرين من الدرجة الأولى.`;
    } else {
      const maxDist = Math.max(dist1, dist2);
      const degreeIndex = maxDist - 1;
      const degreeStr = getArabicDegreeWord(degreeIndex);
      const ordinalStr = getArabicOrdinal(maxDist);

      relationshipDegree = `أبناء عمومة من الدرجة ${degreeStr}`;
      relationshipType = `التقاء في ${ordinalStr}`;
      explanation = `أنتما تنحدران من ${ordinalStr} المشترك (${ancestorName})، لذلك تنتميان إلى نفس الفرع العائلي وسلسلة النسب المتصلة.`;
    }

    const ordinalName = getArabicOrdinal(Math.max(dist1, dist2));
    const formattedSummary = `${name1} و${name2} يلتقيان في ${ordinalName}: ${ancestorName}. العلاقة: ${relationshipDegree}.`;

    return {
      person1,
      person2,
      commonAncestor,
      path1,
      path2,
      distance1: dist1,
      distance2: dist2,
      relationshipDegree,
      relationshipType,
      explanation,
      formattedSummary,
    };
  } catch (error) {
    console.error('Relationship analysis failed:', error);
    throw new Error('فشل تحليل صلة القرابة بين الشخصين', { cause: error });
  }
}

/**
 * Genealogy Data Automatic Validation Engine
 */
export async function validateGenealogyData(): Promise<{
  issues: GenealogyValidationIssue[];
  summary: { totalIssues: number; highCount: number; mediumCount: number; lowCount: number };
}> {
  const allPeopleRaw = await db.select().from(people);
  const allPeople = enrichPeopleWithLineage(allPeopleRaw as Person[]);
  const map = new Map<number, Person>();
  allPeople.forEach((p) => map.set(p.id, p));

  const issues: GenealogyValidationIssue[] = [];
  const currentYear = new Date().getFullYear();

  for (const p of allPeople) {
    // 1. Check circular parent loops
    let curr: Person | undefined = p;
    const visited = new Set<number>();
    while (curr && curr.fatherId) {
      if (visited.has(curr.fatherId)) {
        issues.push({
          id: `loop_${p.id}_${curr.fatherId}`,
          severity: 'high',
          category: 'loop',
          title: 'حلقة نسب دائرية غير منطقية',
          description: `السجل يحتوي على تكرار حلقي في تسلسل الأبوة بين ${p.fullName} والوالد المانح ID: ${curr.fatherId}`,
          personId: p.id,
          personName: p.fullName,
          suggestedFix: 'قم بتصحيح رقم ربط الأب (fatherId) لفك الحلقة التكرارية الدائرية.',
        });
        break;
      }
      visited.add(curr.id);
      curr = map.get(curr.fatherId);
    }

    // 2. Check birth/death year validity
    const birthYr = p.birthDate ? parseInt(p.birthDate) : p.birthYear;
    const deathYr = p.deathDate ? parseInt(p.deathDate) : undefined;

    if (birthYr) {
      if (birthYr > currentYear) {
        issues.push({
          id: `invalid_birth_${p.id}`,
          severity: 'high',
          category: 'invalid_date',
          title: 'سنة ميلاد مستقبلية خاطئة',
          description: `سنة الميلاد المسجلة (${birthYr}) أكبر من السنة الحالية (${currentYear}).`,
          personId: p.id,
          personName: p.fullName,
          suggestedFix: 'عدّل سنة الميلاد لتكون سنة تاريخية سابقة.',
        });
      }

      if (deathYr) {
        if (deathYr < birthYr) {
          issues.push({
            id: `death_before_birth_${p.id}`,
            severity: 'high',
            category: 'invalid_date',
            title: 'سنة الوفاة أسبق من الميلاد',
            description: `سنة الوفاة (${deathYr}) أسبق من سنة الميلاد المسجلة (${birthYr}).`,
            personId: p.id,
            personName: p.fullName,
            suggestedFix: 'مراجعة تاريخ الميلاد وتاريخ الوفاة وتصحيحهما.',
          });
        }
        if (deathYr - birthYr > 120) {
          issues.push({
            id: `unrealistic_age_${p.id}`,
            severity: 'low',
            category: 'invalid_date',
            title: 'عمر غير واقعي (> 120 سنة)',
            description: `العمر المحسوب بين الميلاد والوفاة هو ${deathYr - birthYr} سنة.`,
            personId: p.id,
            personName: p.fullName,
            suggestedFix: 'التحقق من صحة تاريخي الميلاد والوفاة.',
          });
        }
      }
    }

    // 3. Child born before parent or parent too young (< 12 yrs at child birth)
    if (p.fatherId) {
      const father = map.get(p.fatherId);
      if (father) {
        const fatherBirth = father.birthDate ? parseInt(father.birthDate) : father.birthYear;
        if (birthYr && fatherBirth) {
          if (birthYr <= fatherBirth) {
            issues.push({
              id: `child_before_father_${p.id}`,
              severity: 'high',
              category: 'parent_child_date',
              title: 'الابن مولود قبل الأب أو في نفس سنته',
              description: `${p.fullName} (مولود ${birthYr}) مسجل كابن لـ ${father.fullName} (مولود ${fatherBirth}).`,
              personId: p.id,
              personName: p.fullName,
              relatedPersonId: father.id,
              relatedPersonName: father.fullName,
              suggestedFix: 'تعديل تواريخ ميلاد الأب والابن للاتساق الزمني.',
            });
          } else if (birthYr - fatherBirth < 12) {
            issues.push({
              id: `father_too_young_${p.id}`,
              severity: 'medium',
              category: 'parent_child_date',
              title: 'فارق العمر بين الأب والابن ضئيل جداً (< 12 سنة)',
              description: `الفارق الزمني بين الأب ${father.fullName} وابنه ${p.fullName} هو ${birthYr - fatherBirth} سنة فقط.`,
              personId: p.id,
              personName: p.fullName,
              relatedPersonId: father.id,
              relatedPersonName: father.fullName,
              suggestedFix: 'تأكد من دقة تواريخ الميلاد لكلا السجلين.',
            });
          }
        }
      } else {
        issues.push({
          id: `orphan_father_${p.id}`,
          severity: 'medium',
          category: 'missing_parent',
          title: 'رقم الأب المربوط غير موجود بقاعدة البيانات',
          description: `تم ربط ${p.fullName} برقم أب (${p.fatherId}) غير متوفر حالياً في السجلات.`,
          personId: p.id,
          personName: p.fullName,
          suggestedFix: 'ربط السجل بالأب الصحيح أو تفريغ الربط.',
        });
      }
    }

    // 4. Incomplete essential information
    if (!p.fullName || p.fullName.trim().length < 2) {
      issues.push({
        id: `incomplete_name_${p.id}`,
        severity: 'medium',
        category: 'incomplete',
        title: 'اسم الشخص غير مكتمل',
        description: `سجل الشخص يحتوي على اسم ناقص أو فارغ.`,
        personId: p.id,
        personName: p.fullName || 'بدون اسم',
        suggestedFix: 'إدخال الاسم الكامل للشخص.',
      });
    }

    // 5. Possible Duplicates (same normalized name & fatherId/tribe)
    const normalizedCurr = normalizeArabicText(p.fullName);
    for (const other of allPeople) {
      if (other.id <= p.id) continue;
      const normalizedOther = normalizeArabicText(other.fullName);
      if (
        normalizedCurr === normalizedOther &&
        ((p.fatherId && p.fatherId === other.fatherId) ||
          (p.tribe && p.tribe === other.tribe))
      ) {
        issues.push({
          id: `dup_${p.id}_${other.id}`,
          severity: 'high',
          category: 'duplicate',
          title: 'احتمالية سجل مكرر بنفس الاسم المكتمل والفرع',
          description: `السجل ${p.fullName} (ID: ${p.id}) يطابق السجل ${other.fullName} (ID: ${other.id}).`,
          personId: p.id,
          personName: p.fullName,
          relatedPersonId: other.id,
          relatedPersonName: other.fullName,
          suggestedFix: 'دمج السجلين أو تمييز أحدهما باللقب/الموقع.',
        });
      }
    }
  }

  const highCount = issues.filter((i) => i.severity === 'high').length;
  const mediumCount = issues.filter((i) => i.severity === 'medium').length;
  const lowCount = issues.filter((i) => i.severity === 'low').length;

  return {
    issues,
    summary: {
      totalIssues: issues.length,
      highCount,
      mediumCount,
      lowCount,
    },
  };
}

/**
 * Extract 4-part full name tokens for exact 4-part duplicate detection
 */
export function extractFourPartName(
  p: Person,
  map: Map<number, Person>
): { fourPartName: string; normalizedKey: string } | null {
  let lineageStr = p.fullLineageName || '';
  if (!lineageStr || lineageStr.trim().length === 0) {
    const names: string[] = [p.fullName || ''];
    let currId = p.fatherId;
    let depth = 0;
    while (currId && depth < 5) {
      const f = map.get(currId);
      if (!f) break;
      names.push(f.fullName || '');
      currId = f.fatherId;
      depth++;
    }
    lineageStr = names.join(' ');
  }

  // Tokenize and strip particle words
  const cleanStr = lineageStr
    .replace(/\s+(?:بن|ابن)\s+/g, ' ')
    .replace(/^(?:بن|ابن)\s+/g, '')
    .trim();

  const words = cleanStr
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w && !['بن', 'ابن', 'رحمه', 'الله', 'المرجوم'].includes(w));

  // Three-part names or less MUST NOT generate a duplicate-name warning!
  if (words.length < 4) {
    return null;
  }

  const fourPartTokens = words.slice(0, 4);
  const fourPartName = fourPartTokens.join(' ');
  const normalizedKey = normalizeArabicText(fourPartName);

  return { fourPartName, normalizedKey };
}

/**
 * Approve two records as different people (persists decision across app refreshes)
 */
export async function approveDifferentPeople(
  person1Id: number,
  person2Id: number,
  normalizedName: string,
  adminEmail?: string
) {
  const p1 = Math.min(person1Id, person2Id);
  const p2 = Math.max(person1Id, person2Id);

  try {
    const existing = await db
      .select()
      .from(duplicateReviews)
      .where(
        and(
          eq(duplicateReviews.person1Id, p1),
          eq(duplicateReviews.person2Id, p2)
        )
      );

    if (existing.length > 0) {
      await db
        .update(duplicateReviews)
        .set({
          status: 'approved_different',
          reviewedBy: adminEmail || 'Admin',
          updatedAt: new Date(),
        })
        .where(eq(duplicateReviews.id, existing[0].id));
    } else {
      await db.insert(duplicateReviews).values({
        person1Id: p1,
        person2Id: p2,
        normalizedName: normalizedName || '',
        status: 'approved_different',
        reviewedBy: adminEmail || 'Admin',
      });
    }

    await db.insert(auditLogs).values({
      adminUid: adminEmail || 'admin',
      adminEmail: adminEmail || 'Admin',
      action: 'APPROVE_DIFFERENT_PERSONS',
      targetPersonId: p1,
      details: `تم اعتماد السجلين #${p1} و #${p2} كشخصين مختلفين مستقلين`,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error in approveDifferentPeople:', err);
    throw err;
  }
}

/**
 * Safely merge duplicate person record into primary record
 */
export async function mergePeopleRecords(
  primaryId: number,
  duplicateId: number,
  adminEmail?: string
) {
  if (primaryId === duplicateId) {
    throw new Error('لا يمكن دمج السجل مع نفسه');
  }

  const [primaryRecord] = await db.select().from(people).where(eq(people.id, primaryId));
  const [duplicateRecord] = await db.select().from(people).where(eq(people.id, duplicateId));

  if (!primaryRecord || !duplicateRecord) {
    throw new Error('السجل الرئيسي أو السجل المكرر غير موجود بقاعدة البيانات');
  }

  // 1. Re-link children fatherId
  await db
    .update(people)
    .set({ fatherId: primaryId })
    .where(eq(people.fatherId, duplicateId));

  // 2. Re-link children motherId
  await db
    .update(people)
    .set({ motherId: primaryId })
    .where(eq(people.motherId, duplicateId));

  // 3. Re-link photos
  await db
    .update(photos)
    .set({ personId: primaryId })
    .where(eq(photos.personId, duplicateId));

  // 4. Re-link documents
  await db
    .update(documents)
    .set({ personId: primaryId })
    .where(eq(documents.personId, duplicateId));

  // 5. Merge missing fields into primary record
  const updates: Record<string, any> = {};
  if (!primaryRecord.fatherId && duplicateRecord.fatherId) updates.fatherId = duplicateRecord.fatherId;
  if (!primaryRecord.motherId && duplicateRecord.motherId) updates.motherId = duplicateRecord.motherId;
  if (!primaryRecord.birthDate && duplicateRecord.birthDate) updates.birthDate = duplicateRecord.birthDate;
  if (!primaryRecord.deathDate && duplicateRecord.deathDate) updates.deathDate = duplicateRecord.deathDate;
  if (!primaryRecord.photoUrl && duplicateRecord.photoUrl) updates.photoUrl = duplicateRecord.photoUrl;
  if (!primaryRecord.biography && duplicateRecord.biography) updates.biography = duplicateRecord.biography;
  if (!primaryRecord.occupation && duplicateRecord.occupation) updates.occupation = duplicateRecord.occupation;
  if (!primaryRecord.tribe && duplicateRecord.tribe) updates.tribe = duplicateRecord.tribe;
  if (!primaryRecord.branch && duplicateRecord.branch) updates.branch = duplicateRecord.branch;

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await db.update(people).set(updates).where(eq(people.id, primaryId));
  }

  // 6. Record in duplicateReviews as resolved
  const p1 = Math.min(primaryId, duplicateId);
  const p2 = Math.max(primaryId, duplicateId);

  try {
    await db.insert(duplicateReviews).values({
      person1Id: p1,
      person2Id: p2,
      normalizedName: normalizeArabicText(primaryRecord.fullName),
      status: 'resolved',
      reviewedBy: adminEmail || 'Admin',
    });
  } catch (err) {
    console.warn('Could not insert duplicateReview record:', err);
  }

  // 7. Delete duplicate record
  await db.delete(people).where(eq(people.id, duplicateId));

  // 8. Audit log
  await db.insert(auditLogs).values({
    adminUid: adminEmail || 'admin',
    adminEmail: adminEmail || 'Admin',
    action: 'MERGE_PERSON_RECORDS',
    targetPersonId: primaryId,
    details: `تم دمج السجل المكرر #${duplicateId} (${duplicateRecord.fullName}) في السجل الأساسي #${primaryId} (${primaryRecord.fullName})`,
  });

  return { success: true, primaryId };
}

/**
 * Build complete Admin Data Audit, Verification, & Review payload
 */
export async function getDataReviewDashboard(): Promise<DataReviewDashboardPayload> {
  const allPeopleRaw = await db.select().from(people);
  const allPeople = enrichPeopleWithLineage(allPeopleRaw as Person[]);
  const map = new Map<number, Person>();
  allPeople.forEach((p) => map.set(p.id, p));

  // Fetch approved/resolved duplicate pairs
  const reviewedPairsSet = new Set<string>();
  try {
    const reviews = await db.select().from(duplicateReviews);
    reviews.forEach((r) => {
      const p1 = Math.min(r.person1Id, r.person2Id);
      const p2 = Math.max(r.person1Id, r.person2Id);
      reviewedPairsSet.add(`${p1}_${p2}`);
    });
  } catch (e) {
    console.warn('duplicate_reviews table check:', e);
  }

  // 1. Group records by exact 4-part name
  const groupsBy4Part = new Map<string, { fourPartName: string; people: Person[] }>();

  for (const p of allPeople) {
    const res = extractFourPartName(p, map);
    if (res) {
      const existing = groupsBy4Part.get(res.normalizedKey);
      if (existing) {
        existing.people.push(p);
      } else {
        groupsBy4Part.set(res.normalizedKey, {
          fourPartName: res.fourPartName,
          people: [p],
        });
      }
    }
  }

  const duplicateWarnings: FourPartDuplicateWarning[] = [];

  for (const [normKey, group] of groupsBy4Part.entries()) {
    if (group.people.length >= 2) {
      for (let i = 0; i < group.people.length; i++) {
        for (let j = i + 1; j < group.people.length; j++) {
          const p1 = group.people[i];
          const p2 = group.people[j];
          const pairKey = `${Math.min(p1.id, p2.id)}_${Math.max(p1.id, p2.id)}`;

          if (!reviewedPairsSet.has(pairKey)) {
            duplicateWarnings.push({
              id: `dup_4part_${pairKey}`,
              pairKey,
              normalized4PartName: normKey,
              original4PartName: group.fourPartName,
              person1: p1,
              person2: p2,
              status: 'pending',
            });
          }
        }
      }
    }
  }

  // 2. Verification Status Groups
  const unverifiedPeople = allPeople.filter((p) => p.confidenceLevel === 'unverified');
  const needsReviewPeople = allPeople.filter((p) => p.confidenceLevel === 'review');
  const verifiedPeople = allPeople.filter(
    (p) => !p.confidenceLevel || p.confidenceLevel === 'verified'
  );

  // 3. Validation Issues
  const validationRes = await validateGenealogyData();

  return {
    summary: {
      totalPeople: allPeople.length,
      duplicateCount: duplicateWarnings.length,
      unverifiedCount: unverifiedPeople.length,
      needsReviewCount: needsReviewPeople.length,
      verifiedCount: verifiedPeople.length,
    },
    duplicateWarnings,
    unverifiedPeople,
    needsReviewPeople,
    verifiedPeople,
    allPeople,
    validationIssues: validationRes.issues,
  };
}


