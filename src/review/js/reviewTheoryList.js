// Entwicklungsauftrag 12, Abschnitt 6 — Liste aller 90 Theoriedokumente mit Prüfstatus.

const ReviewTheoryList = (() => {
  const { el, badge } = ReviewDom;

  function overallStatusOf(t) { return t.workspace ? t.workspace.overallStatus : 'needs_language_review'; }

  function render(container) {
    const { theories, constants } = ReviewApp.state;
    const rows = theories
      .slice()
      .sort((a, b) => (a.theory_id || '').localeCompare(b.theory_id || ''))
      .map((t) => el('tr', { attrs: { tabindex: '0' }, onClick: () => ReviewApp.navigate('theories', t.theory_id) }, [
        el('td', {}, [el('code', { text: t.theory_id })]),
        el('td', { text: t.title || '' }),
        el('td', { text: t.unit_id || '' }),
        el('td', { text: t.batch !== null && t.batch !== undefined ? `Batch ${t.batch}` : '' }),
        el('td', {}, [badge(constants.OVERALL_STATUS_LABELS_DE[overallStatusOf(t)] || overallStatusOf(t), 'neutral')])
      ]));

    container.replaceChildren(el('div', { class: 'view view-theory-list' }, [
      el('h2', { text: 'Theoriedokumente' }),
      el('p', { class: 'hint', text: `${theories.length} Theoriedokumente` }),
      el('table', { class: 'data-table clickable' }, [
        el('thead', {}, el('tr', {}, ['ID', 'Titel', 'Unit', 'Batch', 'Status'].map((h) => el('th', { text: h })))),
        el('tbody', {}, rows)
      ])
    ]));
  }

  return { render };
})();
