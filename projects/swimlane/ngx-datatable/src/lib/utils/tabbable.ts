export const TABBABLE_SELECTOR = [
  'input:not(:disabled)',
  'textarea:not(:disabled)',
  'select:not(:disabled)',
  'button:not(:disabled)',
  'a[href]',
  'area[href]',
  'audio[controls]',
  'video[controls]',
  'iframe',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function getTabbableElements(container: HTMLElement, options: { includeHidden?: boolean } = {}): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR));
  if (options.includeHidden) {
    return candidates;
  }
  return candidates.filter((el) => getComputedStyle(el).visibility !== 'hidden');
}
