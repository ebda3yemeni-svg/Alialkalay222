var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  documents: () => documents,
  documentsRelations: () => documentsRelations,
  duplicateReviews: () => duplicateReviews,
  people: () => people,
  peopleRelations: () => peopleRelations,
  photos: () => photos,
  photosRelations: () => photosRelations,
  users: () => users
});
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").notNull().unique(),
  email: (0, import_pg_core.text)("email").notNull(),
  name: (0, import_pg_core.text)("name"),
  role: (0, import_pg_core.text)("role").notNull().default("viewer"),
  // 'owner', 'admin', 'editor', 'viewer'
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var people = (0, import_pg_core.pgTable)("people", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  fullName: (0, import_pg_core.text)("full_name").notNull(),
  fatherId: (0, import_pg_core.integer)("father_id"),
  motherId: (0, import_pg_core.integer)("mother_id"),
  gender: (0, import_pg_core.text)("gender").notNull().default("male"),
  // 'male' | 'female'
  familyName: (0, import_pg_core.text)("family_name"),
  tribe: (0, import_pg_core.text)("tribe"),
  branch: (0, import_pg_core.text)("branch"),
  birthDate: (0, import_pg_core.text)("birth_date"),
  deathDate: (0, import_pg_core.text)("death_date"),
  birthPlace: (0, import_pg_core.text)("birth_place"),
  deathPlace: (0, import_pg_core.text)("death_place"),
  isDeceased: (0, import_pg_core.boolean)("is_deceased").default(false),
  biography: (0, import_pg_core.text)("biography"),
  occupation: (0, import_pg_core.text)("occupation"),
  phone: (0, import_pg_core.text)("phone"),
  email: (0, import_pg_core.text)("email"),
  photoUrl: (0, import_pg_core.text)("photo_url"),
  notes: (0, import_pg_core.text)("notes"),
  confidenceLevel: (0, import_pg_core.text)("confidence_level").default("verified"),
  createdBy: (0, import_pg_core.text)("created_by"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var photos = (0, import_pg_core.pgTable)("photos", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  personId: (0, import_pg_core.integer)("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  url: (0, import_pg_core.text)("url").notNull(),
  caption: (0, import_pg_core.text)("caption"),
  isPublic: (0, import_pg_core.boolean)("is_public").default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var documents = (0, import_pg_core.pgTable)("documents", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  personId: (0, import_pg_core.integer)("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  title: (0, import_pg_core.text)("title").notNull(),
  fileUrl: (0, import_pg_core.text)("file_url").notNull(),
  fileType: (0, import_pg_core.text)("file_type").default("pdf"),
  isPublic: (0, import_pg_core.boolean)("is_public").default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var auditLogs = (0, import_pg_core.pgTable)("audit_logs", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  adminUid: (0, import_pg_core.text)("admin_uid").notNull(),
  adminEmail: (0, import_pg_core.text)("admin_email"),
  action: (0, import_pg_core.text)("action").notNull(),
  targetPersonId: (0, import_pg_core.integer)("target_person_id"),
  details: (0, import_pg_core.text)("details"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var duplicateReviews = (0, import_pg_core.pgTable)("duplicate_reviews", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  person1Id: (0, import_pg_core.integer)("person1_id").notNull(),
  person2Id: (0, import_pg_core.integer)("person2_id").notNull(),
  normalizedName: (0, import_pg_core.text)("normalized_name").notNull(),
  status: (0, import_pg_core.text)("status").notNull().default("approved_different"),
  // 'approved_different' | 'resolved' | 'dismissed'
  reviewedBy: (0, import_pg_core.text)("reviewed_by"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var peopleRelations = (0, import_drizzle_orm.relations)(people, ({ one, many }) => ({
  father: one(people, {
    fields: [people.fatherId],
    references: [people.id],
    relationName: "fatherChildren"
  }),
  mother: one(people, {
    fields: [people.motherId],
    references: [people.id],
    relationName: "motherChildren"
  }),
  childrenAsFather: many(people, { relationName: "fatherChildren" }),
  childrenAsMother: many(people, { relationName: "motherChildren" }),
  photos: many(photos),
  documents: many(documents)
}));
var photosRelations = (0, import_drizzle_orm.relations)(photos, ({ one }) => ({
  person: one(people, {
    fields: [photos.personId],
    references: [people.id]
  })
}));
var documentsRelations = (0, import_drizzle_orm.relations)(documents, ({ one }) => ({
  person: one(people, {
    fields: [documents.personId],
    references: [people.id]
  })
}));

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new import_pg.Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// server.ts
var import_drizzle_orm4 = require("drizzle-orm");

// src/server/genealogy.ts
var import_drizzle_orm2 = require("drizzle-orm");
function enrichPeopleWithLineage(peopleList) {
  const map = /* @__PURE__ */ new Map();
  for (const p of peopleList) {
    map.set(p.id, p);
  }
  return peopleList.map((p) => {
    let fatherName = null;
    let motherName = null;
    let grandfatherName = null;
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
    const lineageAncestors = [];
    let currentFatherId = p.fatherId;
    let depth = 0;
    const visited = /* @__PURE__ */ new Set([p.id]);
    while (currentFatherId && !visited.has(currentFatherId) && depth < 10) {
      visited.add(currentFatherId);
      const ancestor = map.get(currentFatherId);
      if (!ancestor) break;
      lineageAncestors.push(ancestor);
      currentFatherId = ancestor.fatherId;
      depth++;
    }
    let pName = (p.fullName || "").trim();
    if (!pName) {
      pName = `\u0633\u062C\u0644 #${p.id}`;
    }
    const parts = [pName];
    for (const anc of lineageAncestors) {
      if (!anc.fullName) continue;
      const ancSegments = anc.fullName.split(/\s+(?:بن|ابن)\s+/).map((s) => s.trim()).filter(Boolean);
      for (const seg of ancSegments) {
        if (seg.startsWith("\u0622\u0644 ") || seg.startsWith("\u0627\u0644")) {
          if (!parts.join(" ").includes(seg)) {
            parts.push(seg);
          }
          continue;
        }
        if (!parts.join(" ").includes(seg)) {
          parts.push(`\u0628\u0646 ${seg}`);
        }
      }
    }
    const famOrTribe = p.familyName || (father ? father.familyName : null) || p.tribe || (father ? father.tribe : null);
    if (famOrTribe && !parts.join(" ").includes(famOrTribe)) {
      parts.push(famOrTribe);
    }
    const fullLineageName = parts.join(" ");
    return {
      ...p,
      fullName: pName,
      fatherName,
      motherName,
      grandfatherName,
      fullLineageName
    };
  });
}
function normalizeArabicText(text2) {
  if (!text2) return "";
  let normalized = text2.toLowerCase();
  normalized = normalized.replace(/\u0640/g, "");
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "");
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, "");
  normalized = normalized.replace(/\u06A9/g, "\u0643");
  normalized = normalized.replace(/\u06CC/g, "\u064A");
  normalized = normalized.replace(/[أإآءئؤ]/g, "\u0627");
  normalized = normalized.replace(/ة/g, "\u0647");
  normalized = normalized.replace(/ى/g, "\u064A");
  normalized = normalized.replace(/[٠۰]/g, "0").replace(/[١۱]/g, "1").replace(/[٢۲]/g, "2").replace(/[٣۳]/g, "3").replace(/[٤۴]/g, "4").replace(/[٥۵]/g, "5").replace(/[٦۶]/g, "6").replace(/[٧۷]/g, "7").replace(/[٨۸]/g, "8").replace(/[٩۹]/g, "9");
  normalized = normalized.replace(/عبد\s+/g, "\u0639\u0628\u062F");
  normalized = normalized.replace(/ابن\s+/g, "\u0627\u0628\u0646");
  normalized = normalized.replace(/بن\s+/g, "\u0628\u0646");
  normalized = normalized.replace(/ابو\s+/g, "\u0627\u0628\u0648");
  normalized = normalized.replace(/آل\s+/g, "\u0627\u0644");
  normalized = normalized.replace(/ال\s+/g, "\u0627\u0644");
  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
}
function scorePersonMatch(person, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) return 1;
  const normQuery = normalizeArabicText(searchQuery);
  if (!normQuery) return 0;
  const normFullName = normalizeArabicText(person.fullName || "");
  const normLineage = normalizeArabicText(person.fullLineageName || "");
  const normFather = normalizeArabicText(person.fatherName || "");
  const normGrandfather = normalizeArabicText(person.grandfatherName || "");
  const normMother = normalizeArabicText(person.motherName || "");
  const normFamily = normalizeArabicText(person.familyName || "");
  const normTribe = normalizeArabicText(person.tribe || "");
  const normBranch = normalizeArabicText(person.branch || "");
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
      person.notes
    ].filter(Boolean).join(" ")
  );
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return 0;
  if (normFullName === normQuery || normLineage === normQuery) {
    return 1e5;
  }
  if (normFullName.startsWith(normQuery) || normLineage.startsWith(normQuery)) {
    return 5e4 + queryTokens.length * 1e3;
  }
  const firstWordName = normFullName.split(/\s+/)[0];
  if (queryTokens.length === 1 && firstWordName === normQuery) {
    return 4e4;
  }
  if (queryTokens.length >= 2) {
    const nameWords = normFullName.split(/\s+/);
    if (nameWords.length >= 2 && nameWords[0] === queryTokens[0] && nameWords[1] === queryTokens[1]) {
      return 35e3;
    }
  }
  if (normFullName.includes(normQuery) || normLineage.includes(normQuery)) {
    return 2e4;
  }
  if (searchableText.includes(normQuery)) {
    return 15e3;
  }
  const allTokensInName = queryTokens.every(
    (token) => normFullName.includes(token) || normLineage.includes(token)
  );
  if (allTokensInName) {
    return 1e4;
  }
  const allTokensInSearchable = queryTokens.every((token) => searchableText.includes(token));
  if (allTokensInSearchable) {
    return 5e3;
  }
  const matchingTokensCount = queryTokens.filter((token) => searchableText.includes(token)).length;
  if (matchingTokensCount > 0) {
    return matchingTokensCount * 100;
  }
  return 0;
}
async function getAllPeople(search, tribe, limit = 1e5) {
  try {
    const allRecords = await db.select().from(people);
    const enriched = enrichPeopleWithLineage(allRecords);
    let filtered = enriched;
    if (tribe && tribe.trim() !== "") {
      filtered = filtered.filter((p) => p.tribe === tribe.trim());
    }
    if (search && search.trim() !== "") {
      const scoredList = filtered.map((person) => ({
        person,
        score: scorePersonMatch(person, search)
      }));
      filtered = scoredList.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.person);
    }
    return filtered.slice(0, limit);
  } catch (error) {
    console.error("Database query failed in getAllPeople:", error);
    throw new Error("\u0641\u0634\u0644 \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.", { cause: error });
  }
}
async function getPersonById(id) {
  try {
    const allRecords = await db.select().from(people);
    const enriched = enrichPeopleWithLineage(allRecords);
    const person = enriched.find((p) => p.id === id);
    return person || null;
  } catch (error) {
    console.error("Failed to fetch person by ID:", error);
    throw new Error("\u0641\u0634\u0644 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u062E\u0635 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.", { cause: error });
  }
}
async function getPersonDetail(id, isPublicOnly = true) {
  try {
    const person = await getPersonById(id);
    if (!person) return null;
    const lineageChain = [person];
    let currentFatherId = person.fatherId;
    const visitedIds = /* @__PURE__ */ new Set([person.id]);
    while (currentFatherId && !visitedIds.has(currentFatherId)) {
      visitedIds.add(currentFatherId);
      const fatherNode = await getPersonById(currentFatherId);
      if (!fatherNode) break;
      lineageChain.unshift(fatherNode);
      currentFatherId = fatherNode.fatherId;
    }
    const father = person.fatherId ? await getPersonById(person.fatherId) : null;
    const mother = person.motherId ? await getPersonById(person.motherId) : null;
    const grandfather = father?.fatherId ? await getPersonById(father.fatherId) : null;
    const greatGrandfather = grandfather?.fatherId ? await getPersonById(grandfather.fatherId) : null;
    const children = await db.select().from(people).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(people.fatherId, person.id), (0, import_drizzle_orm2.eq)(people.motherId, person.id)));
    const childIds = children.map((c) => c.id);
    let grandchildren = [];
    if (childIds.length > 0) {
      grandchildren = await db.select().from(people).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.inArray)(people.fatherId, childIds), (0, import_drizzle_orm2.inArray)(people.motherId, childIds)));
    }
    let siblings = [];
    if (person.fatherId || person.motherId) {
      const siblingConditions = [];
      if (person.fatherId) siblingConditions.push((0, import_drizzle_orm2.eq)(people.fatherId, person.fatherId));
      if (person.motherId) siblingConditions.push((0, import_drizzle_orm2.eq)(people.motherId, person.motherId));
      const rawSiblings = await db.select().from(people).where((0, import_drizzle_orm2.or)(...siblingConditions));
      siblings = rawSiblings.filter((s) => s.id !== person.id);
    }
    let uncles = [];
    if (father && father.fatherId) {
      const fatherBrothers = await db.select().from(people).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(people.fatherId, father.fatherId), (0, import_drizzle_orm2.eq)(people.gender, "male")));
      uncles = fatherBrothers.filter((u) => u.id !== father.id);
    }
    let cousins = [];
    const uncleIds = uncles.map((u) => u.id);
    if (uncleIds.length > 0) {
      cousins = await db.select().from(people).where((0, import_drizzle_orm2.inArray)(people.fatherId, uncleIds));
    }
    const rawAll = await db.select().from(people);
    const allPeople = rawAll;
    let totalDescendantsCount = 0;
    let maxGenDepth = 0;
    const computeDescendants = (rootId, depth, visited) => {
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
    computeDescendants(person.id, 1, /* @__PURE__ */ new Set());
    const directBranchesCount = children.filter(
      (c) => allPeople.some((p) => p.fatherId === c.id || p.motherId === c.id)
    ).length;
    const brothersCount = siblings.filter((s) => s.gender === "male").length;
    const sistersCount = siblings.filter((s) => s.gender === "female").length;
    let photosList = await db.select().from(photos).where((0, import_drizzle_orm2.eq)(photos.personId, person.id));
    if (isPublicOnly) {
      photosList = photosList.filter((p) => p.isPublic !== false);
    }
    let documentsList = await db.select().from(documents).where((0, import_drizzle_orm2.eq)(documents.personId, person.id));
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
      sistersCount
    };
  } catch (error) {
    console.error("Failed to compute person details:", error);
    throw new Error("\u0641\u0634\u0644 \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0644\u0623\u0642\u0627\u0631\u0628 \u0644\u0644\u0634\u062E\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628.", { cause: error });
  }
}
async function getFullFamilyTree(rootId) {
  try {
    let buildNode = function(p, gen, visited) {
      visited.add(p.id);
      const childrenNodes = all.filter((c) => (c.fatherId === p.id || c.motherId === p.id) && !visited.has(c.id)).map((c) => buildNode(c, gen + 1, new Set(visited)));
      return {
        id: p.id,
        fullName: p.fullName,
        fullLineageName: p.fullLineageName || p.fullName,
        gender: p.gender || "male",
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
        children: childrenNodes
      };
    };
    const rawAll = await db.select().from(people);
    if (rawAll.length === 0) return [];
    const all = enrichPeopleWithLineage(rawAll);
    const personMap = /* @__PURE__ */ new Map();
    all.forEach((p) => personMap.set(p.id, p));
    let roots = [];
    if (rootId) {
      const target = personMap.get(rootId);
      if (target) {
        let curr = target;
        const visited = /* @__PURE__ */ new Set([curr.id]);
        while (curr.fatherId && personMap.has(curr.fatherId) && !visited.has(curr.fatherId)) {
          visited.add(curr.fatherId);
          curr = personMap.get(curr.fatherId);
        }
        roots = [curr];
      }
    }
    if (roots.length === 0) {
      roots = all.filter((p) => !p.fatherId || !personMap.has(p.fatherId));
    }
    return roots.map((root) => buildNode(root, 1, /* @__PURE__ */ new Set()));
  } catch (error) {
    console.error("Failed to construct family tree graph:", error);
    throw new Error("\u0641\u0634\u0644 \u0628\u0646\u0627\u0621 \u0634\u062C\u0631\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.", { cause: error });
  }
}
async function getDescendantsTree(rootId) {
  try {
    let buildDescendantNode = function(p, gen, visited) {
      visited.add(p.id);
      const children = all.filter(
        (c) => (c.fatherId === p.id || c.motherId === p.id) && !visited.has(c.id)
      );
      const childrenNodes = children.map(
        (c) => buildDescendantNode(c, gen + 1, new Set(visited))
      );
      return {
        id: p.id,
        fullName: p.fullName,
        fullLineageName: p.fullLineageName || p.fullName,
        gender: p.gender || "male",
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
        children: childrenNodes
      };
    };
    const rawAll = await db.select().from(people);
    if (rawAll.length === 0) return null;
    const all = enrichPeopleWithLineage(rawAll);
    const personMap = /* @__PURE__ */ new Map();
    all.forEach((p) => personMap.set(p.id, p));
    const rootPerson = personMap.get(rootId);
    if (!rootPerson) return null;
    return buildDescendantNode(rootPerson, 1, /* @__PURE__ */ new Set());
  } catch (error) {
    console.error("Failed to construct descendants tree graph:", error);
    throw new Error("\u0641\u0634\u0644 \u0628\u0646\u0627\u0621 \u0634\u062C\u0631\u0629 \u0627\u0644\u0630\u0631\u064A\u0629 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.", { cause: error });
  }
}
async function getStatistics() {
  try {
    let getDepth = function(p, visited = /* @__PURE__ */ new Set()) {
      if (visited.has(p.id)) return 1;
      visited.add(p.id);
      const children = all.filter((c) => c.fatherId === p.id || c.motherId === p.id);
      if (children.length === 0) return 1;
      let maxChild = 0;
      for (const child of children) {
        maxChild = Math.max(maxChild, getDepth(child, new Set(visited)));
      }
      return 1 + maxChild;
    };
    const all = await db.select().from(people);
    const totalPeople = all.length;
    const totalMales = all.filter((p) => p.gender === "male").length;
    const totalFemales = all.filter((p) => p.gender === "female").length;
    const totalLiving = all.filter((p) => !p.isDeceased).length;
    const totalDeceased = all.filter((p) => p.isDeceased).length;
    const familySet = new Set(all.map((p) => p.familyName).filter(Boolean));
    const tribeSet = new Set(all.map((p) => p.tribe).filter(Boolean));
    const personMap = /* @__PURE__ */ new Map();
    all.forEach((p) => personMap.set(p.id, p));
    let maxGen = 1;
    const roots = all.filter((p) => !p.fatherId || !personMap.has(p.fatherId));
    roots.forEach((r) => {
      maxGen = Math.max(maxGen, getDepth(r));
    });
    let largestBranch = { ancestorName: "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F", descendantsCount: 0 };
    let mostDescendantsPerson = { id: 0, fullName: "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F", descendantsCount: 0 };
    all.forEach((p) => {
      const descendantsCount = getDepthCount(p, all);
      if (descendantsCount > mostDescendantsPerson.descendantsCount) {
        mostDescendantsPerson = { id: p.id, fullName: p.fullName, descendantsCount };
      }
    });
    roots.forEach((r) => {
      const descendantsCount = getDepthCount(r, all);
      if (descendantsCount > largestBranch.descendantsCount) {
        largestBranch = { ancestorName: r.fullName, descendantsCount };
      }
    });
    const familyCounts = {};
    all.forEach((p) => {
      const fam = p.familyName || p.tribe || "\u0639\u0627\u0626\u0644\u0629 \u0639\u0627\u0645\u0629";
      familyCounts[fam] = (familyCounts[fam] || 0) + 1;
    });
    let largestFamilyByMembers = { familyName: "\u0628\u0646\u064A \u0639\u0644\u064A \u0627\u0644\u0643\u0644\u0639\u064A", count: totalPeople };
    const sortedFamilies = Object.entries(familyCounts).sort((a, b) => b[1] - a[1]);
    if (sortedFamilies.length > 0) {
      largestFamilyByMembers = { familyName: sortedFamilies[0][0], count: sortedFamilies[0][1] };
    }
    const withPhotosCount = all.filter((p) => p.photoUrl && p.photoUrl.trim() !== "").length;
    const missingInfoCount = all.filter(
      (p) => !p.birthDate || !p.fatherId && !p.motherId || !p.familyName && !p.tribe
    ).length;
    const verifiedCount = all.filter((p) => !p.confidenceLevel || p.confidenceLevel === "verified").length;
    const reviewCount = all.filter((p) => p.confidenceLevel === "review").length;
    const unverifiedCount = all.filter((p) => p.confidenceLevel === "unverified").length;
    const firstNameCounts = {};
    const tribeCounts = {};
    all.forEach((p) => {
      const firstName = p.fullName.trim().split(" ")[0];
      if (firstName) {
        firstNameCounts[firstName] = (firstNameCounts[firstName] || 0) + 1;
      }
      if (p.tribe && p.tribe.trim()) {
        const tr = p.tribe.trim();
        tribeCounts[tr] = (tribeCounts[tr] || 0) + 1;
      }
    });
    const mostCommonNames = Object.entries(firstNameCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const mostCommonTribes = Object.entries(tribeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const enrichedAll = enrichPeopleWithLineage(all);
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
      recentAdditions
    };
  } catch (error) {
    console.error("Failed to compute statistics:", error);
    throw new Error("\u0641\u0634\u0644 \u0627\u062D\u062A\u0633\u0627\u0628 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A.", { cause: error });
  }
}
function getDepthCount(p, all, visited = /* @__PURE__ */ new Set()) {
  if (visited.has(p.id)) return 0;
  visited.add(p.id);
  const children = all.filter((c) => c.fatherId === p.id || c.motherId === p.id);
  let count = children.length;
  for (const c of children) {
    count += getDepthCount(c, all, visited);
  }
  return count;
}
async function detectDuplicates(fullName, fatherId) {
  try {
    const all = await db.select().from(people);
    const suggestions = [];
    const cleanName = fullName.trim();
    if (!cleanName) return [];
    for (const p of all) {
      let score = 0;
      let reasons = [];
      if (p.fullName.trim() === cleanName) {
        score += 60;
        reasons.push("\u0627\u0633\u0645 \u0645\u0637\u0627\u0628\u0642 \u062A\u0645\u0627\u0645\u0627\u064B");
      } else if (p.fullName.includes(cleanName) || cleanName.includes(p.fullName)) {
        score += 40;
        reasons.push("\u062A\u0634\u0627\u0628\u0647 \u0641\u064A \u0627\u0644\u0623\u062C\u0632\u0627\u0621 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0645\u0646 \u0627\u0644\u0627\u0633\u0645");
      }
      if (fatherId && p.fatherId === fatherId) {
        score += 40;
        reasons.push("\u0646\u0641\u0633 \u0627\u0644\u0623\u0628 \u0627\u0644\u0645\u0633\u062C\u0644");
      }
      if (score >= 50) {
        suggestions.push({
          person1: { fullName, fatherId },
          person2: p,
          matchScore: score,
          reason: reasons.join(" + ")
        });
      }
    }
    return suggestions;
  } catch (error) {
    console.error("Duplicate search error:", error);
    return [];
  }
}
function getArabicOrdinal(num) {
  const ordinals = {
    1: "\u0627\u0644\u0648\u0627\u0644\u062F / \u0627\u0644\u0623\u0628",
    2: "\u0627\u0644\u062C\u062F \u0627\u0644\u062B\u0627\u0646\u064A",
    3: "\u0627\u0644\u062C\u062F \u0627\u0644\u062B\u0627\u0644\u062B",
    4: "\u0627\u0644\u062C\u062F \u0627\u0644\u0631\u0627\u0628\u0639",
    5: "\u0627\u0644\u062C\u062F \u0627\u0644\u062E\u0627\u0645\u0633",
    6: "\u0627\u0644\u062C\u062F \u0627\u0644\u0633\u0627\u062F\u0633",
    7: "\u0627\u0644\u062C\u062F \u0627\u0644\u0633\u0627\u0628\u0639",
    8: "\u0627\u0644\u062C\u062F \u0627\u0644\u062B\u0627\u0645\u0646",
    9: "\u0627\u0644\u062C\u062F \u0627\u0644\u062A\u0627\u0633\u0639",
    10: "\u0627\u0644\u062C\u062F \u0627\u0644\u0639\u0627\u0634\u0631"
  };
  return ordinals[num] || `\u0627\u0644\u062C\u062F \u0631\u0642\u0645 ${num}`;
}
function getArabicDegreeWord(num) {
  const degrees = {
    1: "\u0627\u0644\u0623\u0648\u0644\u0649",
    2: "\u0627\u0644\u062B\u0627\u0646\u064A\u0629",
    3: "\u0627\u0644\u062B\u0627\u0644\u062B\u0629",
    4: "\u0627\u0644\u0631\u0627\u0628\u0639\u0629",
    5: "\u0627\u0644\u062E\u0627\u0645\u0633\u0629",
    6: "\u0627\u0644\u0633\u0627\u062F\u0633\u0629",
    7: "\u0627\u0644\u0633\u0627\u0628\u0639\u0629",
    8: "\u0627\u0644\u062B\u0627\u0645\u0646\u0629",
    9: "\u0627\u0644\u062A\u0627\u0633\u0639\u0629",
    10: "\u0627\u0644\u0639\u0627\u0634\u0631\u0629"
  };
  return degrees[num] || `${num}`;
}
async function analyzeRelationship(person1Id, person2Id) {
  try {
    const p1Id = Number(person1Id);
    const p2Id = Number(person2Id);
    if (isNaN(p1Id) || isNaN(p2Id)) {
      throw new Error("\u0645\u0639\u0631\u0641\u0627\u062A \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    }
    const rawAll = await db.select().from(people);
    if (rawAll.length === 0) return null;
    const all = enrichPeopleWithLineage(rawAll);
    const personMap = /* @__PURE__ */ new Map();
    all.forEach((p) => personMap.set(Number(p.id), p));
    const person1 = personMap.get(p1Id);
    const person2 = personMap.get(p2Id);
    if (!person1 || !person2) return null;
    const name1 = person1.fullLineageName || person1.fullName;
    const name2 = person2.fullLineageName || person2.fullName;
    const getAncestorsChain = (startPerson) => {
      const chain = [];
      let curr = startPerson;
      let depth = 0;
      const visited = /* @__PURE__ */ new Set();
      while (curr && !visited.has(curr.id)) {
        visited.add(curr.id);
        let stepName = "\u0627\u0644\u0634\u062E\u0635 \u0646\u0641\u0633\u0647";
        if (depth === 1) stepName = "\u0627\u0644\u0623\u0628 / \u0627\u0644\u0648\u0627\u0644\u062F";
        else if (depth === 2) stepName = "\u0627\u0644\u062C\u062F \u0627\u0644\u0645\u0628\u0627\u0634\u0631";
        else if (depth >= 3) stepName = getArabicOrdinal(depth);
        chain.push({
          person: curr,
          relationshipToTarget: stepName,
          distanceFromTarget: depth
        });
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
    let commonAncestor = null;
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
        relationshipDegree: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0644\u0629 \u0642\u0631\u0627\u0628\u0629 \u0645\u0648\u062B\u0642\u0629",
        relationshipType: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062C\u062F \u0645\u0634\u062A\u0631\u0643",
        explanation: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062C\u062F \u0645\u0634\u062A\u0631\u0643 \u0645\u0633\u062C\u0644 \u0628\u064A\u0646 \u0627\u0644\u0634\u062E\u0635\u064A\u0646 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629. \u0642\u062F \u064A\u062A\u0635\u0644 \u0627\u0644\u0646\u0633\u0628 \u0639\u0628\u0631 \u0641\u0631\u0648\u0639 \u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0623\u0642\u062F\u0645 \u0644\u0645 \u062A\u064F\u0648\u062B\u0642 \u0628\u0639\u062F.",
        formattedSummary: `${name1} \u0648${name2}: \u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0644\u0629 \u0642\u0631\u0627\u0628\u0629 \u0645\u0633\u062C\u0644\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.`
      };
    }
    const ancestorName = commonAncestor.fullLineageName || commonAncestor.fullName;
    const path1 = chain1.slice(0, dist1 + 1);
    const path2 = chain2.slice(0, dist2 + 1);
    let relationshipDegree = "";
    let relationshipType = "";
    let explanation = "";
    if (person1.id === person2.id) {
      relationshipDegree = "\u0627\u0644\u0634\u062E\u0635 \u0646\u0641\u0633\u0647";
      relationshipType = "\u062A\u0637\u0627\u0628\u0642 \u0643\u0627\u0645\u0644 \u0644\u0644\u0633\u062C\u0644";
      explanation = "\u062A\u0645 \u0627\u062E\u062A\u064A\u0627\u0631 \u0646\u0641\u0633 \u0627\u0644\u0634\u062E\u0635 \u0641\u064A \u0643\u0644\u0627 \u0637\u0631\u0641\u064A \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629.";
    } else if (dist1 === 0 && dist2 === 1) {
      relationshipDegree = "\u0623\u0628 / \u0648\u0627\u0644\u0650\u062F \u0645\u0628\u0627\u0634\u0631";
      relationshipType = "\u0639\u0644\u0627\u0642\u0629 \u0623\u0628 \u0648\u0627\u0628\u0646\u0647";
      explanation = `${name1} \u0647\u0648 \u0648\u0627\u0644\u062F ${name2} \u0627\u0644\u0645\u0628\u0627\u0634\u0631.`;
    } else if (dist1 === 1 && dist2 === 0) {
      relationshipDegree = "\u0627\u0628\u0646 / \u0627\u0628\u0646\u0629 \u0645\u0628\u0627\u0634\u0631\u0629";
      relationshipType = "\u0639\u0644\u0627\u0642\u0629 \u0627\u0628\u0646 \u0648\u0623\u0628\u064A\u0647";
      explanation = `${name1} \u0647\u0648 \u0627\u0628\u0646 ${name2} \u0627\u0644\u0645\u0628\u0627\u0634\u0631.`;
    } else if (dist1 === 0 && dist2 === 2) {
      relationshipDegree = "\u062C\u062F \u0645\u0628\u0627\u0634\u0631";
      relationshipType = "\u0639\u0644\u0627\u0642\u0629 \u062C\u062F \u0648\u062D\u0641\u064A\u062F";
      explanation = `${name1} \u0647\u0648 \u062C\u062F ${name2} \u0627\u0644\u0645\u0628\u0627\u0634\u0631.`;
    } else if (dist1 === 2 && dist2 === 0) {
      relationshipDegree = "\u062D\u0641\u064A\u062F \u0645\u0628\u0627\u0634\u0631";
      relationshipType = "\u0639\u0644\u0627\u0642\u0629 \u062D\u0641\u064A\u062F \u0648\u062C\u062F";
      explanation = `${name1} \u0647\u0648 \u062D\u0641\u064A\u062F ${name2} \u0627\u0644\u0645\u0628\u0627\u0634\u0631.`;
    } else if (dist1 === 0 && dist2 > 2) {
      relationshipDegree = `\u062C\u062F \u0645\u0646 \u0627\u0644\u062C\u064A\u0644 ${dist2}`;
      relationshipType = "\u0646\u0633\u0628 \u0635\u0627\u0639\u062F \u0645\u0628\u0627\u0634\u0631";
      explanation = `${name1} \u0647\u0648 \u062C\u062F \u0645\u0628\u0627\u0634\u0631 \u0641\u064A \u0627\u0644\u062C\u064A\u0644 ${dist2} \u0644\u0640 ${name2}.`;
    } else if (dist1 > 2 && dist2 === 0) {
      relationshipDegree = `\u062D\u0641\u064A\u062F \u0645\u0646 \u0627\u0644\u062C\u064A\u0644 ${dist1}`;
      relationshipType = "\u0646\u0633\u0628 \u0646\u0627\u0632\u0644 \u0645\u0628\u0627\u0634\u0631";
      explanation = `${name1} \u0647\u0648 \u062D\u0641\u064A\u062F \u0645\u0628\u0627\u0634\u0631 \u0641\u064A \u0627\u0644\u062C\u064A\u0644 ${dist1} \u0644\u0640 ${name2}.`;
    } else if (dist1 === 1 && dist2 === 1) {
      relationshipDegree = "\u0625\u062E\u0648\u0629 \u0623\u0634\u0642\u0627\u0621 / \u0644\u0623\u0628";
      relationshipType = "\u0625\u062E\u0648\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0648\u0627\u0644\u062F";
      explanation = `${name1} \u0648${name2} \u0634\u0642\u064A\u0642\u0627\u0646 \u064A\u0634\u062A\u0631\u0643\u0627\u0646 \u0641\u064A \u0627\u0644\u0623\u0628 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 (${ancestorName}).`;
    } else if (dist1 === 1 && dist2 === 2) {
      relationshipDegree = "\u0639\u0645 \u0648\u0627\u0628\u0646 \u0623\u062E";
      relationshipType = "\u0642\u0631\u0627\u0628\u0629 \u0627\u0644\u0623\u0639\u0645\u0627\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629";
      explanation = `${name1} \u0647\u0648 \u0639\u0645 ${name2} (\u0623\u062E\u0648 \u0623\u0628\u064A\u0647).`;
    } else if (dist1 === 2 && dist2 === 1) {
      relationshipDegree = "\u0627\u0628\u0646 \u0623\u062E \u0648\u0639\u0645";
      relationshipType = "\u0642\u0631\u0627\u0628\u0629 \u0623\u0628\u0646\u0627\u0621 \u0627\u0644\u0623\u062E\u0648\u0629";
      explanation = `${name1} \u0647\u0648 \u0627\u0628\u0646 \u0623\u062E ${name2}.`;
    } else if (dist1 === 2 && dist2 === 2) {
      relationshipDegree = "\u0623\u0628\u0646\u0627\u0621 \u0639\u0645\u0648\u0645\u0629 \u0645\u0646 \u0627\u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0648\u0644\u0649";
      relationshipType = "\u0623\u0628\u0646\u0627\u0621 \u0639\u0645\u0648\u0645\u0629 \u0634\u0642\u064A\u0642\u064A\u0646";
      explanation = `${name1} \u0648${name2} \u064A\u0644\u062A\u0642\u064A\u0627\u0646 \u0641\u064A \u0627\u0644\u062C\u062F \u0627\u0644\u062B\u0627\u0646\u064A (${ancestorName})\u060C \u0641\u0647\u0645\u0627 \u0623\u0628\u0646\u0627\u0621 \u0639\u0645\u0648\u0645\u0629 \u0645\u0628\u0627\u0634\u0631\u064A\u0646 \u0645\u0646 \u0627\u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0648\u0644\u0649.`;
    } else {
      const maxDist = Math.max(dist1, dist2);
      const degreeIndex = maxDist - 1;
      const degreeStr = getArabicDegreeWord(degreeIndex);
      const ordinalStr = getArabicOrdinal(maxDist);
      relationshipDegree = `\u0623\u0628\u0646\u0627\u0621 \u0639\u0645\u0648\u0645\u0629 \u0645\u0646 \u0627\u0644\u062F\u0631\u062C\u0629 ${degreeStr}`;
      relationshipType = `\u0627\u0644\u062A\u0642\u0627\u0621 \u0641\u064A ${ordinalStr}`;
      explanation = `\u0623\u0646\u062A\u0645\u0627 \u062A\u0646\u062D\u062F\u0631\u0627\u0646 \u0645\u0646 ${ordinalStr} \u0627\u0644\u0645\u0634\u062A\u0631\u0643 (${ancestorName})\u060C \u0644\u0630\u0644\u0643 \u062A\u0646\u062A\u0645\u064A\u0627\u0646 \u0625\u0644\u0649 \u0646\u0641\u0633 \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0639\u0627\u0626\u0644\u064A \u0648\u0633\u0644\u0633\u0644\u0629 \u0627\u0644\u0646\u0633\u0628 \u0627\u0644\u0645\u062A\u0635\u0644\u0629.`;
    }
    const ordinalName = getArabicOrdinal(Math.max(dist1, dist2));
    const formattedSummary = `${name1} \u0648${name2} \u064A\u0644\u062A\u0642\u064A\u0627\u0646 \u0641\u064A ${ordinalName}: ${ancestorName}. \u0627\u0644\u0639\u0644\u0627\u0642\u0629: ${relationshipDegree}.`;
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
      formattedSummary
    };
  } catch (error) {
    console.error("Relationship analysis failed:", error);
    throw new Error("\u0641\u0634\u0644 \u062A\u062D\u0644\u064A\u0644 \u0635\u0644\u0629 \u0627\u0644\u0642\u0631\u0627\u0628\u0629 \u0628\u064A\u0646 \u0627\u0644\u0634\u062E\u0635\u064A\u0646", { cause: error });
  }
}
async function validateGenealogyData() {
  const allPeopleRaw = await db.select().from(people);
  const allPeople = enrichPeopleWithLineage(allPeopleRaw);
  const map = /* @__PURE__ */ new Map();
  allPeople.forEach((p) => map.set(p.id, p));
  const issues = [];
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  for (const p of allPeople) {
    let curr = p;
    const visited = /* @__PURE__ */ new Set();
    while (curr && curr.fatherId) {
      if (visited.has(curr.fatherId)) {
        issues.push({
          id: `loop_${p.id}_${curr.fatherId}`,
          severity: "high",
          category: "loop",
          title: "\u062D\u0644\u0642\u0629 \u0646\u0633\u0628 \u062F\u0627\u0626\u0631\u064A\u0629 \u063A\u064A\u0631 \u0645\u0646\u0637\u0642\u064A\u0629",
          description: `\u0627\u0644\u0633\u062C\u0644 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062A\u0643\u0631\u0627\u0631 \u062D\u0644\u0642\u064A \u0641\u064A \u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0623\u0628\u0648\u0629 \u0628\u064A\u0646 ${p.fullName} \u0648\u0627\u0644\u0648\u0627\u0644\u062F \u0627\u0644\u0645\u0627\u0646\u062D ID: ${curr.fatherId}`,
          personId: p.id,
          personName: p.fullName,
          suggestedFix: "\u0642\u0645 \u0628\u062A\u0635\u062D\u064A\u062D \u0631\u0642\u0645 \u0631\u0628\u0637 \u0627\u0644\u0623\u0628 (fatherId) \u0644\u0641\u0643 \u0627\u0644\u062D\u0644\u0642\u0629 \u0627\u0644\u062A\u0643\u0631\u0627\u0631\u064A\u0629 \u0627\u0644\u062F\u0627\u0626\u0631\u064A\u0629."
        });
        break;
      }
      visited.add(curr.id);
      curr = map.get(curr.fatherId);
    }
    const birthYr = p.birthDate ? parseInt(p.birthDate) : p.birthYear;
    const deathYr = p.deathDate ? parseInt(p.deathDate) : void 0;
    if (birthYr) {
      if (birthYr > currentYear) {
        issues.push({
          id: `invalid_birth_${p.id}`,
          severity: "high",
          category: "invalid_date",
          title: "\u0633\u0646\u0629 \u0645\u064A\u0644\u0627\u062F \u0645\u0633\u062A\u0642\u0628\u0644\u064A\u0629 \u062E\u0627\u0637\u0626\u0629",
          description: `\u0633\u0646\u0629 \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0627\u0644\u0645\u0633\u062C\u0644\u0629 (${birthYr}) \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 (${currentYear}).`,
          personId: p.id,
          personName: p.fullName,
          suggestedFix: "\u0639\u062F\u0651\u0644 \u0633\u0646\u0629 \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0644\u062A\u0643\u0648\u0646 \u0633\u0646\u0629 \u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0633\u0627\u0628\u0642\u0629."
        });
      }
      if (deathYr) {
        if (deathYr < birthYr) {
          issues.push({
            id: `death_before_birth_${p.id}`,
            severity: "high",
            category: "invalid_date",
            title: "\u0633\u0646\u0629 \u0627\u0644\u0648\u0641\u0627\u0629 \u0623\u0633\u0628\u0642 \u0645\u0646 \u0627\u0644\u0645\u064A\u0644\u0627\u062F",
            description: `\u0633\u0646\u0629 \u0627\u0644\u0648\u0641\u0627\u0629 (${deathYr}) \u0623\u0633\u0628\u0642 \u0645\u0646 \u0633\u0646\u0629 \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0627\u0644\u0645\u0633\u062C\u0644\u0629 (${birthYr}).`,
            personId: p.id,
            personName: p.fullName,
            suggestedFix: "\u0645\u0631\u0627\u062C\u0639\u0629 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0648\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0648\u0641\u0627\u0629 \u0648\u062A\u0635\u062D\u064A\u062D\u0647\u0645\u0627."
          });
        }
        if (deathYr - birthYr > 120) {
          issues.push({
            id: `unrealistic_age_${p.id}`,
            severity: "low",
            category: "invalid_date",
            title: "\u0639\u0645\u0631 \u063A\u064A\u0631 \u0648\u0627\u0642\u0639\u064A (> 120 \u0633\u0646\u0629)",
            description: `\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0645\u062D\u0633\u0648\u0628 \u0628\u064A\u0646 \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0648\u0627\u0644\u0648\u0641\u0627\u0629 \u0647\u0648 ${deathYr - birthYr} \u0633\u0646\u0629.`,
            personId: p.id,
            personName: p.fullName,
            suggestedFix: "\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u062A\u0627\u0631\u064A\u062E\u064A \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0648\u0627\u0644\u0648\u0641\u0627\u0629."
          });
        }
      }
    }
    if (p.fatherId) {
      const father = map.get(p.fatherId);
      if (father) {
        const fatherBirth = father.birthDate ? parseInt(father.birthDate) : father.birthYear;
        if (birthYr && fatherBirth) {
          if (birthYr <= fatherBirth) {
            issues.push({
              id: `child_before_father_${p.id}`,
              severity: "high",
              category: "parent_child_date",
              title: "\u0627\u0644\u0627\u0628\u0646 \u0645\u0648\u0644\u0648\u062F \u0642\u0628\u0644 \u0627\u0644\u0623\u0628 \u0623\u0648 \u0641\u064A \u0646\u0641\u0633 \u0633\u0646\u062A\u0647",
              description: `${p.fullName} (\u0645\u0648\u0644\u0648\u062F ${birthYr}) \u0645\u0633\u062C\u0644 \u0643\u0627\u0628\u0646 \u0644\u0640 ${father.fullName} (\u0645\u0648\u0644\u0648\u062F ${fatherBirth}).`,
              personId: p.id,
              personName: p.fullName,
              relatedPersonId: father.id,
              relatedPersonName: father.fullName,
              suggestedFix: "\u062A\u0639\u062F\u064A\u0644 \u062A\u0648\u0627\u0631\u064A\u062E \u0645\u064A\u0644\u0627\u062F \u0627\u0644\u0623\u0628 \u0648\u0627\u0644\u0627\u0628\u0646 \u0644\u0644\u0627\u062A\u0633\u0627\u0642 \u0627\u0644\u0632\u0645\u0646\u064A."
            });
          } else if (birthYr - fatherBirth < 12) {
            issues.push({
              id: `father_too_young_${p.id}`,
              severity: "medium",
              category: "parent_child_date",
              title: "\u0641\u0627\u0631\u0642 \u0627\u0644\u0639\u0645\u0631 \u0628\u064A\u0646 \u0627\u0644\u0623\u0628 \u0648\u0627\u0644\u0627\u0628\u0646 \u0636\u0626\u064A\u0644 \u062C\u062F\u0627\u064B (< 12 \u0633\u0646\u0629)",
              description: `\u0627\u0644\u0641\u0627\u0631\u0642 \u0627\u0644\u0632\u0645\u0646\u064A \u0628\u064A\u0646 \u0627\u0644\u0623\u0628 ${father.fullName} \u0648\u0627\u0628\u0646\u0647 ${p.fullName} \u0647\u0648 ${birthYr - fatherBirth} \u0633\u0646\u0629 \u0641\u0642\u0637.`,
              personId: p.id,
              personName: p.fullName,
              relatedPersonId: father.id,
              relatedPersonName: father.fullName,
              suggestedFix: "\u062A\u0623\u0643\u062F \u0645\u0646 \u062F\u0642\u0629 \u062A\u0648\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0644\u0643\u0644\u0627 \u0627\u0644\u0633\u062C\u0644\u064A\u0646."
            });
          }
        }
      } else {
        issues.push({
          id: `orphan_father_${p.id}`,
          severity: "medium",
          category: "missing_parent",
          title: "\u0631\u0642\u0645 \u0627\u0644\u0623\u0628 \u0627\u0644\u0645\u0631\u0628\u0648\u0637 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
          description: `\u062A\u0645 \u0631\u0628\u0637 ${p.fullName} \u0628\u0631\u0642\u0645 \u0623\u0628 (${p.fatherId}) \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0627\u0644\u0633\u062C\u0644\u0627\u062A.`,
          personId: p.id,
          personName: p.fullName,
          suggestedFix: "\u0631\u0628\u0637 \u0627\u0644\u0633\u062C\u0644 \u0628\u0627\u0644\u0623\u0628 \u0627\u0644\u0635\u062D\u064A\u062D \u0623\u0648 \u062A\u0641\u0631\u064A\u063A \u0627\u0644\u0631\u0628\u0637."
        });
      }
    }
    if (!p.fullName || p.fullName.trim().length < 2) {
      issues.push({
        id: `incomplete_name_${p.id}`,
        severity: "medium",
        category: "incomplete",
        title: "\u0627\u0633\u0645 \u0627\u0644\u0634\u062E\u0635 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644",
        description: `\u0633\u062C\u0644 \u0627\u0644\u0634\u062E\u0635 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0627\u0633\u0645 \u0646\u0627\u0642\u0635 \u0623\u0648 \u0641\u0627\u0631\u063A.`,
        personId: p.id,
        personName: p.fullName || "\u0628\u062F\u0648\u0646 \u0627\u0633\u0645",
        suggestedFix: "\u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0634\u062E\u0635."
      });
    }
    const normalizedCurr = normalizeArabicText(p.fullName);
    for (const other of allPeople) {
      if (other.id <= p.id) continue;
      const normalizedOther = normalizeArabicText(other.fullName);
      if (normalizedCurr === normalizedOther && (p.fatherId && p.fatherId === other.fatherId || p.tribe && p.tribe === other.tribe)) {
        issues.push({
          id: `dup_${p.id}_${other.id}`,
          severity: "high",
          category: "duplicate",
          title: "\u0627\u062D\u062A\u0645\u0627\u0644\u064A\u0629 \u0633\u062C\u0644 \u0645\u0643\u0631\u0631 \u0628\u0646\u0641\u0633 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0645\u0643\u062A\u0645\u0644 \u0648\u0627\u0644\u0641\u0631\u0639",
          description: `\u0627\u0644\u0633\u062C\u0644 ${p.fullName} (ID: ${p.id}) \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0633\u062C\u0644 ${other.fullName} (ID: ${other.id}).`,
          personId: p.id,
          personName: p.fullName,
          relatedPersonId: other.id,
          relatedPersonName: other.fullName,
          suggestedFix: "\u062F\u0645\u062C \u0627\u0644\u0633\u062C\u0644\u064A\u0646 \u0623\u0648 \u062A\u0645\u064A\u064A\u0632 \u0623\u062D\u062F\u0647\u0645\u0627 \u0628\u0627\u0644\u0644\u0642\u0628/\u0627\u0644\u0645\u0648\u0642\u0639."
        });
      }
    }
  }
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;
  return {
    issues,
    summary: {
      totalIssues: issues.length,
      highCount,
      mediumCount,
      lowCount
    }
  };
}
function extractFourPartName(p, map) {
  let lineageStr = p.fullLineageName || "";
  if (!lineageStr || lineageStr.trim().length === 0) {
    const names = [p.fullName || ""];
    let currId = p.fatherId;
    let depth = 0;
    while (currId && depth < 5) {
      const f = map.get(currId);
      if (!f) break;
      names.push(f.fullName || "");
      currId = f.fatherId;
      depth++;
    }
    lineageStr = names.join(" ");
  }
  const cleanStr = lineageStr.replace(/\s+(?:بن|ابن)\s+/g, " ").replace(/^(?:بن|ابن)\s+/g, "").trim();
  const words = cleanStr.split(/\s+/).map((w) => w.trim()).filter((w) => w && !["\u0628\u0646", "\u0627\u0628\u0646", "\u0631\u062D\u0645\u0647", "\u0627\u0644\u0644\u0647", "\u0627\u0644\u0645\u0631\u062C\u0648\u0645"].includes(w));
  if (words.length < 4) {
    return null;
  }
  const fourPartTokens = words.slice(0, 4);
  const fourPartName = fourPartTokens.join(" ");
  const normalizedKey = normalizeArabicText(fourPartName);
  return { fourPartName, normalizedKey };
}
async function approveDifferentPeople(person1Id, person2Id, normalizedName, adminEmail) {
  const p1 = Math.min(person1Id, person2Id);
  const p2 = Math.max(person1Id, person2Id);
  try {
    const existing = await db.select().from(duplicateReviews).where(
      (0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(duplicateReviews.person1Id, p1),
        (0, import_drizzle_orm2.eq)(duplicateReviews.person2Id, p2)
      )
    );
    if (existing.length > 0) {
      await db.update(duplicateReviews).set({
        status: "approved_different",
        reviewedBy: adminEmail || "Admin",
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm2.eq)(duplicateReviews.id, existing[0].id));
    } else {
      await db.insert(duplicateReviews).values({
        person1Id: p1,
        person2Id: p2,
        normalizedName: normalizedName || "",
        status: "approved_different",
        reviewedBy: adminEmail || "Admin"
      });
    }
    await db.insert(auditLogs).values({
      adminUid: adminEmail || "admin",
      adminEmail: adminEmail || "Admin",
      action: "APPROVE_DIFFERENT_PERSONS",
      targetPersonId: p1,
      details: `\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0633\u062C\u0644\u064A\u0646 #${p1} \u0648 #${p2} \u0643\u0634\u062E\u0635\u064A\u0646 \u0645\u062E\u062A\u0644\u0641\u064A\u0646 \u0645\u0633\u062A\u0642\u0644\u064A\u0646`
    });
    return { success: true };
  } catch (err) {
    console.error("Error in approveDifferentPeople:", err);
    throw err;
  }
}
async function mergePeopleRecords(primaryId, duplicateId, adminEmail) {
  if (primaryId === duplicateId) {
    throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062F\u0645\u062C \u0627\u0644\u0633\u062C\u0644 \u0645\u0639 \u0646\u0641\u0633\u0647");
  }
  const [primaryRecord] = await db.select().from(people).where((0, import_drizzle_orm2.eq)(people.id, primaryId));
  const [duplicateRecord] = await db.select().from(people).where((0, import_drizzle_orm2.eq)(people.id, duplicateId));
  if (!primaryRecord || !duplicateRecord) {
    throw new Error("\u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0623\u0648 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0645\u0643\u0631\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A");
  }
  await db.update(people).set({ fatherId: primaryId }).where((0, import_drizzle_orm2.eq)(people.fatherId, duplicateId));
  await db.update(people).set({ motherId: primaryId }).where((0, import_drizzle_orm2.eq)(people.motherId, duplicateId));
  await db.update(photos).set({ personId: primaryId }).where((0, import_drizzle_orm2.eq)(photos.personId, duplicateId));
  await db.update(documents).set({ personId: primaryId }).where((0, import_drizzle_orm2.eq)(documents.personId, duplicateId));
  const updates = {};
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
    updates.updatedAt = /* @__PURE__ */ new Date();
    await db.update(people).set(updates).where((0, import_drizzle_orm2.eq)(people.id, primaryId));
  }
  const p1 = Math.min(primaryId, duplicateId);
  const p2 = Math.max(primaryId, duplicateId);
  try {
    await db.insert(duplicateReviews).values({
      person1Id: p1,
      person2Id: p2,
      normalizedName: normalizeArabicText(primaryRecord.fullName),
      status: "resolved",
      reviewedBy: adminEmail || "Admin"
    });
  } catch (err) {
    console.warn("Could not insert duplicateReview record:", err);
  }
  await db.delete(people).where((0, import_drizzle_orm2.eq)(people.id, duplicateId));
  await db.insert(auditLogs).values({
    adminUid: adminEmail || "admin",
    adminEmail: adminEmail || "Admin",
    action: "MERGE_PERSON_RECORDS",
    targetPersonId: primaryId,
    details: `\u062A\u0645 \u062F\u0645\u062C \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0645\u0643\u0631\u0631 #${duplicateId} (${duplicateRecord.fullName}) \u0641\u064A \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A #${primaryId} (${primaryRecord.fullName})`
  });
  return { success: true, primaryId };
}
async function getDataReviewDashboard() {
  const allPeopleRaw = await db.select().from(people);
  const allPeople = enrichPeopleWithLineage(allPeopleRaw);
  const map = /* @__PURE__ */ new Map();
  allPeople.forEach((p) => map.set(p.id, p));
  const reviewedPairsSet = /* @__PURE__ */ new Set();
  try {
    const reviews = await db.select().from(duplicateReviews);
    reviews.forEach((r) => {
      const p1 = Math.min(r.person1Id, r.person2Id);
      const p2 = Math.max(r.person1Id, r.person2Id);
      reviewedPairsSet.add(`${p1}_${p2}`);
    });
  } catch (e) {
    console.warn("duplicate_reviews table check:", e);
  }
  const groupsBy4Part = /* @__PURE__ */ new Map();
  for (const p of allPeople) {
    const res = extractFourPartName(p, map);
    if (res) {
      const existing = groupsBy4Part.get(res.normalizedKey);
      if (existing) {
        existing.people.push(p);
      } else {
        groupsBy4Part.set(res.normalizedKey, {
          fourPartName: res.fourPartName,
          people: [p]
        });
      }
    }
  }
  const duplicateWarnings = [];
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
              status: "pending"
            });
          }
        }
      }
    }
  }
  const unverifiedPeople = allPeople.filter((p) => p.confidenceLevel === "unverified");
  const needsReviewPeople = allPeople.filter((p) => p.confidenceLevel === "review");
  const verifiedPeople = allPeople.filter(
    (p) => !p.confidenceLevel || p.confidenceLevel === "verified"
  );
  const validationRes = await validateGenealogyData();
  return {
    summary: {
      totalPeople: allPeople.length,
      duplicateCount: duplicateWarnings.length,
      unverifiedCount: unverifiedPeople.length,
      needsReviewCount: needsReviewPeople.length,
      verifiedCount: verifiedPeople.length
    },
    duplicateWarnings,
    unverifiedPeople,
    needsReviewPeople,
    verifiedPeople,
    allPeople,
    validationIssues: validationRes.issues
  };
}

// src/server/seed.ts
async function seedInitialGenealogyData() {
  try {
    const tableCheck = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people' LIMIT 1;`).catch(() => null);
    if (tableCheck && tableCheck.rowCount && tableCheck.rowCount > 0) {
      console.log("Database schema verified (tables exist).");
      return;
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        uid text NOT NULL UNIQUE,
        email text NOT NULL,
        name text,
        role text NOT NULL DEFAULT 'viewer',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `).catch(() => null);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS people (
        id serial PRIMARY KEY,
        full_name text NOT NULL,
        father_id integer,
        mother_id integer,
        gender text NOT NULL DEFAULT 'male',
        family_name text,
        tribe text,
        branch text,
        birth_date text,
        death_date text,
        birth_place text,
        death_place text,
        is_deceased boolean DEFAULT false,
        biography text,
        occupation text,
        phone text,
        email text,
        photo_url text,
        notes text,
        confidence_level text DEFAULT 'verified',
        created_by text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `).catch(() => null);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id serial PRIMARY KEY,
        person_id integer NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        url text NOT NULL,
        caption text,
        is_public boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `).catch(() => null);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id serial PRIMARY KEY,
        person_id integer NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        title text NOT NULL,
        file_url text NOT NULL,
        file_type text DEFAULT 'pdf',
        is_public boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `).catch(() => null);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        admin_uid text NOT NULL,
        admin_email text,
        action text NOT NULL,
        target_person_id integer,
        details text,
        created_at timestamp DEFAULT now()
      );
    `).catch(() => null);
    console.log("Database schema verification completed.");
  } catch (err) {
    console.log("Note on database schema setup:", err?.message || err);
  }
}

// src/lib/firebase-admin.ts
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "credible-descent-q98sv",
  appId: "1:520164409194:web:94ff0d2e590f7460266f13",
  apiKey: "AIzaSyDA2AcMVuQfSsbfwUoPoSwEEcvRdlQLDD8",
  authDomain: "credible-descent-q98sv.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-159079a3-ee8a-4de6-a732-199103495f58",
  storageBucket: "credible-descent-q98sv.firebasestorage.app",
  messagingSenderId: "520164409194",
  measurementId: "",
  recaptchaSiteKey: ""
};

// src/lib/firebase-admin.ts
if (!(0, import_app.getApps)().length) {
  (0, import_app.initializeApp)({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminAuth = (0, import_auth.getAuth)();

// src/middleware/auth.ts
var import_drizzle_orm3 = require("drizzle-orm");
var syncUser = async (decodedToken) => {
  const email = decodedToken.email || `${decodedToken.uid}@app.local`;
  const name = decodedToken.name || decodedToken.email?.split("@")[0] || "\u0645\u0633\u062A\u062E\u062F\u0645";
  const [existingByUid] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.uid, decodedToken.uid));
  if (existingByUid) {
    const [updated] = await db.update(users).set({ email, name }).where((0, import_drizzle_orm3.eq)(users.id, existingByUid.id)).returning();
    return updated;
  }
  const [existingByEmail] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.email, email));
  if (existingByEmail) {
    const [updated] = await db.update(users).set({ uid: decodedToken.uid, name }).where((0, import_drizzle_orm3.eq)(users.id, existingByEmail.id)).returning();
    return updated;
  }
  const existingUsers = await db.select().from(users);
  const isFirstUser = existingUsers.length === 0;
  const defaultRole = isFirstUser ? "owner" : "viewer";
  const [dbUser] = await db.insert(users).values({
    uid: decodedToken.uid,
    email,
    name,
    role: defaultRole,
    isActive: true
  }).returning();
  return dbUser;
};
var optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await syncUser(decodedToken);
    req.dbUser = dbUser;
  } catch (error) {
    console.warn("Optional auth token invalid:", error);
  }
  next();
};
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await syncUser(decodedToken);
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647\u0627 \u0623\u0648 \u0631\u0645\u0634 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
  }
};
var requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.dbUser?.isActive === false) {
      return res.status(403).json({ error: "\u0639\u0630\u0631\u0627\u064B\u060C \u062A\u0645 \u062A\u062C\u0645\u064A\u062F / \u0625\u064A\u0642\u0627\u0641 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0624\u0642\u062A\u0627\u064B \u0645\u0646 \u0642\u0628\u0644 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629." });
    }
    if (["owner", "admin", "editor"].includes(req.dbUser?.role || "")) {
      return next();
    }
    return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u062A\u062A\u0637\u0644\u0628 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0645\u0634\u0631\u0641" });
  });
};
var requireOwner = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.dbUser?.isActive === false) {
      return res.status(403).json({ error: "\u0639\u0630\u0631\u0627\u064B\u060C \u062A\u0645 \u062A\u062C\u0645\u064A\u062F / \u0625\u064A\u0642\u0627\u0641 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0624\u0642\u062A\u0627\u064B." });
    }
    if (req.dbUser?.role === "owner") {
      return next();
    }
    return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0645\u062E\u0635\u0635\u0629 \u062D\u0635\u0631\u064A\u0627\u064B \u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A" });
  });
};

// src/server/aiAssistant.ts
var import_genai = require("@google/genai");
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("\u0631\u0645\u0632 \u0645\u0641\u062A\u0627\u062D GEMINI_API_KEY \u063A\u064A\u0631 \u0645\u0639\u0631\u0641 \u0641\u064A \u0627\u0644\u0628\u064A\u0626\u0629.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function findMentionedPeople(query, allPeople) {
  if (!query) return [];
  const matched = [];
  for (const person of allPeople) {
    const score = scorePersonMatch(person, query);
    if (score > 0) {
      matched.push({ person, score });
    }
  }
  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, 10).map((m) => m.person);
}
async function processGenealogyAIChat(userPrompt, chatHistory = []) {
  try {
    const allPeople = await getAllPeople();
    const candidatePeople = findMentionedPeople(userPrompt, allPeople);
    let relationshipAnalysisText = "";
    if (candidatePeople.length >= 2) {
      try {
        const comparison = await analyzeRelationship(candidatePeople[0].id, candidatePeople[1].id);
        if (comparison && comparison.commonAncestor) {
          relationshipAnalysisText = `
[\u062A\u062D\u0644\u064A\u0644 \u0635\u0644\u0629 \u0627\u0644\u0642\u0631\u0627\u0628\u0629 \u0627\u0644\u0645\u062D\u0633\u0648\u0628 \u0645\u0646 \u0627\u0644\u0634\u062C\u0631\u0629]:
\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644: ${comparison.person1.fullName} (ID: ${comparison.person1.id})
\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0646\u064A: ${comparison.person2.fullName} (ID: ${comparison.person2.id})
\u0627\u0644\u062C\u062F \u0627\u0644\u0645\u0634\u062A\u0631\u0643: ${comparison.commonAncestor.fullName} (ID: ${comparison.commonAncestor.id})
\u062F\u0631\u062C\u0629 \u0627\u0644\u0642\u0631\u0627\u0628\u0629: ${comparison.relationshipDegree}
\u0646\u0648\u0639 \u0627\u0644\u0642\u0631\u0627\u0628\u0629: ${comparison.relationshipType}
\u0627\u0644\u0634\u0631\u062D \u0627\u0644\u062F\u0642\u064A\u0642: ${comparison.explanation}
\u0645\u0633\u0627\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644 \u062D\u062A\u0649 \u0627\u0644\u062C\u062F \u0627\u0644\u0645\u0634\u062A\u0631\u0643: ${comparison.path1.map((p) => `${p.person.fullName} [ID:${p.person.id}]`).join(" <- ")}
\u0645\u0633\u0627\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0646\u064A \u062D\u062A\u0649 \u0627\u0644\u062C\u062F \u0627\u0644\u0645\u0634\u062A\u0631\u0643: ${comparison.path2.map((p) => `${p.person.fullName} [ID:${p.person.id}]`).join(" <- ")}
`;
        }
      } catch (e) {
        console.error("Error analyzing candidate relationship in AI Assistant:", e);
      }
    }
    const compactPeopleDb = allPeople.map((p) => {
      const parts = [
        `ID:${p.id}`,
        `\u0627\u0644\u0627\u0633\u0645:${p.fullName}`,
        p.fatherId ? `\u0627\u0644\u0623\u0628_ID:${p.fatherId}` : null,
        p.fatherName ? `\u0627\u0633\u0645_\u0627\u0644\u0623\u0628:${p.fatherName}` : null,
        p.grandfatherName ? `\u0627\u0644\u062C\u062F:${p.grandfatherName}` : null,
        p.gender ? `\u0627\u0644\u062C\u0646\u0633:${p.gender === "male" ? "\u0630\u0643\u0631" : "\u0623\u0646\u062B\u0649"}` : null,
        p.tribe ? `\u0627\u0644\u0642\u0628\u064A\u0644\u0629:${p.tribe}` : null,
        p.branch ? `\u0627\u0644\u0641\u0631\u0639:${p.branch}` : null,
        p.birthDate ? `\u0627\u0644\u0645\u064A\u0644\u0627\u062F:${p.birthDate}` : null,
        p.deathDate ? `\u0627\u0644\u0648\u0641\u0627\u0629:${p.deathDate}` : null,
        p.notes ? `\u0645\u0644\u0627\u062D\u0638\u0627\u062A:${p.notes}` : null
      ].filter(Boolean).join(" | ");
      return parts;
    }).join("\n");
    let extraCandidateDetails = "";
    for (const candidate of candidatePeople.slice(0, 4)) {
      try {
        const detail = await getPersonDetail(candidate.id);
        if (detail) {
          extraCandidateDetails += `
[\u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u0648\u0633\u0639\u0629 \u0644\u0644\u0634\u062E\u0635: ${detail.person.fullName} - ID:${detail.person.id}]:
- \u0627\u0644\u0633\u0644\u0633\u0644\u0629 \u0627\u0644\u0646\u0633\u0628\u064A\u0629 \u0627\u0644\u0635\u0627\u0639\u062F\u0629: ${detail.lineageChain.map((p) => `${p.fullName} (ID:${p.id})`).join(" <- ")}
- \u0627\u0644\u0623\u0628: ${detail.father ? `${detail.father.fullName} (ID:${detail.father.id})` : "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644"}
- \u0627\u0644\u062C\u062F: ${detail.grandfather ? `${detail.grandfather.fullName} (ID:${detail.grandfather.id})` : "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644"}
- \u0627\u0644\u0623\u0628\u0646\u0627\u0621 (${detail.children.length}): ${detail.children.map((c) => `${c.fullName} (ID:${c.id})`).join("\u060C ")}
- \u0627\u0644\u0623\u062D\u0641\u0627\u062F (${detail.grandchildren.length}): ${detail.grandchildren.map((g) => `${g.fullName} (ID:${g.id})`).join("\u060C ")}
- \u0627\u0644\u0625\u062E\u0648\u0629 (${detail.siblings.length}): ${detail.siblings.map((s) => `${s.fullName} (ID:${s.id})`).join("\u060C ")}
- \u0627\u0644\u0623\u0639\u0645\u0627\u0645 (${detail.uncles.length}): ${detail.uncles.map((u) => `${u.fullName} (ID:${u.id})`).join("\u060C ")}
`;
        }
      } catch (err) {
        console.error("Error fetching detail for candidate:", err);
      }
    }
    const systemInstruction = `
\u0623\u0646\u062A "\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0623\u0646\u0633\u0627\u0628 \u0627\u0644\u0630\u0643\u064A" \u0627\u0644\u0631\u0633\u0645\u064A \u0644\u0645\u0648\u0633\u0648\u0639\u0629 \u0627\u0644\u0623\u0646\u0633\u0627\u0628 \u0644\u0628\u0646\u064A \u0639\u0644\u064A \u0627\u0644\u0643\u0644\u0639\u064A.
\u0645\u0647\u0645\u062A\u0643 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0639\u0646 \u0623\u064A \u0633\u0624\u0627\u0644 \u0645\u062A\u0639\u0644\u0642 \u0628\u0627\u0644\u0623\u0633\u0645\u0627\u0621\u060C \u0627\u0644\u0623\u0646\u0633\u0627\u0628\u060C \u0627\u0644\u0622\u0628\u0627\u0621\u060C \u0627\u0644\u0623\u0628\u0646\u0627\u0621\u060C \u0627\u0644\u0623\u062D\u0641\u0627\u062F\u060C \u0627\u0644\u0623\u062C\u062F\u0627\u062F\u060C \u0627\u0644\u0633\u0644\u0627\u0644\u0627\u062A\u060C \u0648\u0635\u0641\u0627\u062A \u0635\u0644\u0627\u062A \u0627\u0644\u0642\u0631\u0627\u0628\u0629\u060C \u0648\u0627\u0644\u0628\u062D\u062B \u0628\u0644\u063A\u0629 \u0637\u0628\u064A\u0639\u064A\u0629.

**\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0635\u0627\u0631\u0645\u0629**:
1. \u062A\u0639\u062A\u0645\u062F \u062D\u0635\u0631\u064A\u0627\u064B \u0648100% \u0639\u0644\u0649 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0646\u0633\u0628 \u0627\u0644\u0645\u0631\u0641\u0642\u0629 \u0623\u062F\u0646\u0627\u0647 \u0627\u0644\u0645\u0623\u062E\u0648\u0630\u0629 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629.
2. \u0644\u0627 \u062A\u0628\u062A\u0643\u0631\u060C \u0648\u0644\u0627 \u062A\u062E\u062A\u0631\u0639\u060C \u0648\u0644\u0627 \u062A\u0641\u062A\u0631\u0636 \u0623\u064A \u0645\u0639\u0644\u0648\u0645\u0629 \u0646\u0633\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.
3. \u0625\u0630\u0627 \u0633\u0626\u0644\u062A \u0639\u0646 \u0634\u062E\u0635 \u0623\u0648 \u0635\u0644\u0629 \u0642\u0631\u0627\u0628\u0629 \u063A\u064A\u0631 \u0645\u0633\u062C\u0644\u0629 \u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A\u060C \u0642\u0644 \u0628\u0648\u0636\u0648\u062D \u0648\u0644\u0637\u0641: "\u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u063A\u064A\u0631 \u0645\u0633\u062C\u0644\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0623\u0646\u0633\u0627\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629."
4. **\u062A\u0636\u0645\u064A\u0646 \u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0644\u0644\u0623\u0634\u062E\u0627\u0635**:
   \u0641\u064A \u0643\u0644 \u0645\u0631\u0629 \u062A\u0630\u0643\u0631 \u0641\u064A\u0647\u0627 \u0634\u062E\u0635\u0627\u064B \u0645\u0648\u062C\u0648\u062F\u0627\u064B \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A\u060C \u064A\u062C\u0628 \u0639\u0644\u064A\u0643 \u0643\u062A\u0627\u0628\u0629 \u0627\u0633\u0645\u0647 \u0645\u062A\u0628\u0648\u0639\u0627\u064B \u0623\u0648 \u0645\u063A\u0644\u0641\u0627\u064B \u0628\u0647\u0630\u0647 \u0627\u0644\u0635\u064A\u063A\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0644\u062A\u0645\u0643\u064A\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0646 \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u064A\u0647 \u0648\u0641\u062A\u062D \u0645\u0644\u0641\u0647 \u0645\u0628\u0627\u0634\u0631\u0629:
   \`[person:ID|\u0627\u0633\u0645 \u0627\u0644\u0634\u062E\u0635]\`
   \u0645\u062B\u0627\u0644:
   "\u0648\u0627\u0644\u062F\u0647 \u0647\u0648 [person:12|\u0639\u0644\u064A \u0628\u0646 \u0645\u062D\u0645\u062F \u0627\u0644\u0643\u0644\u0639\u064A]\u060C \u0648\u064A\u0645\u0643\u0646\u0643 \u0641\u062A\u062D \u0645\u0644\u0641\u0647 \u0645\u0646 \u0647\u0646\u0627."
   "\u064A\u0644\u062A\u0642\u064A\u0627\u0646 \u0641\u064A \u0627\u0644\u062C\u062F \u0627\u0644\u0631\u0627\u0628\u0639: [person:45|\u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0628\u0646 \u062B\u0627\u0628\u062A \u0627\u0644\u0643\u0644\u0639\u064A]."
5. \u0627\u062C\u0639\u0644 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u062F\u0642\u064A\u0642\u0629\u060C \u0645\u0646\u0638\u0645\u0629\u060C \u0645\u062D\u062A\u0631\u0645\u0629\u060C \u0648\u0648\u0627\u0636\u062D\u0629 \u062C\u062F\u0627\u064B \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.
6. \u0644\u0627 \u062A\u0642\u0645 \u0628\u062A\u0646\u0641\u064A\u0630 \u0623\u0648 \u0627\u0642\u062A\u0631\u0627\u062D \u0623\u064A \u062A\u0639\u062F\u064A\u0644 \u0623\u0648 \u062D\u0630\u0641 \u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A.

[\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0644\u0623\u0634\u062E\u0627\u0635]:
${compactPeopleDb}

${extraCandidateDetails}

${relationshipAnalysisText}
`;
    const ai = getGeminiClient();
    const formattedContents = [];
    for (const h of chatHistory.slice(-6)) {
      formattedContents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      });
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });
    return response.text || "\u0639\u0630\u0631\u0627\u064B\u060C \u0644\u0645 \u0623\u062A\u0645\u0643\u0646 \u0645\u0646 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u062F\u060C \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.";
  } catch (error) {
    console.error("Error in processGenealogyAIChat:", error);
    throw new Error(error.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0623\u0646\u0633\u0627\u0628 \u0627\u0644\u0630\u0643\u064A");
  }
}
async function getAIAdminSuggestions() {
  try {
    const validation = await validateGenealogyData();
    const allPeople = await getAllPeople();
    const suggestions = validation.issues.map((issue) => {
      let type = "error";
      if (issue.category === "duplicate") type = "duplicate";
      else if (issue.category === "missing_parent" || issue.category === "incomplete") type = "missing";
      return {
        id: issue.id,
        type,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        personId: issue.personId,
        personName: issue.personName,
        relatedPersonId: issue.relatedPersonId || null,
        relatedPersonName: issue.relatedPersonName || null,
        suggestedFix: issue.suggestedFix,
        requiresApproval: true
      };
    });
    return {
      totalSuggestions: suggestions.length,
      suggestions
    };
  } catch (error) {
    console.error("Error in getAIAdminSuggestions:", error);
    throw new Error("\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0644\u0644\u0645\u0634\u0631\u0641\u064A\u0646");
  }
}

// server.ts
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, X-Requested-With, Cache-Control, Pragma"
    );
    res.header("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  await seedInitialGenealogyData();
  try {
    const tableExists = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'duplicate_reviews' LIMIT 1;`).catch(() => null);
    if (!tableExists || !tableExists.rowCount) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS duplicate_reviews (
          id SERIAL PRIMARY KEY,
          person1_id INTEGER NOT NULL,
          person2_id INTEGER NOT NULL,
          normalized_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved_different',
          reviewed_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => null);
    }
  } catch (_err) {
  }
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/auth/me", optionalAuth, async (req, res) => {
    if (!req.dbUser) {
      return res.json({ authenticated: false, role: "viewer" });
    }
    return res.json({
      authenticated: true,
      user: req.dbUser,
      role: req.dbUser.role
    });
  });
  app.get("/api/people", async (req, res) => {
    try {
      const search = req.query.search;
      const tribe = req.query.tribe;
      const limit = req.query.limit ? parseInt(req.query.limit) : 1e5;
      const list = await getAllPeople(search, tribe, limit);
      res.json(list);
    } catch (err) {
      console.error("Error in GET /api/people:", err);
      res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0634\u062E\u0627\u0635" });
    }
  });
  app.get("/api/people/compare", async (req, res) => {
    try {
      const p1 = parseInt(req.query.p1);
      const p2 = parseInt(req.query.p2);
      if (isNaN(p1) || isNaN(p2)) {
        return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0634\u062E\u0635\u064A\u0646 \u0645\u0639\u062A\u0628\u0631\u064A\u0646 \u0645\u0646 \u0645\u0634\u062C\u0631\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0644\u0644\u0645\u0642\u0627\u0631\u0646\u0629" });
      }
      const comparison = await analyzeRelationship(p1, p2);
      if (!comparison) {
        return res.status(404).json({ error: "\u0623\u062D\u062F \u0627\u0644\u0634\u062E\u0635\u064A\u0646 \u0627\u0644\u0645\u062D\u062F\u062F\u064A\u0646 \u0623\u0648 \u0643\u0644\u0627\u0647\u0645\u0627 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0623\u0646\u0633\u0627\u0628" });
      }
      res.json(comparison);
    } catch (err) {
      console.error("Error in GET /api/people/compare:", err);
      res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0642\u0631\u0627\u0628\u0629" });
    }
  });
  app.get("/api/people/:id", optionalAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "\u0645\u0639\u0631\u0651\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      const isAdmin = req.dbUser?.role === "owner" || req.dbUser?.role === "admin";
      const detail = await getPersonDetail(id, !isAdmin);
      if (!detail) {
        return res.status(404).json({ error: "\u0627\u0644\u0634\u062E\u0635 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(detail);
    } catch (err) {
      console.error("Error in GET /api/people/:id:", err);
      res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u062E\u0635" });
    }
  });
  app.post("/api/people", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (!body.fullName || !body.fullName.trim()) {
        return res.status(400).json({ error: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0637\u0644\u0648\u0628" });
      }
      const [newPerson] = await db.insert(people).values({
        fullName: body.fullName.trim(),
        fatherId: body.fatherId ? parseInt(body.fatherId) : null,
        motherId: body.motherId ? parseInt(body.motherId) : null,
        gender: body.gender || "male",
        familyName: body.familyName?.trim() || null,
        tribe: body.tribe?.trim() || null,
        branch: body.branch?.trim() || null,
        birthDate: body.birthDate?.trim() || null,
        deathDate: body.deathDate?.trim() || null,
        birthPlace: body.birthPlace?.trim() || null,
        deathPlace: body.deathPlace?.trim() || null,
        isDeceased: Boolean(body.isDeceased),
        biography: body.biography?.trim() || null,
        occupation: body.occupation?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        photoUrl: body.photoUrl?.trim() || null,
        notes: body.notes?.trim() || null,
        createdBy: req.dbUser?.email || "\u0645\u0634\u0631\u0641"
      }).returning();
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: "\u0625\u0636\u0627\u0641\u0629 \u0634\u062E\u0635 \u062C\u062F\u064A\u062F",
        targetPersonId: newPerson.id,
        details: `\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629: ${newPerson.fullName}`
      });
      pushAdminNotification({
        category: "person_added",
        title: "\u0625\u0636\u0627\u0641\u0629 \u0634\u062E\u0635 \u062C\u062F\u064A\u062F",
        message: `\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0646\u0633\u0628\u064A \u0627\u0644\u062C\u062F\u064A\u062F: (${newPerson.fullName})`,
        personId: newPerson.id,
        personName: newPerson.fullName,
        adminEmail: req.dbUser?.email
      });
      res.status(201).json(newPerson);
    } catch (err) {
      console.error("Error in POST /api/people:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0625\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
    }
  });
  app.put("/api/people/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      const body = req.body;
      const [updated] = await db.update(people).set({
        fullName: body.fullName?.trim(),
        fatherId: body.fatherId ? parseInt(body.fatherId) : null,
        motherId: body.motherId ? parseInt(body.motherId) : null,
        gender: body.gender,
        familyName: body.familyName?.trim() || null,
        tribe: body.tribe?.trim() || null,
        branch: body.branch?.trim() || null,
        birthDate: body.birthDate?.trim() || null,
        deathDate: body.deathDate?.trim() || null,
        birthPlace: body.birthPlace?.trim() || null,
        deathPlace: body.deathPlace?.trim() || null,
        isDeceased: Boolean(body.isDeceased),
        biography: body.biography?.trim() || null,
        occupation: body.occupation?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        photoUrl: body.photoUrl?.trim() || null,
        notes: body.notes?.trim() || null,
        confidenceLevel: body.confidenceLevel || void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm4.eq)(people.id, id)).returning();
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: "\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0634\u062E\u0635",
        targetPersonId: id,
        details: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A: ${updated?.fullName || id}`
      });
      if (updated) {
        pushAdminNotification({
          category: "person_edited",
          title: "\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0634\u062E\u0635",
          message: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0633\u062C\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0634\u062E\u0635: (${updated.fullName})`,
          personId: updated.id,
          personName: updated.fullName,
          adminEmail: req.dbUser?.email
        });
      }
      res.json(updated);
    } catch (err) {
      console.error("Error in PUT /api/people/:id:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
    }
  });
  app.put("/api/people/:id/confidence", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { confidenceLevel } = req.body;
      if (!["verified", "review", "unverified"].includes(confidenceLevel)) {
        return res.status(400).json({ error: "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      const [updated] = await db.update(people).set({
        confidenceLevel,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm4.eq)(people.id, id)).returning();
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: "\u062A\u063A\u064A\u064A\u0631 \u0645\u0624\u0634\u0631 \u0645\u0648\u062B\u0648\u0642\u064A\u0629 \u0627\u0644\u0633\u062C\u0644",
        targetPersonId: id,
        details: `\u062A\u062D\u062F\u064A\u062B \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629 \u0644\u0640 (${updated.fullName}) \u0625\u0644\u0649: ${confidenceLevel}`
      });
      pushAdminNotification({
        category: "confidence_changed",
        title: "\u062A\u063A\u064A\u064A\u0631 \u0645\u0624\u0634\u0631 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629",
        message: `\u062A\u062D\u062F\u064A\u062B \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629 \u0644\u0640 (${updated.fullName}) \u0625\u0644\u0649: ${confidenceLevel === "verified" ? "\u0645\u0648\u062B\u0642 \u0631\u0633\u0645\u064A\u0627\u064B" : confidenceLevel === "review" ? "\u062A\u062D\u062A \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629" : "\u063A\u064A\u0631 \u0645\u0648\u062B\u0642"}`,
        personId: updated.id,
        personName: updated.fullName,
        adminEmail: req.dbUser?.email
      });
      res.json(updated);
    } catch (err) {
      console.error("Error in PUT /api/people/:id/confidence:", err);
      res.status(500).json({ error: "\u0641\u0634\u0644 \u062A\u063A\u064A\u064A\u0631 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629" });
    }
  });
  app.delete("/api/people/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      const target = await getPersonById(id);
      if (!target) return res.status(404).json({ error: "\u0627\u0644\u0634\u062E\u0635 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      await db.update(people).set({ fatherId: null }).where((0, import_drizzle_orm4.eq)(people.fatherId, id));
      await db.update(people).set({ motherId: null }).where((0, import_drizzle_orm4.eq)(people.motherId, id));
      await db.delete(people).where((0, import_drizzle_orm4.eq)(people.id, id));
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: "\u062D\u0630\u0641 \u0634\u062E\u0635",
        targetPersonId: id,
        details: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062E\u0627\u0635 \u0628\u0640: ${target.fullName}`
      });
      pushAdminNotification({
        category: "person_deleted",
        title: "\u062D\u0630\u0641 \u0633\u062C\u0644 \u0646\u0633\u0628\u064A",
        message: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0646\u0633\u0628\u064A \u0627\u0644\u062E\u0627\u0635 \u0628\u0640: (${target.fullName})`,
        personName: target.fullName,
        adminEmail: req.dbUser?.email
      });
      res.json({ success: true, message: "\u062A\u0645 \u0627\u0644\u062D\u0630\u0641 \u0628\u0646\u062C\u0627\u062D \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
    } catch (err) {
      console.error("Error in DELETE /api/people/:id:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u0627\u0644\u062D\u0630\u0641 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
    }
  });
  app.get("/api/tree", async (req, res) => {
    try {
      const rootId = req.query.rootId ? parseInt(req.query.rootId) : void 0;
      const tree = await getFullFamilyTree(rootId);
      res.json(tree);
    } catch (err) {
      console.error("Error in GET /api/tree:", err);
      res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u0645\u064A\u0644 \u0634\u062C\u0631\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629" });
    }
  });
  app.get("/api/people/:id/descendants", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      const descendantsTree = await getDescendantsTree(id);
      if (!descendantsTree) {
        return res.status(404).json({ error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0634\u062E\u0635" });
      }
      res.json(descendantsTree);
    } catch (err) {
      console.error("Error in GET /api/people/:id/descendants:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0634\u062C\u0631\u0629 \u0627\u0644\u0630\u0631\u064A\u0629" });
    }
  });
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await getStatistics();
      res.json(stats);
    } catch (err) {
      console.error("Error in GET /api/statistics:", err);
      res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A" });
    }
  });
  app.post("/api/duplicates/check", requireAdmin, async (req, res) => {
    try {
      const { fullName, fatherId } = req.body;
      const matches = await detectDuplicates(fullName || "", fatherId ? parseInt(fatherId) : null);
      res.json(matches);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/validate-genealogy", requireAdmin, async (req, res) => {
    try {
      const report = await validateGenealogyData();
      res.json(report);
    } catch (err) {
      console.error("Error validating genealogy:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u0627\u0644\u0641\u062D\u0635 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0633\u0628" });
    }
  });
  app.get("/api/admin/data-review", requireAdmin, async (req, res) => {
    try {
      const dashboardPayload = await getDataReviewDashboard();
      res.json(dashboardPayload);
    } catch (err) {
      console.error("Error in GET /api/admin/data-review:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0648\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629" });
    }
  });
  app.post("/api/admin/duplicate-reviews/approve", requireAdmin, async (req, res) => {
    try {
      const { person1Id, person2Id, normalizedName } = req.body;
      if (!person1Id || !person2Id) {
        return res.status(400).json({ error: "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0623\u0648\u0644 \u0648\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062B\u0627\u0646\u064A \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
      }
      const result = await approveDifferentPeople(
        parseInt(person1Id),
        parseInt(person2Id),
        normalizedName || "",
        req.dbUser?.email
      );
      res.json(result);
    } catch (err) {
      console.error("Error in POST /api/admin/duplicate-reviews/approve:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0634\u062E\u0635\u064A\u0646 \u0643\u0645\u062E\u062A\u0644\u0641\u064A\u0646" });
    }
  });
  app.post("/api/admin/merge-people", requireAdmin, async (req, res) => {
    try {
      const { primaryId, duplicateId } = req.body;
      if (!primaryId || !duplicateId) {
        return res.status(400).json({ error: "\u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0648\u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0645\u0643\u0631\u0631 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
      }
      const result = await mergePeopleRecords(
        parseInt(primaryId),
        parseInt(duplicateId),
        req.dbUser?.email
      );
      res.json(result);
    } catch (err) {
      console.error("Error in POST /api/admin/merge-people:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u062F\u0645\u062C \u0627\u0644\u0633\u062C\u0644\u064A\u0646" });
    }
  });
  app.put("/api/people/:id/verification-status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { confidenceLevel } = req.body;
      if (!["verified", "unverified", "review"].includes(confidenceLevel)) {
        return res.status(400).json({ error: "\u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      const personId = parseInt(id);
      const [updated] = await db.update(people).set({ confidenceLevel, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm4.eq)(people.id, personId)).returning();
      await db.insert(auditLogs).values({
        adminUid: req.dbUser?.uid || "admin",
        adminEmail: req.dbUser?.email || "Admin",
        action: "UPDATE_VERIFICATION_STATUS",
        targetPersonId: personId,
        details: `\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u0644\u0644\u0633\u062C\u0644 #${personId} \u0625\u0644\u0649 (${confidenceLevel})`
      });
      res.json(updated);
    } catch (err) {
      console.error("Error updating verification status:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u062B\u064A\u0642" });
    }
  });
  app.post("/api/ai/genealogy-chat", async (req, res) => {
    try {
      const { prompt, history } = req.body;
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0645\u0637\u0644\u0648\u0628" });
      }
      const reply = await processGenealogyAIChat(prompt.trim(), history || []);
      res.json({ reply });
    } catch (err) {
      console.error("Error in POST /api/ai/genealogy-chat:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0623\u0646\u0633\u0627\u0628 \u0627\u0644\u0630\u0643\u064A" });
    }
  });
  app.get("/api/ai/admin-suggestions", requireAdmin, async (req, res) => {
    try {
      const suggestions = await getAIAdminSuggestions();
      res.json(suggestions);
    } catch (err) {
      console.error("Error in GET /api/ai/admin-suggestions:", err);
      res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" });
    }
  });
  let adminNotificationsStore = [];
  let storeInitialized = false;
  async function initAdminNotificationsStore() {
    if (storeInitialized) return;
    storeInitialized = true;
    try {
      const logs = await db.select().from(auditLogs).limit(30);
      logs.forEach((log) => {
        let cat = "edit_submitted";
        if (log.action.includes("\u0625\u0636\u0627\u0641\u0629")) cat = "person_added";
        if (log.action.includes("\u062D\u0630\u0641")) cat = "person_deleted";
        if (log.action.includes("\u0645\u0648\u062B\u0648\u0642\u064A\u0629")) cat = "confidence_changed";
        if (log.action.includes("\u0635\u0648\u0631\u0629")) cat = "image_uploaded";
        if (log.action.includes("\u0648\u062B\u064A\u0642\u0629")) cat = "document_uploaded";
        adminNotificationsStore.push({
          id: `log-${log.id}`,
          category: cat,
          title: log.action,
          message: log.details || "\u062A\u0645 \u062A\u0646\u0641\u064A\u0630 \u0625\u062C\u0631\u0627\u0621 \u0625\u062F\u0627\u0631\u064A \u0639\u0644\u0649 \u0627\u0644\u0646\u0638\u0627\u0645",
          timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          personId: log.targetPersonId || void 0,
          adminEmail: log.adminEmail || void 0,
          isRead: false
        });
      });
      const validationReport = await validateGenealogyData();
      if (validationReport && validationReport.issues) {
        validationReport.issues.slice(0, 15).forEach((iss, idx) => {
          let cat = "ai_issue";
          if (iss.category === "duplicate") cat = "duplicate_detected";
          if (iss.category === "incomplete" || iss.category === "missing_parent") cat = "missing_info";
          adminNotificationsStore.push({
            id: `issue-${iss.id || idx}`,
            category: cat,
            title: iss.title,
            message: iss.description,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            personId: iss.personId,
            personName: iss.personName,
            isRead: false
          });
        });
      }
      const seedDefaults = [
        {
          category: "person_added",
          title: "\u0625\u0636\u0627\u0641\u0629 \u0634\u062E\u0635 \u062C\u062F\u064A\u062F \u0625\u0644\u0649 \u0627\u0644\u0634\u062C\u0631\u0629",
          message: "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0633\u062C\u0644 \u0646\u0633\u0628\u064A \u062C\u062F\u064A\u062F \u0644\u0644\u0634\u064A\u062E \u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0628\u0646 \u0645\u062D\u0645\u062F \u0622\u0644 \u0633\u0639\u0648\u062F.",
          personId: 1,
          personName: "\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0628\u0646 \u0645\u062D\u0645\u062F \u0622\u0644 \u0633\u0639\u0648\u062F",
          adminEmail: "admin@genealogy.sa"
        },
        {
          category: "person_edited",
          title: "\u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0634\u062E\u0635",
          message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0635\u0641 \u0627\u0644\u0633\u064A\u0631\u0629 \u0627\u0644\u0630\u0627\u062A\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0633\u062C\u0644 \u0627\u0644\u0623\u0645\u064A\u0631 \u0633\u0644\u0645\u0627\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0639\u0632\u064A\u0632.",
          personId: 2,
          personName: "\u0633\u0644\u0645\u0627\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0639\u0632\u064A\u0632",
          adminEmail: "editor@genealogy.sa"
        },
        {
          category: "family_added",
          title: "\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639 \u0639\u0627\u0626\u0644\u0629 \u062C\u062F\u064A\u062F",
          message: '\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639 \u0639\u0627\u0626\u0644\u0629 "\u0622\u0644 \u0625\u0628\u0631\u0627\u0647\u064A\u0645" \u0648\u062A\u0648\u062B\u064A\u0642 \u0646\u0633\u0628\u0647\u0645 \u0628\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A.',
          familyName: "\u0639\u0627\u0626\u0644\u0629 \u0622\u0644 \u0625\u0628\u0631\u0627\u0647\u064A\u0645",
          adminEmail: "admin@genealogy.sa"
        },
        {
          category: "family_updated",
          title: "\u062A\u062D\u062F\u064A\u062B \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0639\u0627\u0626\u0644\u0629",
          message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062A\u0648\u062B\u064A\u0642 \u0648\u0645\u0643\u0627\u0646 \u0625\u0642\u0627\u0645\u0629 \u0641\u0631\u0639 \u0639\u0627\u0626\u0644\u0629 \u0622\u0644 \u0645\u062D\u0645\u062F.",
          familyName: "\u0641\u0631\u0639 \u0639\u0627\u0626\u0644\u0629 \u0622\u0644 \u0645\u062D\u0645\u062F",
          adminEmail: "admin@genealogy.sa"
        },
        {
          category: "edit_submitted",
          title: "\u0645\u0642\u062A\u0631\u062D \u062A\u0639\u062F\u064A\u0644 \u062C\u062F\u064A\u062F \u0645\u0646 \u0645\u0633\u062A\u062E\u062F\u0645",
          message: "\u0642\u0627\u0645 \u0623\u062D\u062F \u0623\u0641\u0631\u0627\u062F \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0628\u062A\u0642\u062F\u064A\u0645 \u0645\u0642\u062A\u0631\u062D \u062A\u0635\u062D\u064A\u062D \u0627\u0633\u0645 \u0627\u0644\u062C\u062F \u0627\u0644\u062E\u0627\u0645\u0633 \u0641\u064A \u0627\u0644\u0633\u0644\u0633\u0644\u0629.",
          personId: 3,
          personName: "\u0645\u062D\u0645\u062F \u0628\u0646 \u0641\u064A\u0635\u0644 \u0628\u0646 \u062A\u0631\u0643\u064A"
        },
        {
          category: "merge_request",
          title: "\u0637\u0644\u0628 \u062F\u0645\u062C \u0633\u062C\u0644\u064A\u0646 \u0645\u0643\u0631\u0631\u064A\u0646",
          message: "\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u0637\u0644\u0628 \u062F\u0645\u062C \u0644\u0644\u0633\u062C\u0644 \u0631\u0642\u0645 #12 \u0645\u0639 \u0627\u0644\u0633\u062C\u0644 \u0631\u0642\u0645 #45 \u0644\u0627\u062D\u062A\u0645\u0627\u0644\u064A\u0629 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u0634\u062E\u0635.",
          personId: 4,
          personName: "\u062E\u0627\u0644\u062F \u0628\u0646 \u0633\u0644\u0637\u0627\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0639\u0632\u064A\u0632"
        },
        {
          category: "confidence_changed",
          title: "\u062A\u0639\u062F\u064A\u0644 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629",
          message: "\u062A\u0645 \u0631\u0641\u0639 \u062F\u0631\u062C\u0629 \u0645\u0648\u062B\u0648\u0642\u064A\u0629 \u0627\u0644\u0633\u062C\u0644 \u0625\u0644\u0649 (\u0645\u0648\u062B\u0642 \u0631\u0633\u0645\u064A\u0627\u064B) \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0648\u062B\u064A\u0642\u0629 \u0627\u0644\u0639\u062B\u0645\u0627\u0646\u064A\u0629 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629.",
          personId: 1,
          personName: "\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0628\u0646 \u0645\u062D\u0645\u062F \u0622\u0644 \u0633\u0639\u0648\u062F",
          adminEmail: "admin@genealogy.sa"
        },
        {
          category: "duplicate_detected",
          title: "\u0627\u0643\u062A\u0634\u0627\u0641 \u0633\u062C\u0644 \u0645\u0643\u0631\u0631 \u0645\u062D\u062A\u0645\u0644",
          message: "\u0646\u0638\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0631\u0635\u062F \u062A\u0634\u0627\u0628\u0647\u0627\u064B \u0628\u0646\u0633\u0628\u0629 94% \u0628\u064A\u0646 \u0633\u062C\u0644\u064A\u0646 \u0641\u064A \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u062B\u0627\u0644\u062B.",
          personId: 5,
          personName: "\u0641\u0647\u062F \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0628\u0646 \u0641\u064A\u0635\u0644"
        },
        {
          category: "missing_info",
          title: "\u0646\u0642\u0635 \u0628\u064A\u0627\u0646\u0627\u062A \u062C\u0648\u0647\u0631\u064A\u0629",
          message: "\u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0646\u0633\u0628\u064A \u064A\u0641\u062A\u0642\u0631 \u0644\u0631\u0628\u0637 \u0627\u0633\u0645 \u0627\u0644\u0623\u0645 \u0648\u0633\u0646\u0629 \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629.",
          personId: 6,
          personName: "\u062A\u0631\u0643\u064A \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0622\u0644 \u0633\u0639\u0648\u062F"
        },
        {
          category: "image_uploaded",
          title: "\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0634\u062E\u0635\u064A\u0629 \u062A\u0627\u0631\u064A\u062E\u064A\u0629",
          message: "\u062A\u0645 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062F\u0642\u0629 \u0648\u0625\u0636\u0627\u0641\u062A\u0647\u0627 \u0644\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0634\u062E\u0635.",
          personId: 1,
          personName: "\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0628\u0646 \u0645\u062D\u0645\u062F \u0622\u0644 \u0633\u0639\u0648\u062F",
          adminEmail: "archivist@genealogy.sa"
        },
        {
          category: "document_uploaded",
          title: "\u0623\u0631\u0634\u0641\u0629 \u0648\u062B\u064A\u0642\u0629 \u0646\u0633\u0628 \u0631\u0633\u0645\u064A\u0629",
          message: "\u062A\u0645 \u0631\u0641\u0639 \u0648\u062B\u064A\u0642\u0629 \u0634\u062C\u0631\u0629 \u0639\u0627\u0626\u0644\u0629 \u0639\u062A\u064A\u0642\u0629 \u0648\u0645\u062E\u0637\u0648\u0637\u0629 \u0635\u0643 \u0645\u0644\u0643\u064A\u0629 \u0648\u062A\u0648\u062B\u064A\u0642\u0647\u0627.",
          personId: 2,
          personName: "\u0633\u0644\u0645\u0627\u0646 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0639\u0632\u064A\u0632",
          adminEmail: "archivist@genealogy.sa"
        },
        {
          category: "ai_issue",
          title: "\u062A\u0646\u0628\u064A\u0647 \u062E\u0648\u0627\u0631\u0632\u0645\u064A\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
          message: "\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0623\u0646\u0633\u0627\u0628 \u0627\u0644\u0630\u0643\u064A \u0627\u0643\u062A\u0634\u0641 \u0641\u0627\u0631\u0642\u0627\u064B \u0632\u0645\u0646\u064A\u0627\u064B \u063A\u064A\u0631 \u0645\u0646\u0637\u0642\u064A (48 \u0633\u0646\u0629) \u0628\u064A\u0646 \u062C\u064A\u0644 \u0627\u0644\u0623\u0628 \u0648\u0627\u0644\u0627\u0628\u0646.",
          personId: 3,
          personName: "\u0645\u062D\u0645\u062F \u0628\u0646 \u0641\u064A\u0635\u0644 \u0628\u0646 \u062A\u0631\u0643\u064A"
        }
      ];
      seedDefaults.forEach((def, index) => {
        const exists = adminNotificationsStore.some((n) => n.category === def.category);
        if (!exists) {
          adminNotificationsStore.push({
            ...def,
            id: `seed-${def.category}-${index}`,
            timestamp: new Date(Date.now() - index * 36e5 * 3).toISOString(),
            isRead: false
          });
        }
      });
    } catch (err) {
      console.error("Error initializing admin notifications:", err);
    }
  }
  function pushAdminNotification(item) {
    const notification = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    };
    adminNotificationsStore.unshift(notification);
  }
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      await initAdminNotificationsStore();
      res.json(adminNotificationsStore);
    } catch (err) {
      console.error("Error in GET /api/admin/notifications:", err);
      res.status(500).json({ error: "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629" });
    }
  });
  app.put("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const item = adminNotificationsStore.find((n) => n.id === id);
    if (item) {
      item.isRead = !item.isRead;
    }
    res.json({ success: true, isRead: item?.isRead });
  });
  app.put("/api/admin/notifications/read-all", requireAdmin, async (req, res) => {
    adminNotificationsStore.forEach((n) => n.isRead = true);
    res.json({ success: true });
  });
  app.delete("/api/admin/notifications/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    adminNotificationsStore = adminNotificationsStore.filter((n) => n.id !== id);
    res.json({ success: true });
  });
  app.delete("/api/admin/notifications", requireAdmin, async (req, res) => {
    adminNotificationsStore = [];
    res.json({ success: true });
  });
  app.post("/api/photos", requireAdmin, async (req, res) => {
    try {
      const { personId, url, caption, isPublic } = req.body;
      if (!personId || !url) {
        return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0634\u062E\u0635 \u0648\u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" });
      }
      const [newPhoto] = await db.insert(photos).values({
        personId: parseInt(personId),
        url,
        caption: caption || null,
        isPublic: isPublic !== false
      }).returning();
      pushAdminNotification({
        category: "image_uploaded",
        title: "\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u062C\u062F\u064A\u062F\u0629",
        message: `\u062A\u0645 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0634\u062E\u0635\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u0644\u0633\u062C\u0644 \u0627\u0644\u0634\u062E\u0635 \u0631\u0642\u0645 (${personId})`,
        personId: parseInt(personId),
        adminEmail: req.dbUser?.email
      });
      res.status(201).json(newPhoto);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/photos/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(photos).where((0, import_drizzle_orm4.eq)(photos.id, id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/documents", requireAdmin, async (req, res) => {
    try {
      const { personId, title, fileUrl, fileType, isPublic } = req.body;
      if (!personId || !title || !fileUrl) {
        return res.status(400).json({ error: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0648\u062B\u064A\u0642\u0629 \u0648\u0627\u0644\u0631\u0627\u0628\u0637 \u0645\u0637\u0644\u0648\u0628\u0629" });
      }
      const [newDoc] = await db.insert(documents).values({
        personId: parseInt(personId),
        title: title.trim(),
        fileUrl,
        fileType: fileType || "pdf",
        isPublic: isPublic !== false
      }).returning();
      pushAdminNotification({
        category: "document_uploaded",
        title: "\u0631\u0641\u0639 \u0648\u062B\u064A\u0642\u0629 \u062C\u062F\u064A\u062F\u0629",
        message: `\u062A\u0645 \u0623\u0631\u0634\u0641\u0629 \u0648\u062B\u064A\u0642\u0629 \u062C\u062F\u064A\u062F\u0629 (${title.trim()}) \u0644\u0633\u062C\u0644 \u0627\u0644\u0634\u062E\u0635 \u0631\u0642\u0645 (${personId})`,
        personId: parseInt(personId),
        adminEmail: req.dbUser?.email
      });
      res.status(201).json(newDoc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/documents/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(documents).where((0, import_drizzle_orm4.eq)(documents.id, id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/audit-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await db.select().from(auditLogs).limit(200);
      res.json(logs.reverse());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const list = await db.select().from(users);
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/users/add-by-email", requireAdmin, async (req, res) => {
    try {
      if (req.dbUser?.role !== "owner") {
        return res.status(403).json({ error: "\u0639\u0630\u0631\u0627\u064B\u060C \u0641\u0642\u0637 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u064A\u062D\u0642 \u0644\u0647 \u0625\u0636\u0627\u0641\u0629 \u0623\u0648 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0634\u0631\u0641\u064A\u0646" });
      }
      const { email, role, isActive } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0637\u0644\u0648\u0628" });
      }
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: "\u0635\u064A\u063A\u0629 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      }
      const validRole = ["owner", "admin", "editor", "viewer"].includes(role) ? role : "admin";
      const activeState = isActive !== false;
      const existingUsers = await db.select().from(users);
      const targetUser = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      let resultUser;
      let actionType = "";
      if (targetUser) {
        const [updated] = await db.update(users).set({ role: validRole, isActive: activeState }).where((0, import_drizzle_orm4.eq)(users.id, targetUser.id)).returning();
        resultUser = updated;
        actionType = "\u062A\u062D\u062F\u064A\u062B \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0645\u0634\u0631\u0641 \u0645\u0648\u062C\u0648\u062F";
      } else {
        const pendingUid = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const userName = cleanEmail.split("@")[0];
        const [created] = await db.insert(users).values({
          uid: pendingUid,
          email: cleanEmail,
          name: userName,
          role: validRole,
          isActive: activeState
        }).returning();
        resultUser = created;
        actionType = "\u0625\u0636\u0627\u0641\u0629 \u0645\u0634\u0631\u0641 \u062C\u062F\u064A\u062F \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064A\u062F";
      }
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: actionType,
        details: `\u062A\u0645 \u0645\u0646\u062D \u0635\u0644\u0627\u062D\u064A\u0627\u062A (${validRole}) \u0644\u0644\u0628\u0631\u064A\u062F (${cleanEmail}) [\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0633\u0627\u0628: ${activeState ? "\u0646\u0634\u0637" : "\u0645\u0639\u0637\u0644"}]`
      });
      res.status(201).json({
        success: true,
        user: resultUser,
        message: targetUser ? "\u062A\u0645 \u062A\u0639\u064A\u064A\u0646 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0641 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0646\u062C\u0627\u062D" : "\u062A\u0645 \u0625\u062F\u0631\u0627\u062C \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0645\u0646\u062D\u0647 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0641. \u0633\u064A\u062A\u0641\u0639\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0641\u0648\u0631 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644\u0647."
      });
    } catch (err) {
      console.error("Error in /api/users/add-by-email:", err);
      res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0634\u0631\u0641" });
    }
  });
  app.put("/api/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role, isActive } = req.body;
      if (req.dbUser?.role !== "owner") {
        return res.status(403).json({ error: "\u0641\u0642\u0637 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u064A\u0645\u0643\u0646\u0647 \u062A\u063A\u064A\u064A\u0631 \u0623\u062F\u0648\u0627\u0631 \u0648\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0641\u064A\u0646" });
      }
      const [targetUser] = await db.select().from(users).where((0, import_drizzle_orm4.eq)(users.id, id));
      if (!targetUser) {
        return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      if (targetUser.id === req.dbUser.id && isActive === false) {
        return res.status(400).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062A\u062C\u0645\u064A\u062F \u0623\u0648 \u0625\u064A\u0642\u0627\u0641 \u062D\u0633\u0627\u0628\u0643 \u0628\u0635\u0641\u0646\u0643 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A" });
      }
      const newRole = role && ["owner", "admin", "editor", "viewer"].includes(role) ? role : targetUser.role;
      const newActive = typeof isActive === "boolean" ? isActive : targetUser.isActive;
      const [updated] = await db.update(users).set({ role: newRole, isActive: newActive }).where((0, import_drizzle_orm4.eq)(users.id, id)).returning();
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: "\u062A\u0639\u062F\u064A\u0644 \u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0634\u0631\u0641",
        details: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0634\u0631\u0641 ${targetUser.email}: \u0627\u0644\u062F\u0648\u0631 = ${newRole}\u060C \u0627\u0644\u062D\u0627\u0644\u0629 = ${newActive ? "\u0646\u0634\u0637" : "\u0645\u0639\u0637\u0644"}`
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      if (req.dbUser?.role !== "owner") {
        return res.status(403).json({ error: "\u0641\u0642\u0637 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u064A\u0645\u0643\u0646\u0647 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0627\u062A \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A" });
      }
      const [targetUser] = await db.select().from(users).where((0, import_drizzle_orm4.eq)(users.id, id));
      if (!targetUser) {
        return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      if (targetUser.id === req.dbUser.id) {
        return res.status(400).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062E\u0627\u0635 \u0643\u0645\u0627\u0644\u0643 \u0644\u0644\u0645\u0646\u0635\u0629" });
      }
      const [updated] = await db.update(users).set({ isActive: Boolean(isActive) }).where((0, import_drizzle_orm4.eq)(users.id, id)).returning();
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: isActive ? "\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628 \u0645\u0634\u0631\u0641" : "\u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0645\u0634\u0631\u0641",
        details: `\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u062D\u0633\u0627\u0628 ${targetUser.email} \u0625\u0644\u0649: ${isActive ? "\u0646\u0634\u0637" : "\u0645\u0639\u0637\u0644 \u0645\u0624\u0642\u062A\u0627\u064B"}`
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (req.dbUser?.role !== "owner") {
        return res.status(403).json({ error: "\u0641\u0642\u0637 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u064A\u0645\u0643\u0646\u0647 \u062D\u0630\u0641 \u0627\u0644\u0645\u0634\u0631\u0641\u064A\u0646" });
      }
      const [targetUser] = await db.select().from(users).where((0, import_drizzle_orm4.eq)(users.id, id));
      if (!targetUser) {
        return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      if (targetUser.id === req.dbUser.id) {
        return res.status(400).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062E\u0627\u0635 \u0628\u0635\u0641\u0646\u0643 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0631\u0626\u064A\u0633\u064A" });
      }
      await db.delete(users).where((0, import_drizzle_orm4.eq)(users.id, id));
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: "\u0625\u0632\u0627\u0644\u0629 \u0645\u0634\u0631\u0641",
        details: `\u062A\u0645\u062A \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0645\u0634\u0631\u0641 ${targetUser.email} \u0648\u0631\u064E\u0641\u0652\u0639 \u0635\u0644\u0627\u062D\u064A\u0627\u062A\u0647`
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/export/json", async (req, res) => {
    try {
      const allPeople = await db.select().from(people);
      const allPhotos = await db.select().from(photos);
      const allDocs = await db.select().from(documents);
      const allUsers = await db.select().from(users);
      const allLogs = await db.select().from(auditLogs);
      const now = /* @__PURE__ */ new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateFormatted = `${year}_${month}_${day}`;
      const filename = `Bani_Ali_AlKalai_Backup_${dateFormatted}.json`;
      const backup = {
        platformName: "Bani_Ali_AlKalai",
        platformTitle: "\u0645\u0634\u062C\u0631\u0629 \u0642\u0628\u064A\u0644\u0629 \u0628\u0646\u064A \u0639\u0644\u064A \u0627\u0644\u0642\u0644\u0639\u064A",
        version: "2.0",
        exportedAt: now.toISOString(),
        backupDateFormatted: dateFormatted,
        stats: {
          peopleCount: allPeople.length,
          photosCount: allPhotos.length,
          documentsCount: allDocs.length,
          usersCount: allUsers.length,
          auditLogsCount: allLogs.length
        },
        people: allPeople,
        photos: allPhotos,
        documents: allDocs,
        users: allUsers,
        auditLogs: allLogs
      };
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.json(backup);
    } catch (err) {
      console.error("Export backup error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/import/json", requireOwner, async (req, res) => {
    try {
      const backupData = req.body;
      const { people: importPeople, photos: importPhotos, documents: importDocs, users: importUsers } = backupData;
      if (!Array.isArray(importPeople)) {
        return res.status(400).json({ error: "\u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u062A\u0627\u0644\u0641 (\u0644\u0627 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0623\u0634\u062E\u0627\u0635)." });
      }
      try {
        const currentPeople = await db.select().from(people);
        const currentPhotos = await db.select().from(photos);
        const currentDocs = await db.select().from(documents);
        const currentUsers = await db.select().from(users);
        const currentLogs = await db.select().from(auditLogs);
        const safetySnapshot = {
          safetyBackupAt: (/* @__PURE__ */ new Date()).toISOString(),
          people: currentPeople,
          photos: currentPhotos,
          documents: currentDocs,
          users: currentUsers,
          auditLogs: currentLogs
        };
        const safetyPath = import_path.default.join(process.cwd(), "safety_backup_before_restore.json");
        import_fs.default.writeFileSync(safetyPath, JSON.stringify(safetySnapshot, null, 2));
      } catch (safetyErr) {
        console.warn("Safety backup creation warning:", safetyErr);
      }
      await db.delete(photos).execute();
      await db.delete(documents).execute();
      await db.delete(people).execute();
      for (const p of importPeople) {
        if (p.fullName) {
          await db.insert(people).values({
            id: p.id,
            fullName: p.fullName,
            fatherId: p.fatherId || null,
            motherId: p.motherId || null,
            gender: p.gender || "male",
            familyName: p.familyName || null,
            tribe: p.tribe || null,
            branch: p.branch || null,
            birthDate: p.birthDate || null,
            deathDate: p.deathDate || null,
            birthPlace: p.birthPlace || null,
            deathPlace: p.deathPlace || null,
            isDeceased: p.isDeceased ?? false,
            biography: p.biography || null,
            occupation: p.occupation || null,
            phone: p.phone || null,
            email: p.email || null,
            photoUrl: p.photoUrl || null,
            notes: p.notes || null,
            confidenceLevel: p.confidenceLevel || "verified",
            createdBy: p.createdBy || req.dbUser?.email || "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629"
          }).onConflictDoNothing();
        }
      }
      if (Array.isArray(importPhotos)) {
        for (const ph of importPhotos) {
          if (ph.personId && ph.url) {
            await db.insert(photos).values({
              id: ph.id,
              personId: ph.personId,
              url: ph.url,
              caption: ph.caption || null,
              isPublic: ph.isPublic ?? true
            }).onConflictDoNothing();
          }
        }
      }
      if (Array.isArray(importDocs)) {
        for (const doc of importDocs) {
          if (doc.personId && doc.title && doc.fileUrl) {
            await db.insert(documents).values({
              id: doc.id,
              personId: doc.personId,
              title: doc.title,
              fileUrl: doc.fileUrl,
              fileType: doc.fileType || "pdf",
              isPublic: doc.isPublic ?? true
            }).onConflictDoNothing();
          }
        }
      }
      if (Array.isArray(importUsers)) {
        for (const u of importUsers) {
          if (u.email) {
            await db.insert(users).values({
              uid: u.uid || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              email: u.email,
              name: u.name || null,
              role: u.role || "viewer",
              isActive: u.isActive ?? true
            }).onConflictDoNothing();
          }
        }
      }
      await pool.query(`SELECT setval('people_id_seq', (SELECT COALESCE(MAX(id), 1) FROM people));`).catch(() => {
      });
      await pool.query(`SELECT setval('photos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM photos));`).catch(() => {
      });
      await pool.query(`SELECT setval('documents_id_seq', (SELECT COALESCE(MAX(id), 1) FROM documents));`).catch(() => {
      });
      await db.insert(auditLogs).values({
        adminUid: req.dbUser.uid,
        adminEmail: req.dbUser.email,
        action: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629",
        details: `\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0628\u0646\u062C\u0627\u062D (${importPeople.length} \u0634\u062E\u0635\u0627\u064B). \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0646\u0633\u062E\u0629 \u0633\u0644\u0627\u0645\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0642\u0628\u0644 \u0627\u0644\u0627\u0633\u062A\u0628\u062F\u0627\u0644.`
      });
      res.json({
        success: true,
        message: "\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0627\u0641\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0648\u0627\u0644\u062E\u0635\u0627\u0626\u0635 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0646\u0633\u062E\u0629 \u0623\u0645\u0627\u0646 \u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0642\u0628\u0644 \u0627\u0644\u0628\u062F\u0621.",
        restoredPeopleCount: importPeople.length
      });
    } catch (err) {
      console.error("Restore backup error:", err);
      res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629" });
    }
  });
  app.get("/api/export/gedcom", async (req, res) => {
    try {
      const allPeople = await db.select().from(people);
      let gedcom = `0 HEAD
1 SOUR ARABIC_GENEALOGY
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE
1 CHAR UTF-8
`;
      for (const p of allPeople) {
        gedcom += `0 @I${p.id}@ INDI
`;
        gedcom += `1 NAME ${p.fullName}
`;
        gedcom += `1 SEX ${p.gender === "female" ? "F" : "M"}
`;
        if (p.birthDate) gedcom += `1 BIRT
2 DATE ${p.birthDate}
`;
        if (p.deathDate) gedcom += `1 DEAT
2 DATE ${p.deathDate}
`;
        if (p.fatherId) gedcom += `1 FAMC @F_FAT_${p.fatherId}@
`;
      }
      gedcom += `0 TLR
`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=genealogy.ged");
      res.send(gedcom);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/robots.txt", (req, res) => {
    const host = req.get("host") || "service-9582.ai.studio";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    const robots = `User-agent: *
Allow: /
Allow: /tree
Allow: /directory
Allow: /person/
Allow: /about
Allow: /stats
Disallow: /admin
Disallow: /login
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(robots);
  });
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = req.get("host") || "service-9582.ai.studio";
      const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
      const baseUrl = `${protocol}://${host}`;
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const allPeopleList = await getAllPeople();
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;
      const staticPages = [
        { path: "/", priority: "1.0", changefreq: "daily" },
        { path: "/tree", priority: "0.9", changefreq: "daily" },
        { path: "/directory", priority: "0.9", changefreq: "daily" },
        { path: "/about", priority: "0.7", changefreq: "monthly" },
        { path: "/stats", priority: "0.7", changefreq: "weekly" }
      ];
      for (const page of staticPages) {
        xml += `  <url>
`;
        xml += `    <loc>${baseUrl}${page.path}</loc>
`;
        xml += `    <lastmod>${today}</lastmod>
`;
        xml += `    <changefreq>${page.changefreq}</changefreq>
`;
        xml += `    <priority>${page.priority}</priority>
`;
        xml += `  </url>
`;
      }
      for (const p of allPeopleList) {
        xml += `  <url>
`;
        xml += `    <loc>${baseUrl}/person/${p.id}</loc>
`;
        xml += `    <lastmod>${today}</lastmod>
`;
        xml += `    <changefreq>weekly</changefreq>
`;
        xml += `    <priority>0.8</priority>
`;
        xml += `  </url>
`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });
  app.get("/google:code.html", (req, res) => {
    const code = req.params.code;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`google-site-verification: google${code}.html`);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({ error: "\u0627\u0644\u0631\u0645\u0632 \u0623\u0648 \u0627\u0644\u0645\u0633\u0627\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      try {
        const url = req.originalUrl;
        let template = import_fs.default.readFileSync(import_path.default.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        if (vite) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.use("*", (req, res) => {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({ error: "\u0627\u0644\u0631\u0645\u0632 \u0623\u0648 \u0627\u0644\u0645\u0633\u0627\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
