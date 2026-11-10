export function loadSave(storage, key, createNew, migrate) {
  for (const candidate of [key, `${key}:backup`]) {
    try {
      const raw = storage.getItem(candidate);
      if (raw) return migrate(JSON.parse(raw));
    } catch {}
  }
  return createNew();
}

export function storeSave(storage, key, save) {
  const next = JSON.stringify(save);
  const previous = storage.getItem(key);
  storage.setItem(`${key}:staging`, next);
  if (previous) storage.setItem(`${key}:backup`, previous);
  storage.setItem(key, next);
  storage.removeItem(`${key}:staging`);
}

export function clearSave(storage, key) {
  storage.removeItem(key);
  storage.removeItem(`${key}:backup`);
  storage.removeItem(`${key}:staging`);
}
