// Zentrale Antwortsperre + Timer-Aufräumung (P0.2 aus dem Entwicklungsauftrag
// "Veröffentlichungsfähigkeit"). Vorher konnten viele Aufgaben mehrfach beantwortet werden
// (Doppelklick auf "Prüfen"/eine Antwortoption, bevor die Buttons gesperrt waren), und ein
// `setTimeout(..., 900)` nach dem Antworten konnte noch feuern, nachdem der Nutzer die Ansicht
// bereits verlassen hatte (verspäteter Callback auf eine nicht mehr sichtbare Aufgabe).
//
// ExerciseGuard.create() liefert pro Übungs-Durchlauf (z. B. einmal pro runLetterQueue()-Aufruf
// oder einmal pro View-mount()) eine kleine Zustandsmaschine:
//   idle -> submitted -> showing_feedback -> transitioning -> (nächste Aufgabe: wieder idle)
// sowie -> completed, wenn die gesamte Übung fertig ist.
// `guard.submit()` liefert nur beim allerersten Aufruf pro Aufgabe `true` (Mehrfachklick-Schutz),
// `guard.setTimeout(fn, ms)` verhält sich wie das native setTimeout, wird aber automatisch
// abgebrochen, sobald `guard.destroy()` aufgerufen wird (beim Verlassen der Ansicht) — der
// Callback feuert dann nicht mehr.

const ExerciseGuard = (() => {
  function create() {
    let alive = true;
    let phase = 'idle';
    const timers = new Set();

    function guardedSetTimeout(fn, delay) {
      const id = setTimeout(() => {
        timers.delete(id);
        if (alive) fn();
      }, delay);
      timers.add(id);
      return id;
    }

    function clearAllTimers() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
    }

    function canSubmit() {
      return alive && phase === 'idle';
    }

    // Muss SYNCHRON als erstes im Klick-Handler aufgerufen werden, bevor irgendeine
    // asynchrone Arbeit (Bewertung, Speichern, Timeout) beginnt. Gibt true zurück, wenn dieser
    // Aufruf die Aufgabe tatsächlich abschließen darf; false bei jedem weiteren Klick auf
    // dieselbe Aufgabe (Doppelklick-Schutz).
    function submit() {
      if (!canSubmit()) return false;
      phase = 'submitted';
      return true;
    }

    function showFeedback() {
      if (!alive) return;
      phase = 'showing_feedback';
    }

    function transitioning() {
      if (!alive) return;
      phase = 'transitioning';
    }

    // Zurück auf 'idle' für die nächste Aufgabe innerhalb desselben Durchlaufs.
    function nextTask() {
      if (!alive) return;
      phase = 'idle';
    }

    function complete() {
      phase = 'completed';
    }

    // Beim Verlassen der Ansicht/des Durchlaufs aufrufen: sperrt endgültig gegen weitere
    // Submits und bricht alle noch offenen Timer ab, damit keine verspäteten Callbacks mehr
    // auf eine nicht mehr sichtbare Aufgabe feuern.
    function destroy() {
      alive = false;
      clearAllTimers();
    }

    return {
      setTimeout: guardedSetTimeout,
      canSubmit,
      submit,
      showFeedback,
      transitioning,
      nextTask,
      complete,
      destroy,
      get phase() { return phase; },
      get alive() { return alive; }
    };
  }

  return { create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExerciseGuard;
}
