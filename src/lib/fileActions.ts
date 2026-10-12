// ===========================================================================
// COPIAR AL PORTAPAPELES — funciona en móvil, PWA y Capacitor
// ===========================================================================
export async function copyToClipboard(text: string): Promise<void> {
  // Estrategia 1: API moderna (necesita HTTPS o localhost)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // continuar al fallback
    }
  }

  // Estrategia 2: textarea + execCommand (funciona en iOS Safari,
  // Android Chrome viejo y WebView de Capacitor sin HTTPS)
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.width = '1px';
  ta.style.height = '1px';
  ta.style.padding = '0';
  ta.style.border = 'none';
  ta.style.outline = 'none';
  ta.style.boxShadow = 'none';
  ta.style.background = 'transparent';
  ta.style.opacity = '0';
  ta.style.fontSize = '16px'; // evita zoom iOS al enfocar
  document.body.appendChild(ta);

  const sel = document.getSelection();
  const savedRange =
    sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

  try {
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    if (!ok) throw new Error('execCommand("copy") devolvió false');
  } finally {
    document.body.removeChild(ta);
    if (savedRange && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
  }
}

// ===========================================================================
// DESCARGAR BLOB — Android Chrome, Capacitor OK. iOS abre en pestaña.
// ===========================================================================
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {
      // ignore
    }
    URL.revokeObjectURL(url);
  }, 800);
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, filename);
}