// Entwicklungsauftrag 12, Abschnitt 3 — Dashboard: alle geforderten Zählungen, ausschließlich
// aus dem geladenen Zustand berechnet (ReviewApp.state.summary kommt aus
// scripts/review/reviewDataLoader.js#computeDashboardSummary -- "keine Zählung darf hart codiert
// sein").

const ReviewDashboard = (() => {
  const { el, badge } = ReviewDom;

  function statCard(label, value, kind) {
    return el('div', { class: 'stat-card' }, [
      el('div', { class: 'stat-value', text: String(value) }),
      el('div', { class: 'stat-label', text: label })
    ]);
  }

  function statusBreakdown(counts, title) {
    const labels = ReviewApp.state.constants.OVERALL_STATUS_LABELS_DE;
    const rows = Object.entries(counts).map(([status, count]) => el('div', { class: 'status-row' }, [
      badge(labels[status] || status, statusKind(status)),
      el('span', { class: 'status-count', text: String(count) })
    ]));
    return el('div', { class: 'panel' }, [el('h3', { text: title }), ...rows]);
  }

  function statusKind(status) {
    if (status === 'approved') return 'approved';
    if (status === 'reviewed') return 'reviewed';
    if (status === 'corrections_required') return 'warning';
    if (status === 'in_review') return 'progress';
    return 'neutral';
  }

  function progressTable(byKey, title, labelFor) {
    const rows = Object.entries(byKey)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([key, v]) => el('tr', {}, [
        el('td', { text: labelFor ? labelFor(key) : key }),
        el('td', { text: String(v.total) }),
        el('td', { text: String(v.reviewed) }),
        el('td', { text: String(v.approved) })
      ]));
    return el('div', { class: 'panel' }, [
      el('h3', { text: title }),
      el('table', { class: 'data-table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', { text: '' }), el('th', { text: 'gesamt' }), el('th', { text: 'geprüft' }), el('th', { text: 'freigegeben' })
        ])),
        el('tbody', {}, rows)
      ])
    ]);
  }

  function render(container) {
    const { summary, words } = ReviewApp.state;
    if (!summary) return;

    const audioBySource = {};
    for (const w of words) audioBySource[w.audio.source] = (audioBySource[w.audio.source] || 0) + 1;

    const root = el('div', { class: 'view view-dashboard' }, [
      el('h2', { text: 'Sprachprüfung — Übersicht' }),
      el('p', { class: 'hint' }, 'Alle Zahlen werden live aus vocabulary.json, theory.json, dem Audio-Manifest und dem lokalen Prüf-Arbeitsbereich berechnet.'),
      el('div', { class: 'stat-grid' }, [
        statCard('Wörter insgesamt', summary.totalWords),
        statCard('Theoriedokumente', summary.totalTheories),
        statCard('mit Korrekturvorschlag', summary.withCorrections),
        statCard('unsichere Einträge', summary.uncertainWords)
      ]),
      el('div', { class: 'panel-grid' }, [
        statusBreakdown(summary.wordStatusCounts, 'Wörter nach Prüfstatus'),
        statusBreakdown(summary.theoryStatusCounts, 'Theorien nach Prüfstatus'),
        el('div', { class: 'panel' }, [
          el('h3', { text: 'Audio — Erzeugungsstatus' }),
          ...Object.entries(summary.audioGenerationCounts).map(([k, v]) => el('div', { class: 'status-row' }, [
            el('span', { text: k }), el('span', { class: 'status-count', text: String(v) })
          ]))
        ]),
        el('div', { class: 'panel' }, [
          el('h3', { text: 'Audio — Anhörprüfung' }),
          ...Object.entries(summary.audioReviewCounts).map(([k, v]) => el('div', { class: 'status-row' }, [
            el('span', { text: k }), el('span', { class: 'status-count', text: String(v) })
          ])),
          el('div', { class: 'status-row' }, [
            el('span', { text: 'vorhanden (Bestand, vor dem Manifest)' }), el('span', { class: 'status-count', text: String(audioBySource.legacy_bestand || 0) })
          ]),
          el('div', { class: 'status-row' }, [
            el('span', { text: 'ohne Aufnahme' }), el('span', { class: 'status-count', text: String(audioBySource.missing || 0) })
          ])
        ])
      ]),
      progressTable(summary.byBatch, 'Fortschritt je Batch', (k) => `Batch ${k}`),
      progressTable(summary.byUnit, 'Fortschritt je Unit'),
      progressTable(summary.bySession, 'Fortschritt je Session')
    ]);

    container.replaceChildren(root);
  }

  return { render };
})();
