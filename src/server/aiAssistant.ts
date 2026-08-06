import { GoogleGenAI } from '@google/genai';
import { getAllPeople, getPersonDetail, analyzeRelationship, validateGenealogyData, scorePersonMatch, normalizeArabicText } from './genealogy.ts';
import { Person } from '../types.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('رمز مفتاح GEMINI_API_KEY غير معرف في البيئة.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Extract person names or candidate IDs from query text by matching against database records
 */
function findMentionedPeople(query: string, allPeople: Person[]): Person[] {
  if (!query) return [];

  const matched: { person: Person; score: number }[] = [];

  for (const person of allPeople) {
    const score = scorePersonMatch(person, query);
    if (score > 0) {
      matched.push({ person, score });
    }
  }

  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, 10).map((m) => m.person);
}

export async function processGenealogyAIChat(userPrompt: string, chatHistory: { role: 'user' | 'model'; text: string }[] = []) {
  try {
    const allPeople = await getAllPeople();
    const candidatePeople = findMentionedPeople(userPrompt, allPeople);

    // If query looks like a relationship comparison between 2 people
    let relationshipAnalysisText = '';
    if (candidatePeople.length >= 2) {
      try {
        const comparison = await analyzeRelationship(candidatePeople[0].id, candidatePeople[1].id);
        if (comparison && comparison.commonAncestor) {
          relationshipAnalysisText = `
[تحليل صلة القرابة المحسوب من الشجرة]:
الشخص الأول: ${comparison.person1.fullName} (ID: ${comparison.person1.id})
الشخص الثاني: ${comparison.person2.fullName} (ID: ${comparison.person2.id})
الجد المشترك: ${comparison.commonAncestor.fullName} (ID: ${comparison.commonAncestor.id})
درجة القرابة: ${comparison.relationshipDegree}
نوع القرابة: ${comparison.relationshipType}
الشرح الدقيق: ${comparison.explanation}
مسار الشخص الأول حتى الجد المشترك: ${comparison.path1.map(p => `${p.person.fullName} [ID:${p.person.id}]`).join(' <- ')}
مسار الشخص الثاني حتى الجد المشترك: ${comparison.path2.map(p => `${p.person.fullName} [ID:${p.person.id}]`).join(' <- ')}
`;
        }
      } catch (e) {
        console.error('Error analyzing candidate relationship in AI Assistant:', e);
      }
    }

    // Build database knowledge context
    // Include full list of people (compact summary) + extra details for candidates
    const compactPeopleDb = allPeople.map((p) => {
      const parts = [
        `ID:${p.id}`,
        `الاسم:${p.fullName}`,
        p.fatherId ? `الأب_ID:${p.fatherId}` : null,
        p.fatherName ? `اسم_الأب:${p.fatherName}` : null,
        p.grandfatherName ? `الجد:${p.grandfatherName}` : null,
        p.gender ? `الجنس:${p.gender === 'male' ? 'ذكر' : 'أنثى'}` : null,
        p.tribe ? `القبيلة:${p.tribe}` : null,
        p.branch ? `الفرع:${p.branch}` : null,
        p.birthDate ? `الميلاد:${p.birthDate}` : null,
        p.deathDate ? `الوفاة:${p.deathDate}` : null,
        p.notes ? `ملاحظات:${p.notes}` : null,
      ].filter(Boolean).join(' | ');
      return parts;
    }).join('\n');

    let extraCandidateDetails = '';
    for (const candidate of candidatePeople.slice(0, 4)) {
      try {
        const detail = await getPersonDetail(candidate.id);
        if (detail) {
          extraCandidateDetails += `
[تفاصيل موسعة للشخص: ${detail.person.fullName} - ID:${detail.person.id}]:
- السلسلة النسبية الصاعدة: ${detail.lineageChain.map(p => `${p.fullName} (ID:${p.id})`).join(' <- ')}
- الأب: ${detail.father ? `${detail.father.fullName} (ID:${detail.father.id})` : 'غير مسجل'}
- الجد: ${detail.grandfather ? `${detail.grandfather.fullName} (ID:${detail.grandfather.id})` : 'غير مسجل'}
- الأبناء (${detail.children.length}): ${detail.children.map(c => `${c.fullName} (ID:${c.id})`).join('، ')}
- الأحفاد (${detail.grandchildren.length}): ${detail.grandchildren.map(g => `${g.fullName} (ID:${g.id})`).join('، ')}
- الإخوة (${detail.siblings.length}): ${detail.siblings.map(s => `${s.fullName} (ID:${s.id})`).join('، ')}
- الأعمام (${detail.uncles.length}): ${detail.uncles.map(u => `${u.fullName} (ID:${u.id})`).join('، ')}
`;
        }
      } catch (err) {
        console.error('Error fetching detail for candidate:', err);
      }
    }

    const systemInstruction = `
أنت "مساعد الأنساب الذكي" الرسمي لموسوعة الأنساب لبني علي الكلعي.
مهمتك التفاعلية إجابة المستخدمين عن أي سؤال متعلق بالأسماء، الأنساب، الآباء، الأبناء، الأحفاد، الأجداد، السلالات، وصفات صلات القرابة، والبحث بلغة طبيعية.

**قواعد العمل الصارمة**:
1. تعتمد حصرياً و100% على البيانات وقواعد النسب المرفقة أدناه المأخوذة من قاعدة بيانات المنصة.
2. لا تبتكر، ولا تخترع، ولا تفترض أي معلومة نسب غير موجودة في قاعدة البيانات.
3. إذا سئلت عن شخص أو صلة قرابة غير مسجلة في البيانات، قل بوضوح ولطف: "هذه المعلومة غير مسجلة حالياً في قاعدة بيانات الأنساب المعتمدة."
4. **تضمين الروابط التفاعلية للأشخاص**:
   في كل مرة تذكر فيها شخصاً موجوداً في قاعدة البيانات، يجب عليك كتابة اسمه متبوعاً أو مغلفاً بهذه الصيغة التفاعلية لتمكين المستخدم من النقر عليه وفتح ملفه مباشرة:
   \`[person:ID|اسم الشخص]\`
   مثال:
   "والده هو [person:12|علي بن محمد الكلعي]، ويمكنك فتح ملفه من هنا."
   "يلتقيان في الجد الرابع: [person:45|عبدالله بن ثابت الكلعي]."
5. اجعل الإجابة دقيقة، منظمة، محترمة، وواضحة جداً باللغة العربية.
6. لا تقم بتنفيذ أو اقتراح أي تعديل أو حذف تلقائي للبيانات.

[قاعدة البيانات الحالية للأشخاص]:
${compactPeopleDb}

${extraCandidateDetails}

${relationshipAnalysisText}
`;

    const ai = getGeminiClient();

    // Prepare contents with history if available
    const formattedContents: any[] = [];
    for (const h of chatHistory.slice(-6)) {
      formattedContents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }
    formattedContents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return response.text || 'عذراً، لم أتمكن من الحصول على رد، يرجى إعادة المحاولة.';
  } catch (error: any) {
    console.error('Error in processGenealogyAIChat:', error);
    throw new Error(error.message || 'حدث خطأ أثناء معالجة استفسار مساعد الأنساب الذكي');
  }
}

/**
 * AI Admin Suggestions Engine: Detects duplicates, missing relationships, and possible data errors
 */
export async function getAIAdminSuggestions() {
  try {
    const validation = await validateGenealogyData();
    const allPeople = await getAllPeople();

    // Format validation issues as approval-based AI Suggestions
    const suggestions = validation.issues.map((issue) => {
      let type: 'duplicate' | 'missing' | 'error' = 'error';
      if (issue.category === 'duplicate') type = 'duplicate';
      else if (issue.category === 'missing_parent' || issue.category === 'incomplete') type = 'missing';

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
        requiresApproval: true,
      };
    });

    return {
      totalSuggestions: suggestions.length,
      suggestions,
    };
  } catch (error: any) {
    console.error('Error in getAIAdminSuggestions:', error);
    throw new Error('فشل توليد اقتراحات الذكاء الاصطناعي للمشرفين');
  }
}
