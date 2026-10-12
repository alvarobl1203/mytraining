import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { MuscleGroup } from '../types';
import type { MuscleRecovery, MuscleStatus } from '../hooks/useMuscleRecovery';

const STATUS_COLORS: Record<MuscleStatus, string> = {
  fatigued: '#f43f5e',
  recovering: '#a855f7',
  fresh: '#3b82f6',
  untrained: '#3f3f46',
};

const STATUS_LABEL: Record<MuscleStatus, string> = {
  fatigued: 'Fatigado < 24h',
  recovering: 'Recuperando 24–48h',
  fresh: 'Fresco > 48h',
  untrained: 'Sin datos',
};

type Side = 'front' | 'back';

interface Zone {
  muscle: MuscleGroup;
  label: string;
  d: string;
}

interface Region {
  region: string;
  muscles: MuscleGroup[];
}

// ===========================================================================
// FRONT — geometría anatómica realista. Eje central X=100.
// ===========================================================================
const FRONT_ZONES: Zone[] = [
  // ----- Hombro (deltoides anterior) -----
 {
  muscle: 'Deltoides Anterior',
  label: 'Deltoides Ant.',
  d: `M 87,81
      C 82,77 75,75 69,77
      C 62,80 57,86 55,94
      C 53,102 54,110 58,116
      C 61,120 66,122 71,120
      C 76,117 82,110 86,102
      C 89,95 89,87 87,81
      Z`,
},
  // ----- Hombro (deltoides lateral) -----
  {
    muscle: 'Deltoides Lateral',
    label: 'Deltoides Lat.',
    d: `M 64,92
        C 56,94 50,102 48,114
        C 46,126 48,138 54,142
        C 60,146 66,142 70,136
        C 74,130 76,120 76,110
        L 72,98
        C 70,94 68,92 64,92 Z`,
  },
  // ----- Pectoral Superior (porción clavicular) -----
  {
    muscle: 'Pectoral Superior',
    label: 'Pectoral Sup.',
    d: `M 90,78
        C 84,77 78,80 73,85
        C 70,89 68,94 68,99
        C 72,101 77,99 82,97
        C 86,96 89,96 90,96
        Z`,
  },
  // ----- Pectoral Medio (porción esternal) -----
  {
    muscle: 'Pectoral Medio',
    label: 'Pectoral Med.',
    d: `M 90,96
        C 85,97 79,99 74,103
        C 71,106 69,111 69,116
        C 73,118 78,117 83,115
        C 87,114 89,113 90,112
        Z`,
  },
  // ----- Pectoral Inferior (porción costal) -----
  {
    muscle: 'Pectoral Inferior',
    label: 'Pectoral Inf.',
    d: `M 90,113
        C 87,114 83,116 79,120
        C 75,124 72,129 71,135
        C 74,139 79,140 84,138
        C 87,137 89,135 90,133
        Z`,
  },
  // ----- Bíceps -----
  {
    muscle: 'Bíceps',
    label: 'Bíceps',
    d: `M 64,116
        C 58,116 54,122 54,130
        L 54,168
        C 54,176 60,180 66,178
        C 70,176 74,172 74,166
        L 74,120
        C 72,117 68,116 64,116 Z`,
  },
  // ----- Antebrazos -----
  {
    muscle: 'Antebrazos',
    label: 'Antebrazos',
    d: `M 60,186
        C 54,186 50,192 50,200
        L 48,244
        C 48,252 54,256 60,254
        L 68,250
        L 68,192
        C 66,188 64,186 60,186 Z`,
  },
  // ----- Recto abdominal (3 segmentos por lado, six-pack) -----
  {
    muscle: 'Recto Abdominal',
    label: 'Recto Abd.',
    d: `M 92,166 L 100,166 L 100,186 L 92,186 Z
        M 92,189 L 100,189 L 100,211 L 92,211 Z
        M 92,214 L 100,214 L 100,258 L 92,258 Z`,
  },
  // ----- Oblicuos (curva lateral del abdomen) -----
  {
    muscle: 'Oblicuos',
    label: 'Oblicuos',
    d: `M 78,168
        C 76,180 75,204 77,228
        L 82,254
        L 88,258
        L 90,258
        L 90,166
        L 80,166
        C 79,166 78,167 78,168 Z`,
  },
  // ----- Transverso (banda inferior) -----
  {
    muscle: 'Transverso Abdominal',
    label: 'Transverso',
    d: `M 80,256 Q 88,262 100,258 L 100,268 Q 90,270 80,264 Z`,
  },
  // ----- Cuádriceps (cabeza lateral + vasto medial + recto femoral) -----
  {
    muscle: 'Cuádriceps',
    label: 'Cuádriceps',
    d: `M 82,290
        C 78,290 76,294 76,300
        L 76,384
        C 76,390 80,392 84,392
        L 94,392
        L 94,290
        C 92,289 86,289 82,290 Z
        M 94,292 L 100,292 L 100,388 L 94,388 Z`,
  },
  // ----- Aductores -----
  {
    muscle: 'Aductores',
    label: 'Aductores',
    d: `M 100,300 L 108,300 L 108,378 L 100,378 Z`,
  },
  // ----- Abductores -----
  {
    muscle: 'Abductores',
    label: 'Abductores',
    d: `M 76,298
        C 72,298 70,302 70,308
        L 72,378
        L 76,378
        L 76,290 Z`,
  },
  // ----- Tibial anterior -----
  {
    muscle: 'Tibial Anterior',
    label: 'Tibial Ant.',
    d: `M 84,408
        C 80,408 78,412 78,416
        L 80,456
        L 92,456
        L 92,416
        C 92,412 90,408 86,408
        Z
        M 108,408
        C 104,408 102,412 102,416
        L 100,456
        L 112,456
        L 114,416
        C 114,412 112,408 108,408 Z`,
  },
];

// ===========================================================================
// BACK — vista trasera
// ===========================================================================
const BACK_ZONES: Zone[] = [
  // ----- Trapecio superior -----
  {
    muscle: 'Trapecio Superior',
    label: 'Trapecio Sup.',
    d: `M 76,76
        C 68,78 60,86 56,98
        L 56,110
        L 96,116
        L 100,96
        L 100,80
        C 92,76 82,76 76,76 Z`,
  },
  // ----- Trapecio medio -----
  {
    muscle: 'Trapecio Medio',
    label: 'Trapecio Med.',
    d: `M 96,118 L 100,118 L 100,146 L 96,146 Z
        M 104,118 L 100,118 L 100,146 L 104,146 Z`,
  },
  // ----- Trapecio inferior -----
  {
    muscle: 'Trapecio Inferior',
    label: 'Trapecio Inf.',
    d: `M 94,148 L 100,148 L 100,180 L 94,178
        C 92,168 91,156 94,148 Z
        M 106,148 L 100,148 L 100,180 L 106,178
        C 108,168 109,156 106,148 Z`,
  },
  // ----- Romboides -----
  {
    muscle: 'Romboides',
    label: 'Romboides',
    d: `M 84,114 L 96,116 L 96,142 L 84,140 Z
        M 116,114 L 104,116 L 104,142 L 116,140 Z`,
  },
  // ----- Infraespinoso (manguito rotador posterior) -----
  {
    muscle: 'Infraespinoso',
    label: 'Infraespinoso',
    d: `M 68,112 L 80,114 L 80,136 L 68,132 Z
        M 132,112 L 120,114 L 120,136 L 132,132 Z`,
  },
  // ----- Deltoides posterior -----
  {
    muscle: 'Deltoides Posterior',
    label: 'Deltoides Post.',
    d: `M 64,92
        C 56,94 50,102 48,114
        C 46,126 48,138 54,142
        C 60,146 66,142 70,136
        C 74,130 76,120 76,110
        L 72,98
        C 70,94 68,92 64,92 Z
        M 136,92
        C 144,94 150,102 152,114
        C 154,126 152,138 146,142
        C 140,146 134,142 130,136
        C 126,130 124,120 124,110
        L 128,98
        C 130,94 132,92 136,92 Z`,
  },
  // ----- Dorsal ancho (la V) -----
  {
    muscle: 'Dorsal Ancho',
    label: 'Dorsal Ancho',
    d: `M 74,148
        C 64,166 60,192 62,218
        L 68,244
        C 78,252 94,252 100,244
        L 100,148 Z
        M 126,148
        C 136,166 140,192 138,218
        L 132,244
        C 122,252 106,252 100,244
        L 100,148 Z`,
  },
  // ----- Erector espinal -----
  {
    muscle: 'Erector Espinal',
    label: 'Erector Espinal',
    d: `M 96,180 L 100,180 L 100,262 L 96,262 Z
        M 104,180 L 100,180 L 100,262 L 104,262 Z`,
  },
  // ----- Tríceps -----
  {
    muscle: 'Tríceps',
    label: 'Tríceps',
    d: `M 64,116
        C 58,116 54,122 54,130
        L 54,170
        C 54,178 60,182 66,180
        C 70,178 74,174 74,168
        L 74,120
        C 72,117 68,116 64,116 Z
        M 136,116
        C 142,116 146,122 146,130
        L 146,170
        C 146,178 140,182 134,180
        C 130,178 126,174 126,168
        L 126,120
        C 128,117 132,116 136,116 Z`,
  },
  // ----- Antebrazos (un solo zone espejado, solo izquierdo) -----
  {
    muscle: 'Antebrazos',
    label: 'Antebrazos',
    d: `M 60,186
        C 54,186 50,192 50,200
        L 48,244
        C 48,252 54,256 60,254
        L 68,250
        L 68,192
        C 66,188 64,186 60,186 Z`,
  },
  // ----- Glúteos (forma redondeada) -----
  {
    muscle: 'Glúteos',
    label: 'Glúteos',
    d: `M 74,272
        C 70,280 70,294 74,306
        C 82,316 100,316 100,304
        L 100,272 Z
        M 126,272
        C 130,280 130,294 126,306
        C 118,316 100,316 100,304
        L 100,272 Z`,
  },
  // ----- Isquiosurales -----
  {
    muscle: 'Isquiosurales',
    label: 'Isquiosurales',
    d: `M 76,318 L 100,318 L 100,404 L 76,404 Z
        M 124,318 L 100,318 L 100,404 L 124,404 Z`,
  },
  // ----- Gemelos (con medial y lateral sugeridos) -----
  {
    muscle: 'Gemelos',
    label: 'Gemelos',
    d: `M 82,414
        C 76,414 74,420 74,426
        L 78,464
        L 96,464
        L 96,426
        C 96,420 92,414 88,414
        Z
        M 118,414
        C 124,414 126,420 126,426
        L 122,464
        L 104,464
        L 104,426
        C 104,420 108,414 112,414
        Z`,
  },
];

// ===========================================================================
// Agrupación por regiones anatómicas para la lista inferior
// ===========================================================================
const FRONT_REGIONS: Region[] = [
  {
    region: 'Hombro',
    muscles: ['Deltoides Anterior', 'Deltoides Lateral'],
  },
  {
    region: 'Pecho',
    muscles: ['Pectoral Superior', 'Pectoral Medio', 'Pectoral Inferior'],
  },
  { region: 'Brazos', muscles: ['Bíceps', 'Antebrazos'] },
  {
    region: 'Core',
    muscles: ['Recto Abdominal', 'Oblicuos', 'Transverso Abdominal'],
  },
  { region: 'Pierna', muscles: ['Cuádriceps', 'Aductores', 'Abductores'] },
  { region: 'Pantorrilla', muscles: ['Tibial Anterior'] },
];

const BACK_REGIONS: Region[] = [
  {
    region: 'Trapecio',
    muscles: ['Trapecio Superior', 'Trapecio Medio', 'Trapecio Inferior'],
  },
  { region: 'Romboides / Rotador', muscles: ['Romboides', 'Infraespinoso'] },
  { region: 'Hombro', muscles: ['Deltoides Posterior'] },
  { region: 'Dorsal', muscles: ['Dorsal Ancho', 'Erector Espinal'] },
  { region: 'Brazos', muscles: ['Tríceps', 'Antebrazos'] },
  { region: 'Glúteo', muscles: ['Glúteos'] },
  { region: 'Pierna', muscles: ['Isquiosurales'] },
  { region: 'Pantorrilla', muscles: ['Gemelos'] },
];

// ===========================================================================
// Componente
// ===========================================================================
export function BodyHeatmap({ data }: { data: MuscleRecovery[] }) {
  const [side, setSide] = useState<Side>('front');
  const [selected, setSelected] = useState<MuscleGroup | null>(null);

  const statusMap = useMemo(() => {
    const m = new Map<MuscleGroup, MuscleStatus>();
    data.forEach((d) => m.set(d.muscle as MuscleGroup, d.status));
    return m;
  }, [data]);

  const counts = useMemo(() => {
    const c = { fatigued: 0, recovering: 0, fresh: 0, untrained: 0 };
    data.forEach((d) => {
      c[d.status] += 1;
    });
    return c;
  }, [data]);

  const zones = side === 'front' ? FRONT_ZONES : BACK_ZONES;
  const regions = side === 'front' ? FRONT_REGIONS : BACK_REGIONS;

  const selectedStatus = selected
    ? statusMap.get(selected) ?? 'untrained'
    : null;

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
      {/* Cabecera */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Mapa de recuperación (72h)
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-600">
            {side === 'front' ? 'Vista frontal' : 'Vista trasera'}
          </p>
        </div>
        <button
          onClick={() => {
            setSide((s) => (s === 'front' ? 'back' : 'front'));
            setSelected(null);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          <ArrowLeftRight size={12} />
          Girar
        </button>
      </div>

      {/* Contadores */}
      <div className="mb-4 grid grid-cols-4 gap-1.5">
        <Counter label="Fatigados" value={counts.fatigued} color="bg-red-500" />
        <Counter
          label="Recuperando"
          value={counts.recovering}
          color="bg-purple-500"
        />
        <Counter label="Frescos" value={counts.fresh} color="bg-blue-500" />
        <Counter
          label="Sin datos"
          value={counts.untrained}
          color="bg-zinc-700"
        />
      </div>

      {/* SVG anatómico */}
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 200 480"
          className="h-[400px] w-auto select-none"
          onMouseLeave={() => setSelected(null)}
        >
          <defs>
            <linearGradient id="skinBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1e22" />
              <stop offset="100%" stopColor="#141417" />
            </linearGradient>
            <filter
              id="zoneGlow"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Silueta base con proporciones anatómicas */}
          <g
            fill="url(#skinBase)"
            stroke="#2a2a30"
            strokeWidth="0.8"
            strokeLinejoin="round"
          >
            {/* Cabeza */}
            <ellipse cx="100" cy="42" rx="20" ry="24" />
            {/* Cuello */}
            <rect x="88" y="62" width="24" height="18" rx="8" />
            {/* Torso (hombros anchos, cintura estrecha) */}
            <path d="M 64,80
                     C 64,78 72,74 84,72
                     L 116,72
                     C 128,74 136,78 136,80
                     L 138,140
                     C 138,180 132,224 126,262
                     L 74,262
                     C 68,224 62,180 62,140 Z" />
            {/* Brazo izquierdo (bíceps + antebrazo con curvas reales) */}
            <path d="M 66,96
                     C 58,96 52,108 50,124
                     L 48,180
                     C 48,188 54,192 60,190
                     L 72,182
                     L 72,104
                     C 72,100 70,96 66,96 Z" />
            <path d="M 48,194
                     L 46,250
                     C 46,258 52,262 58,260
                     L 66,256
                     L 66,196 Z" />
            <ellipse cx="58" cy="268" rx="10" ry="12" />
            {/* Brazo derecho (espejo) */}
            <path d="M 134,96
                     C 142,96 148,108 150,124
                     L 152,180
                     C 152,188 146,192 140,190
                     L 128,182
                     L 128,104
                     C 128,100 130,96 134,96 Z" />
            <path d="M 152,194
                     L 154,250
                     C 154,258 148,262 142,260
                     L 134,256
                     L 134,196 Z" />
            <ellipse cx="142" cy="268" rx="10" ry="12" />
            {/* Muslo izquierdo (cuádriceps con volumen) */}
            <path d="M 76,264
                     C 72,264 70,270 70,278
                     L 74,396
                     C 74,402 78,404 84,404
                     L 96,404
                     C 98,404 100,402 100,398
                     L 100,264 Z" />
            {/* Muslo derecho */}
            <path d="M 124,264
                     C 128,264 130,270 130,278
                     L 126,396
                     C 126,402 122,404 116,404
                     L 104,404
                     C 102,404 100,402 100,398
                     L 100,264 Z" />
            {/* Gemelo izquierdo (pantorrilla con curva) */}
            <path d="M 78,414
                     C 74,414 72,420 72,428
                     L 76,456
                     L 96,456
                     L 96,428
                     C 96,420 92,414 88,414 Z" />
            <path d="M 122,414
                     C 126,414 128,420 128,428
                     L 124,456
                     L 104,456
                     L 104,428
                     C 104,420 108,414 112,414 Z" />
            {/* Pies */}
            <rect x="78" y="462" width="20" height="10" rx="3" />
            <rect x="102" y="462" width="20" height="10" rx="3" />
          </g>

          {/* Zonas musculares - lado izquierdo completo */}
          <g>
            {zones.map((z) => (
              <ZonePath
                key={`L-${z.muscle}`}
                zone={z}
                status={statusMap.get(z.muscle) ?? 'untrained'}
                selected={selected === z.muscle}
                onSelect={setSelected}
                mirror={false}
              />
            ))}
          </g>

          {/* Zonas musculares - lado derecho espejado */}
          <g transform="translate(200,0) scale(-1,1)">
            {zones.map((z) => (
              <ZonePath
                key={`R-${z.muscle}`}
                zone={z}
                status={statusMap.get(z.muscle) ?? 'untrained'}
                selected={selected === z.muscle}
                onSelect={setSelected}
                mirror
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Panel de detalle del seleccionado */}
      {selected && selectedStatus && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
          <span
            className="h-3 w-3 shrink-0 rounded-sm"
            style={{ background: STATUS_COLORS[selectedStatus] }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {selected}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              {STATUS_LABEL[selectedStatus]}
            </p>
          </div>
        </div>
      )}

      {/* Lista agrupada por regiones anatómicas */}
      <div className="mt-4 space-y-3">
        {regions.map((r) => (
          <div key={r.region}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {r.region}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {r.muscles.map((m) => {
                const st = statusMap.get(m) ?? 'untrained';
                const isSel = selected === m;
                // Buscar el label bonito en las zones
                const zone = zones.find((z) => z.muscle === m);
                const label = zone?.label ?? m;
                return (
                  <button
                    key={m}
                    onClick={() => setSelected(isSel ? null : m)}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-all duration-150 ${
                      isSel
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[st] }}
                    />
                    <span className="truncate text-[11px] font-medium text-zinc-200">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap gap-3 border-t border-zinc-800/60 pt-3 text-[10px]">
        {(
          ['fatigued', 'recovering', 'fresh', 'untrained'] as MuscleStatus[]
        ).map((st) => (
          <span key={st} className="flex items-center gap-1.5 text-zinc-500">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: STATUS_COLORS[st] }}
            />
            {STATUS_LABEL[st]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Sub-componentes
// ===========================================================================
function ZonePath({
  zone,
  status,
  selected,
  onSelect,
  mirror,
}: {
  zone: Zone;
  status: MuscleStatus;
  selected: boolean;
  onSelect: (m: MuscleGroup) => void;
  mirror: boolean;
}) {
  const color = STATUS_COLORS[status];
  const baseOpacity = status === 'untrained' ? 0.35 : 0.82;

  return (
    <path
      d={zone.d}
      fill={color}
      fillOpacity={selected ? 0.98 : baseOpacity}
      stroke={selected ? '#22d3ee' : '#0a0a0a'}
      strokeWidth={selected ? 2 : 0.7}
      filter={selected ? 'url(#zoneGlow)' : undefined}
      style={{
        cursor: 'pointer',
        transition: 'fill-opacity 150ms ease, stroke 150ms ease',
      }}
      onMouseEnter={() => onSelect(zone.muscle)}
      onClick={() => onSelect(zone.muscle)}
      data-mirror={mirror}
    />
  );
}

function Counter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-2 text-center">
      <div className="mb-1 flex items-center justify-center gap-1">
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <span className="text-[9px] uppercase tracking-wide text-zinc-500">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}