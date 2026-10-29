function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSubsequence(needle: string, haystack: string) {
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i]![0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0]![j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      );
    }
  }

  return matrix[a.length]![b.length]!;
}

function tokenMatches(token: string, words: string[], haystack: string) {
  if (!token) return true;
  if (haystack.includes(token)) return true;
  if (token.length >= 3 && isSubsequence(token, haystack.replace(/\s+/g, ''))) return true;

  const maxDistance = token.length <= 4 ? 1 : 2;

  return words.some((word) => {
    if (word.includes(token) || token.includes(word)) return true;
    if (Math.abs(word.length - token.length) > maxDistance) return false;
    return levenshtein(word, token) <= maxDistance;
  });
}

/** Generic fuzzy match across any text fields (title, description, tags, etc.). */
export function fuzzyMatch(query: string, fields: Array<string | null | undefined>) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  const haystack = normalize(fields.filter(Boolean).join(' '));
  if (!haystack) return false;
  if (haystack.includes(normalizedQuery)) return true;

  const words = haystack.split(' ').filter(Boolean);
  const tokens = normalizedQuery.split(' ').filter(Boolean);

  return tokens.every((token) => tokenMatches(token, words, haystack));
}
