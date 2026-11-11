import type { DateOnly } from '../cycle/dateOnly';

export const feedbackStatuses = ['helpful', 'not_helpful', 'not_tried'] as const;

export type FeedbackStatus = (typeof feedbackStatuses)[number];

export interface GuidanceFeedback {
  date: DateOnly;
  cueId: string;
  status: FeedbackStatus;
}

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === 'string' && feedbackStatuses.includes(value as FeedbackStatus);
}
