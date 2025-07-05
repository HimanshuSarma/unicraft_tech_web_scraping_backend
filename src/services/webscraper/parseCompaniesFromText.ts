import { pipeline } from '@xenova/transformers';
import { extractTechStackForCompanies } from './parseCompanyTechStack';
import { extractCompanyDetails } from './parseCompanyInfo';

let nerModel: any = null;

// Clean and normalize the raw input text
function cleanTextForNER(rawText: string): string {
  return rawText
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/[^\w\s.,@&$+:/'-]/g, '') // keep useful punctuation
    .trim();
}

// Common false positive filter
function isLikelyCompanyName(name: string): boolean {
  const commonFalsePositives = [
    'home', 'portfolio', 'compare', 'visit', 'awards', 'winner', 'services',
    'list', 'category', 'trend', 'contact', 'view', 'agency', 'design'
  ];
  const nameLower = name.toLowerCase();

  return (
    name.length >= 3 &&
    !commonFalsePositives.some(word => nameLower.includes(word))
  );
}

// Checks for common company suffixes
function hasCompanySuffix(name: string): boolean {
  const suffixes = ['inc', 'corp', 'llc', 'ltd', 'co', 'technologies', 'solutions', 'systems', 'group'];
  return suffixes.some(suffix => name.toLowerCase().includes(suffix));
}

// Assigns a score to help rank company name candidates
function scoreCompanyName(name: string): number {
  let score = 0;
  const lower = name.toLowerCase();

  const suffixes = ['inc', 'corp', 'llc', 'ltd', 'co', 'technologies', 'solutions', 'systems', 'group'];
  if (suffixes.some(s => lower.includes(s))) score += 3;

  if (name.trim().split(/\s+/).length > 1) score += 2;

  if (/^[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(name)) score += 2;

  if (name.length >= 8) score += 1;

  return score;
}

// Breaks large text into overlapping chunks
function chunkText(text: string, maxLen = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen - overlap) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}

// Loads NER model (singleton pattern)
async function loadNERModel(): Promise<void> {
  if (!nerModel) {
    nerModel = await pipeline('ner', 'Xenova/bert-base-NER');
  }
}

// Extracts up to 10 likely company names from raw page text
export async function extractEntitiesFromText(rawText: string): Promise<any[]> {
  await loadNERModel();

  const text = cleanTextForNER(rawText);
  const chunks = chunkText(text);
  const companyNames = new Set<string>();

  for (const chunk of chunks) {
    const entities = await nerModel(chunk);
    let currentName = '';

    for (const ent of entities) {
      if (ent.entity === 'B-ORG') {
        if (currentName) companyNames.add(currentName.trim());
        currentName = ent.word.startsWith('##') ? ent.word.slice(2) : ent.word;
      } else if (ent.entity === 'I-ORG') {
        currentName += ent.word.startsWith('##') ? ent.word.slice(2) : ` ${ent.word}`;
      } else {
        if (currentName) {
          companyNames.add(currentName.trim());
          currentName = '';
        }
      }
    }

    if (currentName) companyNames.add(currentName.trim());
  }

  const filtered = Array.from(companyNames).filter(isLikelyCompanyName);

  const companies = filtered
    .map(name => ({ name, score: scoreCompanyName(name) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(entry => entry.name);

  console.log(companies, 'companies');
  const techMap = extractCompanyDetails(rawText, companies);
  console.log(techMap, `techMap`)

  return techMap;
}






