// scripts/backfill-involvement.mjs
// Uso: node scripts/backfill-involvement.mjs > scripts/backfill.sql
// Luego pega el contenido de backfill.sql en Supabase SQL Editor

import { writeFileSync } from 'node:fs';
import { MUSCLE_INVOLVEMENT_MAP } from '../src/lib/muscleInvolvement.ts';

const statements = [];

// 1. Ejercicios con mapa específico
for (const [name, involvement] of Object.entries(MUSCLE_INVOLVEMENT_MAP)) {
  const esc = name.replace(/'/g, "''");
  const json = JSON.stringify(involvement).replace(/'/g, "''");
  statements.push(
    `update public.exercises
   set muscle_involvement = '${json}'::jsonb
 where name = '${esc}';`
  );
}

// 2. Fallback para ejercicios sin mapa: primary 1.0 + secondary 0.5
// Se hace en SQL porque necesitamos acceder a los arrays
statements.push(`
-- Fallback: primario 1.0 + secundarios 0.5 para los que no están en el mapa
update public.exercises e
   set muscle_involvement = sub.involvement
  from (
    select
      e2.id,
      (
        select jsonb_object_agg(m, 1.0)
          from unnest(e2.primary_muscles) as m
        union all
        select jsonb_object_agg(m, 0.5)
          from unnest(e2.secondary_muscles) as m
      ) as involvement
      from public.exercises e2
     where e2.muscle_involvement = '{}'::jsonb
       and coalesce(array_length(e2.primary_muscles, 1), 0) > 0
  ) sub
 where e.id = sub.id;
`);

// 3. Fallback final: usar primary_muscle (singular legacy) si aún está vacío
statements.push(`
-- Fallback final para los que aún estén vacíos (usar primary_muscle singular)
update public.exercises
   set muscle_involvement = jsonb_build_object(primary_muscle, 1.0)
 where muscle_involvement = '{}'::jsonb
   and primary_muscle is not null;

-- Verificación
select
  count(*) filter (where muscle_involvement = '{}'::jsonb) as vacios,
  count(*) as total
from public.exercises;
`);

const sql = statements.join('\n\n');
writeFileSync('./scripts/backfill.sql', sql, 'utf8');
console.log(`✅ Generado scripts/backfill.sql con ${statements.length} statements`);
console.log('Pega su contenido en Supabase SQL Editor.');