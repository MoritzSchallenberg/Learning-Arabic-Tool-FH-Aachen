// FeedbackRenderer (Entwicklungsauftrag 17, Abschnitt 5.3/8/9.3/19/20) — EINE gemeinsame
// UI-Komponente für das erklärende Feedback aller Aufgaben der Stufen 6-9 (Abschnitt 21).
// Reine Darstellung: bekommt ein fertiges FeedbackModel und rendert es. Bewertet NICHTS selbst
// (Abschnitt 22). Ausschließlich textContent/DOM-APIs -- niemals innerHTML mit datenabhängigem
// Inhalt (Abschnitt 9.3/29).

const FeedbackRenderer = (() => {
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    // Entwicklungsauftrag 18, Abschnitt 6: automatisch lang="ar" für arabische Textklassen.
    if (opts.className && /\barabic-(word-main|example|text)\b/.test(opts.className)) node.lang = 'ar';
    return node;
  }

  function visuallyHidden(text) {
    const span = el('span', { className: 'visually-hidden', text });
    return span;
  }

  function primaryGerman(word) {
    return Array.isArray(word.german_answers) && word.german_answers.length > 0 ? word.german_answers[0] : word.german;
  }

  // Entwicklungsauftrag 18, Abschnitt 6: arabischer Text braucht ein EIGENES Element mit
  // lang="ar"/dir="rtl" (nicht nur die CSS-Klasse), sobald er mit deutschem Text im selben
  // Absatz gemischt wird -- sonst fehlt Screenreadern/der Bidi-Darstellung die korrekte
  // Sprachauszeichnung, und die arabische Schriftgrößen-Einstellung (Abschnitt 3) greift nicht.
  function arabicSpan(text) {
    const span = el('span', { className: 'arabic-text', text });
    span.lang = 'ar';
    span.dir = 'rtl';
    return span;
  }

  /** Hängt "<arabische Form> — <deutsche Bedeutung>" mit korrekt isoliertem arabischem Teil an. */
  function appendWordSummary(container, word) {
    container.appendChild(arabicSpan(word.arabic_vocalized || word.arabic));
    container.appendChild(document.createTextNode(` — ${primaryGerman(word)}`));
  }

  function audioButton(label, onClick, iconLabel) {
    const btn = el('button', { className: 'btn secondary btn-small', text: iconLabel || '🔊' });
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.addEventListener('click', () => onClick(btn));
    return btn;
  }

  // --- Abschnitt 9.3: Zeichenvergleich sicher rendern (dir=rtl/unicode-bidi, textContent) -------
  function renderCharDiff(charDiff) {
    const wrap = el('div', { className: 'char-diff' });
    wrap.dir = 'rtl';
    wrap.style.unicodeBidi = 'isolate';
    wrap.setAttribute('aria-hidden', 'true'); // die Textalternative übernimmt screenReaderText
    charDiff.segments.forEach((seg) => {
      const span = el('span', { className: `char-diff-segment char-diff-${seg.status}` });
      span.textContent = seg.status === 'extra' ? seg.givenText : seg.expectedText;
      wrap.appendChild(span);
    });
    const alt = visuallyHidden(charDiff.screenReaderText);
    const explanation = el('p', { className: 'text-hint char-diff-explanation', text: charDiff.explanation });
    const holder = el('div');
    holder.appendChild(wrap);
    holder.appendChild(alt);
    holder.appendChild(explanation);
    return holder;
  }

  function renderAnswerComparison(model) {
    const wrap = el('div', { className: 'answer-comparison' });
    const category = model.resultCategory;

    if (model.submittedAnswer !== null && model.submittedAnswer !== undefined) {
      // --- getippte Eingabeaufgaben (Abschnitt 8.2 erste Variante) ---
      const submittedRow = el('p', { className: 'answer-comparison-row' });
      submittedRow.appendChild(el('span', { className: 'answer-comparison-label', text: 'Deine Antwort: ' }));
      const submittedValue = el('span', { className: 'answer-comparison-value arabic-text' });
      submittedValue.dir = 'rtl';
      submittedValue.textContent = model.submittedAnswer || '(leer)';
      submittedRow.appendChild(submittedValue);
      wrap.appendChild(submittedRow);

      if (category === 'accepted_alternative') {
        wrap.appendChild(el('p', { className: 'text-hint', text: `„${model.matchedAcceptedAnswer}" ist eine gültige alternative Schreibweise.` }));
      } else if (category === 'correct_no_diacritics') {
        const row = el('p', { className: 'answer-comparison-row' });
        row.appendChild(el('span', { className: 'answer-comparison-label', text: 'Vollständig vokalisierte Form: ' }));
        const val = el('span', { className: 'answer-comparison-value arabic-text' });
        val.dir = 'rtl';
        val.textContent = model.word.arabic_vocalized || model.word.arabic;
        row.appendChild(val);
        wrap.appendChild(row);
      } else if (category === 'diacritics_mismatch' || category === 'typo' || category === 'wrong_word') {
        const row = el('p', { className: 'answer-comparison-row' });
        row.appendChild(el('span', { className: 'answer-comparison-label', text: 'Richtige Form: ' }));
        const val = el('span', { className: 'answer-comparison-value arabic-text' });
        val.dir = 'rtl';
        val.textContent = model.word.arabic_vocalized || model.word.arabic;
        row.appendChild(val);
        wrap.appendChild(row);
      }
      return wrap;
    }

    // --- Auswahlaufgaben (Abschnitt 8.2 zweite Variante) ---
    if (model.selectedWord) {
      const selRow = el('p', { className: 'answer-comparison-row' });
      selRow.appendChild(el('span', { className: 'answer-comparison-label', text: 'Du hast gewählt: ' }));
      const selVal = el('span', { className: 'answer-comparison-value' });
      appendWordSummary(selVal, model.selectedWord);
      selRow.appendChild(selVal);
      wrap.appendChild(selRow);
    }
    if (!model.isCorrect) {
      const rightRow = el('p', { className: 'answer-comparison-row' });
      rightRow.appendChild(el('span', { className: 'answer-comparison-label', text: 'Gesucht war: ' }));
      const rightVal = el('span', { className: 'answer-comparison-value' });
      appendWordSummary(rightVal, model.word);
      rightRow.appendChild(rightVal);
      wrap.appendChild(rightRow);
    }
    return wrap;
  }

  function renderWordInfo(word, settings) {
    const wrap = el('div', { className: 'feedback-word-info' });
    const arabicRow = el('p', { className: 'arabic-example' });
    arabicRow.dir = 'rtl';
    arabicRow.lang = 'ar';
    arabicRow.textContent = word.arabic_vocalized || word.arabic;
    wrap.appendChild(arabicRow);
    if (settings.showTransliteration !== false && word.transliteration) {
      wrap.appendChild(el('p', { className: 'text-hint', text: word.transliteration }));
    }
    wrap.appendChild(el('p', { className: 'word-card-translation', text: primaryGerman(word) }));
    const others = Array.isArray(word.german_answers) ? word.german_answers.slice(1) : [];
    if (others.length > 0) {
      wrap.appendChild(el('p', { className: 'text-hint', text: `Weitere Bedeutungen: ${others.join(', ')}` }));
    }
    const grammarBits = [];
    if (word.part_of_speech) grammarBits.push(word.part_of_speech);
    if (word.gender) grammarBits.push(word.gender);
    if (word.plural) grammarBits.push(`Plural: ${word.plural}`);
    if (grammarBits.length > 0) {
      const details = document.createElement('details');
      details.className = 'word-card-extra';
      const summary = document.createElement('summary');
      summary.textContent = 'Grammatik';
      details.appendChild(summary);
      details.appendChild(el('p', { className: 'text-hint', text: grammarBits.join(' · ') }));
      wrap.appendChild(details);
    }
    return wrap;
  }

  function renderAudioActions({ onAudioNormal, onAudioSlow, onSelectedAudio, selectedWord }) {
    const wrap = el('div', { className: 'feedback-audio-actions' });
    wrap.appendChild(audioButton('Richtige Aussprache normal abspielen', onAudioNormal, '🔊'));
    wrap.appendChild(audioButton('Richtige Aussprache langsam abspielen', onAudioSlow, '🐢'));
    if (selectedWord && onSelectedAudio) {
      wrap.appendChild(audioButton('Deine gewählte Aufnahme abspielen', onSelectedAudio, '🔁'));
    }
    return wrap;
  }

  function renderRepeatHint(model) {
    if (model.repeatScheduled) {
      return el('p', { className: 'repeat-hint', text: 'Dieses Wort erscheint später in dieser Session erneut.' });
    }
    if (model.repeatLimitReached) {
      return el('p', { className: 'repeat-hint', text: 'Dieses Wort wird für eine spätere Übung vorgemerkt.' });
    }
    return null;
  }

  const RELATION_LABELS = {
    confusion: 'Diese Wörter sind im Kurs als leicht zu verwechseln markiert.',
    opposite: 'Diese beiden Wörter bilden ein Gegensatzpaar.',
    homonym: 'Diese Wörter werden gleich oder ähnlich geschrieben, bedeuten aber etwas anderes.'
  };

  function renderRelationTable(targetWord, relatedWord, relationType, { onTargetAudio, onRelatedAudio }) {
    const wrap = el('div', { className: 'relation-compare' });
    if (RELATION_LABELS[relationType]) {
      wrap.appendChild(el('p', { className: 'text-hint', text: RELATION_LABELS[relationType] }));
    }
    const table = document.createElement('table');
    table.className = 'relation-compare-table';
    const colLabelA = 'Gesuchtes Wort';
    const colLabelB = relationType === 'opposite' ? 'Gegenteil' : 'Verwechseltes Wort';
    const head = document.createElement('tr');
    head.appendChild(el('th', { text: '' }));
    head.appendChild(el('th', { text: colLabelA }));
    head.appendChild(el('th', { text: colLabelB }));
    table.appendChild(head);

    // Entwicklungsauftrag 18, Abschnitt 4: bei wenig Platz wechselt die Tabelle über CSS in eine
    // gestapelte Darstellung (jede Zelle wird zum eigenen Block) -- data-label liefert dafür die
    // sichtbare Beschriftung nach, die sonst nur in der (dann versteckten) Kopfzeile stünde.
    function row(label, a, b, isArabic) {
      const tr = document.createElement('tr');
      tr.appendChild(el('td', { className: 'text-hint', text: label }));
      [[a, colLabelA], [b, colLabelB]].forEach(([value, colLabel]) => {
        const td = document.createElement('td');
        td.setAttribute('data-label', `${colLabel} — ${label}`);
        if (isArabic) {
          td.appendChild(arabicSpan(value));
        } else {
          td.textContent = value;
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    }
    row('Arabisch', targetWord.arabic_vocalized || targetWord.arabic, relatedWord.arabic_vocalized || relatedWord.arabic, true);
    row('Umschrift', targetWord.transliteration || '–', relatedWord.transliteration || '–');
    row('Bedeutung', primaryGerman(targetWord), primaryGerman(relatedWord));
    wrap.appendChild(table);

    if (onTargetAudio || onRelatedAudio) {
      const audioRow = el('div', { className: 'feedback-audio-actions' });
      if (onTargetAudio) audioRow.appendChild(audioButton(`${primaryGerman(targetWord)} anhören`, onTargetAudio, '▶'));
      if (onRelatedAudio) audioRow.appendChild(audioButton(`${primaryGerman(relatedWord)} anhören`, onRelatedAudio, '▶'));
      wrap.appendChild(audioRow);
    }
    return wrap;
  }

  /**
   * Rendert das gemeinsame Feedback für eine Einzelwort-Aufgabe.
   * @param {HTMLElement} container
   * @param {object} model - aus FeedbackModel#buildForWord()
   * @param {object} options
   * @param {object} options.settings
   * @param {(btn:HTMLElement)=>void} options.onAudioNormal
   * @param {(btn:HTMLElement)=>void} options.onAudioSlow
   * @param {object} [options.selectedWord] - bei Auswahlaufgaben: die tatsächlich gewählte falsche Option
   * @param {(btn:HTMLElement)=>void} [options.onSelectedAudio]
   * @param {{word:object, type:string}|null} [options.autoRelation] - bereits erkannte Beziehung (Abschnitt 11)
   * @param {{word:object, type:string}[]} [options.manualRelations] - weitere Beziehungen, nur auf Wunsch sichtbar (Abschnitt 16)
   * @param {(btn:HTMLElement)=>void} [options.onRelationAudio] - Audio für Beziehungs-Wort
   */
  function render(container, model, options = {}) {
    const { settings = {}, onAudioNormal, onAudioSlow, selectedWord, onSelectedAudio, autoRelation, manualRelations, onRelationAudio } = options;
    while (container.firstChild) container.removeChild(container.firstChild);

    const panel = el('div', { className: `feedback-panel feedback-${model.tone}` });
    panel.setAttribute('role', model.srRole);
    panel.setAttribute('aria-live', model.srRole === 'alert' ? 'assertive' : 'polite');
    panel.tabIndex = -1;

    const header = el('div', { className: 'feedback-panel-header' });
    const iconSpan = el('span', { className: 'feedback-panel-icon', text: model.icon });
    iconSpan.setAttribute('aria-hidden', 'true');
    header.appendChild(iconSpan);
    header.appendChild(el('h3', { className: 'feedback-panel-title', text: model.title }));
    panel.appendChild(header);

    if (model.helpUsed && model.isCorrect) {
      panel.appendChild(el('p', { className: 'text-hint', text: 'Richtig mit Hilfestellung' }));
    }

    if (model.resultCategory !== 'empty') {
      panel.appendChild(renderAnswerComparison({ ...model, selectedWord }));
    } else {
      panel.appendChild(el('p', { className: 'text-hint', text: 'Es wurde keine Eingabe abgegeben.' }));
    }

    if (model.charDiff && model.charDiff.hasDifference) {
      panel.appendChild(renderCharDiff(model.charDiff));
    }

    panel.appendChild(renderWordInfo(model.word, settings));

    if (onAudioNormal && onAudioSlow) {
      panel.appendChild(renderAudioActions({ onAudioNormal, onAudioSlow, onSelectedAudio, selectedWord }));
    }

    const repeatHint = renderRepeatHint(model);
    if (repeatHint) panel.appendChild(repeatHint);

    if (autoRelation) {
      panel.appendChild(renderRelationTable(model.word, autoRelation.word, autoRelation.type, { onRelatedAudio: onRelationAudio }));
    } else if (Array.isArray(manualRelations) && manualRelations.length > 0) {
      const details = document.createElement('details');
      details.className = 'relation-disclosure';
      const summary = document.createElement('summary');
      summary.textContent = 'Ähnliche Wörter anzeigen';
      details.appendChild(summary);
      manualRelations.forEach((rel) => {
        details.appendChild(renderRelationTable(model.word, rel.word, rel.type, {}));
      });
      panel.appendChild(details);
    }

    container.appendChild(panel);
    panel.focus();
    return panel;
  }

  /**
   * Entwicklungsauftrag 17, Abschnitt 13 — Abschlussfeedback einer Zuordnungsgruppe.
   * @param {HTMLElement} container
   * @param {object} model - aus FeedbackModel#buildMatchingGroupSummary()
   * @param {object} options
   */
  function renderMatchingGroupSummary(container, model, options = {}) {
    const { settings = {}, onAudioFor } = options;
    while (container.firstChild) container.removeChild(container.firstChild);

    const panel = el('div', { className: `feedback-panel feedback-${model.tone}` });
    panel.setAttribute('role', model.srRole);
    panel.setAttribute('aria-live', model.srRole === 'alert' ? 'assertive' : 'polite');
    panel.tabIndex = -1;

    const header = el('div', { className: 'feedback-panel-header' });
    const iconSpan = el('span', { className: 'feedback-panel-icon', text: model.icon });
    iconSpan.setAttribute('aria-hidden', 'true');
    header.appendChild(iconSpan);
    header.appendChild(el('h3', { className: 'feedback-panel-title', text: model.title }));
    panel.appendChild(header);

    const list = el('div', { className: 'matching-summary-list' });
    model.pairs.forEach((pair) => {
      const row = el('div', { className: `matching-summary-row ${pair.correct ? 'correct' : 'wrong'}` });
      const status = el('span', { className: 'matching-summary-status', text: pair.correct ? '✓' : '✕' });
      status.setAttribute('aria-hidden', 'true');
      row.appendChild(status);
      const label = el('span', { className: 'matching-summary-label' });
      appendWordSummary(label, pair.word);
      row.appendChild(label);
      if (pair.hadFirstError) {
        row.appendChild(el('span', { className: 'text-hint', text: '(erster Versuch nicht richtig)' }));
      }
      if (onAudioFor) {
        row.appendChild(audioButton(`${primaryGerman(pair.word)} anhören`, (btn) => onAudioFor(pair.word, btn), '🔊'));
      }
      list.appendChild(row);
    });
    panel.appendChild(list);

    container.appendChild(panel);
    panel.focus();
    return panel;
  }

  return { render, renderMatchingGroupSummary };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackRenderer;
}
