export const ENTITLEMENT_ID = 'full_access';
export const MONTHLY_PRODUCT_ID = 'monthly_access';
export const CONTENT_VERSION = 1;
export const NOTIFICATION_HORIZON_DAYS = 14;
export const SUPPORTED_LANGUAGES = ['en', 'it', 'ru', 'uk', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
