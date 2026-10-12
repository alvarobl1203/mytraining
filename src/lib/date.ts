/** Devuelve YYYY-MM-DD usando el huso horario LOCAL (no UTC). */
export function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocalIso(): string {
  return localIsoDate(new Date());
}

/** Convierte "YYYY-MM-DD" a un Date a medianoche LOCAL. */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Lunes = 0, Domingo = 6. */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Devuelve el nombre del día (Lunes, Martes...). */
export function weekdayName(idx: number): string {
  return (
    ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][
      idx
    ] ?? ''
  );
}