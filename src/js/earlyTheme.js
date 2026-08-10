// Entwicklungsauftrag 14, Abschnitt 9 — läuft als ALLERERSTES Skript in index.html (vor allen
// anderen <script>-Tags, vor dem Rendern des restlichen Dokuments), damit das gespeicherte Theme
// angewendet ist, bevor irgendetwas sichtbar gezeichnet wird. `window.initialTheme` kommt
// synchron aus preload.js (ipcRenderer.sendSync — vom Hauptprozess bereits validiert). Bewusst
// als eigene, kleine externe Datei statt eines Inline-<script>-Blocks: die CSP dieser App
// erlaubt in index.html nur `script-src 'self'`, kein `'unsafe-inline'`.
(function applyInitialThemeEarly() {
  var theme = window.initialTheme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();
