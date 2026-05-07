export function classNames(
  cls: string,
  mods: Record<string, boolean> = {},
  additional: string[] = []
): string {
  return [
    cls,
    ...additional,
    ...Object.entries(mods)
      .filter(([, value]) => value)
      .map(([className]) => className),
  ].join(' ');
}
