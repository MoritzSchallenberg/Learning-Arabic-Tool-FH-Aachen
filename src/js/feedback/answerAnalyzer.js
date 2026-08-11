// AnswerAnalyzer (Entwicklungsauftrag 17, Abschnitt 5.1) — reines, DOM-unabhängiges Modul, das
// eine gegebene Antwort gegen ein Wort analysiert und ein detailliertes, aber rein TECHNISCH
// abgeleitetes Ergebnis liefert (Aufgabentyp-unabhängig von der Darstellung). Verwendet
// ausschließlich die bestehende, verbindliche Bewertungsgrundlage aus srs.js
// (evaluateArabicAnswer/evaluateAgainstAnyDetailed) — leitet NIE selbst eine Korrektheit her,
// sondern verfeinert nur, WESHALB ein bereits feststehendes Ergebnis so ausgefallen ist
// (Abschnitt 22: "Grading-Ergebnis -> Feedbacktext", nicht umgekehrt).
//
// Zwei Aufgabenfamilien:
// - Getippte arabische Antworten (analyzeTypedArabicAnswer): Rekonstruieren/geführte/freie
//   Eingabe/Diktat — hier wird zusätzlich ein zeichenweiser Vergleich (Abschnitt 9) berechnet.
// - Auswahlaufgaben (analyzeChoiceAnswer): Wiedererkennen/Zuordnung/Kontextauswahl — hier wird
//   stattdessen geprüft, ob die falsch gewählte Option in einer bekannten Datenbeziehung zum
//   Zielwort steht (confusion_group/homonym_group/opposite_id, Abschnitt 11/16) — NIE erfunden.

const AnswerAnalyzer = (() => {
  // Deckt sich bewusst mit srs.js#HARAKAT_PATTERN (U+064B–U+0652) — dieselben acht Zeichen,
  // hier zusätzlich einzeln benannt (Abschnitt 9.2: "nur technisch eindeutig ableitbare
  // Bezeichnungen", keine erfundene grammatische Ursache).
  const DIACRITIC_NAMES = {
    'ً': 'Tanwīn Fatḥ',
    'ٌ': 'Tanwīn Ḍamm',
    'ٍ': 'Tanwīn Kasr',
    'َ': 'Fatḥa',
    'ُ': 'Ḍamma',
    'ِ': 'Kasra',
    'ّ': 'Shadda',
    'ْ': 'Sukūn'
  };
  const DIACRITIC_CHARS = new Set(Object.keys(DIACRITIC_NAMES));

  const ORDINAL_DE = {
    1: 'ersten', 2: 'zweiten', 3: 'dritten', 4: 'vierten', 5: 'fünften',
    6: 'sechsten', 7: 'siebten', 8: 'achten', 9: 'neunten', 10: 'zehnten'
  };
  function ordinal(n) {
    return ORDINAL_DE[n] || `${n}.`;
  }

  function isDiacritic(ch) {
    return DIACRITIC_CHARS.has(ch);
  }

  function diacriticName(ch) {
    return DIACRITIC_NAMES[ch] || `Zeichen U+${ch.codePointAt(0).toString(16).toUpperCase()}`;
  }

  // --- 9.3 technische Sicherheit: Unicode normalisieren, Kombinationszeichen dem vorherigen
  // Grundbuchstaben zuordnen, Vokalzeichen NICHT als eigene sichtbare "Buchstaben" behandeln ----
  function tokenizeArabicClusters(text) {
    const normalized = normalizeArabic(text || '', { stripDiacritics: false });
    const clusters = [];
    for (const ch of Array.from(normalized)) {
      if (isDiacritic(ch)) {
        if (clusters.length === 0) {
          // Führendes Vokalzeichen ohne vorherigen Grundbuchstaben (technisch ungültig, aber
          // robust behandeln statt abzustürzen) -- eigenes Cluster ohne Basisbuchstaben.
          clusters.push({ base: '', diacritics: [ch] });
        } else {
          clusters[clusters.length - 1].diacritics.push(ch);
        }
      } else {
        clusters.push({ base: ch, diacritics: [] });
      }
    }
    return clusters;
  }

  function clusterText(cluster) {
    if (!cluster) return '';
    return cluster.base + cluster.diacritics.join('');
  }

  function sameDiacriticSet(a, b) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((ch, i) => ch === sortedB[i]);
  }

  function clusterCost(a, b) {
    if (a.base !== b.base) return 1;
    return sameDiacriticSet(a.diacritics, b.diacritics) ? 0 : 0.5;
  }

  /** Editierabstand auf Cluster-Ebene (nicht auf rohen Unicode-Zeichen) mit Backtrace, damit
   * Vokalzeichen nie als eigenständige "Buchstaben" gezählt werden (Abschnitt 9.3). */
  function diffClusters(expectedClusters, givenClusters) {
    const n = expectedClusters.length;
    const m = givenClusters.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i += 1) dp[i][0] = i;
    for (let j = 0; j <= m; j += 1) dp[0][j] = j;
    for (let i = 1; i <= n; i += 1) {
      for (let j = 1; j <= m; j += 1) {
        const subCost = clusterCost(expectedClusters[i - 1], givenClusters[j - 1]);
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + subCost);
      }
    }
    let i = n;
    let j = m;
    const ops = [];
    while (i > 0 || j > 0) {
      const subCost = (i > 0 && j > 0) ? clusterCost(expectedClusters[i - 1], givenClusters[j - 1]) : null;
      if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + subCost) {
        ops.unshift({ type: subCost === 0 ? 'equal' : 'substitute', expected: expectedClusters[i - 1], given: givenClusters[j - 1] });
        i -= 1; j -= 1;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        ops.unshift({ type: 'missing', expected: expectedClusters[i - 1], given: null });
        i -= 1;
      } else {
        ops.unshift({ type: 'extra', expected: null, given: givenClusters[j - 1] });
        j -= 1;
      }
    }
    return ops;
  }

  function diacriticIssue(expectedCluster, givenCluster) {
    const exp = new Set(expectedCluster.diacritics);
    const giv = new Set(givenCluster.diacritics);
    const missing = expectedCluster.diacritics.filter((ch) => !giv.has(ch));
    const extra = givenCluster.diacritics.filter((ch) => !exp.has(ch));
    return { missing, extra };
  }

  /**
   * Entwicklungsauftrag 17, Abschnitt 9: sicherer, RTL-tauglicher Zeichenvergleich. Liefert reine
   * Daten (keine DOM-Knoten, kein HTML) — die Darstellung übernimmt feedbackRenderer.js über
   * textContent, niemals innerHTML (Abschnitt 9.3).
   * @returns {{segments: object[], explanation: string, screenReaderText: string, hasDifference: boolean}}
   */
  function diffArabicText(expected, given) {
    const expectedClusters = tokenizeArabicClusters(expected);
    const givenClusters = tokenizeArabicClusters(given);
    const ops = diffClusters(expectedClusters, givenClusters);

    let letterIndex = 0;
    const segments = ops.map((op) => {
      if (op.type === 'equal') {
        letterIndex += 1;
        return { status: 'match', position: letterIndex, expectedText: clusterText(op.expected), givenText: clusterText(op.given) };
      }
      if (op.type === 'substitute') {
        letterIndex += 1;
        if (op.expected.base === op.given.base) {
          const issue = diacriticIssue(op.expected, op.given);
          return {
            status: 'diacritic_issue',
            position: letterIndex,
            expectedText: clusterText(op.expected),
            givenText: clusterText(op.given),
            missingDiacritics: issue.missing,
            extraDiacritics: issue.extra
          };
        }
        return { status: 'substituted', position: letterIndex, expectedText: clusterText(op.expected), givenText: clusterText(op.given) };
      }
      if (op.type === 'missing') {
        letterIndex += 1;
        return { status: 'missing', position: letterIndex, expectedText: clusterText(op.expected), givenText: '' };
      }
      // 'extra' -- zählt bewusst NICHT als eigene Grundbuchstaben-Position der erwarteten Form,
      // sonst würde die Positionsangabe für alle folgenden Buchstaben verrutschen.
      return { status: 'extra', position: null, expectedText: '', givenText: clusterText(op.given) };
    });

    const hasDifference = segments.some((s) => s.status !== 'match');

    // Kurze, technisch abgeleitete Erklärung (Abschnitt 9.2) -- fasst das ERSTE auffällige
    // Segment zusammen, damit die Erklärung kurz und konkret bleibt statt jede Abweichung
    // aufzuzählen (die vollständige Aufschlüsselung liefert screenReaderText).
    let explanation = 'Deine Eingabe stimmt vollständig überein.';
    const firstIssue = segments.find((s) => s.status !== 'match');
    if (firstIssue) {
      if (firstIssue.status === 'diacritic_issue') {
        const parts = [];
        if (firstIssue.missingDiacritics.length > 0) {
          parts.push(`fehlt die ${firstIssue.missingDiacritics.map(diacriticName).join(', ')}`);
        }
        if (firstIssue.extraDiacritics.length > 0) {
          parts.push(`ist ${firstIssue.extraDiacritics.map(diacriticName).join(', ')} zusätzlich vorhanden`);
        }
        explanation = `Der Grundbuchstabe stimmt. Beim ${ordinal(firstIssue.position)} Buchstaben ${parts.join(' und ')}.`;
      } else if (firstIssue.status === 'substituted') {
        explanation = `Am ${ordinal(firstIssue.position)} Buchstaben weicht deine Eingabe ab.`;
      } else if (firstIssue.status === 'missing') {
        explanation = `Beim ${ordinal(firstIssue.position)} Buchstaben fehlt ein Zeichen.`;
      } else if (firstIssue.status === 'extra') {
        explanation = 'Deine Eingabe enthält ein zusätzliches Zeichen.';
      }
    }

    const screenReaderText = segments.map((s) => {
      if (s.status === 'match') return `Am ${ordinal(s.position)} Buchstaben (${s.expectedText}): richtig.`;
      if (s.status === 'diacritic_issue') {
        const bits = [];
        if (s.missingDiacritics.length > 0) bits.push(`fehlende ${s.missingDiacritics.map(diacriticName).join(', ')}`);
        if (s.extraDiacritics.length > 0) bits.push(`zusätzliche ${s.extraDiacritics.map(diacriticName).join(', ')}`);
        return `Am ${ordinal(s.position)} Buchstaben: Grundbuchstabe richtig, ${bits.join(', ')}.`;
      }
      if (s.status === 'substituted') return `Am ${ordinal(s.position)} Buchstaben: erwartet ${s.expectedText}, eingegeben ${s.givenText}.`;
      if (s.status === 'missing') return `Am ${ordinal(s.position)} Buchstaben fehlt ein Zeichen (erwartet ${s.expectedText}).`;
      return `Zusätzliches Zeichen eingegeben: ${s.givenText}.`;
    }).join(' ');

    return { segments, explanation, screenReaderText, hasDifference };
  }

  // --- Hilfsfunktionen (bewusst dieselbe primäre-Antwort-Reihenfolge wie
  // exerciseRegistry.js#arabicAnswers/germanAnswers -- kein zweiter, abweichender Datenpfad) ----
  function arabicAnswers(word) {
    return Array.isArray(word.accepted_arabic_answers) && word.accepted_arabic_answers.length > 0
      ? word.accepted_arabic_answers
      : [word.arabic];
  }
  function germanAnswers(word) {
    return Array.isArray(word.german_answers) && word.german_answers.length > 0 ? word.german_answers : [word.german];
  }

  /**
   * Entwicklungsauftrag 17, Abschnitt 7 — analysiert eine getippte arabische Antwort und liefert
   * die verfeinerte Feedback-Kategorie. Die zugrundeliegende Korrektheit kommt unverändert aus
   * evaluateArabicAnswer()/evaluateAgainstAnyDetailed() (Abschnitt 22).
   * @param {object} word
   * @param {string} given
   */
  function analyzeTypedArabicAnswer(word, given) {
    const expectedAnswers = arabicAnswers(word);
    const primary = expectedAnswers[0];
    const trimmed = (given || '').trim();
    const base = {
      submittedAnswer: trimmed,
      expectedAnswers,
      primaryAnswer: primary,
      fullVocalizedForm: word.arabic_vocalized || word.arabic
    };

    if (trimmed === '') {
      return { ...base, category: 'empty', matchedAnswer: null, charDiff: null };
    }

    const givenNormalized = normalizeArabic(trimmed, { stripDiacritics: false });
    const givenHasDiacritics = Array.from(givenNormalized).some(isDiacritic);

    const primaryResult = evaluateArabicAnswer(primary, trimmed);
    if (primaryResult === 'correct_full') {
      return { ...base, category: 'correct_full', matchedAnswer: primary, charDiff: null };
    }
    for (const alt of expectedAnswers.slice(1)) {
      if (evaluateArabicAnswer(alt, trimmed) === 'correct_full') {
        return { ...base, category: 'accepted_alternative', matchedAnswer: alt, charDiff: null };
      }
    }
    if (primaryResult === 'correct_no_diacritics') {
      const category = givenHasDiacritics ? 'diacritics_mismatch' : 'correct_no_diacritics';
      const charDiff = category === 'diacritics_mismatch' ? diffArabicText(base.fullVocalizedForm, trimmed) : null;
      return { ...base, category, matchedAnswer: primary, charDiff };
    }
    for (const alt of expectedAnswers.slice(1)) {
      if (evaluateArabicAnswer(alt, trimmed) === 'correct_no_diacritics') {
        return { ...base, category: 'accepted_alternative', matchedAnswer: alt, charDiff: null };
      }
    }
    const detailed = evaluateAgainstAnyDetailed(expectedAnswers, trimmed, evaluateArabicAnswer);
    const diffTarget = detailed.matchedAnswer || primary;
    if (detailed.category === 'typo') {
      return { ...base, category: 'typo', matchedAnswer: diffTarget, charDiff: diffArabicText(diffTarget, trimmed) };
    }
    return { ...base, category: 'wrong_word', matchedAnswer: null, charDiff: diffArabicText(base.fullVocalizedForm, trimmed) };
  }

  /**
   * Entwicklungsauftrag 17, Abschnitt 11/16 — rein datenbasierte Beziehung zwischen zwei Wörtern.
   * Keine Beziehung wird behauptet, wenn sie nicht explizit in den Kursdaten hinterlegt ist.
   */
  function relationBetween(wordA, wordB) {
    if (!wordA || !wordB || wordA.id === wordB.id) return null;
    if (wordA.confusion_group && wordB.confusion_group && wordA.confusion_group === wordB.confusion_group) {
      return { type: 'confusion' };
    }
    if (wordA.homonym_group && wordB.homonym_group && wordA.homonym_group === wordB.homonym_group) {
      return { type: 'homonym' };
    }
    if ((wordA.opposite_id && wordA.opposite_id === wordB.id) || (wordB.opposite_id && wordB.opposite_id === wordA.id)) {
      return { type: 'opposite' };
    }
    return null;
  }

  /**
   * Entwicklungsauftrag 17, Abschnitt 7/11 — analysiert eine Auswahlaufgabe (Multiple Choice,
   * Audio-Auswahl, Kontextauswahl). `domain` bestimmt, ob die ausgewählte Option ein arabisches
   * Wort ('arabic_word') oder eine deutsche Bedeutung ('german_meaning') ist -- steuert nur, ob
   * bei einer Falschantwort 'wrong_word' oder 'wrong_meaning' zurückgegeben wird (Abschnitt 7.6).
   * @param {{targetWord: object, selectedOption: object|null, isCorrect: boolean, domain: 'arabic_word'|'german_meaning'}} params
   */
  function analyzeChoiceAnswer({ targetWord, selectedOption, isCorrect, domain }) {
    if (!selectedOption) {
      return { category: 'empty', selectedWordId: null, expectedWordId: targetWord.id, relation: null };
    }
    if (isCorrect) {
      return {
        category: selectedOption.id === targetWord.id ? 'correct_full' : 'accepted_alternative',
        selectedWordId: selectedOption.id,
        expectedWordId: targetWord.id,
        relation: null
      };
    }
    return {
      category: domain === 'german_meaning' ? 'wrong_meaning' : 'wrong_word',
      selectedWordId: selectedOption.id,
      expectedWordId: targetWord.id,
      relation: relationBetween(targetWord, selectedOption)
    };
  }

  return {
    DIACRITIC_NAMES,
    isDiacritic,
    diacriticName,
    tokenizeArabicClusters,
    diffArabicText,
    arabicAnswers,
    germanAnswers,
    analyzeTypedArabicAnswer,
    analyzeChoiceAnswer,
    relationBetween
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnswerAnalyzer;
}
