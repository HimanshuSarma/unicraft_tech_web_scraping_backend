// Example list of popular technologies to detect (can be expanded)
const KNOWN_TECH_TERMS = [
  'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Laravel',
  'Ruby on Rails', 'Spring Boot', 'Java', 'Python', 'PHP', 'C#', '.NET', 'Go', 'Rust', 'C++',
  'AWS', 'Azure', 'GCP', 'Firebase', 'Docker', 'Kubernetes', 'MySQL', 'PostgreSQL', 'MongoDB',
  'Redis', 'GraphQL', 'REST', 'Shopify', 'WordPress', 'Magento', 'Joomla', 'Svelte', 'Tailwind',
  'Bootstrap', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Webpack', 'Babel', 'Jenkins', 'CI/CD'
];

function extractTechStackFromText(text: string): string[] {
  const techUsed = new Set<string>();
  for (const tech of KNOWN_TECH_TERMS) {
    const regex = new RegExp(`\\b${tech.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      techUsed.add(tech);
    }
  }
  return Array.from(techUsed);
}

// This maps company names to technologies mentioned nearby in the page
export function extractTechStackForCompanies(
  rawText: string,
  companies: string[]
): Array<{ [company: string]: { techStack: string[] } }> {
  const results: Array<{ [company: string]: { techStack: string[] } }> = [];
  const lowerText = rawText.toLowerCase();

  for (const company of companies) {
    const idx = lowerText.indexOf(company.toLowerCase());

    const context =
      idx !== -1
        ? rawText.slice(Math.max(0, idx - 1000), idx + 1000)
        : rawText;

    const techStack = extractTechStackFromText(context);
    results.push({ [company]: { techStack } });
  }

  return results;
}

