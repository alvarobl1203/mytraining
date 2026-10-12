import { jsPDF } from 'jspdf';

// ===========================================================================
// Paleta (coincide con la app)
// ===========================================================================
const C = {
  bg: [9, 9, 11] as [number, number, number],
  surface: [24, 24, 27] as [number, number, number],
  surfaceAlt: [18, 18, 20] as [number, number, number],
  border: [63, 63, 70] as [number, number, number],
  text: [244, 244, 245] as [number, number, number],
  textMuted: [161, 161, 170] as [number, number, number],
  textDim: [113, 113, 122] as [number, number, number],
  accent: [34, 211, 238] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number],
  amber: [251, 191, 36] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
};

const A4_W = 595;
const A4_H = 842;
const MARGIN = 40;
const CONTENT_W = A4_W - MARGIN * 2;

function setFill(pdf: jsPDF, c: [number, number, number]) {
  pdf.setFillColor(c[0], c[1], c[2]);
}
function setText(pdf: jsPDF, c: [number, number, number]) {
  pdf.setTextColor(c[0], c[1], c[2]);
}
function setStroke(pdf: jsPDF, c: [number, number, number]) {
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

// ===========================================================================
// Cabecera de página con logo textual
// ===========================================================================
function drawHeader(pdf: jsPDF, title: string, subtitle?: string): number {
  // Logo
  setFill(pdf, C.blue);
  pdf.roundedRect(MARGIN, 40, 28, 28, 8, 8, 'F');
  setText(pdf, [255, 255, 255]);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('⚡', MARGIN + 7, 59);

  // Título "My Training"
  pdf.setFontSize(16);
  setText(pdf, C.text);
  pdf.text('My ', MARGIN + 36, 58);
  setText(pdf, C.accent);
  pdf.text('Training', MARGIN + 57, 58);

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

  // Fecha
  pdf.setFontSize(9);
  setText(pdf, C.textDim);
  pdf.text(
    `Generado el ${new Date().toLocaleString('es-ES')}`,
    MARGIN,
    y + 2
  );

  // Línea separadora
  y += 14;
  setStroke(pdf, C.border);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y, A4_W - MARGIN, y);

  return y + 20;
}

// ===========================================================================
// Tarjetas KPI (4 en fila)
// ===========================================================================
function drawKpiRow(
  pdf: jsPDF,
  kpis: { label: string; value: string; tone?: 'default' | 'accent' | 'amber' | 'green' }[],
  startY: number
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

    // Label arriba
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    setText(pdf, C.textDim);
    pdf.text(kpi.label.toUpperCase(), x + cardW / 2, startY + 18, {
      align: 'center',
    });

    // Valor grande
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

// ===========================================================================
// Sección con título
// ===========================================================================
function drawSectionTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  setText(pdf, C.text);
  pdf.text(title, MARGIN, y);
  return y + 8;
}

// ===========================================================================
// Tabla de ejercicios (analíticas)
// ===========================================================================
interface ExerciseRow {
  name: string;
  sets: number;
  volume: number;
  best: number;
}

function drawExercisesTable(
  pdf: jsPDF,
  rows: ExerciseRow[],
  startY: number
): number {
  let y = drawSectionTitle(pdf, 'Volumen por ejercicio', startY);
  y += 12;

  const colSets = MARGIN + CONTENT_W * 0.66;
  const colVol = MARGIN + CONTENT_W * 0.86;
  const col1Rm = A4_W - MARGIN - 8;

  // Encabezado de tabla
  setFill(pdf, C.surface);
  pdf.rect(MARGIN, y, CONTENT_W, 22, 'F');
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  setText(pdf, C.textDim);
  pdf.text('EJERCICIO', MARGIN + 10, y + 15);
  pdf.text('SERIES', colSets, y + 15, { align: 'right' });
  pdf.text('VOLUMEN', colVol, y + 15, { align: 'right' });
  pdf.text('1RM', col1Rm, y + 15, { align: 'right' });
  y += 22;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  rows.forEach((r, i) => {
    if (y > A4_H - 60) {
      y = newPage(pdf);
    }
    if (i % 2 === 0) {
      setFill(pdf, C.surfaceAlt);
      pdf.rect(MARGIN, y, CONTENT_W, 20, 'F');
    }
    setText(pdf, C.text);
    const name = truncate(pdf, r.name, CONTENT_W * 0.6);
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

  return y + 12;
}

// ===========================================================================
// Tabla de PRs
// ===========================================================================
interface PrRow {
  exercise: string;
  weight: number;
  reps: number;
  estimated1Rm?: number | null;
}

function drawPrsTable(pdf: jsPDF, prs: PrRow[], startY: number): number {
  let y = startY;
  if (y > A4_H - 150) y = newPage(pdf);
  y = drawSectionTitle(pdf, 'Récords personales', y);
  y += 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  prs.forEach((p) => {
    if (y > A4_H - 40) y = newPage(pdf);

    setFill(pdf, [42, 28, 10]);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 22, 6, 6, 'F');
    setStroke(pdf, C.amber);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 22, 6, 6, 'S');

    setText(pdf, C.amber);
    pdf.setFontSize(10);
    pdf.text('★', MARGIN + 10, y + 15);

    setText(pdf, C.text);
    pdf.setFontSize(9);
    pdf.text(truncate(pdf, p.exercise, CONTENT_W * 0.55), MARGIN + 26, y + 15);

    setText(pdf, C.amber);
    const txt = `${p.weight} kg × ${p.reps}${
      p.estimated1Rm ? ` · 1RM ${p.estimated1Rm.toFixed(1)}` : ''
    }`;
    pdf.text(txt, A4_W - MARGIN - 10, y + 15, { align: 'right' });

    y += 26;
  });

  return y + 6;
}

// ===========================================================================
// Footer con paginación
// ===========================================================================
function drawFooters(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7.5);
    setText(pdf, C.textDim);
    pdf.text(
      `MyTraining · Página ${i} de ${total}`,
      A4_W / 2,
      A4_H - 18,
      { align: 'center' }
    );
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
}

export function buildAnalyticsPDF(data: AnalyticsPDFData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  paintBackground(pdf);

  let y = drawHeader(pdf, 'Análisis de rendimiento', data.scopeLabel);

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
      {
        label: 'PRs',
        value: String(data.totalPRs),
        tone: 'amber',
      },
    ],
    y
  );

  if (data.includeVolume && data.exercises.length > 0) {
    y = drawExercisesTable(pdf, data.exercises, y);
    y += 8;
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
}

export function buildPlanPDF(data: PlanPDFData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  paintBackground(pdf);

  let y = drawHeader(
    pdf,
    data.planName,
    `${data.totalDays} ${
      data.totalDays === 1 ? 'día' : 'días'
    } · ${data.totalExercises} ejercicios${
      data.restCount > 0 ? ` · ${data.restCount} descanso${data.restCount > 1 ? 's' : ''}` : ''
    }`
  );

  data.days.forEach((day) => {
    if (y > A4_H - 160) y = newPage(pdf);

    // Barra del día
    setFill(pdf, C.surface);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 32, 8, 8, 'F');
    setStroke(pdf, C.border);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 32, 8, 8, 'S');

    // Franja lateral de color
    setFill(pdf, day.isRest ? C.textMuted : C.accent);
    pdf.roundedRect(MARGIN + 4, y + 6, 3, 20, 2, 2, 'F');

    // Día
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    setText(pdf, day.isRest ? C.textMuted : C.accent);
    pdf.text(day.dayName.toUpperCase(), MARGIN + 14, y + 21);

    // Label
    pdf.setFontSize(11);
    setText(pdf, C.text);
    pdf.text(day.label, MARGIN + 80, y + 21);

    // Indicador derecha
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    if (day.isRest) {
      setText(pdf, C.textDim);
      pdf.text('Descanso', A4_W - MARGIN - 12, y + 21, { align: 'right' });
    } else {
      setText(pdf, C.textDim);
      pdf.text(
        `${day.exercises.length} ej.`,
        A4_W - MARGIN - 12,
        y + 21,
        { align: 'right' }
      );
    }

    y += 40;

    // Ejercicios
    if (!day.isRest && day.exercises.length > 0) {
      day.exercises.forEach((ex, idx) => {
        if (y > A4_H - 60) y = newPage(pdf);

        setFill(pdf, C.surfaceAlt);
        pdf.roundedRect(MARGIN, y, CONTENT_W, 40, 6, 6, 'F');

        // Índice
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        setText(pdf, C.accent);
        pdf.text(`${idx + 1}`, MARGIN + 12, y + 25);

        // Nombre del ejercicio
        pdf.setFontSize(10.5);
        setText(pdf, C.text);
        const name = truncate(pdf, ex.name, CONTENT_W * 0.6);
        pdf.text(name, MARGIN + 28, y + 18);

        // Músculos
        if (ex.primaryMuscle) {
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          setText(pdf, C.textDim);
          const muscles = [
            ex.primaryMuscle,
            ...(ex.secondaryMuscles ?? []),
          ].join(' · ');
          pdf.text(truncate(pdf, muscles, CONTENT_W * 0.6), MARGIN + 28, y + 30);
        }

        // Especificaciones a la derecha
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        setText(pdf, C.accent);
        pdf.text(
          `${ex.sets}×${ex.repsMin}-${ex.repsMax}`,
          A4_W - MARGIN - 12,
          y + 18,
          { align: 'right' }
        );

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        setText(pdf, C.textDim);
        pdf.text(
          `RIR ${ex.rir} · ${ex.restSeconds}s`,
          A4_W - MARGIN - 12,
          y + 30,
          { align: 'right' }
        );

        y += 46;
      });
    }

    y += 12;
  });

  drawFooters(pdf);
  return pdf;
}