/**
 * Copy text to the clipboard, with a fallback for insecure contexts.
 *
 * `navigator.clipboard` only exists on HTTPS and on localhost. This plugin is
 * built for demo instances, which are routinely reached over plain HTTP through
 * a tunnel — there the modern API is simply absent, so the old hidden-textarea
 * trick is what actually copies.
 *
 * @param {string} text text to copy
 * @returns {Promise<boolean>} whether the text reached the clipboard
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Falls through to the textarea below: a rejected permission is not the end
    // of the road, execCommand is judged by a different rule.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
