export const ENTITLEMENT_ID = 'full_access';
export const MONTHLY_PRODUCT_ID = 'monthly_access';
export const CONTENT_VERSION = 2;
export const NOTIFICATION_HORIZON_DAYS = 14;
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'it', 'es', 'de', 'ru', 'uk', 'hi', 'zh-Hans', 'ms', 'mbf'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

