import type { Confidence, ResourceState, SubjectSlug } from './index';

export const SYSTEM_RESOURCE_SLUGS = [
  'lecture', 'unacademy-module', 'allen-module', 'aakash-module', 'errorless',
  'pw-dpp', 'unacademy-dpp', 'subject-dpp', 'ncert-reading', 'pyqs', 'revision', 'done',
] as const;

export type TopicStatus = 'not-started' | 'in-progress' | 'completed' | 'needs-revision';
export type ProgressTopic = {
  confidence: Confidence;
  flaggedForRevision: boolean;
  nextRevisionAt: string | null;
  resources: Record<string, ResourceState>;
};

export type ResourceSummary = { completed: number; applicable: number; percentage: number };
const isDue = (nextRevisionAt: string | null, today: string): boolean => nextRevisionAt !== null && nextRevisionAt !== '' && nextRevisionAt <= today;

export function getTrackedResourceCount(topic: ProgressTopic): number {
  return Object.values(topic.resources).filter((resource) => resource.isApplicable).length;
}

export function getCheckedResourceCount(topic: ProgressTopic): number {
  return Object.values(topic.resources).filter((resource) => resource.isApplicable && resource.checked).length;
}

export function getTopicStatus(topic: ProgressTopic, today: string, lowConfidenceNeedsRevision = true): TopicStatus {
  const done = topic.resources.done;
  if (isDue(topic.nextRevisionAt, today) || topic.flaggedForRevision || (lowConfidenceNeedsRevision && done?.checked && topic.confidence > 0 && topic.confidence <= 2)) return 'needs-revision';
  if (done?.checked) return 'completed';
  if (getCheckedResourceCount(topic) > 0) return 'in-progress';
  return 'not-started';
}

export function getResourceSummary(topics: ProgressTopic[], resourceSlug: string): ResourceSummary {
  const applicable = topics.filter((topic) => topic.resources[resourceSlug]?.isApplicable);
  const completed = applicable.filter((topic) => topic.resources[resourceSlug]?.checked).length;
  return { completed, applicable: applicable.length, percentage: applicable.length === 0 ? 0 : Math.round((completed / applicable.length) * 100) };
}

export function getOverallCompletion(topics: ProgressTopic[]): number {
  const applicable = topics.reduce((total, topic) => total + getTrackedResourceCount(topic), 0);
  const completed = topics.reduce((total, topic) => total + getCheckedResourceCount(topic), 0);
  return applicable === 0 ? 0 : Math.round((completed / applicable) * 100);
}

export function getSubjectDppSlug(subject: SubjectSlug): string {
  return { physics: 'physicsaholics-dpp', chemistry: 'aka-dpp', biology: 'seep-mam-dpp' }[subject];
}
