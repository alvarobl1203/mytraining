// ===========================================================================
// MyTraining — Iconos anatómicos de regiones musculares (v2)
// ===========================================================================
// Estilo unificado:
//   - viewBox 0 0 32 32 (más resolución que v1).
//   - Silueta del cuerpo (fill opacity 0.12-0.20) + músculo destacado.
//   - currentColor.
//   - Vista frontal, posterior o 3/4 según región.
//   - aria-hidden (decorativos).
// ===========================================================================

import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number;
};

/* ---------------------------------------------------------------------------
 * Pecho — Vista frontal, dos pectorales
 * ------------------------------------------------------------------------- */
export function ChestIcon({
  size = 24,
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
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
      {/* Torso (silueta completa) */}
      <path
        d="M7 8 Q11 5 16 5 Q21 5 25 8 L26 17 Q21 18.5 16 19 Q11 18.5 6 17 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.5"
      />

      {/* Pectoral izquierdo */}
      <path
        d="M9 10 Q12 8.5 15.4 11 Q15.6 14 13.5 15.5 Q10.5 15.5 8.5 13.8 Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
      {/* Pectoral derecho */}
      <path
        d="M23 10 Q20 8.5 16.6 11 Q16.4 14 18.5 15.5 Q21.5 15.5 23.5 13.8 Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
      {/* Línea central del esternón */}
      <line x1="16" y1="9" x2="16" y2="15.5" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Espalda — Vista posterior, V del dorsal
 * ------------------------------------------------------------------------- */
export function BackIcon({
  size = 24,
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
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
      {/* Torso posterior */}
      <path
        d="M7 8 Q11 5 16 5 Q21 5 25 8 L22 20 Q19 23 16 24 Q13 23 10 20 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.5"
      />

      {/* Trapecio superior */}
      <path
        d="M11 7 Q16 6 21 7 L20 11 Q16 10 12 11 Z"
        fill="currentColor"
        fillOpacity="0.35"
      />

      {/* Dorsal ancho izquierdo (ala) */}
      <path
        d="M9.5 12 Q10 14 11 16 Q13 18.5 14.8 20.5 Q12.5 19.5 11 17.5 Q9.5 15 9.5 12 Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
      {/* Dorsal ancho derecho (ala) */}
      <path
        d="M22.5 12 Q22 14 21 16 Q19 18.5 17.2 20.5 Q19.5 19.5 21 17.5 Q22.5 15 22.5 12 Z"
        fill="currentColor"
        fillOpacity="0.4"
      />

      {/* Columna vertebral */}
      <line x1="16" y1="7" x2="16" y2="22" strokeOpacity="0.6" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Hombro — Vista 3/4, deltoides
 * ------------------------------------------------------------------------- */
export function ShoulderIcon({
  size = 24,
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
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
      {/* Cabeza */}
      <circle
        cx="20"
        cy="8"
        r="3.5"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.5"
      />

      {/* Cuello + hombro izquierdo (deltoides) */}
      <path
        d="M8 26 L8 16 Q8.5 12 12.5 11 Q16.5 10.5 18 12.5 L18 26"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeOpacity="0.5"
      />

      {/* Deltoides (redondeado) */}
      <path
        d="M8.5 16.5 Q11 11.5 16 11 Q19 11 18.5 13 Q17 14.5 15 15 Q12 15.5 11 18 Z"
        fill="currentColor"
        fillOpacity="0.45"
      />

      {/* Brazo cayendo */}
      <path d="M11 18 L11 26" strokeOpacity="0.6" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Brazos — Brazo flexionado con bíceps marcado
 * ------------------------------------------------------------------------- */
export function ArmIcon({
  size = 24,
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
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
      {/* Brazo entero (silueta) */}
      <path
        d="M9 5 Q13 4 15 7 Q17 11 17 16 Q17 19 15 21 L19 29"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.5"
      />

      {/* Bíceps (abultamiento) */}
      <path
        d="M10 8 Q13 7.5 14.5 10 Q15 13 13.5 15 Q11.5 15 10 13 Q9 10 10 8 Z"
        fill="currentColor"
        fillOpacity="0.45"
      />

      {/* Antebrazo (línea separadora) */}
      <path d="M15 16 Q16.5 15 17.5 16" strokeOpacity="0.6" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Pierna — Lateral con cuádriceps + pantorrilla
 * ------------------------------------------------------------------------- */
export function LegIcon({
  size = 24,
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
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
      {/* Pierna completa (silueta) */}
      <path
        d="M12 3 Q17 3 18 8 L18 18 Q17.5 20 16 21 L18 29 Q16 30 14.5 29 L12.5 21 Q11 20 11 18 L11 8 Q11 3 12 3 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.5"
      />

      {/* Cuádriceps (músculo anterior) */}
      <path
        d="M12 6 Q15 5.5 16.5 8 L16.5 17 Q15 19 12.5 18.5 Q11.5 17 11.5 8 Z"
        fill="currentColor"
        fillOpacity="0.45"
      />

      {/* Rodilla (línea horizontal) */}
      <line x1="11.5" y1="19" x2="17" y2="19" strokeOpacity="0.5" />

      {/* Pantorrilla (gemelo) */}
      <path
        d="M13 21 Q15 21 16 24 L15 27 Q13.5 27.5 13 26 Z"
        fill="currentColor"
        fillOpacity="0.35"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Core — Frontal, six-pack
 * ------------------------------------------------------------------------- */
export function CoreIcon({
  size = 24,
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
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
      {/* Torso */}
      <path
        d="M9 5 Q16 3.5 23 5 L23.5 26 Q16 27.5 8.5 26 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.5"
      />

      {/* Recto abdominal: 6 segmentos */}
      <rect
        x="11.5"
        y="9"
        width="3.8"
        height="4"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="16.7"
        y="9"
        width="3.8"
        height="4"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="11.5"
        y="13.8"
        width="3.8"
        height="4"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="16.7"
        y="13.8"
        width="3.8"
        height="4"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="11.5"
        y="18.6"
        width="3.8"
        height="4"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="16.7"
        y="18.6"
        width="3.8"
        height="4"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.5"
      />

      {/* Oblicuos (laterales) */}
      <path
        d="M9.5 9 Q8.5 13 9 17 L10 18 L10.5 9 Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M22.5 9 Q23.5 13 23 17 L22 18 L21.5 9 Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Mapa región → icono
 * ------------------------------------------------------------------------- */
export const REGION_ICONS = {
  Pecho: ChestIcon,
  Espalda: BackIcon,
  Hombro: ShoulderIcon,
  Brazos: ArmIcon,
  Pierna: LegIcon,
  Core: CoreIcon,
} as const;

export type RegionName = keyof typeof REGION_ICONS;