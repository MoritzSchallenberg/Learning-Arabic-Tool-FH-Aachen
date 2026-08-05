// Minimaler, abhängigkeitsfreier DOM-Stub für Tests — kein jsdom, damit `npm test` weiterhin
// ganz ohne `npm install`/Internetverbindung läuft (nur node:test + node:assert, beides in Node
// eingebaut). Enthält einen kleinen, aber echten HTML-Parser (kein reines String-Sink für
// innerHTML), weil praktisch jede View im Code das Muster
// `container.innerHTML = '<button id="x">...</button>'; container.querySelector('#x')...`
// verwendet. Deckt bewusst nur ab, was diese Codebase tatsächlich benutzt: #id, .class,
// Tag-Namen und einfache [attr]/[attr="wert"]-Selektoren, keine Kombinatoren.

const VOID_ELEMENTS = new Set(['br', 'img', 'input', 'hr', 'meta', 'link']);

class FakeClassList {
  constructor(el) { this.el = el; }
  _set() { return new Set((this.el.className || '').split(/\s+/).filter(Boolean)); }
  _sync(set) { this.el.className = Array.from(set).join(' '); }
  add(c) { const s = this._set(); s.add(c); this._sync(s); }
  remove(c) { const s = this._set(); s.delete(c); this._sync(s); }
  toggle(c, force) {
    const s = this._set();
    const shouldHave = force === undefined ? !s.has(c) : force;
    if (shouldHave) s.add(c); else s.delete(c);
    this._sync(s);
    return shouldHave;
  }
  contains(c) { return this._set().has(c); }
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

class FakeElement {
  constructor(tagName) {
    this.tagName = (tagName || 'div').toLowerCase();
    this.children = [];
    this.parentNode = null;
    this.id = '';
    this.className = '';
    this._text = '';
    this._attrs = {};
    this.dataset = {};
    this.style = {};
    this._listeners = {};
    this.classList = new FakeClassList(this);
    this.value = '';
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.focused = false;
    this.disabled = false;
    this.checked = false;
    this.selected = false;
  }

  get value() {
    if (this.tagName === 'select') {
      const selectedOption = this.children.find((c) => c.tagName === 'option' && c.selected);
      const target = selectedOption || this.children.find((c) => c.tagName === 'option');
      return target ? (target.hasAttribute('value') ? target.getAttribute('value') : target.textContent) : '';
    }
    return this._value ?? '';
  }

  set value(v) {
    if (this.tagName === 'select') {
      for (const opt of this.children) {
        if (opt.tagName === 'option') {
          const optValue = opt.hasAttribute('value') ? opt.getAttribute('value') : opt.textContent;
          opt.selected = optValue === v;
        }
      }
      return;
    }
    this._value = v;
  }

  get textContent() {
    return (this._text || '') + this.children.map((c) => c.textContent).join('');
  }

  set textContent(v) {
    this._text = String(v);
    this.children = [];
  }

  get innerHTML() {
    return this.children.map(serializeElement).join('') + (this._text || '');
  }

  set innerHTML(html) {
    this.children = [];
    this._text = '';
    const parsed = parseHtmlFragment(html);
    for (const node of parsed) {
      node.parentNode = this;
      this.children.push(node);
    }
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(newNode, referenceNode) {
    newNode.parentNode = this;
    if (referenceNode == null) {
      this.children.push(newNode);
      return newNode;
    }
    const idx = this.children.indexOf(referenceNode);
    if (idx === -1) {
      this.children.push(newNode);
    } else {
      this.children.splice(idx, 0, newNode);
    }
    return newNode;
  }

  setAttribute(name, value) {
    if (name === 'id') this.id = String(value);
    else if (name === 'class') this.className = String(value);
    else this._attrs[name] = String(value);
  }

  getAttribute(name) {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.className || null;
    return Object.prototype.hasOwnProperty.call(this._attrs, name) ? this._attrs[name] : null;
  }

  hasAttribute(name) {
    if (name === 'id') return !!this.id;
    if (name === 'class') return !!this.className;
    return name in this._attrs;
  }

  addEventListener(type, fn) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(fn);
  }

  dispatchEvent(event) {
    const list = this._listeners[event.type] || [];
    for (const fn of list) fn(event);
    return true;
  }

  click() { this.dispatchEvent({ type: 'click' }); }
  focus() { this.focused = true; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }

  querySelectorAll(selector) { return queryAll(this, selector); }
  querySelector(selector) { const r = queryAll(this, selector); return r[0] || null; }

  // Test-Hilfsfunktion für ältere Tests in diesem Repo.
  findAllButtons() { return this.querySelectorAll('button'); }
}

function serializeElement(el) {
  const attrs = [];
  if (el.id) attrs.push(`id="${el.id}"`);
  if (el.className) attrs.push(`class="${el.className}"`);
  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
  return `<${el.tagName}${attrStr}>${el.innerHTML}</${el.tagName}>`;
}

function parseAttrs(attrStr) {
  const attrs = {};
  const re = /([a-zA-Z0-9_-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|[^\s"'>]+))?/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    const name = m[1];
    let value = '';
    if (m[3] !== undefined) value = m[3];
    else if (m[4] !== undefined) value = m[4];
    else if (m[2] !== undefined) value = m[2];
    attrs[name] = value;
  }
  return attrs;
}

function applyAttrs(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'id') el.id = value;
    else if (key === 'class') el.className = value;
    else if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
      el.dataset[camel] = decodeEntities(value);
    } else if (key === 'disabled') {
      el.disabled = true;
    } else if (key === 'checked') {
      el.checked = true;
    } else if (key === 'selected') {
      el.selected = true;
      el._attrs.selected = '';
    } else if (key === 'style') {
      for (const decl of value.split(';')) {
        const [prop, val] = decl.split(':');
        if (prop && val !== undefined) {
          const camelProp = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          if (camelProp) el.style[camelProp] = val.trim();
        }
      }
    } else {
      el._attrs[key] = decodeEntities(value);
    }
  }
}

// Sehr einfacher, bewusst nicht vollständiger HTML-Fragment-Parser: reicht für die im Code
// erzeugten, immer wohlgeformten Templates (keine Kommentare/<script>/<style> darin).
function parseHtmlFragment(html) {
  const root = { tagName: '__root__', children: [] };
  const stack = [root];
  let i = 0;
  const n = html.length;

  while (i < n) {
    if (html[i] === '<') {
      const isClosing = html[i + 1] === '/';
      const tagMatch = /^<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/.exec(html.slice(i));
      if (!tagMatch) { i += 1; continue; }
      const [full, tagName, rest] = tagMatch;
      i += full.length;

      if (isClosing) {
        for (let s = stack.length - 1; s > 0; s--) {
          if (stack[s].tagName === tagName.toLowerCase()) {
            stack.length = s;
            break;
          }
        }
        continue;
      }

      const selfClosing = /\/\s*$/.test(rest) || VOID_ELEMENTS.has(tagName.toLowerCase());
      const el = new FakeElement(tagName);
      applyAttrs(el, parseAttrs(rest.replace(/\/\s*$/, '')));
      stack[stack.length - 1].children.push(el);
      el.parentNode = stack[stack.length - 1] === root ? null : stack[stack.length - 1];
      if (!selfClosing) stack.push(el);
      continue;
    }

    let end = html.indexOf('<', i);
    if (end === -1) end = n;
    const text = decodeEntities(html.slice(i, end));
    const parent = stack[stack.length - 1];
    parent._text = (parent._text || '') + text;
    i = end;
  }

  return root.children;
}

function matchesSimpleSelector(el, selector) {
  if (selector.startsWith('#')) return el.id === selector.slice(1);

  const attrMatch = /^([a-zA-Z0-9]*)\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]$/.exec(selector);
  if (attrMatch) {
    const [, tag, attr, value] = attrMatch;
    if (tag && el.tagName !== tag.toLowerCase()) return false;
    if (attr.startsWith('data-')) {
      const camel = attr.slice(5).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
      if (!(camel in el.dataset)) return false;
      return value === undefined || el.dataset[camel] === value;
    }
    if (!el.hasAttribute(attr)) return false;
    return value === undefined || el.getAttribute(attr) === value;
  }

  // Tag-Name + eine oder mehrere .class-Bedingungen, z. B. ".meter-fill.mastery" oder
  // "div.card" — alle Teile müssen zutreffen (Kombination, kein Nachfahren-Kombinator).
  const parts = selector.match(/(\.[a-zA-Z0-9_-]+)|([a-zA-Z0-9]+)/g) || [];
  if (parts.length === 0) return false;
  const classSet = new Set((el.className || '').split(/\s+/).filter(Boolean));
  for (const part of parts) {
    if (part.startsWith('.')) {
      if (!classSet.has(part.slice(1))) return false;
    } else if (el.tagName !== part.toLowerCase()) {
      return false;
    }
  }
  return true;
}

function queryAll(root, selector) {
  const results = [];
  function walk(el) {
    for (const child of el.children) {
      if (matchesSimpleSelector(child, selector)) results.push(child);
      walk(child);
    }
  }
  walk(root);
  return results;
}

function createDocumentStub() {
  return { createElement: (tag) => new FakeElement(tag) };
}

class FakeKeyboardEvent {
  constructor(type, opts = {}) {
    this.type = type;
    Object.assign(this, opts);
  }
}

module.exports = { FakeElement, createDocumentStub, FakeKeyboardEvent };
