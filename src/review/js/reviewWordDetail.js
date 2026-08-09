// Entwicklungsauftrag 12, Abschnitt 4/5/15 — Wortprüfansicht: alle Felder, bearbeitbare
// Korrekturvorschläge (Original und Vorschlag bleiben beide sichtbar), die 9 Prüfaspekte, der
// übergeordnete Status (mit Bestätigungspflicht vor "approved") und die Audioprüfung.

const ReviewWordDetail = (() => {
  const { el, arabic, badge } = ReviewDom;

  function fieldRow(label, originalNode, correctionUi) {
    return el('div', { class: 'field-row' }, [
      el('div', { class: 'field-label', text: label }),
      el('div', { class: 'field-original' }, [originalNode]),
      el('div', { class: 'field-correction' }, [correctionUi])
    ]);
  }

  function correctionEditor(word, field, originalValue, refresh) {
    const existing = word.workspace && word.workspace.corrections[field];
    const displayValue = existing ? existing.proposedValue : originalValue;
    const input = el('input', { class: 'correction-input', attrs: { type: 'text', value: '' } });
    input.value = Array.isArray(displayValue) ? displayValue.join(', ') : (displayValue || '');
    const status = el('span', { class: 'correction-status', text: existing ? 'Korrekturvorschlag gespeichert' : '' });
    const saveBtn = el('button', {
      class: 'btn btn-small',
      text: 'Vorschlag speichern',
      onClick: async () => {
        const proposedValue = Array.isArray(originalValue) ? input.value.split(',').map((s) => s.trim()).filter(Boolean) : input.value;
        const result = await window.reviewApi.proposeWordCorrection({
          wordId: word.id, field, originalValue, proposedValue, expectedVersion: word.workspace ? word.workspace.version : 0
        });
        if (!result.ok && result.conflict) {
          status.textContent = 'Konflikt: Dieser Eintrag wurde inzwischen anderswo geändert -- bitte neu laden.';
          return;
        }
        await ReviewApp.refresh();
        refresh();
      }
    });
    return el('div', { class: 'correction-editor' }, [input, saveBtn, status]);
  }

  function aspectRow(word, aspectKey, refresh) {
    const { constants } = ReviewApp.state;
    const current = (word.workspace && word.workspace.aspects[aspectKey]) || { result: 'not_yet_reviewed', note: '' };
    const select = el('select', {
      onChange: async (e) => {
        const result = await window.reviewApi.setWordAspectResult({
          wordId: word.id, aspectKey, result: e.target.value, note: noteInput.value, expectedVersion: word.workspace ? word.workspace.version : 0
        });
        if (!result.ok && result.conflict) { alert('Konflikt: bitte Seite neu laden.'); return; }
        await ReviewApp.refresh();
        refresh();
      }
    }, constants.ASPECT_RESULTS.map((r) => el('option', { attrs: { value: r, selected: r === current.result ? 'selected' : undefined }, text: constants.ASPECT_RESULT_LABELS_DE[r] })));
    select.value = current.result;
    const noteInput = el('input', { class: 'aspect-note', attrs: { type: 'text', placeholder: 'Notiz (optional)' } });
    noteInput.value = current.note || '';
    return el('div', { class: 'aspect-row' }, [
      el('span', { class: 'aspect-label', text: constants.WORD_ASPECT_LABELS_DE[aspectKey] }),
      select,
      noteInput
    ]);
  }

  function overallStatusPanel(word, refresh) {
    const { constants } = ReviewApp.state;
    const status = word.workspace ? word.workspace.overallStatus : 'needs_language_review';
    const container = el('div', { class: 'overall-status-panel' }, [
      el('span', { class: 'overall-status-current' }, [badge(constants.OVERALL_STATUS_LABELS_DE[status] || status, 'neutral')])
    ]);

    const reviewedBtn = el('button', {
      class: 'btn',
      text: 'Als "geprüft" markieren',
      onClick: async () => {
        const result = await window.reviewApi.setWordOverallStatus({ wordId: word.id, status: 'reviewed', expectedVersion: word.workspace ? word.workspace.version : 0 });
        if (!result.ok) { alert(explainStatusError(result)); return; }
        await ReviewApp.refresh();
        refresh();
      }
    });

    const approveBtn = el('button', {
      class: 'btn btn-primary',
      text: 'Ausdrücklich freigeben ("approved")',
      onClick: async () => {
        const summary = buildChangeSummaryText(word);
        // eslint-disable-next-line no-alert -- Abschnitt 5, Regel 6: vollständige Änderungsübersicht
        // MUSS vor "approved" angezeigt werden; ein einfacher, blockierender Bestätigungsdialog
        // erfüllt das ohne zusätzliche UI-Bibliothek.
        const confirmed = window.confirm(`Vollständige Änderungsübersicht für "${word.id}":\n\n${summary}\n\nJetzt ausdrücklich freigeben?`);
        if (!confirmed) return;
        const result = await window.reviewApi.setWordOverallStatus({ wordId: word.id, status: 'approved', explicitConfirmation: true, expectedVersion: word.workspace ? word.workspace.version : 0 });
        if (!result.ok) { alert(explainStatusError(result)); return; }
        await ReviewApp.refresh();
        refresh();
      }
    });

    container.appendChild(el('div', { class: 'overall-status-actions' }, [reviewedBtn, approveBtn]));
    return container;
  }

  function explainStatusError(result) {
    if (result.error === 'aspects_incomplete') return `Noch nicht alle Aspekte bearbeitet: ${result.unresolved.join(', ')}`;
    if (result.error === 'not_ready_for_approval') return `Nicht freigebbar -- noch offen/unsicher: ${result.notReady.join(', ')}`;
    if (result.error === 'explicit_confirmation_required') return 'Freigabe erfordert eine ausdrückliche Bestätigung.';
    if (result.conflict) return 'Konflikt: dieser Eintrag wurde inzwischen anderswo geändert -- bitte neu laden.';
    return 'Aktion nicht möglich.';
  }

  function buildChangeSummaryText(word) {
    if (!word.workspace || Object.keys(word.workspace.corrections).length === 0) return '(keine Korrekturvorschläge -- Originalwerte werden bestätigt)';
    return Object.entries(word.workspace.corrections)
      .map(([field, c]) => `- ${field}: "${JSON.stringify(c.originalValue)}" -> "${JSON.stringify(c.proposedValue)}"`)
      .join('\n');
  }

  async function audioSection(word, refresh) {
    const section = el('div', { class: 'panel audio-panel' }, [
      el('h3', { text: 'Audio' }),
      el('div', {}, [
        el('span', { text: `Zustand: ${word.audio.generation_status} / Prüfstatus: ${word.audio.audio_review_status} / Quelle: ${word.audio.source}` })
      ])
    ]);
    if (word.audio.source !== 'missing') {
      const playBtn = el('button', {
        class: 'btn btn-small',
        text: '▶ abspielen',
        onClick: async () => {
          const base64 = await window.reviewApi.loadAudio(word.id);
          if (!base64) { alert('Audiodatei konnte nicht geladen werden.'); return; }
          const audioEl = new Audio(`data:audio/wav;base64,${base64}`);
          audioEl.play();
        }
      });
      section.appendChild(playBtn);
    }
    section.appendChild(aspectRow(word, 'audio_pronunciation', refresh));
    return section;
  }

  async function render(container, wordId) {
    const word = ReviewApp.wordById(wordId);
    if (!word) { container.replaceChildren(el('p', { text: 'Wort nicht gefunden.' })); return; }
    const { constants } = ReviewApp.state;

    async function refresh() { await render(container, wordId); }

    const fields = el('div', { class: 'field-list' }, [
      fieldRow('Arabisch (vokalisiert)', arabic(word.arabic_vocalized), correctionEditor(word, 'proposed_arabic_vocalized', word.arabic_vocalized, refresh)),
      fieldRow('Arabisch (unvokalisiert)', arabic(word.arabic_unvocalized), el('span', { class: 'hint', text: '(nicht bearbeitbar -- Referenzform)' })),
      fieldRow('Umschrift', el('span', { text: word.transliteration || '' }), correctionEditor(word, 'proposed_transliteration', word.transliteration || '', refresh)),
      fieldRow('Deutsche Bedeutungen', el('span', { text: (word.german_answers || []).join(', ') }), correctionEditor(word, 'german_answers', word.german_answers || [], refresh)),
      fieldRow('Akzeptierte arabische Antworten', el('span', { text: (word.accepted_arabic_answers || []).join(', ') }), correctionEditor(word, 'accepted_arabic_answers', word.accepted_arabic_answers || [], refresh)),
      fieldRow('Wortart', el('span', { text: word.part_of_speech || '' }), correctionEditor(word, 'part_of_speech', word.part_of_speech || '', refresh)),
      fieldRow('Genus', el('span', { text: word.gender || '(keins)' }), correctionEditor(word, 'gender', word.gender || '', refresh)),
      fieldRow('Plural', el('span', { text: word.plural || '(keiner)' }), correctionEditor(word, 'plural', word.plural || '', refresh)),
      fieldRow('Homonymgruppe', el('span', { text: word.homonym_group || '(keine)' }), el('span', { class: 'hint' })),
      fieldRow('Gegensatz', el('span', { text: word.opposite_id || '(keiner)' }), el('span', { class: 'hint' })),
      fieldRow('Verwechslungsgruppe', el('span', { text: word.confusion_group || '(keine)' }), el('span', { class: 'hint' }))
    ]);

    const existingPromptCorrection = word.workspace && word.workspace.corrections.application_prompts;
    const promptsTextarea = el('textarea', { class: 'notes-area', attrs: { rows: '4' } });
    promptsTextarea.value = JSON.stringify(existingPromptCorrection ? existingPromptCorrection.proposedValue : word.application_prompts, null, 2);
    const promptsStatus = el('span', { class: 'correction-status', text: existingPromptCorrection ? 'Korrekturvorschlag gespeichert' : '' });
    const promptsList = el('div', { class: 'panel' }, [
      el('h3', { text: 'Application-Prompts' }),
      ...(word.application_prompts || []).map((p) => el('div', { class: 'prompt-row' }, [
        el('div', { text: p.prompt }),
        el('div', { class: 'hint', text: `erwartete Bedeutung: ${p.expected_meaning || '(nicht gesetzt)'}` })
      ])),
      el('div', { class: 'field-label', text: 'Korrekturvorschlag (als JSON-Liste)' }),
      promptsTextarea,
      el('button', {
        class: 'btn btn-small',
        text: 'Vorschlag speichern',
        onClick: async () => {
          let parsed;
          try {
            parsed = JSON.parse(promptsTextarea.value);
          } catch (err) {
            promptsStatus.textContent = `Ungültiges JSON: ${err.message}`;
            return;
          }
          const result = await window.reviewApi.proposeWordCorrection({
            wordId: word.id, field: 'application_prompts', originalValue: word.application_prompts, proposedValue: parsed, expectedVersion: word.workspace ? word.workspace.version : 0
          });
          if (!result.ok && result.conflict) { promptsStatus.textContent = 'Konflikt: bitte neu laden.'; return; }
          await ReviewApp.refresh();
          refresh();
        }
      }),
      promptsStatus
    ]);

    const aspectsPanel = el('div', { class: 'panel' }, [
      el('h3', { text: 'Prüfaspekte' }),
      ...constants.WORD_ASPECT_KEYS.filter((k) => k !== 'audio_pronunciation').map((k) => aspectRow(word, k, refresh))
    ]);

    const notesArea = el('textarea', { class: 'notes-area', attrs: { placeholder: 'Allgemeine Notiz' } });
    notesArea.value = (word.workspace && word.workspace.notes) || '';
    const saveNoteBtn = el('button', {
      class: 'btn btn-small',
      text: 'Notiz speichern',
      onClick: async () => {
        await window.reviewApi.proposeWordCorrection({ wordId: word.id, field: 'notes', originalValue: '', proposedValue: notesArea.value, expectedVersion: word.workspace ? word.workspace.version : 0 });
        await ReviewApp.refresh();
        refresh();
      }
    });

    const root = el('div', { class: 'view view-word-detail' }, [
      el('button', { class: 'btn btn-link', text: '← zur Wortliste', onClick: () => ReviewApp.navigate('words') }),
      el('h2', {}, [el('code', { text: word.id }), ' ', arabic(word.arabic_vocalized)]),
      el('p', { class: 'hint', text: `${word.unit_id} / ${word.session_id} / Batch ${word.batch}` }),
      overallStatusPanel(word, refresh),
      fields,
      promptsList,
      aspectsPanel,
      el('div', { class: 'panel' }, [el('h3', { text: 'Notiz' }), notesArea, saveNoteBtn])
    ]);

    root.appendChild(await audioSection(word, refresh));
    container.replaceChildren(root);
  }

  return { render };
})();
