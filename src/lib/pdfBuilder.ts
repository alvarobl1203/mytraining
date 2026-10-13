// ===========================================================================
// MyTraining — Generación de PDFs (Analíticas + Planes)
// ===========================================================================
// v2 — Reescritura completa:
//   - Logo real desde public/icon.svg convertido a PNG con canvas
//   - Desglose serie-a-serie por ejercicio (peso × reps · RIR · 1RM)
//   - Jerarquía visual mejorada: secciones, subtítulos y cards
//   - Paginación robusta con cabecera/continuación
// ===========================================================================

import { jsPDF } from 'jspdf';

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------
type RGB = [number, number, number];

// ---------------------------------------------------------------------------
// Paleta (coincide con la app)
// ---------------------------------------------------------------------------
const C = {
  bg: [9, 9, 11] as RGB,
  surface: [24, 24, 27] as RGB,
  surfaceAlt: [18, 18, 20] as RGB,
  surfaceCard: [16, 16, 18] as RGB,
  border: [63, 63, 70] as RGB,
  borderSoft: [39, 39, 42] as RGB,
  text: [244, 244, 245] as RGB,
  textMuted: [161, 161, 170] as RGB,
  textDim: [113, 113, 122] as RGB,
  accent: [34, 211, 238] as RGB,
  blue: [59, 130, 246] as RGB,
  amber: [251, 191, 36] as RGB,
  amberDim: [42, 28, 10] as RGB,
  red: [239, 68, 68] as RGB,
  green: [34, 197, 94] as RGB,
};

const A4_W = 595;
const A4_H = 842;
const MARGIN = 40;
const CONTENT_W = A4_W - MARGIN * 2;
const PAGE_BOTTOM = A4_H - 40; // margen inferior seguro antes del footer

// ---------------------------------------------------------------------------
// Helpers de color
// ---------------------------------------------------------------------------
function setFill(pdf: jsPDF, c: RGB) {
  pdf.setFillColor(c[0], c[1], c[2]);
}
function setText(pdf: jsPDF, c: RGB) {
  pdf.setTextColor(c[0], c[1], c[2]);
}
function setStroke(pdf: jsPDF, c: RGB) {
  pdf.setDrawColor(c[0], c[1], c[2]);
}

function paintBackground(pdf: jsPDF) {
  setFill(pdf, C.bg);
  pdf.rect(0, 0, A4_W, A4_H, 'F');
}

function truncate(pdf: jsPDF, text: string, maxW: number): string {
  if (pdf.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 3 && pdf.getTextWidth(t + '…') > maxW) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

function newPage(pdf: jsPDF): number {
  pdf.addPage();
  paintBackground(pdf);
  return 60;
}

// ---------------------------------------------------------------------------
// Logo: carga public/icon.svg y lo convierte a PNG base64 (cacheado)
// ---------------------------------------------------------------------------
let cachedLogoDataUrl: string | null = null;

export async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch('/icon.svg', { cache: 'force-cache' });
    if (!res.ok) return null;
    const svgText = await res.text();

    // Blob -> ObjectURL -> Image -> Canvas -> PNG base64
    const svgBlob = new Blob([svgText], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('No se pudo cargar el logo'));
      img.src = url;
    });

    const size = 256; // resolución alta para que se vea nítido en el PDF
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      return null;
    }
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);

    cachedLogoDataUrl = canvas.toDataURL('image/png');
    return cachedLogoDataUrl;
  } catch {
    // Si falla, el PDF se genera sin logo (fallback textual)
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cabecera con logo real
// ---------------------------------------------------------------------------
function drawHeader(
  pdf: jsPDF,
  logoDataUrl: string | null,
  title: string,
  subtitle?: string,
): number {
  const logoSize = 30;
  const logoY = 40;

  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', MARGIN, logoY, logoSize, logoSize);
    } catch {
      // Fallback si addImage falla
      setFill(pdf, C.blue);
      pdf.roundedRect(MARGIN, logoY, logoSize, logoSize, 8, 8, 'F');
    }
  } else {
    // Fallback: cuadrado azul con rayo textual
    setFill(pdf, C.blue);
    pdf.roundedRect(MARGIN, logoY, logoSize, logoSize, 8, 8, 'F');
    setText(pdf, [255, 255, 255]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('M', MARGIN + 10, logoY + 21);
  }

  // Wordmark "My Training"
  pdf.setFontSize(17);
  pdf.setFont('helvetica', 'bold');
  setText(pdf, C.text);
  pdf.text('My ', MARGIN + logoSize + 10, logoY + 21);
  setText(pdf, C.accent);
  pdf.text('Training', MARGIN + logoSize + 10 + pdf.getTextWidth('My '), logoY + 21);

  // Título principal
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  setText(pdf, C.text);
  pdf.text(title, MARGIN, 100);

  // Subtítulo
  let y = 118;
  if (subtitle) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    setText(pdf, C.textMuted);
    pdf.text(subtitle, MARGIN, y);
    y += 16;
  }

  // Fecha de generación
  pdf.setFontSize(9);
  setText(pdf, C.textDim);
  pdf.text(`Generado el ${new Date().toLocaleString('es-ES')}`, MARGIN, y + 2);

  // Separador
  y += 14;
  setStroke(pdf, C.border);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y, A4_W - MARGIN, y);

  return y + 20;
}

// ---------------------------------------------------------------------------
// Tarjetas KPI (4 en fila)
// ---------------------------------------------------------------------------
function drawKpiRow(
  pdf: jsPDF,
  kpis: Array<{
    label: string;
    value: string;
    tone?: 'default' | 'accent' | 'amber' | 'green';
  }>,
  startY: number,
): number {
  const gap = 8;
  const count = Math.min(kpis.length, 4);
  const cardW = (CONTENT_W - gap * (count - 1)) / count;
  const cardH = 62;

  kpis.slice(0, 4).forEach((kpi, i) => {
    const x = MARGIN + i * (cardW + gap);
    setFill(pdf, C.surface);
    pdf.roundedRect(x, startY, cardW, cardH, 10, 10, 'F');
    setStroke(pdf, C.border);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, startY, cardW, cardH, 10, 10, 'S');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    setText(pdf, C.textDim);
    pdf.text(kpi.label.toUpperCase(), x + cardW / 2, startY + 18, {
      align: 'center',
    });

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const tone =
      kpi.tone === 'accent'
        ? C.accent
        : kpi.tone === 'amber'
          ? C.amber
          : kpi.tone === 'green'
            ? C.green
            : C.text;
    setText(pdf, tone);
    pdf.text(kpi.value, x + cardW / 2, startY + 46, { align: 'center' });
  });

  return startY + cardH + 24;
}

// ---------------------------------------------------------------------------
// Sección: título + separador
// ---------------------------------------------------------------------------
function drawSectionTitle(
  pdf: jsPDF,
  title: string,
  subtitle: string | undefined,
  y: number,
): number {
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  setText(pdf, C.text);
  pdf.text(title, MARGIN, y);

  if (subtitle) {
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    setText(pdf, C.textDim);
    pdf.text(subtitle, MARGIN, y + 12);
  }

  return y + (subtitle ? 18 : 8);
}

// ---------------------------------------------------------------------------
// Tabla resumen por ejercicio
// ---------------------------------------------------------------------------
export interface SetDetail {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  estimated1Rm: number | null;
  isPr?: boolean;
}

export interface ExerciseRow {
  name: string;
  sets: number;
  volume: number;
  best: number;
  setDetails?: SetDetail[];
}

function drawSummaryTable(
  pdf: jsPDF,
  rows: ExerciseRow[],
  startY: number,
): number {
  let y = drawSectionTitle(
    pdf,
    'Volumen por ejercicio',
    'Resumen ordenado por tonelaje acumulado',
    startY,
  );
  y += 12;

  const colSets = MARGIN + CONTENT_W * 0.62;
  const colVol = MARGIN + CONTENT_W * 0.84;
  const col1Rm = A4_W - MARGIN - 10;

  // Encabezado de la tabla
  setFill(pdf, C.surface);
  pdf.rect(MARGIN, y, CONTENT_W, 22, 'F');
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  setText(pdf, C.textDim);
  pdf.text('EJERCICIO', MARGIN + 10, y + 15);
  pdf.text('SERIES', colSets, y + 15, { align: 'right' });
  pdf.text('VOLUMEN', colVol, y + 15, { align: 'right' });
  pdf.text('1RM MÁX', col1Rm, y + 15, { align: 'right' });
  y += 22;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  rows.forEach((r, i) => {
    if (y > PAGE_BOTTOM - 20) y = newPage(pdf);
    if (i % 2 === 0) {
      setFill(pdf, C.surfaceAlt);
      pdf.rect(MARGIN, y, CONTENT_W, 20, 'F');
    }
    setText(pdf, C.text);
    const name = truncate(pdf, r.name, CONTENT_W * 0.58);
    pdf.text(name, MARGIN + 10, y + 13);

    setText(pdf, C.textMuted);
    pdf.text(String(r.sets), colSets, y + 13, { align: 'right' });

    setText(pdf, C.accent);
    pdf.text(`${r.volume.toFixed(0)} kg`, colVol, y + 13, { align: 'right' });

    setText(pdf, C.text);
    pdf.text(r.best > 0 ? r.best.toFixed(1) : '—', col1Rm, y + 13, {
      align: 'right',
    });
    y += 20;
  });

  return y + 20;
}

// ---------------------------------------------------------------------------
// Sección detallada: cada ejercicio con su desglose serie a serie
// ---------------------------------------------------------------------------
function drawSetDetailCard(
  pdf: jsPDF,
  ex: ExerciseRow,
  startY: number,
): number {
  const details = ex.setDetails ?? [];
  if (details.length === 0) return startY;

  let y = startY;
  const headerH = 40;
  const rowH = 17;
  const padding = 10;
  const cardH = headerH + padding + details.length * rowH + padding;

  // ¿Cabe en la página actual? Si no, salta de página.
  // (Permitimos split si el card es enorme, pero normalmente no lo será.)
  const fitsOnCurrentPage = y + cardH <= PAGE_BOTTOM;
  const fitsOnNewPage = 60 + cardH <= PAGE_BOTTOM;

  if (!fitsOnCurrentPage && fitsOnNewPage) {
    y = newPage(pdf);
  }

  // Card contenedor
  setFill(pdf, C.surfaceCard);
  pdf.roundedRect(MARGIN, y, CONTENT_W, cardH, 8, 8, 'F');
  setStroke(pdf, C.borderSoft);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN, y, CONTENT_W, cardH, 8, 8, 'S');

  // Barra lateral acento
  setFill(pdf, C.accent);
  pdf.roundedRect(MARGIN + 4, y + 6, 3, headerH - 12, 1.5, 1.5, 'F');

  // Nombre del ejercicio
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  setText(pdf, C.text);
  const nameMaxW = CONTENT_W * 0.55;
  pdf.text(truncate(pdf, ex.name, nameMaxW), MARGIN + 14, y + 18);

  // Resumen a la derecha: series · tonelaje · 1RM máx
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  setText(pdf, C.textDim);
  pdf.text(
    `${ex.sets} ${ex.sets === 1 ? 'serie' : 'series'}  ·  ${ex.volume.toFixed(0)} kg  ·  1RM ${ex.best > 0 ? ex.best.toFixed(1) : '—'}`,
    A4_W - MARGIN - 12,
    y + 18,
    { align: 'right' },
  );

  // Línea separadora bajo la cabecera
  setStroke(pdf, C.borderSoft);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN + 10, y + headerH - 4, A4_W - MARGIN - 10, y + headerH - 4);

  // Filas de series
  let rowY = y + headerH + padding - 2;
  pdf.setFontSize(8.5);
  details.forEach((s) => {
    // Número de serie
    pdf.setFont('helvetica', 'bold');
    setText(pdf, C.accent);
    pdf.text(`S${s.setNumber}`, MARGIN + 16, rowY + 11);

    // Peso × reps
    pdf.setFont('helvetica', 'normal');
    setText(pdf, C.text);
    const weight = s.weightKg != null ? `${s.weightKg} kg` : '—';
    const reps = s.reps != null ? `${s.reps} reps` : '—';
    pdf.text(`${weight} × ${reps}`, MARGIN + 40, rowY + 11);

    // RIR
    setText(pdf, C.textMuted);
    const rir = s.rir != null ? `RIR ${s.rir}` : 'RIR —';
    pdf.text(rir, MARGIN + CONTENT_W * 0.55, rowY + 11);

    // 1RM estimado
    setText(pdf, C.textMuted);
    const oneRm = s.estimated1Rm != null ? s.estimated1Rm.toFixed(1) : '—';
    pdf.text(`1RM est. ${oneRm}`, A4_W - MARGIN - 16, rowY + 11, {
      align: 'right',
    });

    // Badge PR a la izquierda si aplica
    if (s.isPr) {
      setFill(pdf, C.amberDim);
      pdf.roundedRect(MARGIN + 6, rowY + 3, 20, 10, 3, 3, 'F');
      setText(pdf, C.amber);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PR', MARGIN + 16, rowY + 10, { align: 'center' });
      pdf.setFontSize(8.5);
    }

    rowY += rowH;
  });

  return y + cardH + 14;
}

function drawSetDetailsSection(
  pdf: jsPDF,
  rows: ExerciseRow[],
  startY: number,
): number {
  const withDetails = rows.filter((r) => (r.setDetails?.length ?? 0) > 0);
  if (withDetails.length === 0) return startY;

  let y = startY;
  if (y > PAGE_BOTTOM - 120) y = newPage(pdf);

  y = drawSectionTitle(
    pdf,
    'Detalle por serie',
    'Peso, repeticiones y 1RM estimado de cada serie registrada',
    y,
  );
  y += 14;

  withDetails.forEach((ex) => {
    y = drawSetDetailCard(pdf, ex, y);
  });

  return y + 6;
}

// ---------------------------------------------------------------------------
// Tabla de PRs
// ---------------------------------------------------------------------------
export interface PrRow {
  exercise: string;
  weight: number;
  reps: number;
  estimated1Rm?: number | null;
}

function drawPrsTable(pdf: jsPDF, prs: PrRow[], startY: number): number {
  let y = startY;
  if (y > PAGE_BOTTOM - 150) y = newPage(pdf);
  y = drawSectionTitle(pdf, 'Récords personales', undefined, y);
  y += 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  prs.forEach((p) => {
    if (y > PAGE_BOTTOM - 26) y = newPage(pdf);

    setFill(pdf, C.amberDim);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 22, 6, 6, 'F');
    setStroke(pdf, C.amber);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 22, 6, 6, 'S');

    setText(pdf, C.amber);
    pdf.setFontSize(10);
    pdf.text('★', MARGIN + 10, y + 15);

    setText(pdf, C.text);
    pdf.setFontSize(9);
    pdf.text(truncate(pdf, p.exercise, CONTENT_W * 0.5), MARGIN + 26, y + 15);

    setText(pdf, C.amber);
    const txt = `${p.weight} kg × ${p.reps}${
      p.estimated1Rm ? ` · 1RM ${p.estimated1Rm.toFixed(1)}` : ''
    }`;
    pdf.text(txt, A4_W - MARGIN - 10, y + 15, { align: 'right' });

    y += 26;
  });

  return y + 6;
}

// ---------------------------------------------------------------------------
// Footer con paginación
// ---------------------------------------------------------------------------
function drawFooters(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7.5);
    setText(pdf, C.textDim);
    pdf.text(`MyTraining · Página ${i} de ${total}`, A4_W / 2, A4_H - 18, {
      align: 'center',
    });
  }
}

// ===========================================================================
// BUILDER 1 — Analíticas
// ===========================================================================
export interface AnalyticsPDFData {
  scopeLabel: string;
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  totalPRs: number;
  exercises: ExerciseRow[];
  prs: PrRow[];
  includeVolume: boolean;
  includePrs: boolean;
  /** Logo en base64 (opcional). Si no se pasa, se intenta cargar /icon.svg. */
  logoDataUrl?: string | null;
}

export async function buildAnalyticsPDF(
  data: AnalyticsPDFData,
): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  paintBackground(pdf);

  const logo =
    data.logoDataUrl !== undefined ? data.logoDataUrl : await loadLogoDataUrl();

  let y = drawHeader(pdf, logo, 'Análisis de rendimiento', data.scopeLabel);

  y = drawKpiRow(
    pdf,
    [
      { label: 'Entrenos', value: String(data.totalWorkouts) },
      { label: 'Series', value: String(data.totalSets) },
      {
        label: 'Volumen',
        value: `${data.totalVolume.toLocaleString('es-ES')} kg`,
        tone: 'accent',
      },
      { label: 'PRs', value: String(data.totalPRs), tone: 'amber' },
    ],
    y,
  );

  if (data.includeVolume && data.exercises.length > 0) {
    y = drawSummaryTable(pdf, data.exercises, y);
    y = drawSetDetailsSection(pdf, data.exercises, y);
  }

  if (data.includePrs && data.prs.length > 0) {
    y = drawPrsTable(pdf, data.prs, y);
  }

  drawFooters(pdf);
  return pdf;
}

// ===========================================================================
// BUILDER 2 — Plan semanal
// ===========================================================================
export interface PlanDayPDF {
  dayName: string;
  label: string;
  isRest: boolean;
  exercises: Array<{
    name: string;
    sets: number;
    repsMin: number;
    repsMax: number;
    rir: number;
    restSeconds: number;
    primaryMuscle?: string;
    secondaryMuscles?: string[];
  }>;
}

export interface PlanPDFData {
  planName: string;
  totalDays: number;
  totalExercises: number;
  restCount: number;
  days: PlanDayPDF[];
  logoDataUrl?: string | null;
}

export async function buildPlanPDF(data: PlanPDFData): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  paintBackground(pdf);

  const logo =
    data.logoDataUrl !== undefined ? data.logoDataUrl : await loadLogoDataUrl();

  let y = drawHeader(
    pdf,
    logo,
    data.planName,
    `${data.totalDays} ${
      data.totalDays === 1 ? 'día' : 'días'
    } · ${data.totalExercises} ejercicios${
      data.restCount > 0
        ? ` · ${data.restCount} descanso${data.restCount > 1 ? 's' : ''}`
        : ''
    }`,
  );

  data.days.forEach((day) => {
    if (y > PAGE_BOTTOM - 160) y = newPage(pdf);

    // Barra del día
    setFill(pdf, C.surface);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 32, 8, 8, 'F');
    setStroke(pdf, C.border);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 32, 8, 8, 'S');

    setFill(pdf, day.isRest ? C.textMuted : C.accent);
    pdf.roundedRect(MARGIN + 4, y + 6, 3, 20, 2, 2, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    setText(pdf, day.isRest ? C.textMuted : C.accent);
    pdf.text(day.dayName.toUpperCase(), MARGIN + 14, y + 21);

    pdf.setFontSize(11);
    setText(pdf, C.text);
    pdf.text(day.label, MARGIN + 80, y + 21);

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    setText(pdf, C.textDim);
    pdf.text(
      day.isRest ? 'Descanso' : `${day.exercises.length} ej.`,
      A4_W - MARGIN - 12,
      y + 21,
      { align: 'right' },
    );

    y += 40;

    if (!day.isRest && day.exercises.length > 0) {
      day.exercises.forEach((ex, idx) => {
        if (y > PAGE_BOTTOM - 60) y = newPage(pdf);

        setFill(pdf, C.surfaceAlt);
        pdf.roundedRect(MARGIN, y, CONTENT_W, 40, 6, 6, 'F');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        setText(pdf, C.accent);
        pdf.text(`${idx + 1}`, MARGIN + 12, y + 25);

        pdf.setFontSize(10.5);
        setText(pdf, C.text);
        pdf.text(
          truncate(pdf, ex.name, CONTENT_W * 0.6),
          MARGIN + 28,
          y + 18,
        );

        if (ex.primaryMuscle) {
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          setText(pdf, C.textDim);
          const muscles = [ex.primaryMuscle, ...(ex.secondaryMuscles ?? [])]
            .join(' · ');
          pdf.text(
            truncate(pdf, muscles, CONTENT_W * 0.6),
            MARGIN + 28,
            y + 30,
          );
        }

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        setText(pdf, C.accent);
        pdf.text(
          `${ex.sets}×${ex.repsMin}-${ex.repsMax}`,
          A4_W - MARGIN - 12,
          y + 18,
          { align: 'right' },
        );

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        setText(pdf, C.textDim);
        pdf.text(
          `RIR ${ex.rir} · ${ex.restSeconds}s`,
          A4_W - MARGIN - 12,
          y + 30,
          { align: 'right' },
        );

        y += 46;
      });
    }

    y += 12;
  });

  drawFooters(pdf);
  return pdf;
}