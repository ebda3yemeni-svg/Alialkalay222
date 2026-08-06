import { Person } from '../types.ts';

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

export function getPersonDisplayName(person: Person): string {
  if (!person) return '';
  return person.fullLineageName || person.fullName || '';
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

  // Rank 1: Exact full match
  if (normFullName === normQuery || normLineage === normQuery) {
    return 100000;
  }

  // Rank 2: Name or lineage starts with exact query phrase
  if (normFullName.startsWith(normQuery) || normLineage.startsWith(normQuery)) {
    return 50000 + queryTokens.length * 1000;
  }

  // Rank 3: First name match
  const firstWordName = normFullName.split(/\s+/)[0];
  if (queryTokens.length === 1 && firstWordName === normQuery) {
    return 40000;
  }

  // Rank 4: First + Second name match
  if (queryTokens.length >= 2) {
    const nameWords = normFullName.split(/\s+/);
    if (nameWords.length >= 2 && nameWords[0] === queryTokens[0] && nameWords[1] === queryTokens[1]) {
      return 35000;
    }
  }

  // Rank 5: Direct phrase substring match in name or lineage
  if (normFullName.includes(normQuery) || normLineage.includes(normQuery)) {
    return 20000;
  }

  // Rank 6: Direct phrase substring match in searchable text
  if (searchableText.includes(normQuery)) {
    return 15000;
  }

  // Rank 7: All tokens match in name or lineage
  const allTokensInName = queryTokens.every(
    (token) => normFullName.includes(token) || normLineage.includes(token)
  );
  if (allTokensInName) {
    return 10000;
  }

  // Rank 8: All tokens match in searchable text
  const allTokensInSearchable = queryTokens.every((token) => searchableText.includes(token));
  if (allTokensInSearchable) {
    return 5000;
  }

  // Rank 9: Partial match
  const matchingTokensCount = queryTokens.filter((token) => searchableText.includes(token)).length;
  if (matchingTokensCount > 0) {
    return matchingTokensCount * 100;
  }

  return 0;
}

export function searchPeople(peopleList: Person[], query: string, maxResults = 10): Person[] {
  if (!query || !query.trim()) return peopleList.slice(0, maxResults);

  const scored = peopleList
    .map((person) => ({
      person,
      score: scorePersonMatch(person, query),
    }))
    .filter((item) => item.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((item) => item.person);
}
