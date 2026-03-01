export function nextPrefixedId(prefix: string, lastValue?: string | null) {
  if (!lastValue) {
    return `${prefix}_1`;
  }

  const raw = lastValue.replace(`${prefix}_`, '');
  const nextNumber = Number.parseInt(raw, 10) + 1;
  if (Number.isNaN(nextNumber)) {
    return `${prefix}_1`;
  }

  return `${prefix}_${nextNumber}`;
}
