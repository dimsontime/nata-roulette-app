const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const PENDING_KEY = 'beer-roulette:pending-decrements';

export const fallbackProducts = [
  { id: 1, name: 'Шоппер', stock: 2500 },
  { id: 2, name: 'Стикерпак', stock: 3000 },
  { id: 3, name: 'Лимон-лайм', stock: 740 },
  { id: 4, name: 'Фейхоа', stock: 1000 },
  { id: 5, name: 'Груша', stock: 2000 },
  { id: 6, name: 'Саперави', stock: 1000 },
  { id: 7, name: 'Тархун', stock: 740 }
];

function readPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writePending(items) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

function mergeItems(...groups) {
  const merged = new Map();

  for (const group of groups) {
    for (const item of group) {
      const id = Number(item.id);
      const quantity = Number(item.quantity ?? 1);

      if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity <= 0) continue;

      merged.set(id, (merged.get(id) ?? 0) + quantity);
    }
  }

  return [...merged.entries()].map(([id, quantity]) => ({ id, quantity }));
}

export function getPending() {
  return readPending();
}

export function addPending(item) {
  const pending = readPending();
  const existing = pending.find((entry) => entry.id === item.id);

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    pending.push({ id: item.id, quantity: item.quantity });
  }

  writePending(pending);
}

export function clearPending() {
  localStorage.removeItem(PENDING_KEY);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.ok === false) {
    throw new Error(body?.message ?? 'API request failed');
  }

  return body;
}

export async function fetchProducts() {
  const body = await request('/api/products');
  return body.products;
}

export async function decrementItems(items, options = {}) {
  const shouldIncludePending = options.includePending ?? true;
  const pending = shouldIncludePending ? readPending() : [];
  const batch = mergeItems(pending, items);

  const body = await request('/api/decrement', {
    method: 'POST',
    body: JSON.stringify({ items: batch })
  });

  clearPending();
  return body.products;
}

export async function syncPending() {
  const pending = readPending();

  if (!pending.length) return null;

  const products = await decrementItems(pending, { includePending: false });
  clearPending();
  return products;
}
