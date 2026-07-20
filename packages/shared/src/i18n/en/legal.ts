/**
 * English Legal Page Translations
 * Privacy policy, terms, security, cookies, ESG methodology
 */
export const legal = {
  // Common
  lastUpdated: 'Last updated: {{date}}',
  tableOfContents: 'Table of Contents',
  backToHome: 'Back to Home',
  effectiveDate: 'Effective Date',
  contactUs: 'Contact Us',
  questionsContact: 'If you have questions about this document, contact us at',

  // Privacy Policy
  privacyTitle: 'Privacy Policy',
  privacySubtitle: 'Aviso de Privacidad',
  privacyIntro:
    'This Privacy Policy describes how Dhanam ("we", "our", or "us") collects, uses, and protects your personal information in compliance with the Mexican Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP).',
  privacySections: {
    dataController: 'Data Controller',
    dataControllerContent:
      'The controller responsible for your personal data is the operator of this Dhanam deployment. The operator publishes its identity and the contact details of its data-privacy officer.',
    dataCollected: 'Personal Data Collected',
    dataCollectedContent:
      'We process the data needed to run the service: identity data (such as your name and email), the financial data you enter or import, device data, and usage analytics.',
    purposes: 'Purposes of Data Processing',
    purposesContent:
      'Your data is processed to manage your account, aggregate and display your finances, and provide analytics. Any secondary use, such as product improvement, is limited to what you have consented to.',
    legalBasis: 'Legal Basis',
    legalBasisContent:
      'Processing is based on your consent, the performance of our agreement with you, and the operator\'s legitimate interest in providing and securing the service.',
    arcoRights: 'ARCO Rights',
    arcoRightsContent:
      'You may access, rectify, cancel, or oppose the processing of your personal data (ARCO rights under the LFPDPPP). Submit requests to the operator, which will respond within the timeframe required by applicable law.',
    dataTransfers: 'International Data Transfers',
    dataTransfersContent:
      'To operate the service we may share data with infrastructure and analytics providers (such as error monitoring and product analytics). Transfers are limited to what is necessary to deliver the service.',
    retention: 'Data Retention',
    retentionContent:
      'We retain personal data only for as long as your account is active or as needed to provide the service and meet legal obligations, after which it is deleted or anonymized.',
    security: 'Security Measures',
    securityContent:
      'We implement industry-standard security measures including AES-256-GCM encryption for sensitive data at rest, TLS 1.3 for data in transit, and regular security assessments.',
    cookies: 'Cookies and Tracking',
    cookiesContent:
      'For details on our use of cookies and tracking technologies, please see our Cookie Policy.',
    changes: 'Changes to This Policy',
    changesContent:
      'We may update this policy. Material changes will be communicated through the application or by email before they take effect.',
    contact: 'Contact Information',
    contactContent:
      'For privacy questions or to exercise your rights, contact the operator of this deployment using the contact details it publishes.',
  },

  // Terms of Service
  termsTitle: 'Terms of Service',
  termsSubtitle: 'Terms and Conditions of Use',
  termsIntro:
    'These Terms of Service ("Terms") govern your access to and use of the Dhanam application and services. By creating an account, you agree to be bound by these Terms.',
  termsSections: {
    acceptance: 'Acceptance of Terms',
    acceptanceContent:
      'By creating an account you confirm that you are at least 18 years old, have the legal capacity to enter into a binding agreement, and accept these Terms.',
    serviceDescription: 'Service Description',
    serviceDescriptionContent:
      'Dhanam provides financial management tools including budgeting, wealth tracking, and portfolio analytics. Dhanam is an information tool only and does not provide financial advice, investment recommendations, or custody of assets.',
    accounts: 'User Accounts',
    accountsContent:
      'You are responsible for keeping your account credentials secure and for all activity under your account. Do not share your account. Accounts may be suspended or terminated for violations of these Terms.',
    subscriptions: 'Subscriptions and Billing',
    subscriptionsContent:
      'The self-hosted open-core edition of Dhanam is provided free of charge. The operator of the deployment you use defines any applicable terms of service.',
    financialDisclaimer: 'Financial Disclaimer',
    financialDisclaimerContent:
      'Dhanam is not a financial advisor, broker, or dealer. Information provided through the service is for informational purposes only and should not be considered financial advice. Always consult a qualified financial professional before making investment decisions.',
    intellectualProperty: 'Intellectual Property',
    intellectualPropertyContent:
      'Dhanam and its open-source components are provided under their applicable licenses. You retain ownership of the content you add. Trademarks and branding remain the property of their respective owners.',
    userConduct: 'Acceptable Use',
    userConductContent:
      'You agree not to misuse the service, including no unauthorized access, data scraping, reverse engineering beyond what the license permits, or activity that disrupts other users.',
    thirdPartyServices: 'Third-Party Services',
    thirdPartyServicesContent:
      'Dhanam integrates with third-party financial data providers (Belvo, Plaid, Bitso, and others). Your use of these integrations is subject to their respective terms of service and privacy policies.',
    liability: 'Limitation of Liability',
    liabilityContent:
      'The service is provided "as is" without warranties of any kind. To the extent permitted by law, the operator is not liable for indirect or consequential damages, or for the accuracy of third-party financial data.',
    jurisdiction: 'Governing Law and Jurisdiction',
    jurisdictionContent:
      'These Terms are governed by the laws applicable where the operator of your deployment is established, and disputes are subject to the competent courts of that jurisdiction.',
    termination: 'Termination',
    terminationContent:
      'You may stop using the service and delete your account at any time. The operator may suspend or terminate access for violations of these Terms. You may export your data before termination.',
    changes: 'Changes to Terms',
    changesContent:
      'We may update these Terms. Material changes will be communicated in advance, and continued use of the service after they take effect constitutes acceptance.',
  },

  // Security Page
  securityTitle: 'Security',
  securitySubtitle: 'How we protect your financial data',
  securityIntro:
    'The security of your financial data is our highest priority. This page describes the measures we take to protect your information.',
  securitySections: {
    overview: 'Security Overview',
    overviewContent:
      'Dhanam employs multiple layers of security to protect your data, following industry best practices and regulatory requirements.',
    encryption: 'Encryption',
    encryptionContent:
      'All sensitive data is encrypted at rest using AES-256-GCM. Data in transit is protected with TLS 1.3. Provider credentials and tokens are encrypted with application-level encryption before database storage.',
    authentication: 'Authentication',
    authenticationContent:
      'Dhanam uses secure authentication with support for TOTP-based two-factor authentication. JWT tokens have short expiration (15 minutes) with rotating refresh tokens (30 days maximum).',
    infrastructure: 'Infrastructure',
    infrastructureContent:
      'We follow industry-standard security practices, including network isolation, hardened service configurations, least-privilege access, and regular security updates.',
    monitoring: 'Monitoring',
    monitoringContent:
      'We use continuous monitoring with Prometheus, Grafana, and Alertmanager for real-time security event detection and response.',
    dataAccess: 'Data Access',
    dataAccessContent:
      'Financial data integrations are read-only. We never store your banking passwords. Provider connections use OAuth or API tokens with minimum required permissions.',
    responsibleDisclosure: 'Responsible Disclosure',
    responsibleDisclosureContent:
      'If you discover a security vulnerability, please report it to security@example.com. We ask that you give us reasonable time to address the issue before public disclosure.',
    responsibleDisclosureSteps: {
      email: 'Email security@example.com with details of the vulnerability',
      include: 'Include steps to reproduce the issue',
      timeline: 'Allow 90 days for remediation before public disclosure',
      scope: 'In-scope: your deployment domain, mobile apps',
    },
    compliance: 'Compliance',
    complianceContent:
      'Each operator is responsible for its own regulatory compliance, including applicable data-protection law. The security controls described on this page and in the project documentation support that effort.',
  },

  // Cookie Policy
  cookiesTitle: 'Cookie Policy',
  cookiesSubtitle: 'How we use cookies and similar technologies',
  cookiesIntro:
    'This Cookie Policy explains how Dhanam uses cookies and similar tracking technologies when you visit our website.',
  cookiesSections: {
    whatAreCookies: 'What Are Cookies',
    whatAreCookiesContent:
      'Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.',
    cookiesWeUse: 'Cookies We Use',
    essential: 'Essential Cookies',
    essentialContent:
      'Required for the application to function. These include session cookies, authentication tokens, and CSRF protection. Cannot be disabled.',
    essentialExamples: 'dhanam_locale (language preference), session tokens, CSRF tokens',
    analytics: 'Analytics Cookies',
    analyticsContent:
      'Help us understand how visitors use our application. We use PostHog for analytics. These are only enabled with your consent.',
    analyticsExamples: 'PostHog tracking cookies',
    preferences: 'Preference Cookies',
    preferencesContent:
      'Remember your settings such as theme (light/dark mode) and language preference.',
    preferencesExamples: 'dhanam_locale, theme preference',
    consentMechanism: 'Your Cookie Choices',
    consentMechanismContent:
      'When you first visit Dhanam, a cookie consent banner will appear. You can accept or reject analytics cookies. Your choice is stored in the dhanam_consent cookie for one year. You can change your preference at any time by clearing your cookies and revisiting the site.',
    thirdParty: 'Third-Party Cookies',
    thirdPartyContent:
      'Some third-party services we use, such as product analytics and error monitoring, may set their own cookies. These are only loaded with your consent where required.',
    managing: 'Managing Cookies',
    managingContent:
      'You can control cookies through your browser settings. Note that disabling essential cookies may prevent the application from functioning correctly.',
    changes: 'Changes to This Policy',
    changesContent:
      'We may update this Cookie Policy from time to time. Changes will be posted on this page.',
  },

  // ESG Methodology
  esgTitle: 'ESG Methodology',
  esgSubtitle: 'How we score crypto assets for Environmental, Social, and Governance factors',
  esgIntro:
    'Dhanam provides ESG (Environmental, Social, and Governance) scores for cryptocurrency assets to help users make informed investment decisions.',
  esgSections: {
    overview: 'Methodology Overview',
    overviewContent:
      'Our ESG scoring system evaluates crypto assets across three dimensions: Environmental impact (energy consumption, consensus mechanism), Social factors (community governance, accessibility), and Governance (transparency, token distribution).',
    sources: 'Data Sources',
    sourcesContent:
      'ESG scores are computed using the open-source Dhanam package, which aggregates data from public blockchain metrics, project documentation, and third-party research.',
    environmental: 'Environmental (E) Score',
    environmentalContent:
      'Evaluates energy intensity of the consensus mechanism, carbon footprint estimates, and environmental sustainability initiatives.',
    social: 'Social (S) Score',
    socialContent:
      'Assesses community participation, developer ecosystem, inclusivity, and social impact programs.',
    governance: 'Governance (G) Score',
    governanceContent:
      'Evaluates token distribution fairness, governance mechanisms, regulatory compliance, and organizational transparency.',
    composite: 'Composite Score',
    compositeContent:
      'The composite ESG score is a weighted average of E, S, and G components. Each component is scored on a scale from 0 to 100.',
    limitations: 'Limitations and Disclaimers',
    limitationsContent:
      'ESG scores are estimates based on available data and should not be the sole basis for investment decisions. Methodology and data sources are subject to change. Scores may not capture all relevant factors.',
    updates: 'Score Updates',
    updatesContent:
      'ESG scores are refreshed periodically as new data becomes available and methodology is refined.',
  },

  // Status Page
  statusTitle: 'System Status',
  statusSubtitle: 'Current operational status of Dhanam services',
  statusDescription: 'For real-time system status and incident history, visit our status page.',
  statusRedirect: 'Go to Status Page',

  // Documentation
  docsTitle: 'Documentation',
  docsSubtitle: 'Developer and user documentation',
  docsDescription: 'Explore our documentation for guides, API references, and integration details.',
  docsRedirect: 'View Documentation',
} as const;
