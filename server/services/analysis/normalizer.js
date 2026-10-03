/**
 * Input Normalizer for ScamShield Analysis Engine.
 * Standardizes incoming payload from multiple client formats into a consistent schema.
 */

const { PUBLIC_EMAIL_DOMAINS } = require('./constants');

/**
 * Safely trims and returns a string or empty string.
 * @param {any} val
 * @returns {string}
 */
const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val).trim();
  return '';
};

/**
 * Extracts emails from free-form text.
 * @param {string} text
 * @returns {string[]}
 */
const extractEmails = (text) => {
  if (!text) return [];
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = text.match(emailRegex) || [];
  return [...new Set(matches.map((m) => m.toLowerCase()))];
};

/**
 * Extracts phone numbers from text (supports international and Indian formats).
 * @param {string} text
 * @returns {string[]}
 */
const extractPhoneNumbers = (text) => {
  if (!text) return [];
  // Matches +91 9876543210, +1-800-..., 9876543210 etc.
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex) || [];
  return [...new Set(matches.map((p) => p.trim()))].filter((p) => p.replace(/\D/g, '').length >= 10);
};

/**
 * Extracts Telegram handles or URLs, ignoring email addresses.
 * @param {string} text
 * @returns {string[]}
 */
const extractTelegramHandles = (text) => {
  if (!text) return [];
  // Strip out standard email addresses first so domain parts are never confused for Telegram handles
  const textWithoutEmails = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' ');
  const telegramRegex = /(?:t\.me\/|telegram\.me\/|(?:^|\s|[^\w@])@)([a-zA-Z0-9_]{4,})/gi;
  const matches = [];
  let match;
  while ((match = telegramRegex.exec(textWithoutEmails)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
};

/**
 * Extracts WhatsApp links or numbers.
 * @param {string} text
 * @returns {string[]}
 */
const extractWhatsAppContacts = (text) => {
  if (!text) return [];
  const waRegex = /(?:wa\.me\/|whatsapp\.com\/send\?phone=)(\d+)/gi;
  const matches = [];
  let match;
  while ((match = waRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
};

/**
 * Safely parses a URL and extracts its hostname and domain.
 * @param {string} urlString
 * @returns {{ valid: boolean, full: string, hostname: string, domain: string, tld: string }}
 */
const parseUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, full: '', hostname: '', domain: '', tld: '' };
  }

  let formatted = urlString.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = 'https://' + formatted;
  }

  try {
    const parsed = new URL(formatted);
    const hostname = parsed.hostname.toLowerCase();
    const parts = hostname.split('.');
    const tld = parts.length > 1 ? parts[parts.length - 1] : '';
    const domain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;

    return {
      valid: true,
      full: parsed.href,
      hostname,
      domain,
      tld
    };
  } catch (err) {
    return {
      valid: false,
      full: urlString,
      hostname: '',
      domain: '',
      tld: ''
    };
  }
};

/**
 * Normalizes salary input into clean text and structured data where possible.
 * @param {any} salary
 * @returns {{ raw: string, display: string }}
 */
const normalizeSalary = (salary) => {
  if (!salary) return { raw: '', display: '' };
  if (typeof salary === 'string') {
    return { raw: salary.trim(), display: salary.trim() };
  }
  if (typeof salary === 'object') {
    const min = salary.min || salary.minimum || '';
    const max = salary.max || salary.maximum || '';
    const curr = salary.currency || '';
    const period = salary.period || salary.frequency || '';
    const display = `${curr} ${min}${min && max ? ' - ' : ''}${max} ${period}`.trim();
    return {
      raw: JSON.stringify(salary),
      display: display || JSON.stringify(salary)
    };
  }
  return { raw: String(salary), display: String(salary) };
};

/**
 * Main normalizer function.
 * @param {Object} rawInput
 * @returns {Object} Normalized job listing object
 */
const normalizeInput = (rawInput = {}) => {
  const jobTitle = safeString(rawInput.jobTitle || rawInput.job_title || rawInput.title);
  const companyName = safeString(rawInput.companyName || rawInput.company_name || rawInput.company);
  const jobDescription = safeString(rawInput.jobDescription || rawInput.job_description || rawInput.description);
  const rawJobUrl = safeString(rawInput.jobUrl || rawInput.job_url || rawInput.url);
  const location = safeString(rawInput.location || rawInput.jobLocation || rawInput.city);

  // Recruiter contact could be string or object
  let rawRecruiter = '';
  if (typeof rawInput.recruiterContact === 'string') {
    rawRecruiter = rawInput.recruiterContact;
  } else if (typeof rawInput.recruiter_contact === 'string') {
    rawRecruiter = rawInput.recruiter_contact;
  } else if (typeof rawInput.contact === 'string') {
    rawRecruiter = rawInput.contact;
  } else if (typeof rawInput.recruiter === 'string') {
    rawRecruiter = rawInput.recruiter;
  } else if (rawInput.recruiterContact && typeof rawInput.recruiterContact === 'object') {
    rawRecruiter = JSON.stringify(rawInput.recruiterContact);
  }

  const parsedUrl = parseUrl(rawJobUrl);
  const normalizedSalary = normalizeSalary(rawInput.salary);

  // Combine text sources for comprehensive extraction
  const combinedContactText = `${rawRecruiter} ${jobDescription}`;
  const emails = extractEmails(combinedContactText);
  const phones = extractPhoneNumbers(combinedContactText);
  const telegramHandles = extractTelegramHandles(combinedContactText);
  const whatsappContacts = extractWhatsAppContacts(combinedContactText);

  // Categorize emails into public webmail vs custom corporate domains
  const emailDetails = emails.map((email) => {
    const domain = email.split('@')[1] || '';
    return {
      email,
      domain,
      isPublicWebmail: PUBLIC_EMAIL_DOMAINS.has(domain.toLowerCase())
    };
  });

  return {
    jobTitle,
    companyName,
    jobDescription,
    jobUrl: parsedUrl.valid ? parsedUrl.full : rawJobUrl,
    urlDetails: parsedUrl,
    salary: normalizedSalary,
    location,
    recruiterContact: {
      raw: rawRecruiter,
      emails,
      emailDetails,
      phones,
      telegramHandles,
      whatsappContacts
    },
    // Raw user inputs preserved exactly for presentation
    userFacingInput: {
      jobTitle: jobTitle || null,
      companyName: companyName || null,
      jobDescription: jobDescription || null,
      jobUrl: rawJobUrl || null,
      salary: normalizedSalary.display || null,
      location: location || null,
      recruiterContact: rawRecruiter || null
    }
  };
};

module.exports = {
  normalizeInput,
  extractEmails,
  extractPhoneNumbers,
  extractTelegramHandles,
  extractWhatsAppContacts,
  parseUrl,
  safeString
};
