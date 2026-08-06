export type Gender = 'male' | 'female';
export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Person {
  id: number;
  fullName: string;
  fatherId?: number | null;
  motherId?: number | null;
  gender: Gender | string;
  familyName?: string | null;
  tribe?: string | null;
  branch?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  birthPlace?: string | null;
  deathPlace?: string | null;
  isDeceased?: boolean | null;
  biography?: string | null;
  occupation?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  confidenceLevel?: 'verified' | 'review' | 'unverified' | string;
  createdBy?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  depth?: number;
  birthYear?: number;
  currentResidence?: string | null;
  // Dynamic relation helpers
  fatherName?: string | null;
  motherName?: string | null;
  grandfatherName?: string | null;
  fullLineageName?: string | null;
  childrenCount?: number;
}

export interface PhotoRecord {
  id: number;
  personId: number;
  url: string;
  caption?: string | null;
  isPublic: boolean | null;
  createdAt?: string | Date | null;
}

export interface DocumentRecord {
  id: number;
  personId: number;
  title: string;
  fileUrl: string;
  fileType?: string | null;
  isPublic: boolean | null;
  createdAt?: string | Date | null;
}

export interface PersonDetail {
  person: Person;
  father?: Person | null;
  mother?: Person | null;
  grandfather?: Person | null;
  greatGrandfather?: Person | null;
  lineageChain: Person[]; // From oldest ancestor down to this person
  children: Person[];
  grandchildren: Person[];
  siblings: Person[]; // Full and half-siblings
  uncles: Person[]; // Uncles (father's brothers)
  cousins: Person[]; // Father's brothers' children
  photos: PhotoRecord[];
  documents: DocumentRecord[];
  totalDescendantsCount?: number;
  generationsCount?: number;
  directBranchesCount?: number;
  brothersCount?: number;
  sistersCount?: number;
}

export interface FamilyTreeNode {
  id: number;
  fullName: string;
  fullLineageName?: string | null;
  gender: Gender | string;
  fatherId?: number | null;
  motherId?: number | null;
  familyName?: string | null;
  tribe?: string | null;
  branch?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  isDeceased?: boolean;
  occupation?: string | null;
  generation: number;
  children: FamilyTreeNode[];
}

export interface AuditLogItem {
  id: number;
  adminUid: string;
  adminEmail?: string | null;
  action: string;
  targetPersonId?: number | null;
  details?: string | null;
  createdAt?: string | Date | null;
}

export interface AppUser {
  id: number;
  uid: string;
  email: string;
  name?: string | null;
  role: UserRole | string;
  isActive?: boolean;
  createdAt?: string | Date | null;
}

export interface GenealogyStatistics {
  totalPeople: number;
  totalMales: number;
  totalFemales: number;
  totalLiving: number;
  totalDeceased: number;
  totalFamilies: number;
  totalTribes: number;
  totalGenerations: number;
  largestBranch: {
    ancestorName: string;
    descendantsCount: number;
  };
  mostDescendantsPerson?: {
    id: number;
    fullName: string;
    descendantsCount: number;
  };
  largestFamilyByMembers?: {
    familyName: string;
    count: number;
  };
  withPhotosCount: number;
  missingInfoCount: number;
  verifiedCount: number;
  reviewCount: number;
  unverifiedCount: number;
  mostCommonNames: { name: string; count: number }[];
  mostCommonTribes: { name: string; count: number }[];
  recentAdditions: Person[];
}

export interface AdminNotification {
  id: string;
  category:
    | 'person_added'
    | 'person_edited'
    | 'person_deleted'
    | 'family_added'
    | 'family_updated'
    | 'edit_submitted'
    | 'merge_request'
    | 'confidence_changed'
    | 'duplicate_detected'
    | 'missing_info'
    | 'ai_issue'
    | 'document_uploaded'
    | 'image_uploaded';
  title: string;
  message: string;
  timestamp: string;
  personId?: number;
  personName?: string;
  familyName?: string;
  adminEmail?: string;
  isRead: boolean;
}

export interface MergeSuggestion {
  person1: Person;
  person2: Person;
  matchScore: number;
  reason: string;
}

export interface PathStep {
  person: Person;
  relationshipToTarget: string;
  distanceFromTarget: number;
}

export interface ComparisonResult {
  person1: Person;
  person2: Person;
  commonAncestor: Person | null;
  path1: PathStep[];
  path2: PathStep[];
  distance1: number;
  distance2: number;
  relationshipDegree: string;
  relationshipType: string;
  explanation: string;
  formattedSummary: string;
}

export interface ComparisonHistoryItem {
  id: string;
  person1Id: number;
  person1Name: string;
  person2Id: number;
  person2Name: string;
  commonAncestorName: string;
  relationshipDegree: string;
  timestamp: string;
}

export interface GenealogyValidationIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category:
    | 'duplicate'
    | 'loop'
    | 'invalid_date'
    | 'parent_child_date'
    | 'missing_parent'
    | 'incomplete';
  title: string;
  description: string;
  personId: number;
  personName: string;
  suggestedFix: string;
  relatedPersonId?: number;
  relatedPersonName?: string;
}

export interface FourPartDuplicateWarning {
  id: string;
  pairKey: string;
  normalized4PartName: string;
  original4PartName: string;
  person1: Person;
  person2: Person;
  status: 'pending' | 'approved_different' | 'resolved';
}

export interface DataReviewDashboardPayload {
  summary: {
    totalPeople: number;
    duplicateCount: number;
    unverifiedCount: number;
    needsReviewCount: number;
    verifiedCount: number;
  };
  duplicateWarnings: FourPartDuplicateWarning[];
  unverifiedPeople: Person[];
  needsReviewPeople: Person[];
  verifiedPeople: Person[];
  allPeople: Person[];
  validationIssues: GenealogyValidationIssue[];
}

