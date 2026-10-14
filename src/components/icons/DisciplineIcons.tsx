// ===========================================================================
// MyTraining — Iconos de disciplina (SVG propios)
// ===========================================================================
// Todos los iconos:
//   - viewBox 0 0 32 32, escalables.
//   - currentColor.
//   - Aceptan size, strokeWidth y className.
//   - Marcados como aria-hidden (decorativos).
// ===========================================================================

import type { SVGProps } from 'react';

type CustomIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number;
};

/* ---------------------------------------------------------------------------
 * Gym — Mancuerna
 * ------------------------------------------------------------------------- */
export function GymIcon({
  size = 24,
  strokeWidth = 1.6,
  ...rest
}: CustomIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {/* Barra central */}
      <line x1="12" y1="16" x2="20" y2="16" />

      {/* Discos izquierdos */}
      <rect
        x="4"
        y="10"
        width="2.4"
        height="12"
        rx="0.8"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <rect x="7" y="7" width="3.4" height="18" rx="1" />

      {/* Discos derechos */}
      <rect
        x="25.6"
        y="10"
        width="2.4"
        height="12"
        rx="0.8"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <rect x="21.6" y="7" width="3.4" height="18" rx="1" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Calistenia — Persona haciendo el pino (handstand)
 * ---------------------------------------------------------------------------
 * Composición anatómica (vista frontal, invertida):
 *
 *   ─ pies ─────────────── pies ─
 *      │                       │
 *      │      piernas          │
 *      │                       │
 *      ├──── cadera ───────────┤
 *     ╱                         ╲
 *    ╱        torso (ancho       ╲
 *   ╱          en hombros)        ╲
 *  ╱                               ╲
 * ╰── hombros ───── o ──── hombros ──╯
 *    │              │              │
 *    │   cabeza     │              │
 *    │   entre      │              │
 *    │   brazos     │              │
 *    │              │              │
 *   ─── manos ────────  manos ─────
 *   ═══════════════════════════════
 *              suelo
 * ------------------------------------------------------------------------- */
export function CalisteniaIcon({
  size = 24,
  strokeWidth = 1.6,
  ...rest
}: CustomIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {/* ---------- Suelo ---------- */}
      <line x1="3.5" y1="29.2" x2="28.5" y2="29.2" strokeWidth={1.8} />

      {/* ---------- Piernas ---------- */}
      {/* Muslo + pantorrilla izquierdos: una sola línea continua, ligeramente más gruesa */}
      <path d="M14 11.5 L13.7 4.6" strokeWidth={2.2} />
      {/* Muslo + pantorrilla derechos */}
      <path d="M18 11.5 L18.3 4.6" strokeWidth={2.2} />

      {/* ---------- Pies ---------- */}
      {/* Pies como pequeños rectángulos horizontales (más anchos que el tobillo) */}
      <path
        d="M12 4 L14.8 4"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d="M17.2 4 L20 4"
        strokeWidth={2.2}
        strokeLinecap="round"
      />

      {/* ---------- Torso (silueta rellena) ---------- */}
      {/* Forma trapezoidal: cadera más estrecha arriba, hombros más anchos abajo */}
      <path
        d="M13 11.2
           L12.4 19.4
           Q12.4 20.2 13.4 20.2
           L18.6 20.2
           Q19.6 20.2 19.6 19.4
           L19 11.2
           Z"
        fill="currentColor"
        fillOpacity="0.42"
      />

      {/* ---------- Cabeza (entre los brazos, más abajo que los hombros) ---------- */}
      <circle
        cx="16"
        cy="23"
        r="2.35"
        fill="currentColor"
        fillOpacity="0.28"
      />

      {/* ---------- Brazos (de hombros a manos) ---------- */}
      {/* El brazo sale desde dentro del trapecio, cerca del hombro */}
      <path d="M12.6 19.8 L11.2 27.6" strokeWidth={1.75} />
      <path d="M19.4 19.8 L20.8 27.6" strokeWidth={1.75} />

      {/* ---------- Manos (apoyadas en el suelo) ---------- */}
      {/* Elipses ligeramente más anchas que los brazos */}
      <ellipse
        cx="11"
        cy="28.2"
        rx="1.75"
        ry="0.9"
        fill="currentColor"
        stroke="none"
      />
      <ellipse
        cx="21"
        cy="28.2"
        rx="1.75"
        ry="0.9"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Cardio — Corazón con pulso
 * ------------------------------------------------------------------------- */
export function CardioIcon({
  size = 24,
  strokeWidth = 1.6,
  ...rest
}: CustomIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path
        d="M16 27 C16 27 4.5 19.8 4.5 12.5 C4.5 8.6 7.7 5.5 11.3 5.5 C13.4 5.5 15 6.9 16 8.5 C17 6.9 18.6 5.5 20.7 5.5 C24.3 5.5 27.5 8.6 27.5 12.5 C27.5 19.8 16 27 16 27 Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M7.5 15 L11 15 L12.5 11 L14.5 19 L16.5 15 L18 15 L20 12 L22 15 L24.5 15" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Todas — Tres discos apilados
 * ------------------------------------------------------------------------- */
export function AllIcon({
  size = 24,
  strokeWidth = 1.6,
  ...rest
}: CustomIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <ellipse
        cx="16"
        cy="9"
        rx="11"
        ry="3.5"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <ellipse cx="16" cy="9" rx="11" ry="3.5" />
      <path d="M5 15 Q5 18.5 16 18.5 Q27 18.5 27 15" />
      <line x1="5" y1="11" x2="5" y2="15" />
      <line x1="27" y1="11" x2="27" y2="15" />
      <path d="M5 21 Q5 24.5 16 24.5 Q27 24.5 27 21" />
      <line x1="5" y1="17" x2="5" y2="21" />
      <line x1="27" y1="17" x2="27" y2="21" />
    </svg>
  );
}