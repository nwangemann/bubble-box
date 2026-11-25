import { File, Paths } from 'expo-file-system';

const file = () => new File(Paths.document, 'settings.json');

/** What was saved, read at once, or null. */
export function read(): string | null {
  const f = file();
  return f.exists ? f.textSync() : null;
}

export function write(text: string) {
  const f = file();
  if (!f.exists) f.create();
  f.write(text);
}
