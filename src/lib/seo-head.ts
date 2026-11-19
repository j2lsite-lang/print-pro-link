/** Keep one authoritative element for a metadata key, including prerendered tags. */
export function uniqueHeadElement<T extends HTMLElement>(selector: string, create: () => T): T {
  const elements = Array.from(document.head.querySelectorAll<T>(selector));
  const element = elements.shift() || create();
  elements.forEach((duplicate) => duplicate.remove());
  if (!element.isConnected) document.head.appendChild(element);
  return element;
}