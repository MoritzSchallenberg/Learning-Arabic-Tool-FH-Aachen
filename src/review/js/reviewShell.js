// Entwicklungsauftrag 12 — Navigation/Shell: Kopfzeile mit Reitern + Export-Button, delegiert an
// die jeweilige View. Ein reiner Redaktions-/Prüfmodus -- verändert nichts an der normalen
// Lernoberfläche (main.js/preload.js/src/index.html bleiben unangetastet).

const ReviewShell = (() => {
  const { el } = ReviewDom;

  function navTab(label, view, currentView) {
    return el('button', {
      class: `nav-tab ${view === currentView ? 'active' : ''}`,
      text: label,
      onClick: () => ReviewApp.navigate(view)
    });
  }

  function renderShell() {
    const appRoot = document.getElementById('app-root');
    const { view } = ReviewApp.currentRoute();

    const header = el('header', { class: 'app-header' }, [
      el('h1', { text: 'Sprachprüfung — Review-Modus' }),
      el('nav', { class: 'nav-tabs' }, [
        navTab('Übersicht', 'dashboard', view),
        navTab('Wörter', 'words', view),
        navTab('Theorien', 'theories', view)
      ]),
      el('button', {
        class: 'btn btn-export',
        text: 'Arbeitsstand exportieren',
        onClick: async () => {
          const result = await window.reviewApi.exportWorkspace();
          if (result.cancelled) return;
          if (result.ok) alert(`Export erstellt: ${result.targetDir}`);
          else alert('Export fehlgeschlagen.');
        }
      })
    ]);

    const content = el('main', { class: 'app-content', attrs: { id: 'view-content' } });

    appRoot.replaceChildren(header, content);
    renderCurrentView(content);
  }

  function renderCurrentView(content) {
    const { state } = ReviewApp;
    if (state.loading) { content.replaceChildren(document.createTextNode('Lade Daten…')); return; }
    if (state.error) { content.replaceChildren(document.createTextNode(`Fehler: ${state.error}`)); return; }

    const { view, id } = ReviewApp.currentRoute();
    if (view === 'words' && id) ReviewWordDetail.render(content, id);
    else if (view === 'words') ReviewWordList.render(content);
    else if (view === 'theories' && id) ReviewTheoryDetail.render(content, id);
    else if (view === 'theories') ReviewTheoryList.render(content);
    else ReviewDashboard.render(content);
  }

  ReviewApp.onRouteChange(() => renderShell());
  document.addEventListener('review:ready', () => renderShell());

  return { renderShell };
})();
