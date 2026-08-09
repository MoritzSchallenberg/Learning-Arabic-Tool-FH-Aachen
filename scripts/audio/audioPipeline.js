// Entwicklungsauftrag 12, Abschnitte 8-14 -- abgesicherte, manifest-gesteuerte
// Audio-Erzeugungspipeline für die vom Nutzer ausdrücklich erlaubte technische
// Vorschau-Audioerzeugung der 759 bislang fehlenden Vokabelaudios.
//
// Design-Prinzipien (direkt aus dem Auftragstext):
//   - Das Manifest ist die MASSGEBLICHE Auswahlquelle -- nie das gesamte Vokabular pauschal.
//   - arabic_vocalized wird IMMER frisch aus der aktuellen vocabulary.json gelesen (nicht aus
//     dem ggf. veralteten Manifest-Cache), damit nie ein überholter Text vertont wird.
//   - Alles außer dem eigentlichen Netzwerkaufruf (siehe ttsProviders.js) ist synchron/lokal und
//     ohne echte API-Aufrufe testbar.
//   - Staging vor Übernahme (Abschnitt 13), atomare Umbenennung, keine stillen Überschreibungen.
//   - Standardmäßig wird NUR die normale Datei erzeugt, keine "_slow.wav" (Abschnitt 11).

const fs = require('node:fs');
const path = require('node:path');
const { writeJsonFileAtomic } = require('../writeJsonAtomic.js');
const { normalizeManifest, enrichManifestWithWordMeta, GENERATION_STATUS_VALUES, PREVIEW_GENERATION_REASON } = require('./audioManifestModel.js');
const { validateAudioBuffer, sha256, textHash } = require('./wavValidation.js');
const { ProviderError } = require('./ttsProviders.js');

function defaultPaths(root) {
  return {
    root,
    manifestPath: path.join(root, 'audio_generation_manifest.json'),
    vocabularyPath: path.join(root, 'language-packs', 'arabic', 'vocabulary.json'),
    audioDir: path.join(root, 'language-packs', 'arabic', 'audio', 'vocabulary'),
    stagingDir: path.join(root, 'language-packs', 'arabic', 'audio', '.staging', 'vocabulary')
  };
}

function loadContext(paths) {
  const manifestRaw = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf-8'));
  const vocabulary = JSON.parse(fs.readFileSync(paths.vocabularyPath, 'utf-8'));
  const words = vocabulary.categories.flatMap((c) => c.words);
  const wordsById = new Map(words.map((w) => [w.id, w]));
  const manifest = enrichManifestWithWordMeta(normalizeManifest(manifestRaw), wordsById);
  return { paths, manifest, wordsById };
}

function saveManifest(paths, manifest) {
  writeJsonFileAtomic(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

/**
 * Liest den aktuell gültigen Vertonungstext für ein Wort IMMER live aus vocabulary.json, nie aus
 * dem Manifest-Cache -- vermeidet, dass nach einer späteren Korrektur der Vokalisierung eine
 * inzwischen überholte Fassung vertont würde.
 */
function resolveInputText(entryId, wordsById) {
  const word = wordsById.get(entryId);
  if (!word) throw new Error(`Manifest verweist auf unbekannte Wort-ID "${entryId}" -- vocabulary.json und audio_generation_manifest.json sind nicht mehr konsistent.`);
  if (!word.arabic_vocalized || !word.arabic_vocalized.trim()) {
    throw new Error(`Wort "${entryId}" hat kein arabic_vocalized-Feld -- kann nicht vertont werden.`);
  }
  return word.arabic_vocalized;
}

/**
 * Wählt die zu bearbeitenden Manifest-Einträge aus. Standardfall ("all"/"sample"): nur Einträge,
 * die noch keine erfolgreich erzeugte Datei haben (generation_status in pending/failed/
 * regeneration_required) -- das macht einen unterbrochenen Lauf von selbst fortsetzbar, ohne
 * bereits erfolgreich erzeugte Dateien erneut anzufragen. Explizite `ids` umgehen diesen Filter
 * bewusst (gezielte Einzel-Neuerzeugung, z. B. nach einer Korrektur -- "regeneration_required").
 */
function selectTargets(context, { ids, unitIds, sampleSize, all } = {}) {
  const entries = context.manifest.entries;
  if (ids && ids.length > 0) {
    const idSet = new Set(ids);
    const found = entries.filter((e) => idSet.has(e.id));
    const missing = ids.filter((id) => !entries.some((e) => e.id === id));
    if (missing.length > 0) {
      throw new Error(`Folgende IDs stehen nicht im Audio-Manifest (entweder unbekannt oder bereits mit vorhandener Bestandsaudio außerhalb des Manifests): ${missing.join(', ')}`);
    }
    return found;
  }

  const pendingLike = entries.filter((e) => e.generation_status === 'pending' || e.generation_status === 'failed' || e.generation_status === 'regeneration_required' || e.generation_status === 'preview_generation_authorized');

  let pool = pendingLike;
  if (unitIds && unitIds.length > 0) {
    const unitSet = new Set(unitIds);
    pool = pool.filter((e) => unitSet.has(e.unit_id));
  }

  if (sampleSize) {
    return representativeSample(pool, context.wordsById, sampleSize);
  }
  if (all) return pool;
  return pool;
}

const BATCH_UNIT_START = { 1: 1, 2: 6, 3: 11, 4: 16, 5: 21, 6: 26 };
function batchOfUnitId(unitId) {
  if (!unitId) return null;
  const match = /vocab_unit_(\d+)/.exec(unitId);
  if (!match) return null;
  const unitNumber = parseInt(match[1], 10);
  return Math.ceil(unitNumber / 5) || null; // Units 1-5 -> Batch 1, 6-10 -> Batch 2, ... 26-30 -> Batch 6
}

const HAMZA_RE = /[أإؤئء]/;
const AYN_RE = /ع/;
const EMPHATIC_RE = /[صضطظ]/;
const SHADDA_RE = /ّ/;
const TANWIN_RE = /[ًٌٍ]/;
const FUNCTION_WORD_TYPES = new Set(['Präposition', 'Konjunktion', 'Partikel', 'Pronomen (Demonstrativ)', 'Pronomen (Indefinit)', 'Fragewort']);

/**
 * Baut eine repräsentative, REPRODUZIERBARE Stichprobe (Abschnitt 14). Deckt gezielt ab, statt
 * nur "irgendwie zu verteilen": mindestens ein Wort je Batch 1-6, Hamza, ʿAyn, mindestens ein
 * emphatischer Konsonant, Schadda, Tanwin, ein mehrteiliger Ausdruck, ein kurzes und ein langes
 * Wort, ein Technik-/Fremdwort (Unit 26) sowie ein Funktionswort (Präposition/Konjunktion/
 * Partikel/Pronomen/Fragewort, v. a. Unit 30). Danach deterministisch (id-sortiert) aufgefüllt.
 * Kein Zufall -- derselbe Aufruf liefert immer dieselben IDs (Abschnitt 18: reproduzierbar).
 */
function representativeSample(pool, wordsById, size) {
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const picked = [];
  const pickedIds = new Set();

  function textOf(entry) {
    const word = wordsById.get(entry.id);
    return (word && word.arabic_vocalized) || entry.arabic_vocalized || '';
  }
  function firstMatching(pred) {
    return sorted.find((e) => !pickedIds.has(e.id) && pred(e));
  }
  function tryAdd(entry) {
    if (!entry || pickedIds.has(entry.id) || picked.length >= size) return;
    picked.push(entry);
    pickedIds.add(entry.id);
  }

  for (let batch = 1; batch <= 6; batch += 1) {
    tryAdd(firstMatching((e) => batchOfUnitId(e.unit_id) === batch));
  }

  const featureChecks = [
    (e) => HAMZA_RE.test(textOf(e)),
    (e) => AYN_RE.test(textOf(e)),
    (e) => EMPHATIC_RE.test(textOf(e)),
    (e) => SHADDA_RE.test(textOf(e)),
    (e) => TANWIN_RE.test(textOf(e)),
    (e) => textOf(e).trim().includes(' '), // mehrteiliger Ausdruck
    (e) => textOf(e).trim().split(/\s+/).length === 1 && [...textOf(e)].length <= 5, // kurzes Einzelwort
    (e) => [...textOf(e)].length >= 14, // langer Ausdruck
    (e) => e.unit_id === 'vocab_unit_26', // Technik-/Fremdwörter
    (e) => { const w = wordsById.get(e.id); return w && FUNCTION_WORD_TYPES.has(w.part_of_speech); }
  ];
  for (const check of featureChecks) tryAdd(firstMatching(check));

  for (const e of sorted) {
    if (picked.length >= size) break;
    tryAdd(e);
  }
  return picked.slice(0, size);
}

function planReport(context, targets) {
  const chars = targets.map((e) => resolveInputText(e.id, context.wordsById).length);
  const totalCharacters = chars.reduce((a, b) => a + b, 0);
  const alreadyGenerated = context.manifest.entries.filter((e) => e.generation_status === 'generated_unreviewed').length;
  const existingLegacyAudioCount = fs.existsSync(context.paths.audioDir)
    ? fs.readdirSync(context.paths.audioDir).filter((f) => f.endsWith('.wav') && !f.endsWith('_slow.wav')).length - alreadyGenerated
    : null;
  return {
    fileCount: targets.length,
    totalCharacters,
    apiCallsPlanned: targets.length, // ein Aufruf je Datei -- keine "_slow.wav" standardmäßig (Abschnitt 11)
    alreadyGenerated,
    existingLegacyAudioApprox: existingLegacyAudioCount,
    ids: targets.map((e) => e.id)
  };
}

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Erzeugt genau eine Datei mit begrenztem Backoff-Retry, Staging, technischer Prüfung und
 * atomarer Übernahme. Aktualisiert den übergebenen `manifest`-Container in-memory und persistiert
 * ihn nach jedem Wort einzeln (Abschnitt 10: "Fortsetzen nach Abbruch" -- ein Absturz nach Wort N
 * darf die ersten N-1 nicht verlieren).
 */
async function generateOne(context, entry, options) {
  const {
    providerFn,
    providerName = 'elevenlabs',
    modelId = null,
    voiceId = null,
    dryRun = false,
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    sleepFn = sleep,
    onProgress = () => {}
  } = options;

  const { paths, wordsById, manifest } = context;
  const text = resolveInputText(entry.id, wordsById);

  if (dryRun) {
    onProgress({ id: entry.id, dryRun: true, textLength: text.length });
    return { id: entry.id, status: 'dry_run', textLength: text.length };
  }

  const finalPath = path.join(paths.audioDir, `${entry.id}.wav`);

  // Harte Schutzmaßnahme (Abschnitt 8): niemals eine bestehende Datei überschreiben, die dieser
  // Lauf nicht selbst gerade erzeugt hat -- betrifft insbesondere die 141 ursprünglichen
  // Bestandsaufnahmen, falls sich je eine ID-Kollision einschliche (nach heutigem Datenstand
  // ausgeschlossen, da diese 141 Wörter gar nicht im Manifest stehen -- diese Prüfung bleibt
  // trotzdem als zweite, unabhängige Absicherung bestehen).
  if (fs.existsSync(finalPath) && entry.generation_status !== 'generated_unreviewed') {
    const msg = `"${finalPath}" existiert bereits, ist im Manifest aber nicht als "generated_unreviewed" markiert -- wird NICHT überschrieben (Schutz der Bestandsaufnahmen).`;
    updateEntry(manifest, entry.id, { generation_status: 'failed', generation: { ...entry.generation, last_error: msg } });
    saveManifest(paths, manifest);
    onProgress({ id: entry.id, status: 'blocked_existing_file', error: msg });
    return { id: entry.id, status: 'blocked_existing_file', error: msg };
  }

  updateEntry(manifest, entry.id, {
    generation_status: 'preview_generation_authorized',
    generation: { ...entry.generation, reason: PREVIEW_GENERATION_REASON, input_text: text, input_text_hash: textHash(text) }
  });
  saveManifest(paths, manifest);

  ensureDir(paths.stagingDir);
  const stagingFinal = path.join(paths.stagingDir, `${entry.id}.wav`);

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const buffer = await providerFn(text);
      const validation = validateAudioBuffer(buffer);
      if (!validation.ok) {
        lastError = `technische Prüfung fehlgeschlagen: ${validation.problems.join('; ')}`;
        // absichtlich NICHT retryable -- ein zweiter identischer Request würde vermutlich
        // dasselbe Ergebnis liefern (z. B. bei konstant zu kurzem Text); trotzdem werden die
        // verbleibenden Versuche nicht künstlich blockiert, falls der Anbieter nicht-deterministisch ist.
        onProgress({ id: entry.id, attempt, status: 'validation_failed', problems: validation.problems });
        if (attempt >= maxAttempts) break;
        await sleepFn(backoffDelay(attempt, baseDelayMs, maxDelayMs));
        continue;
      }

      // temporäre Datei + atomare Umbenennung, zuerst innerhalb des Staging-Bereichs ...
      const stagingTmp = `${stagingFinal}.tmp-${process.pid}-${Date.now()}`;
      fs.writeFileSync(stagingTmp, buffer);
      fs.renameSync(stagingTmp, stagingFinal);

      // ... danach atomare Übernahme aus dem Staging- in den produktiven Audioordner.
      ensureDir(paths.audioDir);
      fs.renameSync(stagingFinal, finalPath);

      const checksum = sha256(buffer);
      updateEntry(manifest, entry.id, {
        generation_status: 'generated_unreviewed',
        audio_review_status: 'not_reviewed',
        generation: {
          ...entry.generation,
          provider: providerName,
          model: modelId,
          voice_id: voiceId,
          generated_at: new Date().toISOString(),
          input_text: text,
          input_text_hash: textHash(text),
          checksum_sha256: checksum,
          reason: PREVIEW_GENERATION_REASON,
          last_error: null
        }
      });
      saveManifest(paths, manifest);
      onProgress({ id: entry.id, attempt, status: 'generated', checksum });
      return { id: entry.id, status: 'generated', checksum };
    } catch (err) {
      lastError = err.message;
      const retryable = err instanceof ProviderError ? err.retryable : true;
      onProgress({ id: entry.id, attempt, status: 'error', error: err.message, retryable });
      if (!retryable || attempt >= maxAttempts) break;
      await sleepFn(backoffDelay(attempt, baseDelayMs, maxDelayMs));
    }
  }

  updateEntry(manifest, entry.id, {
    generation_status: 'failed',
    generation: { ...entry.generation, last_error: lastError }
  });
  saveManifest(paths, manifest);
  return { id: entry.id, status: 'failed', error: lastError };
}

function backoffDelay(attempt, baseDelayMs, maxDelayMs) {
  return Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
}

function updateEntry(manifest, id, patch) {
  const idx = manifest.entries.findIndex((e) => e.id === id);
  if (idx === -1) return;
  manifest.entries[idx] = { ...manifest.entries[idx], ...patch };
}

async function runGeneration(context, targets, options) {
  const results = { generated: [], failed: [], dryRun: [], blocked: [] };
  for (const entry of targets) {
    // eslint-disable-next-line no-await-in-loop -- bewusst sequentiell, um Anbieter-Ratenlimits
    // nicht zu überfordern und die per-Wort-Fortschrittsausgabe lesbar zu halten.
    const result = await generateOne(context, entry, options);
    if (result.status === 'dry_run') results.dryRun.push(result);
    else if (result.status === 'generated') results.generated.push(result);
    else if (result.status === 'blocked_existing_file') results.blocked.push(result);
    else results.failed.push(result);
  }
  return results;
}

/**
 * Abschnitt 10, "npm run audio:verify" -- rein lesende Konsistenzprüfung zwischen Manifest und
 * tatsächlich vorhandenen Dateien. Verändert nichts, meldet nur.
 */
function verify(context) {
  const problems = [];
  const ok = [];
  for (const entry of context.manifest.entries) {
    if (entry.generation_status !== 'generated_unreviewed') continue;
    const finalPath = path.join(context.paths.audioDir, `${entry.id}.wav`);
    if (!fs.existsSync(finalPath)) {
      problems.push({ id: entry.id, problem: 'als generated_unreviewed markiert, aber Datei fehlt auf der Festplatte' });
      continue;
    }
    const buffer = fs.readFileSync(finalPath);
    const checksum = sha256(buffer);
    if (entry.generation && entry.generation.checksum_sha256 && entry.generation.checksum_sha256 !== checksum) {
      problems.push({ id: entry.id, problem: `Prüfsumme stimmt nicht mehr überein (Datei wurde außerhalb der Pipeline verändert) -- erwartet ${entry.generation.checksum_sha256}, gefunden ${checksum}` });
      continue;
    }
    const validation = validateAudioBuffer(buffer);
    if (!validation.ok) {
      problems.push({ id: entry.id, problem: `technische Prüfung schlägt heute fehl: ${validation.problems.join('; ')}` });
      continue;
    }
    ok.push(entry.id);
  }
  return { ok, problems };
}

module.exports = {
  defaultPaths,
  loadContext,
  saveManifest,
  resolveInputText,
  selectTargets,
  representativeSample,
  planReport,
  generateOne,
  runGeneration,
  verify,
  backoffDelay,
  GENERATION_STATUS_VALUES
};
