import test from 'node:test';
import assert from 'node:assert/strict';
import { getOverallCompletion, getResourceSummary, getSubjectDppSlug, getTopicStatus, type ProgressTopic } from './progress.js';

const topic = (overrides: Partial<ProgressTopic> = {}): ProgressTopic => ({
  confidence: 0,
  flaggedForRevision: false,
  nextRevisionAt: null,
  resources: {
    lecture: { checked: false, isApplicable: true, completedAt: null },
    done: { checked: false, isApplicable: true, completedAt: null },
  },
  ...overrides,
});

test('derives topic statuses', () => {
  assert.equal(getTopicStatus(topic(), '2026-10-07'), 'not-started');
  assert.equal(getTopicStatus(topic({ resources: { lecture: { checked: true, isApplicable: true, completedAt: null }, done: { checked: false, isApplicable: true, completedAt: null } } }), '2026-10-07'), 'in-progress');
  assert.equal(getTopicStatus(topic({ resources: { lecture: { checked: true, isApplicable: true, completedAt: null }, done: { checked: true, isApplicable: true, completedAt: null } } }), '2026-10-07'), 'completed');
  assert.equal(getTopicStatus(topic({ flaggedForRevision: true }), '2026-10-07'), 'needs-revision');
  assert.equal(getTopicStatus(topic({ nextRevisionAt: '2026-10-06' }), '2026-10-07'), 'needs-revision');
  assert.equal(getTopicStatus(topic({ confidence: 2, resources: { done: { checked: true, isApplicable: true, completedAt: null } } }), '2026-10-07'), 'needs-revision');
});

test('excludes non-applicable resources from denominators', () => {
  const topics = [
    topic(),
    topic({ resources: { lecture: { checked: false, isApplicable: false, completedAt: null }, done: { checked: true, isApplicable: true, completedAt: null } } }),
  ];
  assert.deepEqual(getResourceSummary(topics, 'lecture'), { completed: 0, applicable: 1, percentage: 0 });
  assert.equal(getOverallCompletion(topics), 33);
});

test('maps subject-specific DPPs', () => {
  assert.equal(getSubjectDppSlug('physics'), 'physicsaholics-dpp');
  assert.equal(getSubjectDppSlug('chemistry'), 'aka-dpp');
  assert.equal(getSubjectDppSlug('biology'), 'seep-mam-dpp');
});
