export const ENTITLEMENT_ID = 'full_access';
export const YEARLY_SUBSCRIPTION_PRODUCT_ID = 'yearly_access';
export const YEARLY_SUBSCRIPTION_PERIOD = 'P1Y';
export const CONTENT_VERSION = 2;
export const NOTIFICATION_HORIZON_DAYS = 14;
export const SUPPORTED_LANGUAGES = ['en', 'it', 'ru', 'uk', 'es', 'fr', 'ms', 'ms-baba', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
