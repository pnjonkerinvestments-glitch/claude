/**
 * Singular and plural: "1 day", "2 days". Uses `key + '_one'` when the count is exactly 1 and that text
 * exists (in i18n/v123.ts), otherwise `key`. `shown` is the count as it should appear (e.g. 1.234).
 */
export function plural(t: (k: string) => string, key: string, n: number, token = '{n}', shown?: string) {
  const one = n === 1 ? t(key + '_one') : '';
  const template = one && one !== key + '_one' ? one : t(key);
  return template.split(token).join(shown ?? String(n));
}
