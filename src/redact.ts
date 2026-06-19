const SECRET_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /(api[_-]?key\s*[:=]\s*)[A-Za-z0-9._-]{12,}/gi,
  /(token\s*[:=]\s*)[A-Za-z0-9._-]{12,}/gi
];

export function redact(input: string | undefined): string | undefined {
  if (!input) return input;
  return SECRET_PATTERNS.reduce((value, pattern) => {
    return value.replace(pattern, (match, prefix) => `${prefix ?? ""}[REDACTED]`);
  }, input);
}

export function hasSecretLikeValue(input: string | undefined): boolean {
  if (!input) return false;
  return SECRET_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(input);
  });
}

