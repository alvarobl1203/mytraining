// ===========================================================================
// Acciones de archivo: portapapeles y descarga (web + Android nativo)
// ===========================================================================
// En web se usa <a download>. En Capacitor/Android el WebView ignora ese
// atributo, así que se escribe en Directory.Cache y se abre Share nativo.
// ===========================================================================

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim() || 'archivo';
  return trimmed.replace(/[/\\?%*:|"<>]/g, '-');
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('No se pudo convertir el archivo a base64'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('FileReader falló al leer el blob'));
    };
    reader.readAsDataURL(blob);
  });
}

function isShareCanceled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('cancel') || msg.includes('cancelad');
}

function downloadBlobOnWeb(blob: Blob, filename: string): void {
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

async function shareBlobOnNative(blob: Blob, filename: string): Promise<void> {
  const safeName = sanitizeFilename(filename);
  const data = await blobToBase64(blob);
  // Sin encoding: el plugin interpreta `data` como binario en base64.
  const written = await Filesystem.writeFile({
    path: safeName,
    data,
    directory: Directory.Cache,
  });
  const uri =
    written.uri ||
    (
      await Filesystem.getUri({
        path: safeName,
        directory: Directory.Cache,
      })
    ).uri;

  try {
    await Share.share({
      title: safeName,
      dialogTitle: 'Compartir archivo',
      files: [uri],
    });
  } catch (error) {
    if (isShareCanceled(error)) return;
    throw error;
  }
}

// ===========================================================================
// DESCARGAR BLOB — web: <a download>; nativo: Filesystem + Share
// ===========================================================================
export async function downloadBlob(
  blob: Blob,
  filename: string
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await shareBlobOnNative(blob, filename);
    return;
  }
  downloadBlobOnWeb(blob, filename);
}

export async function downloadText(
  content: string,
  filename: string
): Promise<void> {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  await downloadBlob(blob, filename);
}
