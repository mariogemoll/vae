export function getPreviousElementSibling(): Element {
  // Get the current script tag
  const currentScript = document.currentScript as HTMLScriptElement;

  // Get the element right above the current script tag
  const pes = currentScript.previousElementSibling;
  if (!pes) {
    throw new Error('No previous element sibling found.');
  }
  return pes;
}
