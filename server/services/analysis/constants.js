/**
 * Constants, Enums, and Shared Standard Lists for ScamShield Analysis Engine.
 */

const SEVERITY = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
});

const ASSESSMENT = Object.freeze({
  HIGH_RISK: 'HIGH_RISK',
  ELEVATED_RISK: 'ELEVATED_RISK',
  MODERATE_RISK: 'MODERATE_RISK',
  LOW_RISK: 'LOW_RISK',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
});

const INDICATOR_TYPES = Object.freeze({
  FINANCIAL_SOLICITATION: 'FINANCIAL_SOLICITATION',
  EMPLOYMENT_PAYMENT_REQUIRED: 'EMPLOYMENT_PAYMENT_REQUIRED',
  SENSITIVE_DATA_SOLICITATION: 'SENSITIVE_DATA_SOLICITATION',
  UNREALISTIC_COMPENSATION: 'UNREALISTIC_COMPENSATION',
  COMMUNICATION_CHANNEL: 'COMMUNICATION_CHANNEL',
  DOMAIN_MISMATCH: 'DOMAIN_MISMATCH',
  URGENT_UNVERIFIED_OFFER: 'URGENT_UNVERIFIED_OFFER',
  TASK_BASED_SCAM_PATTERN: 'TASK_BASED_SCAM_PATTERN',
  SUSPICIOUS_URL_STRUCTURE: 'SUSPICIOUS_URL_STRUCTURE',
  IDENTITY_VERIFICATION: 'IDENTITY_VERIFICATION'
});

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'aol.com',
  'rediffmail.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'icloud.com',
  'mail.com',
  'yandex.com',
  'gmx.com'
]);

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  'is.gd',
  'buff.ly',
  'ow.ly',
  'rb.gy',
  'cutt.ly',
  'shorturl.at',
  't.ly',
  'soo.gd'
]);

const CHAT_REDIRECT_DOMAINS = new Set([
  't.me',
  'telegram.me',
  'wa.me',
  'api.whatsapp.com',
  'chat.whatsapp.com'
]);

const SUSPICIOUS_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'buzz',
  'rest',
  'work',
  'icu',
  'fit',
  'surf',
  'monster',
  'cfd',
  'sbs',
  'quest'
]);

const STANDARD_DISCLAIMER =
  'ScamShield provides evidence-based risk indicators to assist candidate vigilance and research. ' +
  'An indicator highlights potential risk factors or anomalies and does not constitute a legal determination of fraud. ' +
  'Always independently verify job offers and company credentials through official corporate communication channels.';

const DEFAULT_RECOMMENDED_ACTIONS = [
  'Never pay any upfront registration, training, or kit fee to obtain employment.',
  'Do not disclose OTPs, banking credentials, UPI PINs, or net banking passwords under any circumstance.',
  'Verify the opening directly on the employer\'s official career portal or by contacting official HR contacts.',
  'Be cautious of interviews conducted exclusively via messaging apps like Telegram or WhatsApp.'
];

module.exports = {
  SEVERITY,
  ASSESSMENT,
  INDICATOR_TYPES,
  PUBLIC_EMAIL_DOMAINS,
  URL_SHORTENERS,
  CHAT_REDIRECT_DOMAINS,
  SUSPICIOUS_TLDS,
  STANDARD_DISCLAIMER,
  DEFAULT_RECOMMENDED_ACTIONS
};
