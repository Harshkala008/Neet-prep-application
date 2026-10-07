'use client';

import { useEffect, useMemo, useState } from 'react';
import syllabus from '@neet/shared/data/syllabus.seed.json';
import { getTopicStatus, type Confidence, type TopicStatus } from '@neet/shared';

type SubjectSlug = 'dashboard' | 'all' | 'physics' | 'chemistry' | 'biology';
type Resource = { slug: string; name: string };
type Topic = { id: string; name: string; order: number };
type Unit = { id: string; name: string; syllabusPages: string; order: number; topics: Topic[] };
type Subject = { slug: Exclude<SubjectSlug, 'all'>; name: string; units: Unit[] };
type TopicState = { checked: Record<string, boolean>; applicable: Record<string, boolean>; confidence: Confidence; notes: string; nextRevisionAt: string };
type Modal = 'planner' | 'more' | 'signin' | 'session' | 'reset' | null;

const resources: Resource[] = [
  { slug: 'lecture', name: 'Lecture' }, { slug: 'unacademy-module', name: 'Unacademy Module' },
  { slug: 'allen-module', name: 'ALLEN Module' }, { slug: 'aakash-module', name: 'Aakash Module' },
  { slug: 'errorless', name: 'Errorless' }, { slug: 'pw-dpp', name: 'PW DPP' },
  { slug: 'unacademy-dpp', name: 'Unacademy DPP' }, { slug: 'subject-dpp', name: 'Subject DPP' },
  { slug: 'ncert-reading', name: 'NCERT Reading' }, { slug: 'pyqs', name: 'PYQs' },
  { slug: 'revision', name: 'Revision' }, { slug: 'done', name: 'Done' },
];

const subjects = syllabus.subjects as Subject[];
const today = new Date().toISOString().slice(0, 10);
const emptyState = (): TopicState => ({ checked: {}, applicable: {}, confidence: 0, notes: '', nextRevisionAt: '' });
const parseConfidence = (value: string): Confidence => {
  const parsed = Number(value);
  return parsed >= 1 && parsed <= 5 ? parsed as Confidence : 0;
};

function statusFor(state: TopicState): TopicStatus {
  const resourcesState = Object.fromEntries(resources.map((resource) => [resource.slug, {
    checked: state.checked[resource.slug] ?? false,
    isApplicable: state.applicable[resource.slug] !== false,
    completedAt: null,
  }]));
  return getTopicStatus({ ...state, flaggedForRevision: false, resources: resourcesState }, today);
}

function subjectIcon(slug: string) {
  return slug === 'physics' ? '🚀' : slug === 'chemistry' ? '⚗️' : '🧬';
}

function ProgressRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  return <div className="ring-wrap" aria-label={`${label}: ${value}%`}>
    <svg viewBox="0 0 120 120" role="img">
      <circle className="ring-track" cx="60" cy="60" r={radius} />
      <circle className="ring-value" cx="60" cy="60" r={radius} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference - (value / 100) * circumference }} />
    </svg>
    <strong>{value}%</strong><span>{label}</span>
  </div>;
}

function StudyChart() {
  const points = [12, 28, 20, 42, 34, 58, 72];
  const coordinates = points.map((point, index) => `${index * 52 + 10},${112 - point}`).join(' ');
  return <div className="chart-shell">
    <svg viewBox="0 0 330 130" role="img" aria-label="Seven day study activity trend">
      <defs><linearGradient id="activity-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#67a8ff" stopOpacity=".42" /><stop offset="1" stopColor="#67a8ff" stopOpacity="0" /></linearGradient></defs>
      {[25, 55, 85, 115].map((y) => <line key={y} x1="0" x2="330" y1={y} y2={y} className="chart-gridline" />)}
      <polygon points={`10,112 ${coordinates} 322,112`} fill="url(#activity-fill)" />
      <polyline points={coordinates} className="chart-line" />
      {points.map((point, index) => <circle key={index} cx={index * 52 + 10} cy={112 - point} r="4" className="chart-dot" />)}
    </svg>
    <div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Today</span></div>
  </div>;
}

export default function HomePage() {
  const [view, setView] = useState<SubjectSlug>('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TopicStatus>('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [sort, setSort] = useState('original');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [states, setStates] = useState<Record<string, TopicState>>({});
  const [hydrated, setHydrated] = useState(false);
  const [bulkAction, setBulkAction] = useState<{ unit: Unit; slug: string; checked: boolean } | null>(null);
  const [undo, setUndo] = useState<Record<string, TopicState> | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [isLight, setIsLight] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(50 * 60);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('neet-tracker-topic-state');
      if (saved) setStates(JSON.parse(saved) as Record<string, TopicState>);
    } catch {
      // Corrupt local data should not prevent the tracker from opening.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('neet-tracker-topic-state', JSON.stringify(states));
  }, [hydrated, states]);

  useEffect(() => {
    if (!sessionActive) return;
    const timer = window.setInterval(() => setSessionSeconds((seconds) => {
      if (seconds <= 1) {
        setSessionActive(false);
        return 0;
      }
      return seconds - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [sessionActive]);

  useEffect(() => {
    document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  }, [isLight]);

  const visibleSubjects = view === 'all' ? subjects : subjects.filter((subject) => subject.slug === view);
  const topicCount = subjects.reduce((total, subject) => total + subject.units.reduce((unitTotal, unit) => unitTotal + unit.topics.length, 0), 0);
  const allTopics = subjects.flatMap((subject) => subject.units.flatMap((unit) => unit.topics.map((topic) => ({ subject, unit, topic }))));
  const scopedTopics = visibleSubjects.flatMap((subject) => subject.units.flatMap((unit) => unit.topics.map((topic) => ({ subject, unit, topic }))));
  const completed = allTopics.filter(({ topic }) => states[topic.id]?.checked.done).length;
  const scopedCompleted = scopedTopics.filter(({ topic }) => states[topic.id]?.checked.done).length;
  const inProgress = allTopics.filter(({ topic }) => statusFor(states[topic.id] ?? emptyState()) === 'in-progress').length;
  const needsRevision = allTopics.filter(({ topic }) => statusFor(states[topic.id] ?? emptyState()) === 'needs-revision').length;
  const resourceSummary = resources.map((resource) => {
    const applicable = allTopics.filter(({ topic }) => (states[topic.id] ?? emptyState()).applicable[resource.slug] !== false);
    const done = applicable.filter(({ topic }) => (states[topic.id] ?? emptyState()).checked[resource.slug]).length;
    return { ...resource, done, applicable, percentage: applicable.length ? Math.round(done / applicable.length * 100) : 0 };
  });

  const filtered = useMemo(() => visibleSubjects.map((subject) => ({
    subject,
    units: subject.units.map((unit) => ({
      ...unit,
      topics: unit.topics.filter((topic) => {
        const state = states[topic.id] ?? emptyState();
        const status = statusFor(state);
        const matchesQuery = !query || `${subject.name} ${unit.name} ${topic.name} ${state.notes}`.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        const matchesConfidence = confidenceFilter === 'all' || String(state.confidence) === confidenceFilter;
        return matchesQuery && matchesStatus && matchesConfidence;
      }).sort((a, b) => sort === 'confidence' ? (states[a.id]?.confidence ?? 0) - (states[b.id]?.confidence ?? 0) : sort === 'highest' ? (states[b.id]?.confidence ?? 0) - (states[a.id]?.confidence ?? 0) : a.order - b.order),
    })).filter((unit) => unit.topics.length > 0),
  })), [confidenceFilter, query, sort, states, statusFilter, visibleSubjects]);

  const updateTopic = (topicId: string, update: Partial<TopicState>) => {
    setStates((current) => ({ ...current, [topicId]: { ...emptyState(), ...current[topicId], ...update } }));
  };
  const toggleResource = (topicId: string, slug: string) => {
    const state = states[topicId] ?? emptyState();
    updateTopic(topicId, { checked: { ...state.checked, [slug]: !state.checked[slug] } });
  };
  const toggleApplicable = (topicId: string, slug: string) => {
    const state = states[topicId] ?? emptyState();
    updateTopic(topicId, { applicable: { ...state.applicable, [slug]: state.applicable[slug] === false } });
  };
  const toggleUnitResource = (unit: Unit, slug: string, checked: boolean) => {
    setUndo(states);
    setStates((current) => {
      const next = { ...current };
      unit.topics.forEach((topic) => {
        const state = next[topic.id] ?? emptyState();
        next[topic.id] = { ...state, checked: { ...state.checked, [slug]: checked } };
      });
      return next;
    });
    window.setTimeout(() => setUndo(null), 30000);
  };

  const showPending = (resourceSlug: string) => {
    setView('all');
    setQuery('');
    setStatusFilter('all');
    setConfidenceFilter('all');
    setExpandedUnits(Object.fromEntries(allTopics.filter(({ topic }) => !(states[topic.id] ?? emptyState()).checked[resourceSlug]).map(({ unit }) => [unit.id, true])));
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), states }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neet-master-tracker-progress.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  const resetData = () => {
    setStates({});
    setExpandedUnits({});
    setExpandedTopics({});
    setModal(null);
  };
  const formatTimer = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const openPlanner = () => {
    setModal(null);
    setView('all');
    setStatusFilter('needs-revision');
    setQuery('');
  };
  const navigate = (nextView: SubjectSlug) => {
    setView(nextView);
    if (nextView !== 'all') {
      setStatusFilter('all');
      setConfidenceFilter('all');
    }
  };
  const overlays = <>{modal === 'planner' && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true"><h2>Planner</h2><p className="muted">Your revision queue is ready. Open the topics due for revision, then set dates and confidence for each topic.</p><div className="modal-actions"><button className="ghost" onClick={() => setModal(null)}>Close</button><button className="primary" onClick={openPlanner}>Open revision queue</button></div></div></div>}
    {modal === 'more' && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true"><h2>Data & tools</h2><p className="muted">Progress is stored locally on this device and can be backed up as JSON.</p><div className="modal-actions"><button className="ghost" onClick={() => setModal(null)}>Close</button><button className="ghost" onClick={exportData}>Export progress</button><button className="primary" onClick={() => setModal('reset')}>Reset progress</button></div></div></div>}
    {modal === 'signin' && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true"><h2>Local mode is active</h2><p className="muted">Your tracker is fully usable without an account. Sign-in synchronization will be added when the backend authentication service is connected.</p><div className="modal-actions"><button className="primary" onClick={() => setModal(null)}>Continue locally</button></div></div></div>}
    {modal === 'session' && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true"><h2>Study session</h2><p className="timer-large">{formatTimer(sessionSeconds)}</p><p className="muted">Use this focused 50-minute session while you study. Your topic progress remains available underneath.</p><div className="modal-actions"><button className="ghost" onClick={() => { setSessionSeconds(50 * 60); setSessionActive(false); }}>Reset</button><button className="primary" onClick={() => setSessionActive((value) => !value)}>{sessionActive ? 'Pause' : 'Start'}</button><button className="ghost" onClick={() => setModal(null)}>Close</button></div></div></div>}
    {modal === 'reset' && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true"><h2>Reset all progress?</h2><p className="muted">This removes every checkbox, note, confidence score, and revision date from this browser. This cannot be undone.</p><div className="modal-actions"><button className="ghost" onClick={() => setModal('more')}>Cancel</button><button className="primary danger" onClick={resetData}>Reset everything</button></div></div></div>}</>;
  const header = (dashboard: boolean) => <header className="topbar">
    <strong>🩺 NEET Master Tracker Pro · UG 2026</strong>
    <nav aria-label="Primary navigation">
      <button className={dashboard ? 'nav-active' : ''} onClick={() => navigate('dashboard')}>Dashboard</button>
      <button className={!dashboard && view === 'all' ? 'nav-active' : ''} onClick={() => navigate('all')}>All / Search</button>
      {subjects.map((subject) => <button key={subject.slug} className={!dashboard && view === subject.slug ? 'nav-active' : ''} onClick={() => navigate(subject.slug)}>{subject.name}</button>)}
      <button onClick={() => setModal('planner')}>Planner</button><button onClick={() => setModal('more')}>More</button>
    </nav>
    <div className="header-actions"><input aria-label="Search syllabus" placeholder="Search syllabus" value={query} onChange={(event) => { setQuery(event.target.value); if (dashboard && event.target.value) setView('all'); }} /><span className="sync-state">Local mode · saved automatically</span><button className="primary" onClick={() => setModal('signin')}>Sign in</button><button className="theme" aria-label="Toggle theme" onClick={() => setIsLight((value) => !value)}>{isLight ? '☀️' : '🌓'}</button></div>
  </header>;
  const workspaceAnalytics = <section className="workspace-analytics">
    <p className="eyebrow">Workspace overview &amp; analytics</p>
    <div className="analytics-strip">
      <article className="analytics-card overall-card"><div className="section-heading"><h2>Overall Progress</h2><span className="kebab">···</span></div><ProgressRing value={Math.round(completed / topicCount * 100)} label="complete" color="#67a8ff" /><small>Minimal telemetry</small></article>
      <article className="analytics-card velocity-card"><div className="section-heading"><div><h2>Analytics &amp; Progress</h2><span className="muted">Daily Study Velocity</span></div><span className="kebab">···</span></div><StudyChart /></article>
      <article className="analytics-side"><div className="analytics-card mini-card"><div className="section-heading"><strong>Study streak: 0 days</strong><span>›</span></div><small>Study streak is streak: 0 days</small></div><div className="analytics-card mini-card"><div className="section-heading"><strong>Focus score</strong><span>›</span></div><small>● Minimalist UI　 ▬ ▬</small><small>● Focus score　 0 / 0</small></div></article>
    </div>
  </section>;

  if (view === 'dashboard') {
    return <main className="shell">
      {header(true)}
      <section className="tracker-heading"><div><p className="eyebrow">Command center</p><h1>Good morning. Keep moving.</h1><p className="muted">Your progress is local to this device until you sign in.</p></div><button className="primary" onClick={() => setView('all')}>Continue syllabus</button></section>
      <section className="dashboard-grid">
        <article className="overview hero-overview"><div className="overview-copy"><p className="eyebrow">Overall readiness</p><h2>{Math.round(completed / topicCount * 100)}%</h2><p className="muted">Your complete preparation signal across syllabus, resources, and revision.</p><div className="progress-track"><span style={{ width: `${completed / topicCount * 100}%` }} /></div><div className="metrics"><div><strong>{completed}</strong><span>Completed</span></div><div><strong>{inProgress}</strong><span>In progress</span></div><div><strong>{topicCount - completed - inProgress}</strong><span>Not started</span></div><div><strong>{needsRevision}</strong><span>Need revision</span></div></div></div><div className="rings"><ProgressRing value={Math.round(completed / topicCount * 100)} label="Overall" color="#67a8ff" /><ProgressRing value={0} label="Focus" color="#6bd6ac" /></div></article>
        <article className="panel focus-panel"><div className="panel-glow" /><p className="eyebrow">Today</p><h2>Study focus</h2><p className="muted">Review low-confidence topics or set a target date in Planner.</p><div className="focus-stat"><span>Session timer</span><strong>{formatTimer(sessionSeconds)}</strong></div><button className="primary" onClick={() => setModal('session')}>{sessionActive ? 'Open active session' : 'Start 50 min session'}</button></article>
      </section>
      <section className="subject-grid">{subjects.map((subject) => { const subjectTopics = subject.units.flatMap((unit) => unit.topics); const subjectDone = subjectTopics.filter((topic) => states[topic.id]?.checked.done).length; return <article className={`subject-card ${subject.slug}`} key={subject.slug}><div className="card-top"><span className="subject-icon">{subjectIcon(subject.slug)}</span><span className="badge">{Math.round(subjectDone / subjectTopics.length * 100)}%</span></div><h2>{subject.name}</h2><p className="muted">{subject.units.length} units · {subjectTopics.length} items · {subjectDone} done</p><div className="mini-progress"><span style={{ width: `${subjectDone / subjectTopics.length * 100}%` }} /></div><button className="card-link" onClick={() => setView(subject.slug)}>Open tracker →</button></article>; })}</section>
      <section className="charts-grid"><article className="panel chart-card"><div className="section-heading"><div><p className="eyebrow">Momentum</p><h2>Study activity</h2></div><span className="chart-total">14h 20m</span></div><StudyChart /></article><article className="panel chart-card"><div className="section-heading"><div><p className="eyebrow">Readiness</p><h2>Subject comparison</h2></div><span className="muted">Target: 100%</span></div><div className="subject-bars">{subjects.map((subject) => { const subjectTopics = subject.units.flatMap((unit) => unit.topics); const subjectDone = subjectTopics.filter((topic) => states[topic.id]?.checked.done).length; const percentage = Math.round(subjectDone / subjectTopics.length * 100); return <div className="subject-bar-row" key={subject.slug}><span>{subjectIcon(subject.slug)} {subject.name}</span><div className="subject-bar-track"><i className={subject.slug} style={{ width: `${percentage}%` }} /></div><strong>{percentage}%</strong></div>; })}</div><div className="chart-legend"><span><i className="legend-dot blue-dot" />Completed</span><span><i className="legend-dot faint-dot" />Remaining</span></div></article></section>
      <section className="panel resource-panel"><div className="section-heading"><div><p className="eyebrow">Resource analytics</p><h2>Preparation checklist</h2></div><span className="muted">N/A items excluded from each denominator</span></div><div className="resource-table">{resourceSummary.map((resource) => <button className="resource-row" key={resource.slug} onClick={() => showPending(resource.slug)}><span>{resource.name}</span><span>{resource.done}/{resource.applicable.length} · {resource.percentage}%</span><span className="resource-bar"><i style={{ width: `${resource.percentage}%` }} /></span></button>)}</div></section>
      {overlays}
    </main>;
  }

  return (
    <main className="shell">
      {header(false)}

      {workspaceAnalytics}
      <section className="tracker-heading">
        <div><p className="eyebrow">{view === 'all' ? 'Syllabus workspace' : `${subjectIcon(view)} ${view}`}</p><h1>{view === 'all' ? 'All syllabus topics' : subjects.find((subject) => subject.slug === view)?.name}</h1><p className="muted">{scopedCompleted}/{scopedTopics.length} topics marked Done · {scopedTopics.length} trackable topics · 12 checks per topic</p></div>
        <div className="tracker-controls">
          <select aria-label="Status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">All topics</option><option value="completed">Completed</option><option value="in-progress">In progress</option><option value="not-started">Not started</option><option value="needs-revision">Needs revision</option></select>
          <select aria-label="Confidence filter" value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value)}><option value="all">All confidence</option><option value="1">Confidence 1/5</option><option value="2">Confidence 2/5</option><option value="3">Confidence 3/5</option><option value="4">Confidence 4/5</option><option value="5">Confidence 5/5</option></select>
          <select aria-label="Confidence sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="original">Original order</option><option value="confidence">Lowest confidence</option><option value="highest">Highest confidence</option></select>
          <button className="ghost" onClick={() => setExpandedUnits(Object.fromEntries(subjects.flatMap((subject) => subject.units.map((unit) => [unit.id, true]))))}>Expand all</button>
          <button className="ghost" onClick={() => setExpandedUnits({})}>Collapse all</button>
        </div>
      </section>

      <div className="pending-row">{resources.slice(0, -1).map((resource) => <button key={resource.slug} className="pending-chip" onClick={() => showPending(resource.slug)}>{resource.name} pending</button>)}</div>

      <section className="tracker-list">
        {filtered.map(({ subject, units }) => <div key={subject.slug} className="subject-section">
          <div className="subject-title"><h2>{subjectIcon(subject.slug)} {subject.name}</h2><span>{subject.units.reduce((sum, unit) => sum + unit.topics.length, 0)} topics · {subject.units.length} units</span></div>
          {units.map((unit) => <details key={unit.id} open={expandedUnits[unit.id] ?? false} onToggle={(event) => setExpandedUnits((current) => ({ ...current, [unit.id]: (event.target as HTMLDetailsElement).open }))}>
            <summary><span><strong>Unit {unit.order}: {unit.name}</strong><small>{unit.syllabusPages} · {unit.topics.length} visible topics</small></span><div className="unit-actions"><button type="button" onClick={(event) => { event.preventDefault(); setBulkAction({ unit, slug: 'done', checked: true }); }}>Mark Done</button><button type="button" onClick={(event) => { event.preventDefault(); setBulkAction({ unit, slug: 'done', checked: false }); }}>Clear Done</button></div></summary>
            <div className="topic-list">{unit.topics.map((topic) => {
              const state = states[topic.id] ?? emptyState(); const status = statusFor(state); const checkedCount = resources.filter((resource) => state.checked[resource.slug] && state.applicable[resource.slug] !== false).length;
              return <details className="topic-card" key={topic.id} open={expandedTopics[topic.id] ?? false} onToggle={(event) => setExpandedTopics((current) => ({ ...current, [topic.id]: (event.target as HTMLDetailsElement).open }))}>
                <summary><span>{topic.name}</span><span className={`topic-status ${status}`}>{status.replace('-', ' ')} · {checkedCount}/12</span></summary>
                <div className="topic-body"><div className="resource-grid">{resources.map((resource) => <div key={resource.slug} className={`resource-item ${state.applicable[resource.slug] === false ? 'resource-na' : ''}`}><label><input type="checkbox" checked={state.checked[resource.slug] ?? false} disabled={state.applicable[resource.slug] === false} onChange={() => toggleResource(topic.id, resource.slug)} />{resource.name}</label><label className="na-toggle"><input type="checkbox" checked={state.applicable[resource.slug] === false} onChange={() => toggleApplicable(topic.id, resource.slug)} />N/A</label></div>)}</div>
                  <div className="topic-meta"><label>Confidence<select value={state.confidence} onChange={(event) => updateTopic(topic.id, { confidence: parseConfidence(event.target.value) })}><option value={0}>Unrated</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label><label>Next revision<input type="date" value={state.nextRevisionAt} onChange={(event) => updateTopic(topic.id, { nextRevisionAt: event.target.value })} /></label></div>
                  <label className="notes-field">Personal notes<textarea placeholder="Add a formula, confusion, or reminder..." value={state.notes} onChange={(event) => updateTopic(topic.id, { notes: event.target.value })} /></label>
                </div>
              </details>;
            })}</div>
          </details>)}
        </div>)}
        {filtered.every(({ units }) => units.length === 0) && <div className="empty-state"><strong>No topics match these filters.</strong><span>Try clearing the search or resetting the filters.</span></div>}
      </section>
      {undo && <div className="undo-toast" role="status">Bulk change applied. <button onClick={() => { setStates(undo); setUndo(null); }}>Undo</button></div>}
      {bulkAction && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="bulk-title"><h2 id="bulk-title">{bulkAction.checked ? 'Mark topics Done?' : 'Clear Done status?'}</h2><p className="muted">{bulkAction.unit.topics.length} topics in {bulkAction.unit.name} will be updated.</p><div className="modal-actions"><button className="ghost" onClick={() => setBulkAction(null)}>Cancel</button><button className="primary" onClick={() => { toggleUnitResource(bulkAction.unit, bulkAction.slug, bulkAction.checked); setBulkAction(null); }}>Confirm</button></div></div></div>}
      {overlays}
    </main>
  );
}
