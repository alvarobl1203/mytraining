update public.exercises
   set muscle_involvement = '{"Pectoral Medio":1,"Pectoral Superior":0.5,"Pectoral Inferior":0.5,"Deltoides Anterior":0.5,"Tríceps":0.5}'::jsonb
 where name = 'Press banca con barra';

update public.exercises
   set muscle_involvement = '{"Pectoral Superior":1,"Pectoral Medio":0.5,"Deltoides Anterior":0.5,"Tríceps":0.5}'::jsonb
 where name = 'Press banca inclinado';

update public.exercises
   set muscle_involvement = '{"Deltoides Anterior":1,"Deltoides Lateral":0.5,"Tríceps":0.5,"Trapecio Superior":0.25}'::jsonb
 where name = 'Press militar con barra';

update public.exercises
   set muscle_involvement = '{"Pectoral Inferior":1,"Tríceps":0.75,"Deltoides Anterior":0.5,"Pectoral Medio":0.25}'::jsonb
 where name = 'Fondos en paralelas';

update public.exercises
   set muscle_involvement = '{"Pectoral Medio":1,"Pectoral Inferior":0.5,"Tríceps":0.5,"Deltoides Anterior":0.5,"Recto Abdominal":0.25}'::jsonb
 where name = 'Flexiones';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Romboides":0.5,"Trapecio Medio":0.5,"Bíceps":0.5,"Antebrazos":0.25}'::jsonb
 where name = 'Jalón al pecho';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Romboides":0.5,"Trapecio Inferior":0.5,"Bíceps":0.75,"Antebrazos":0.5}'::jsonb
 where name = 'Dominadas';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Romboides":0.75,"Trapecio Medio":0.5,"Trapecio Inferior":0.5,"Bíceps":0.5,"Erector Espinal":0.25}'::jsonb
 where name = 'Remo con barra';

update public.exercises
   set muscle_involvement = '{"Deltoides Posterior":1,"Trapecio Medio":0.75,"Trapecio Inferior":0.5,"Infraespinoso":0.5}'::jsonb
 where name = 'Face pulls';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":0.75,"Isquiosurales":0.5,"Erector Espinal":0.5,"Aductores":0.5,"Gemelos":0.25,"Recto Abdominal":0.25}'::jsonb
 where name = 'Sentadilla con barra';

update public.exercises
   set muscle_involvement = '{"Erector Espinal":1,"Glúteos":1,"Isquiosurales":1,"Dorsal Ancho":0.5,"Trapecio Superior":0.5,"Antebrazos":0.75,"Cuádriceps":0.5}'::jsonb
 where name = 'Peso muerto convencional';

update public.exercises
   set muscle_involvement = '{"Isquiosurales":1,"Glúteos":0.75,"Erector Espinal":0.75,"Antebrazos":0.5}'::jsonb
 where name = 'Peso muerto rumano';

update public.exercises
   set muscle_involvement = '{"Glúteos":1,"Isquiosurales":0.5,"Cuádriceps":0.25}'::jsonb
 where name = 'Hip thrust';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":0.5,"Isquiosurales":0.5}'::jsonb
 where name = 'Prensa de piernas (leg press)';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":0.75,"Isquiosurales":0.5,"Aductores":0.5}'::jsonb
 where name = 'Zancadas búlgaras';

update public.exercises
   set muscle_involvement = '{"Bíceps":1,"Braquial":0.75,"Antebrazos":0.5}'::jsonb
 where name = 'Curl de bíceps con mancuernas';

update public.exercises
   set muscle_involvement = '{"Braquial":1,"Bíceps":0.75,"Antebrazos":0.5}'::jsonb
 where name = 'Curl martillo';

update public.exercises
   set muscle_involvement = '{"Tríceps":1,"Antebrazos":0.25}'::jsonb
 where name = 'Extensión de tríceps en polea';

update public.exercises
   set muscle_involvement = '{"Tríceps":1,"Antebrazos":0.25}'::jsonb
 where name = 'Press francés';

update public.exercises
   set muscle_involvement = '{"Deltoides Lateral":1,"Trapecio Superior":0.5}'::jsonb
 where name = 'Elevaciones laterales';

update public.exercises
   set muscle_involvement = '{"Deltoides Posterior":1,"Trapecio Medio":0.5,"Romboides":0.5}'::jsonb
 where name = 'Pájaros con mancuernas';

update public.exercises
   set muscle_involvement = '{"Pectoral Medio":1,"Pectoral Superior":0.25,"Pectoral Inferior":0.25}'::jsonb
 where name = 'Pec deck (contractor)';

update public.exercises
   set muscle_involvement = '{"Pectoral Medio":1,"Pectoral Superior":0.5,"Deltoides Anterior":0.25}'::jsonb
 where name = 'Aperturas con mancuernas';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Bíceps":0.75,"Tríceps":0.75,"Pectoral Inferior":0.5,"Recto Abdominal":0.5}'::jsonb
 where name = 'Muscle-up';

update public.exercises
   set muscle_involvement = '{"Recto Abdominal":1,"Transverso Abdominal":1,"Oblicuos":0.5}'::jsonb
 where name = 'Plancha abdominal';

update public.exercises
   set muscle_involvement = '{"Recto Abdominal":1,"Oblicuos":0.5}'::jsonb
 where name = 'Abdominales (crunch)';

update public.exercises
   set muscle_involvement = '{"Recto Abdominal":1,"Oblicuos":0.75,"Dorsal Ancho":0.5,"Antebrazos":0.5}'::jsonb
 where name = 'Toes-to-bar';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":0.75,"Pectoral Medio":0.5,"Deltoides Anterior":0.5,"Recto Abdominal":0.5}'::jsonb
 where name = 'Sled Push';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Bíceps":0.75,"Isquiosurales":0.75,"Glúteos":0.5,"Antebrazos":0.5}'::jsonb
 where name = 'Sled Pull';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Pectoral Medio":0.5,"Glúteos":0.5,"Recto Abdominal":0.5}'::jsonb
 where name = 'Burpee Broad Jump';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Deltoides Anterior":0.75,"Glúteos":0.5,"Recto Abdominal":0.5}'::jsonb
 where name = 'Wall Balls';

update public.exercises
   set muscle_involvement = '{"Antebrazos":1,"Trapecio Superior":0.75,"Recto Abdominal":0.75,"Cuádriceps":0.5}'::jsonb
 where name = 'Farmers Carry';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Cuádriceps":0.75,"Isquiosurales":0.75,"Bíceps":0.5,"Glúteos":0.5}'::jsonb
 where name = 'Rowing (remo ergómetro)';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Tríceps":0.75,"Recto Abdominal":0.5,"Cuádriceps":0.5}'::jsonb
 where name = 'SkiErg';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":1,"Trapecio Superior":1,"Deltoides Anterior":0.75,"Erector Espinal":0.75,"Isquiosurales":0.5}'::jsonb
 where name = 'Snatch';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":1,"Trapecio Superior":0.75,"Deltoides Anterior":0.75,"Tríceps":0.5,"Erector Espinal":0.5}'::jsonb
 where name = 'Clean & Jerk';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":0.75,"Deltoides Anterior":0.75,"Tríceps":0.5,"Recto Abdominal":0.5}'::jsonb
 where name = 'Thruster';

update public.exercises
   set muscle_involvement = '{"Dorsal Ancho":1,"Bíceps":0.75,"Recto Abdominal":0.5,"Romboides":0.5}'::jsonb
 where name = 'Kipping Pull-up';

update public.exercises
   set muscle_involvement = '{"Cuádriceps":1,"Glúteos":0.75,"Gemelos":0.75,"Isquiosurales":0.5}'::jsonb
 where name = 'Box Jump';

update public.exercises
   set muscle_involvement = '{"Deltoides Anterior":1,"Tríceps":0.75,"Trapecio Superior":0.5,"Recto Abdominal":0.5}'::jsonb
 where name = 'Handstand Push-up';

update public.exercises
   set muscle_involvement = '{"Gemelos":1,"Tibial Anterior":0.75,"Antebrazos":0.5,"Recto Abdominal":0.25}'::jsonb
 where name = 'Double-unders';


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
