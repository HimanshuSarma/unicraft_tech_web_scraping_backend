// List of known technologies
const KNOWN_TECH_TERMS = [
  'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Laravel',
  'Ruby on Rails', 'Spring Boot', 'Java', 'Python', 'PHP', 'C#', '.NET', 'Go', 'Rust', 'C++',
  'AWS', 'Azure', 'GCP', 'Firebase', 'Docker', 'Kubernetes', 'MySQL', 'PostgreSQL', 'MongoDB',
  'Redis', 'GraphQL', 'REST', 'Shopify', 'WordPress', 'Magento', 'Joomla', 'Svelte', 'Tailwind',
  'Bootstrap', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Webpack', 'Babel', 'Jenkins', 'CI/CD'
];

// Extract technologies used in nearby context
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

// Extract emails and phone numbers from text
function extractContactInfoFromText(text: string): {
  phones: string[];
  emails: string[];
  websites: string[];
} {
  const phoneRegex = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const websiteRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/\S*)?/g;

  // Normalize common obfuscations in emails
  const normalizedText = text
    .replace(/\s*\(at\)\s*/gi, '@')
    .replace(/\s*\[at\]\s*/gi, '@')
    .replace(/\s*\(dot\)\s*/gi, '.')
    .replace(/\s*\[dot\]\s*/gi, '.');

  const phones = Array.from(new Set(normalizedText.match(phoneRegex) || []));
  const emails = Array.from(new Set(normalizedText.match(emailRegex) || []));
  const websites = Array.from(new Set(normalizedText.match(websiteRegex) || []));

  return { phones, emails, websites };
}



// Main function to extract company details
export function extractCompanyDetails(
  rawText: string,
  companies: string[]
): Array<{ [company: string]: { techStack: string[]; contactInfo: { phones: string[]; emails: string[] } } }> {
  const lowerText = rawText.toLowerCase();
  const results: Array<{ [company: string]: { techStack: string[]; contactInfo: { phones: string[]; emails: string[] } } }> = [];

  for (const company of companies) {
    const idx = lowerText.indexOf(company.toLowerCase());

    // Get a text slice around the company name if found
    const context =
      idx !== -1
        ? rawText.slice(Math.max(0, idx - 1000), idx + 1000)
        : rawText;

    const techStack = extractTechStackFromText(context);
    const contactInfo = extractContactInfoFromText(context);

    results.push({
      [company]: {
        techStack,
        contactInfo
      }
    });
  }

  return results;
}
