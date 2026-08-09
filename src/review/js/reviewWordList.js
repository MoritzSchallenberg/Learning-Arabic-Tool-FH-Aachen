// Entwicklungsauftrag 12, Abschnitt 3 — Wortliste mit allen geforderten Filtern und der Suche.
// Filtert rein im Speicher über den bereits geladenen Zustand (ReviewApp.state.words) -- kein
// erneuter IPC-Aufruf je Tastendruck.

const ReviewWordList = (() => {
  const { el, arabic, badge } = ReviewDom;

  const filterState = {
    batch: '', unit: '', session: '', partOfSpeech: '', status: '', audioState: '',
    onlyWithCorrections: false, onlyUncertain: false, audioPresence: '', search: ''
  };

  function overallStatusOf(w) { return w.workspace ? w.workspace.overallStatus : 'needs_language_review'; }

  function matchesFilter(w) {
    if (filterState.batch !== '' && String(w.batch) !== filterState.batch) return false;
    if (filterState.unit && w.unit_id !== filterState.unit) return false;
    if (filterState.session && w.session_id !== filterState.session) return false;
    if (filterState.partOfSpeech && w.part_of_speech !== filterState.partOfSpeech) return false;
    if (filterState.status && overallStatusOf(w) !== filterState.status) return false;
    if (filterState.audioState && w.audio.generation_status !== filterState.audioState) return false;
    if (filterState.onlyWithCorrections && !(w.workspace && Object.keys(w.workspace.corrections || {}).length > 0)) return false;
    if (filterState.onlyUncertain && !(w.workspace && Object.values(w.workspace.aspects || {}).some((a) => a.result === 'uncertain'))) return false;
    if (filterState.audioPresence === 'with' && w.audio.source === 'missing') return false;
    if (filterState.audioPresence === 'without' && w.audio.source !== 'missing') return false;
    if (filterState.search) {
      const q = filterState.search.trim().toLowerCase();
      const haystack = [w.id, w.arabic_unvocalized, w.arabic_vocalized, w.transliteration, ...(w.german_answers || [])].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  function uniqueSorted(values) { return [...new Set(values.filter(Boolean))].sort(); }

  function selectField(labelText, options, value, onChange) {
    const select = el('select', {
      onChange: (e) => onChange(e.target.value)
    }, [el('option', { attrs: { value: '' }, text: `${labelText}: alle` }), ...options.map((o) => el('option', { attrs: { value: o.value, selected: o.value === value ? '' : undefined } }, o.label))]);
    select.value = value;
    return el('label', { class: 'filter-field' }, [select]);
  }

  function render(container) {
    const { words, constants } = ReviewApp.state;
    const statuses = constants.OVERALL_STATUSES.map((s) => ({ value: s, label: constants.OVERALL_STATUS_LABELS_DE[s] }));
    const batches = uniqueSorted(words.map((w) => String(w.batch))).map((b) => ({ value: b, label: `Batch ${b}` }));
    const units = uniqueSorted(words.map((w) => w.unit_id)).map((u) => ({ value: u, label: u }));
    const sessions = uniqueSorted(words.filter((w) => !filterState.unit || w.unit_id === filterState.unit).map((w) => w.session_id)).map((s) => ({ value: s, label: s }));
    const partsOfSpeech = uniqueSorted(words.map((w) => w.part_of_speech)).map((p) => ({ value: p, label: p }));
    const audioStates = uniqueSorted(words.map((w) => w.audio.generation_status)).map((a) => ({ value: a, label: a }));

    const filterBar = el('div', { class: 'filter-bar' }, [
      el('input', {
        class: 'search-input', attrs: { type: 'text', placeholder: 'Suche: ID, Arabisch, Umschrift, Deutsch' },
        onInput: (e) => { filterState.search = e.target.value; renderTable(); }
      }),
      selectField('Batch', batches, filterState.batch, (v) => { filterState.batch = v; renderTable(); }),
      selectField('Unit', units, filterState.unit, (v) => { filterState.unit = v; filterState.session = ''; renderAll(); }),
      selectField('Session', sessions, filterState.session, (v) => { filterState.session = v; renderTable(); }),
      selectField('Wortart', partsOfSpeech, filterState.partOfSpeech, (v) => { filterState.partOfSpeech = v; renderTable(); }),
      selectField('Prüfstatus', statuses, filterState.status, (v) => { filterState.status = v; renderTable(); }),
      selectField('Audiozustand', audioStates, filterState.audioState, (v) => { filterState.audioState = v; renderTable(); }),
      selectField('Audio vorhanden', [{ value: 'with', label: 'mit Audio' }, { value: 'without', label: 'ohne Audio' }], filterState.audioPresence, (v) => { filterState.audioPresence = v; renderTable(); }),
      el('label', { class: 'filter-checkbox' }, [
        el('input', { attrs: { type: 'checkbox', checked: filterState.onlyWithCorrections ? 'checked' : undefined }, onChange: (e) => { filterState.onlyWithCorrections = e.target.checked; renderTable(); } }),
        ' nur mit Korrekturen'
      ]),
      el('label', { class: 'filter-checkbox' }, [
        el('input', { attrs: { type: 'checkbox', checked: filterState.onlyUncertain ? 'checked' : undefined }, onChange: (e) => { filterState.onlyUncertain = e.target.checked; renderTable(); } }),
        ' nur unsichere Einträge'
      ])
    ]);

    const tableHolder = el('div', { class: 'table-holder' });
    const countLabel = el('p', { class: 'hint' });

    function renderTable() {
      const filtered = words.filter(matchesFilter);
      countLabel.textContent = `${filtered.length} von ${words.length} Wörtern`;
      const rows = filtered.map((w) => el('tr', { attrs: { tabindex: '0' }, onClick: () => ReviewApp.navigate('words', w.id) }, [
        el('td', {}, [el('code', { text: w.id })]),
        el('td', {}, [arabic(w.arabic_vocalized)]),
        el('td', { text: w.transliteration || '' }),
        el('td', { text: (w.german_answers || []).join(', ') }),
        el('td', { text: `Batch ${w.batch}` }),
        el('td', {}, [badge(constants.OVERALL_STATUS_LABELS_DE[overallStatusOf(w)] || overallStatusOf(w), statusKind(overallStatusOf(w)))]),
        el('td', {}, [badge(w.audio.generation_status, w.audio.source === 'missing' ? 'warning' : 'neutral')])
      ]));
      tableHolder.replaceChildren(el('table', { class: 'data-table clickable' }, [
        el('thead', {}, el('tr', {}, ['ID', 'Arabisch', 'Umschrift', 'Deutsch', 'Batch', 'Status', 'Audio'].map((h) => el('th', { text: h })))),
        el('tbody', {}, rows)
      ]));
    }

    function statusKind(status) {
      if (status === 'approved') return 'approved';
      if (status === 'reviewed') return 'reviewed';
      if (status === 'corrections_required') return 'warning';
      if (status === 'in_review') return 'progress';
      return 'neutral';
    }

    function renderAll() {
      container.replaceChildren(el('div', { class: 'view view-word-list' }, [
        el('h2', { text: 'Wörter' }),
        filterBar,
        countLabel,
        tableHolder
      ]));
      renderTable();
    }

    renderAll();
  }

  return { render };
})();
