import { z } from 'zod';

export const subjectSlugSchema = z.enum(['physics', 'chemistry', 'biology']);
export type SubjectSlug = z.infer<typeof subjectSlugSchema>;

export const confidenceSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const resourceStateSchema = z.object({
  checked: z.boolean(),
  isApplicable: z.boolean(),
  completedAt: z.string().datetime().nullable(),
});
export type ResourceState = z.infer<typeof resourceStateSchema>;

export const topicProgressSchema = z.object({
  topicId: z.string().min(1),
  confidence: confidenceSchema,
  lastRevisedAt: z.string().date().nullable(),
  nextRevisionAt: z.string().date().nullable(),
  notes: z.string().max(20_000),
  flaggedForRevision: z.boolean(),
  updatedAt: z.string().datetime(),
  resources: z.record(z.string().min(1), resourceStateSchema),
});
export type TopicProgress = z.infer<typeof topicProgressSchema>;

export const resourceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  group: z.string().min(1),
  applicableSubjects: z.array(subjectSlugSchema).min(1),
  order: z.number().int().nonnegative(),
  isSystem: z.boolean(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
  version: z.string().min(1),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const SUBJECT_NAMES: Record<SubjectSlug, string> = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
};

export * from './progress';
