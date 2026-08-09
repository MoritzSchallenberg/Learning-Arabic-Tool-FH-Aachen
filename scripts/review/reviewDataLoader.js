// Entwicklungsauftrag 12, Abschnitt 3/4/6 — lädt und verknüpft alle für den Review-Modus
// nötigen Quellen (rein lesend, verändert nie vocabulary.json/theory.json/batch_NN.json) und
// berechnet die Dashboard-Zählungen ausschließlich aus den tatsächlich geladenen Daten -- "keine
// Zählung darf hart codiert sein" (Abschnitt 3).

const fs = require('fs');
const path = require('path');
const { WORD_ASPECT_KEYS, THEORY_ASPECT_KEYS } = require('./reviewConstants.js');
const { paths: workspacePaths, loadState } = require('./reviewWorkspaceStore.js');

function packPaths(root) {
  const pack = path.join(root, 'language-packs', 'arabic');
  return {
    root,
    pack,
    vocabularyPath: path.join(pack, 'vocabulary.json'),
    theoryPath: path.join(pack, 'theory.json'),
    vocabSessionsPath: path.join(pack, 'vocabSessions.json'),
    manifestPath: path.join(root, 'audio_generation_manifest.json'),
    audioDir: path.join(pack, 'audio', 'vocabulary'),
    languageReviewDir: path.join(root, 'language-review')
  };
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return fallback;
  }
}

function loadBatches(languageReviewDir) {
  if (!fs.existsSync(languageReviewDir)) return [];
  const files = fs.readdirSync(languageReviewDir).filter((f) => /^batch_\d+\.json$/.test(f)).sort();
  return files.map((file) => readJson(path.join(languageReviewDir, file))).filter(Boolean);
}

function batchOfUnitId(unitId) {
  const match = /vocab_unit_(\d+)/.exec(unitId || '');
  if (!match) return 0; // Buchstaben-/Schrift-Units gehören zu keinem Vokabel-Batch
  return Math.ceil(parseInt(match[1], 10) / 5);
}

/**
 * Bestimmt den Audiozustand eines Wortes -- unabhängig davon, ob es (759 neue Wörter) im
 * Manifest steht oder (141 Bestandswörter aus Batch 0) schon vor dem Manifest-System eine
 * Aufnahme bekommen hat. Prüft dafür zusätzlich direkt das Dateisystem, statt sich blind auf das
 * Manifest zu verlassen (das für Bestandswörter gar keinen Eintrag hat).
 */
function computeAudioState(wordId, manifestByWordId, audioDir) {
  const manifestEntry = manifestByWordId.get(wordId);
  if (manifestEntry) {
    return {
      source: 'manifest',
      generation_status: manifestEntry.generation_status || 'pending',
      audio_review_status: manifestEntry.audio_review_status || 'not_reviewed',
      provider: manifestEntry.generation ? manifestEntry.generation.provider : null,
      generated_at: manifestEntry.generation ? manifestEntry.generation.generated_at : null
    };
  }
  const hasFile = fs.existsSync(path.join(audioDir, `${wordId}.wav`));
  if (hasFile) {
    return { source: 'legacy_bestand', generation_status: 'generated_unreviewed', audio_review_status: 'not_reviewed', provider: null, generated_at: null };
  }
  return { source: 'missing', generation_status: 'pending', audio_review_status: 'not_reviewed', provider: null, generated_at: null };
}

/**
 * Lädt und verknüpft alle Quellen zu einer einzigen, für die Oberfläche nutzbaren Struktur.
 */
function loadReviewData(root) {
  const pp = packPaths(root);
  const wp = workspacePaths(root);

  const vocabulary = readJson(pp.vocabularyPath, { categories: [] });
  const words = vocabulary.categories.flatMap((c) => c.words);

  const theoryDoc = readJson(pp.theoryPath, { theories: [] });
  const vocabSessions = readJson(pp.vocabSessionsPath, { sessions: [], vocab_units: [] });
  const sessionById = new Map(vocabSessions.sessions.map((s) => [s.session_id, s]));

  // Nur die 90 Vokabel-Session-Theorien (nicht die 8 Schrift-Unit-Theorien) sind Teil dieses
  // Review-Modus -- Abschnitt 6 spricht ausdrücklich von "allen 90 Theoriedokumenten".
  const theorySessionIds = new Set(vocabSessions.sessions.map((s) => s.theory_id));
  const theories = theoryDoc.theories.filter((t) => theorySessionIds.has(t.theory_id));

  const manifest = readJson(pp.manifestPath, { entries: [] });
  const manifestByWordId = new Map(manifest.entries.map((e) => [e.id, e]));

  const batches = loadBatches(pp.languageReviewDir);
  const batchEntryByWordId = new Map();
  const batchNumberByWordId = new Map();
  const theoryReviewByTheoryId = new Map();
  for (const batch of batches) {
    for (const entry of batch.entries || []) {
      batchEntryByWordId.set(entry.id, entry);
      batchNumberByWordId.set(entry.id, batch.batch);
    }
    for (const t of batch.theory_review || []) {
      theoryReviewByTheoryId.set(t.theory_id, { ...t, batch: batch.batch });
    }
  }

  const wordWorkspaceState = loadState(wp.wordStatePath);
  const theoryWorkspaceState = loadState(wp.theoryStatePath);

  const enrichedWords = words.map((w) => {
    const audio = computeAudioState(w.id, manifestByWordId, pp.audioDir);
    const batchEntry = batchEntryByWordId.get(w.id) || null;
    const workspace = wordWorkspaceState[w.id] || null;
    return {
      ...w,
      batch: batchNumberByWordId.has(w.id) ? batchNumberByWordId.get(w.id) : batchOfUnitId(w.unit_id),
      audio,
      batchReview: batchEntry,
      workspace
    };
  });

  const enrichedTheories = theories.map((t) => {
    const sessionEntry = [...sessionById.values()].find((s) => s.theory_id === t.theory_id);
    const batchReview = theoryReviewByTheoryId.get(t.theory_id) || null;
    const workspace = theoryWorkspaceState[t.theory_id] || null;
    return {
      ...t,
      unit_id: sessionEntry ? sessionEntry.unit_id : null,
      session_id: sessionEntry ? sessionEntry.session_id : null,
      title_session: sessionEntry ? sessionEntry.title : null,
      batch: batchReview ? batchReview.batch : null,
      batchReview,
      workspace
    };
  });

  return {
    words: enrichedWords,
    theories: enrichedTheories,
    sessions: vocabSessions.sessions,
    units: vocabSessions.vocab_units || [],
    paths: pp
  };
}

function overallStatusOf(entity) {
  return entity.workspace ? entity.workspace.overallStatus : 'needs_language_review';
}

/**
 * Abschnitt 3 -- alle Dashboard-Zählungen. Ausschließlich aus `data` berechnet (siehe Aufrufer),
 * niemals aus fest im Code stehenden Zahlen.
 */
function computeDashboardSummary(data) {
  const { words, theories } = data;

  const wordStatusCounts = {};
  for (const w of words) {
    const status = overallStatusOf(w);
    wordStatusCounts[status] = (wordStatusCounts[status] || 0) + 1;
  }
  const theoryStatusCounts = {};
  for (const t of theories) {
    const status = overallStatusOf(t);
    theoryStatusCounts[status] = (theoryStatusCounts[status] || 0) + 1;
  }

  const audioGenerationCounts = {};
  const audioReviewCounts = {};
  for (const w of words) {
    audioGenerationCounts[w.audio.generation_status] = (audioGenerationCounts[w.audio.generation_status] || 0) + 1;
    audioReviewCounts[w.audio.audio_review_status] = (audioReviewCounts[w.audio.audio_review_status] || 0) + 1;
  }

  const byBatch = {};
  for (const w of words) {
    const key = w.batch;
    if (!byBatch[key]) byBatch[key] = { total: 0, reviewed: 0, approved: 0 };
    byBatch[key].total += 1;
    const status = overallStatusOf(w);
    if (status === 'reviewed' || status === 'approved') byBatch[key].reviewed += 1;
    if (status === 'approved') byBatch[key].approved += 1;
  }

  const byUnit = {};
  for (const w of words) {
    const key = w.unit_id;
    if (!byUnit[key]) byUnit[key] = { total: 0, reviewed: 0, approved: 0 };
    byUnit[key].total += 1;
    const status = overallStatusOf(w);
    if (status === 'reviewed' || status === 'approved') byUnit[key].reviewed += 1;
    if (status === 'approved') byUnit[key].approved += 1;
  }

  const bySession = {};
  for (const w of words) {
    const key = w.session_id;
    if (!bySession[key]) bySession[key] = { total: 0, reviewed: 0, approved: 0 };
    bySession[key].total += 1;
    const status = overallStatusOf(w);
    if (status === 'reviewed' || status === 'approved') bySession[key].reviewed += 1;
    if (status === 'approved') bySession[key].approved += 1;
  }

  return {
    totalWords: words.length,
    totalTheories: theories.length,
    wordStatusCounts,
    theoryStatusCounts,
    audioGenerationCounts,
    audioReviewCounts,
    withCorrections: words.filter((w) => w.workspace && Object.keys(w.workspace.corrections || {}).length > 0).length,
    uncertainWords: words.filter((w) => w.workspace && Object.values(w.workspace.aspects || {}).some((a) => a.result === 'uncertain')).length,
    byBatch,
    byUnit,
    bySession
  };
}

module.exports = {
  packPaths,
  readJson,
  loadBatches,
  batchOfUnitId,
  computeAudioState,
  loadReviewData,
  computeDashboardSummary,
  overallStatusOf,
  WORD_ASPECT_KEYS,
  THEORY_ASPECT_KEYS
};
