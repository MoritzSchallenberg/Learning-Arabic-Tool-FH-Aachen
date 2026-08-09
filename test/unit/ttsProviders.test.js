// Entwicklungsauftrag 12, Abschnitt 18 — Tests für die Anbieter-Anbindung. Nutzt ausschließlich
// einen eingeschleusten `httpClient`-Mock, macht NIE eine echte Netzwerkanfrage.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  elevenLabsAvailable, elevenLabsConfigFromEnv, synthesizeWithElevenLabs, ProviderError
} = require('../../scripts/audio/ttsProviders.js');

test('elevenLabsAvailable: false ohne ELEVENLABS_API_KEY, true sobald gesetzt', () => {
  assert.equal(elevenLabsAvailable({}), false);
  assert.equal(elevenLabsAvailable({ ELEVENLABS_API_KEY: 'geheim-123' }), true);
});

test('elevenLabsConfigFromEnv: nutzt Standard-Voice/Modell, wenn nicht überschrieben', () => {
  const cfg = elevenLabsConfigFromEnv({ ELEVENLABS_API_KEY: 'x' });
  assert.equal(cfg.apiKey, 'x');
  assert.ok(cfg.voiceId);
  assert.ok(cfg.modelId);
});

test('synthesizeWithElevenLabs: ohne API-Schlüssel wirft sofort einen nicht wiederholbaren Fehler, ohne den httpClient aufzurufen', async () => {
  let called = false;
  const httpClient = async () => { called = true; return { statusCode: 200, body: Buffer.from('x') }; };
  await assert.rejects(
    () => synthesizeWithElevenLabs('نص', { apiKey: null, httpClient }),
    (err) => err instanceof ProviderError && err.retryable === false
  );
  assert.equal(called, false, 'bei fehlendem Schlüssel darf gar keine Anfrage gesendet werden');
});

test('synthesizeWithElevenLabs: gibt bei HTTP 200 den rohen Buffer zurück und sendet den Schlüssel nur als Header', async () => {
  const seenHeaders = [];
  const httpClient = async (url, opts) => {
    seenHeaders.push(opts.headers);
    return { statusCode: 200, body: Buffer.from('RIFF....WAVEfmt ') };
  };
  const result = await synthesizeWithElevenLabs('كَلِمَة', { apiKey: 'sehr-geheimer-schluessel', httpClient });
  assert.ok(Buffer.isBuffer(result));
  assert.equal(seenHeaders[0]['xi-api-key'], 'sehr-geheimer-schluessel');
});

test('synthesizeWithElevenLabs: HTTP 401 ist nicht wiederholbar (ungültiger Schlüssel)', async () => {
  const httpClient = async () => ({ statusCode: 401, body: Buffer.from('{"detail":"invalid_api_key"}') });
  await assert.rejects(
    () => synthesizeWithElevenLabs('نص', { apiKey: 'falsch', httpClient }),
    (err) => err instanceof ProviderError && err.retryable === false && err.statusCode === 401
  );
});

test('synthesizeWithElevenLabs: HTTP 402 (Kontingent aufgebraucht) ist nicht wiederholbar', async () => {
  const httpClient = async () => ({ statusCode: 402, body: Buffer.from('{"detail":"quota_exceeded"}') });
  await assert.rejects(
    () => synthesizeWithElevenLabs('نص', { apiKey: 'x', httpClient }),
    (err) => err instanceof ProviderError && err.retryable === false && err.statusCode === 402
  );
});

test('synthesizeWithElevenLabs: ein unerwarteter HTTP-Fehler (z. B. 500) ist wiederholbar', async () => {
  const httpClient = async () => ({ statusCode: 500, body: Buffer.from('server error') });
  await assert.rejects(
    () => synthesizeWithElevenLabs('نص', { apiKey: 'x', httpClient }),
    (err) => err instanceof ProviderError && err.retryable === true
  );
});

test('synthesizeWithElevenLabs: ein Netzwerkfehler (z. B. Timeout) ist wiederholbar', async () => {
  const httpClient = async () => { throw new Error('ETIMEDOUT'); };
  await assert.rejects(
    () => synthesizeWithElevenLabs('نص', { apiKey: 'x', httpClient }),
    (err) => err instanceof ProviderError && err.retryable === true
  );
});

test('synthesizeWithElevenLabs: leerer Text löst keine Anfrage aus', async () => {
  let called = false;
  const httpClient = async () => { called = true; return { statusCode: 200, body: Buffer.alloc(0) }; };
  await assert.rejects(() => synthesizeWithElevenLabs('   ', { apiKey: 'x', httpClient }));
  assert.equal(called, false);
});
