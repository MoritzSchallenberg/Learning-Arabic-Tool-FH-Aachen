// Entwicklungsauftrag 12, Abschnitt 6 — Theorieprüfansicht: Titel, Lernziele, alle Blöcke
// (Erklärung, "Mehr erfahren", Wortvorschau, arabische Beispiele, Merksätze/typische Fehler,
// Mini-Checks mit Lösungen), Korrekturen NUR im Arbeitsbereich (theory.json bleibt unverändert).

const ReviewTheoryDetail = (() => {
  const { el, arabic, badge } = ReviewDom;

  function renderBlock(block, wordsById) {
    switch (block.type) {
      case 'heading':
        return el('h4', { class: 'block-heading', text: block.text || '' });
      case 'paragraph':
        return el('p', { class: 'block-paragraph', text: block.text || '' });
      case 'callout':
        return el('div', { class: `block-callout callout-${block.variant || 'info'}` }, [
          block.title ? el('strong', { text: block.title }) : null,
          el('p', { text: block.text || '' })
        ]);
      case 'example':
        return el('div', { class: 'block-example' }, [
          arabic(block.arabic || ''),
          el('div', { class: 'hint', text: block.translation || '' }),
          block.note ? el('div', { class: 'hint', text: block.note }) : null
        ]);
      case 'comparison':
        return el('table', { class: 'data-table' }, [
          el('thead', {}, el('tr', {}, (block.headers || []).map((h) => el('th', { text: h })))),
          el('tbody', {}, (block.items || []).map((row) => el('tr', {}, row.map((cell) => el('td', { text: cell })))))
        ]);
      case 'word_preview':
        return el('div', { class: 'block-word-preview' }, (block.word_ids || []).map((id) => {
          const w = wordsById.get(id);
          return el('div', { class: 'word-preview-chip' }, [
            arabic(w ? w.arabic_vocalized : id),
            el('span', { class: 'hint', text: w ? (w.german_answers || []).join(', ') : `(unbekannt: ${id})` })
          ]);
        }));
      case 'mini_check':
        return el('div', { class: 'block-mini-check' }, (block.questions || []).map((q) => el('div', { class: 'mini-check-question' }, [
          el('p', { text: q.question }),
          el('ul', {}, (q.options || []).map((o) => el('li', { class: o.correct ? 'option-correct' : '' }, [
            el('span', { text: o.text }),
            o.correct ? badge('richtig', 'approved') : null
          ])))
        ])));
      default:
        return el('pre', { class: 'block-unknown', text: JSON.stringify(block) });
    }
  }

  function aspectRow(theory, aspectKey, refresh) {
    const { constants } = ReviewApp.state;
    const current = (theory.workspace && theory.workspace.aspects[aspectKey]) || { result: 'not_yet_reviewed', note: '' };
    const select = el('select', {
      onChange: async (e) => {
        const result = await window.reviewApi.setTheoryAspectResult({
          theoryId: theory.theory_id, aspectKey, result: e.target.value, note: noteInput.value, expectedVersion: theory.workspace ? theory.workspace.version : 0
        });
        if (!result.ok && result.conflict) { alert('Konflikt: bitte neu laden.'); return; }
        await ReviewApp.refresh();
        refresh();
      }
    }, constants.ASPECT_RESULTS.map((r) => el('option', { attrs: { value: r, selected: r === current.result ? 'selected' : undefined }, text: constants.ASPECT_RESULT_LABELS_DE[r] })));
    select.value = current.result;
    const noteInput = el('input', { class: 'aspect-note', attrs: { type: 'text', placeholder: 'Notiz (optional)' } });
    noteInput.value = current.note || '';
    return el('div', { class: 'aspect-row' }, [
      el('span', { class: 'aspect-label', text: constants.THEORY_ASPECT_LABELS_DE[aspectKey] }),
      select,
      noteInput
    ]);
  }

  function overallStatusPanel(theory, refresh) {
    const { constants } = ReviewApp.state;
    const status = theory.workspace ? theory.workspace.overallStatus : 'needs_language_review';
    const container = el('div', { class: 'overall-status-panel' }, [
      el('span', {}, [badge(constants.OVERALL_STATUS_LABELS_DE[status] || status, 'neutral')])
    ]);
    const reviewedBtn = el('button', {
      class: 'btn',
      text: 'Als "geprüft" markieren',
      onClick: async () => {
        const result = await window.reviewApi.setTheoryOverallStatus({ theoryId: theory.theory_id, status: 'reviewed', expectedVersion: theory.workspace ? theory.workspace.version : 0 });
        if (!result.ok) { alert(result.error === 'aspects_incomplete' ? `Noch offen: ${result.unresolved.join(', ')}` : 'nicht möglich'); return; }
        await ReviewApp.refresh();
        refresh();
      }
    });
    const approveBtn = el('button', {
      class: 'btn btn-primary',
      text: 'Ausdrücklich freigeben ("approved")',
      onClick: async () => {
        // eslint-disable-next-line no-alert -- Regel 6: Änderungsübersicht vor Freigabe zeigen.
        const confirmed = window.confirm(`Theorie "${theory.theory_id}" jetzt ausdrücklich freigeben?\n\nKorrekturvorschläge: ${theory.workspace ? Object.keys(theory.workspace.corrections).length : 0}`);
        if (!confirmed) return;
        const result = await window.reviewApi.setTheoryOverallStatus({ theoryId: theory.theory_id, status: 'approved', explicitConfirmation: true, expectedVersion: theory.workspace ? theory.workspace.version : 0 });
        if (!result.ok) { alert(result.error === 'not_ready_for_approval' ? `Nicht freigebbar: ${result.notReady.join(', ')}` : 'nicht möglich'); return; }
        await ReviewApp.refresh();
        refresh();
      }
    });
    container.appendChild(el('div', { class: 'overall-status-actions' }, [reviewedBtn, approveBtn]));
    return container;
  }

  function render(container, theoryId) {
    const theory = ReviewApp.theoryById(theoryId);
    if (!theory) { container.replaceChildren(el('p', { text: 'Theorie nicht gefunden.' })); return; }
    const wordsById = new Map(ReviewApp.state.words.map((w) => [w.id, w]));
    const { constants } = ReviewApp.state;

    function refresh() { render(container, theoryId); }

    const notesArea = el('textarea', { class: 'notes-area', attrs: { placeholder: 'Allgemeine Notiz' } });
    notesArea.value = (theory.workspace && theory.workspace.notes) || '';
    const saveNoteBtn = el('button', {
      class: 'btn btn-small',
      text: 'Notiz speichern',
      onClick: async () => {
        await window.reviewApi.proposeTheoryCorrection({ theoryId: theory.theory_id, field: 'notes', originalValue: '', proposedValue: notesArea.value, expectedVersion: theory.workspace ? theory.workspace.version : 0 });
        await ReviewApp.refresh();
        refresh();
      }
    });

    const root = el('div', { class: 'view view-theory-detail' }, [
      el('button', { class: 'btn btn-link', text: '← zur Theorieliste', onClick: () => ReviewApp.navigate('theories') }),
      el('h2', { text: theory.title }),
      el('p', { class: 'hint', text: `${theory.theory_id} — ${theory.unit_id || ''} / ${theory.session_id || ''}` }),
      overallStatusPanel(theory, refresh),
      el('div', { class: 'panel' }, [
        el('h3', { text: 'Lernziele' }),
        el('ul', {}, (theory.learning_objectives || []).map((o) => el('li', { text: o })))
      ]),
      el('div', { class: 'panel theory-blocks' }, [
        el('h3', { text: 'Inhalt' }),
        ...theory.blocks.map((b) => renderBlock(b, wordsById))
      ]),
      el('div', { class: 'panel' }, [
        el('h3', { text: 'Prüfaspekte' }),
        ...constants.THEORY_ASPECT_KEYS.map((k) => aspectRow(theory, k, refresh))
      ]),
      el('div', { class: 'panel' }, [el('h3', { text: 'Notiz' }), notesArea, saveNoteBtn])
    ]);

    container.replaceChildren(root);
  }

  return { render };
})();
