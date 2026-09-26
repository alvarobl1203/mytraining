/*
# Seed exercise catalog for MyTraining

## Purpose
Populates the `exercises` table with a comprehensive public catalog of
~146 exercises covering all major muscle groups, equipment types, and categories.

## Details
- All exercises are public: is_public = true, user_id = null
- Categories used: Fuerza, Hipertrofia, Cardio
- Equipment used: Barra, Mancuernas, Multipower (Smith), Máquina, Polea, Peso Corporal, Kettlebell, Cardio
- Muscle groups covered: Pectoral, Dorsal, Trapecio, Deltoides Anterior, Deltoides Lateral,
  Deltoides Posterior, Bíceps, Tríceps, Antebrazos, Cuádriceps, Isquiosurales, Glúteos,
  Gemelos, Core, Cardiovascular
- Instructions are brief, in Spanish, anatomically accurate
- Secondary muscles are anatomically correct per exercise
- Empty arrays use ARRAY[]::text[] for PostgreSQL compatibility
- Uses ON CONFLICT DO NOTHING to avoid duplicates

## Security
- No changes to RLS policies
- No changes to table structure
- Only inserts rows with is_public = true, user_id = null
*/

INSERT INTO exercises (name, category, primary_muscle, secondary_muscles, equipment, instructions, is_public, user_id) VALUES
-- ============ PECTORAL (14) ============
('Press Banca con Barra', 'Fuerza', 'Pectoral', ARRAY['Deltoides Anterior', 'Tríceps'], 'Barra', 'Tumbado en banco, agarra la barra al ancho de los hombros, baja controlada hasta el pecho y empuja hasta extender los brazos.', true, null),
('Press Banca con Mancuernas', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior', 'Tríceps'], 'Mancuernas', 'Tumbado en banco, baja las mancuernas en arco hasta el pecho y empuja manteniendo los codos a 45 grados.', true, null),
('Press Banca Inclinado con Barra', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior', 'Tríceps'], 'Barra', 'Banco inclinado 30-45 grados, baja la barra al esternón superior y empuja enfocando la parte alta del pectoral.', true, null),
('Press Banca Inclinado con Mancuernas', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior', 'Tríceps'], 'Mancuernas', 'Banco inclinado, baja las mancuernas con los codos abiertos y empuja contrayendo la parte alta del pecho.', true, null),
('Press Banca Declinado con Barra', 'Fuerza', 'Pectoral', ARRAY['Tríceps', 'Deltoides Anterior'], 'Barra', 'Banco declinado, baja la barra al pecho bajo y empuja enfocando la parte baja del pectoral.', true, null),
('Press Banca Declinado con Mancuernas', 'Hipertrofia', 'Pectoral', ARRAY['Tríceps', 'Deltoides Anterior'], 'Mancuernas', 'Banco declinado, baja las mancuernas al pecho bajo y empuja manteniendo el arco natural.', true, null),
('Aperturas con Mancuernas', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior'], 'Mancuernas', 'Tumbado en banco plano, abre los brazos en arco amplio con los codos ligeramente flexionados y junta contrayendo el pectoral.', true, null),
('Aperturas Inclinadas con Mancuernas', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior'], 'Mancuernas', 'Banco inclinado, abre los brazos en arco amplio y junta enfocando la parte alta del pectoral.', true, null),
('Cruce de Poleas (Chest Fly)', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior'], 'Polea', 'De pie entre dos poleas altas, cruza las manos por delante del pecho con codos ligeramente flexionados.', true, null),
('Press Banca en Multipower', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior', 'Tríceps'], 'Multipower (Smith)', 'Tumbado en banco dentro del Multipower, baja la barra controlada y empuja con trayectoria guiada.', true, null),
('Fondos en Paralelas (Pectoral)', 'Fuerza', 'Pectoral', ARRAY['Tríceps', 'Deltoides Anterior'], 'Peso Corporal', 'En paralelas, inclina el torso adelante, baja flexionando los codos hasta 90 grados y empuja hacia arriba.', true, null),
('Flexiones', 'Fuerza', 'Pectoral', ARRAY['Tríceps', 'Core', 'Deltoides Anterior'], 'Peso Corporal', 'En posición de plancha, baja el pecho hasta casi tocar el suelo manteniendo el core firme y empuja.', true, null),
('Pec Deck (Máquina)', 'Hipertrofia', 'Pectoral', ARRAY['Deltoides Anterior'], 'Máquina', 'Sentado en la máquina, junta los antebrazos acolchados contrayendo el pectoral y vuelve controlado.', true, null),
('Press Banca con Mancuernas Neutras', 'Hipertrofia', 'Pectoral', ARRAY['Tríceps', 'Deltoides Anterior'], 'Mancuernas', 'Tumbado en banco, agarra las mancuernas con palmas mirándose y empuja manteniendo los codos pegados al torso.', true, null),

-- ============ DORSAL (12) ============
('Dominadas', 'Fuerza', 'Dorsal', ARRAY['Bíceps', 'Antebrazos'], 'Peso Corporal', 'Colgado de la barra, tira del torso hacia arriba hasta superar la barbilla y baja controlado.', true, null),
('Jalón al Pecho con Polea', 'Hipertrofia', 'Dorsal', ARRAY['Bíceps', 'Antebrazos'], 'Polea', 'Sentado en la máquina, tira de la barra hacia el pecho llevando los codos atrás y apretando la espalda.', true, null),
('Jalón Tras Nuca con Polea', 'Hipertrofia', 'Dorsal', ARRAY['Bíceps'], 'Polea', 'Sentado, lleva la barra tras la nuca tirando con los codos hacia abajo y atrás.', true, null),
('Remo con Barra', 'Fuerza', 'Dorsal', ARRAY['Bíceps', 'Antebrazos', 'Trapecio'], 'Barra', 'Torso inclinado adelante, tira de la barra hacia el abdomen llevando los codos atrás y apretando las escápulas.', true, null),
('Remo con Mancuerna', 'Hipertrofia', 'Dorsal', ARRAY['Bíceps', 'Antebrazos'], 'Mancuernas', 'Apoyado en banco, tira de la mancuerna hacia la cadera llevando el codo atrás.', true, null),
('Remo con Mancuernas a Dos Manos', 'Hipertrofia', 'Dorsal', ARRAY['Bíceps', 'Antebrazos', 'Trapecio'], 'Mancuernas', 'Torso inclinado, tira de ambas mancuernas hacia las caderas apretando la espalda media.', true, null),
('Remo en Polea Baja', 'Hipertrofia', 'Dorsal', ARRAY['Bíceps', 'Antebrazos'], 'Polea', 'Sentado en la polea baja, tira de la barra hacia el abdomen llevando los codos atrás.', true, null),
('Remo en Multipower', 'Hipertrofia', 'Dorsal', ARRAY['Bíceps', 'Antebrazos'], 'Multipower (Smith)', 'Torso inclinado dentro del Multipower, tira de la barra guiada hacia el abdomen.', true, null),
('Pullover con Mancuerna', 'Hipertrofia', 'Dorsal', ARRAY['Tríceps', 'Pectoral'], 'Mancuernas', 'Tumbado, baja la mancuerna por detrás de la cabeza en arco amplio y sube contrayendo el dorsal.', true, null),
('Pullover en Polea', 'Hipertrofia', 'Dorsal', ARRAY['Tríceps'], 'Polea', 'De pie o sentado, lleva la polea por detrás de la cabeza en arco y vuelve contrayendo el dorsal.', true, null),
('Remo T-Bar', 'Hipertrofia', 'Dorsal', ARRAY['Bíceps', 'Trapecio'], 'Máquina', 'Straddling la barra T, tira hacia el pecho apretando las escápulas y baja controlado.', true, null),
('Remo Invertido', 'Fuerza', 'Dorsal', ARRAY['Bíceps', 'Core'], 'Peso Corporal', 'Colgado bajo una barra baja, tira del pecho hacia la barra manteniendo el cuerpo recto.', true, null),

-- ============ TRAPECIO (8) ============
('Encogimientos con Barra', 'Hipertrofia', 'Trapecio', ARRAY['Deltoides Lateral'], 'Barra', 'De pie, sujeta la barra y sube los hombros hacia las orejas apretando el trapecio, baja controlado.', true, null),
('Encogimientos con Mancuernas', 'Hipertrofia', 'Trapecio', ARRAY['Deltoides Lateral'], 'Mancuernas', 'De pie, sube los hombros hacia las orejas con las mancuernas y baja lento.', true, null),
('Encogimientos en Máquina', 'Hipertrofia', 'Trapecio', ARRAY[]::text[], 'Máquina', 'Sentado en la máquina de encogimientos, sube los hombros apretando el trapecio.', true, null),
('Encogimientos en Polea', 'Hipertrofia', 'Trapecio', ARRAY[]::text[], 'Polea', 'De pie junto a la polea baja, sube el hombro del lado trabajado hacia la oreja.', true, null),
('Remo al Cuello con Barra (Upright Row)', 'Fuerza', 'Trapecio', ARRAY['Deltoides Lateral', 'Bíceps'], 'Barra', 'Sujeta la barra con agarre estrecho, sube hacia el mentón llevando los codos arriba y baja controlado.', true, null),
('Remo al Cuello con Mancuernas', 'Hipertrofia', 'Trapecio', ARRAY['Deltoides Lateral', 'Bíceps'], 'Mancuernas', 'Sube las mancuernas hacia el mentón llevando los codos por encima de las manos.', true, null),
('Remo al Cuello en Polea', 'Hipertrofia', 'Trapecio', ARRAY['Deltoides Lateral', 'Bíceps'], 'Polea', 'En polea baja con agarre estrecho, sube la barra hacia el mentón llevando los codos arriba.', true, null),
('Shrug en Multipower', 'Hipertrofia', 'Trapecio', ARRAY[]::text[], 'Multipower (Smith)', 'De pie dentro del Multipower, sube los hombros hacia las orejas con la barra guiada.', true, null),

-- ============ DELTOIDES ANTERIOR (8) ============
('Press Militar con Barra', 'Fuerza', 'Deltoides Anterior', ARRAY['Tríceps', 'Trapecio'], 'Barra', 'Sentado o de pie, empuja la barra desde los hombros hasta extender los brazos encima de la cabeza.', true, null),
('Press Militar con Mancuernas', 'Hipertrofia', 'Deltoides Anterior', ARRAY['Tríceps', 'Trapecio'], 'Mancuernas', 'Sentado, empuja las mancuernas desde los hombros hasta extender los brazos arriba.', true, null),
('Press Militar en Máquina', 'Hipertrofia', 'Deltoides Anterior', ARRAY['Tríceps'], 'Máquina', 'Sentado en la máquina, empuja las manijas hacia arriba hasta extender los brazos.', true, null),
('Press Arnold', 'Hipertrofia', 'Deltoides Anterior', ARRAY['Tríceps', 'Deltoides Lateral'], 'Mancuernas', 'Sentado, sube las mancuernas girando las palmas de frente al cuerpo a frente adelante al extender.', true, null),
('Elevaciones Frontales con Mancuernas', 'Hipertrofia', 'Deltoides Anterior', ARRAY['Trapecio'], 'Mancuernas', 'De pie, sube las mancuernas al frente hasta la altura de los hombros y baja controlado.', true, null),
('Elevaciones Frontales con Polea', 'Hipertrofia', 'Deltoides Anterior', ARRAY['Trapecio'], 'Polea', 'En polea baja, sube la cuerda al frente hasta la altura de los hombros.', true, null),
('Elevaciones Frontales con Disco', 'Hipertrofia', 'Deltoides Anterior', ARRAY['Trapecio'], 'Mancuernas', 'Sujeta un disco con ambas manos, sube al frente hasta la altura de los ojos y baja lento.', true, null),
('Press Militar en Multipower', 'Hipertrofia', 'Deltoides Anterior', ARRAY['Tríceps', 'Trapecio'], 'Multipower (Smith)', 'Sentado dentro del Multipower, empuja la barra guiada desde los hombros hasta arriba.', true, null),

-- ============ DELTOIDES LATERAL (8) ============
('Elevaciones Laterales con Mancuernas', 'Hipertrofia', 'Deltoides Lateral', ARRAY['Trapecio'], 'Mancuernas', 'De pie, sube las mancuernas a los lados hasta la altura de los hombros con codos ligeramente flexionados.', true, null),
('Elevaciones Laterales con Polea', 'Hipertrofia', 'Deltoides Lateral', ARRAY['Trapecio'], 'Polea', 'En polea baja cruzada, sube la cuerda al lateral hasta la altura del hombro.', true, null),
('Elevaciones Laterales en Máquina', 'Hipertrofia', 'Deltoides Lateral', ARRAY[]::text[], 'Máquina', 'Sentado en la máquina, abre los brazos hacia los lados contrayendo el deltoide lateral.', true, null),
('Elevaciones Laterales con Kettlebell', 'Hipertrofia', 'Deltoides Lateral', ARRAY['Trapecio'], 'Kettlebell', 'De pie, sube el kettlebell al lateral hasta la altura del hombro y baja lento.', true, null),
('Elevaciones Laterales Inclinadas', 'Hipertrofia', 'Deltoides Lateral', ARRAY['Trapecio'], 'Mancuernas', 'Inclinado en banco, sube las mancuernas a los lados enfocando el deltoide lateral sin impulso.', true, null),
('Circunducciones con Mancuernas', 'Hipertrofia', 'Deltoides Lateral', ARRAY['Deltoides Anterior', 'Deltoides Posterior'], 'Mancuernas', 'De pie, dibuja círculos con las mancuernas a la altura de los hombros manteniendo tensión constante.', true, null),
('Elevaciones Laterales en Polea (Unilateral)', 'Hipertrofia', 'Deltoides Lateral', ARRAY['Trapecio'], 'Polea', 'En polea baja al lado del cuerpo, sube la cuerda al lateral con un brazo hasta la altura del hombro.', true, null),
('Press Lateral con Mancuernas', 'Hipertrofia', 'Deltoides Lateral', ARRAY['Deltoides Anterior', 'Tríceps'], 'Mancuernas', 'Sentado, sube las mancuernas en plano escapular con los codos a 90 grados y empuja arriba.', true, null),

-- ============ DELTOIDES POSTERIOR (8) ============
('Pájaros con Mancuernas (Rear Delt Fly)', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Dorsal', 'Trapecio'], 'Mancuernas', 'Inclinado adelante, abre los brazos a los lados contrayendo el deltoide posterior.', true, null),
('Pájaros en Máquina (Rear Delt)', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Dorsal'], 'Máquina', 'Sentado en la máquina inversa, abre los brazos hacia atrás contrayendo el deltoide posterior.', true, null),
('Face Pull en Polea', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Trapecio', 'Dorsal'], 'Polea', 'En polea alta con cuerda, tira hacia el rostro separando las manos y apretando la espalda alta.', true, null),
('Pájaros en Polea (Rear Delt)', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Dorsal'], 'Polea', 'En polea baja cruzada, abre el brazo hacia atrás contrayendo el deltoide posterior.', true, null),
('Aperturas Invertidas en Polea', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Dorsal', 'Trapecio'], 'Polea', 'Entre dos poleas bajas, abre los brazos hacia atrás contrayendo el deltoide posterior.', true, null),
('Elevaciones Posteriores en Banco Inclinado', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Dorsal', 'Trapecio'], 'Mancuernas', 'Tumbado boca abajo en banco inclinado, sube las mancuernas a los lados apretando el deltoide posterior.', true, null),
('Pájaros Invertidos con Kettlebell', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Dorsal'], 'Kettlebell', 'Inclinado adelante, sujeta el kettlebell con un brazo y abre hacia el lado contrayendo el deltoide posterior.', true, null),
('Remo al Rostro con Mancuernas', 'Hipertrofia', 'Deltoides Posterior', ARRAY['Trapecio', 'Deltoides Lateral'], 'Mancuernas', 'Inclinado, abre las mancuernas hacia atrás en forma de T apretando los deltoides posteriores.', true, null),

-- ============ BÍCEPS (10) ============
('Curl con Barra', 'Fuerza', 'Bíceps', ARRAY['Antebrazos'], 'Barra', 'De pie, sujeta la barra con palmas arriba, sube flexionando los codos y baja controlado sin balanceo.', true, null),
('Curl con Mancuernas', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Mancuernas', 'De pie, sube las mancuernas flexionando los codos manteniendo los codos pegados al torso.', true, null),
('Curl Martillo con Mancuernas', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Mancuernas', 'De pie, sube las mancuernas con agarre neutro manteniendo los codos fijos al torso.', true, null),
('Curl Martillo con Cuerda en Polea', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Polea', 'En polea baja con cuerda, sube con agarre neutro manteniendo los codos pegados.', true, null),
('Curl en Banco Scott con Barra', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Barra', 'Sentado en banco Scott, apoya los brazos en el pad y sube la barra aislando el bíceps.', true, null),
('Curl en Banco Scott con Mancuernas', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Mancuernas', 'Apoyado en banco Scott, sube una mancuerna a la vez aislando el bíceps sin impulso.', true, null),
('Curl Concentrado con Mancuerna', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Mancuernas', 'Sentado, apoya el codo en el muslo interior y sube la mancuerna contrayendo el bíceps.', true, null),
('Curl en Polea con Barra Recta', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Polea', 'En polea baja con barra recta, sube flexionando los codos sin balancear el torso.', true, null),
('Curl Inclinado con Mancuernas', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Mancuernas', 'Sentado en banco inclinado, baja las mancuernas en estiramiento profundo y sube contrayendo.', true, null),
('Curl Alternado con Mancuernas', 'Hipertrofia', 'Bíceps', ARRAY['Antebrazos'], 'Mancuernas', 'De pie, sube una mancuerna a la vez girando la palma hacia arriba en la subida.', true, null),

-- ============ TRÍCEPS (10) ============
('Press Francés con Barra', 'Fuerza', 'Tríceps', ARRAY['Pectoral', 'Deltoides Anterior'], 'Barra', 'Tumbado, baja la barra hacia la frente flexionando los codos y extiende volviendo a la posición inicial.', true, null),
('Press Francés con Mancuernas', 'Hipertrofia', 'Tríceps', ARRAY[]::text[], 'Mancuernas', 'Tumbado, baja las mancuernas por los lados de la cabeza y extiende los brazos.', true, null),
('Extensión de Tríceps en Polea', 'Hipertrofia', 'Tríceps', ARRAY[]::text[], 'Polea', 'De pie o sentado, extiende los brazos empujando la barra hacia abajo manteniendo los codos fijos.', true, null),
('Extensión de Tríceps con Cuerda en Polea', 'Hipertrofia', 'Tríceps', ARRAY[]::text[], 'Polea', 'En polea alta con cuerda, empuja hacia abajo separando la cuerda al final del movimiento.', true, null),
('Extensión Sobre la Cabeza con Mancuerna', 'Hipertrofia', 'Tríceps', ARRAY[]::text[], 'Mancuernas', 'Sentado o de pie, baja la mancuerna por detrás de la cabeza y sube extendiendo los brazos.', true, null),
('Fondos en Paralelas (Tríceps)', 'Fuerza', 'Tríceps', ARRAY['Pectoral', 'Deltoides Anterior'], 'Peso Corporal', 'En paralelas con torso vertical, baja flexionando los codos pegados al cuerpo y empuja hacia arriba.', true, null),
('Press de Tríceps en Banco (Close Grip)', 'Fuerza', 'Tríceps', ARRAY['Pectoral', 'Deltoides Anterior'], 'Barra', 'Tumbado, press banca con agarre estrecho manteniendo los codos pegados al torso.', true, null),
('Patada de Tríceps con Mancuerna', 'Hipertrofia', 'Tríceps', ARRAY[]::text[], 'Mancuernas', 'Inclinado adelante, extiende el brazo atrás manteniendo el codo fijo y contrae el tríceps.', true, null),
('Press Francés en Multipower', 'Hipertrofia', 'Tríceps', ARRAY[]::text[], 'Multipower (Smith)', 'Tumbado dentro del Multipower, baja la barra guiada hacia la frente y extiende.', true, null),
('Extensión de Tríceps en Máquina', 'Hipertrofia', 'Tríceps', ARRAY[]::text[], 'Máquina', 'Sentado en la máquina, empuja las manijas extendiendo los brazos y vuelve controlado.', true, null),

-- ============ ANTEBRAZOS (6) ============
('Curl de Muñecas con Barra', 'Hipertrofia', 'Antebrazos', ARRAY['Bíceps'], 'Barra', 'Sentado, apoya los antebrazos en los muslos, sube la barra flexionando las muñecas y baja lento.', true, null),
('Curl de Muñecas con Mancuernas', 'Hipertrofia', 'Antebrazos', ARRAY['Bíceps'], 'Mancuernas', 'Sentado, apoya los antebrazos en los muslos, sube las mancuernas con las muñecas y baja.', true, null),
('Curl Inverso con Barra', 'Hipertrofia', 'Antebrazos', ARRAY['Bíceps'], 'Barra', 'De pie, agarra la barra con palmas abajo, sube flexionando los codos aislando los extensores.', true, null),
('Curl Inverso con Mancuernas', 'Hipertrofia', 'Antebrazos', ARRAY['Bíceps'], 'Mancuernas', 'De pie, agarra las mancuernas con palmas abajo y sube manteniendo los codos fijos.', true, null),
('Curl de Muñecas en Banco', 'Hipertrofia', 'Antebrazos', ARRAY[]::text[], 'Mancuernas', 'Sentado con los antebrazos sobre el banco, sube y baja las mancuernas con las muñecas.', true, null),
('Extensión de Muñecas con Mancuernas', 'Hipertrofia', 'Antebrazos', ARRAY[]::text[], 'Mancuernas', 'Sentado, abre y cierra las muñecas bajando y subiendo las mancuernas con los antebrazos apoyados.', true, null),

-- ============ CUÁDRICEPS (13) ============
('Sentadilla con Barra', 'Fuerza', 'Cuádriceps', ARRAY['Glúteos', 'Core'], 'Barra', 'Barra en la espalda, baja flexionando las rodillas hasta 90 grados manteniendo el core firme y sube.', true, null),
('Sentadilla Frontal con Barra', 'Fuerza', 'Cuádriceps', ARRAY['Glúteos', 'Core'], 'Barra', 'Barra en la parte frontal de los hombros, baja manteniendo el torso vertical y sube empujando con los cuádriceps.', true, null),
('Sentadilla con Mancuernas', 'Hipertrofia', 'Cuádriceps', ARRAY['Glúteos', 'Core'], 'Mancuernas', 'Mancuernas en los hombros, baja flexionando las rodillas y sube manteniendo el pecho arriba.', true, null),
('Sentadilla en Multipower', 'Hipertrofia', 'Cuádriceps', ARRAY['Glúteos', 'Core'], 'Multipower (Smith)', 'Barra guiada en los hombros, baja en trayectoria recta y sube enfocando los cuádriceps.', true, null),
('Sentadilla en Máquina (Hack)', 'Hipertrofia', 'Cuádriceps', ARRAY['Glúteos'], 'Máquina', 'En la máquina Hack, baja con la espalda apoyada y sube empujando con los cuádriceps.', true, null),
('Prensa de Piernas', 'Fuerza', 'Cuádriceps', ARRAY['Glúteos', 'Isquiosurales'], 'Máquina', 'Sentado en la prensa, empuja la plataforma extendiendo las piernas sin bloquear las rodillas.', true, null),
('Extensión de Cuádriceps en Máquina', 'Hipertrofia', 'Cuádriceps', ARRAY[]::text[], 'Máquina', 'Sentado, extiende las piernas empujando la almohadilla y contrae los cuádriceps arriba.', true, null),
('Zancadas con Mancuernas', 'Hipertrofia', 'Cuádriceps', ARRAY['Glúteos', 'Isquiosurales'], 'Mancuernas', 'De pie, da un paso adelante y baja la rodilla trasera hasta casi tocar el suelo, sube y alterna.', true, null),
('Zancadas con Barra', 'Fuerza', 'Cuádriceps', ARRAY['Glúteos', 'Isquiosurales'], 'Barra', 'Barra en la espalda, da un paso adelante bajando la rodilla trasera y sube alternando piernas.', true, null),
('Sentadilla Búlgara con Mancuernas', 'Hipertrofia', 'Cuádriceps', ARRAY['Glúteos', 'Isquiosurales'], 'Mancuernas', 'Pie trasero elevado en banco, baja con la pierna delantera hasta 90 grados y sube.', true, null),
('Sentadilla Sissy', 'Fuerza', 'Cuádriceps', ARRAY['Core'], 'Peso Corporal', 'De pie, inclínate atrás flexionando las rodillas manteniendo las caderas alineadas y sube.', true, null),
('Step-ups con Mancuernas', 'Hipertrofia', 'Cuádriceps', ARRAY['Glúteos', 'Isquiosurales'], 'Mancuernas', 'Sube a un cajón empujando con la pierna de apoyo y baja controlado alternando piernas.', true, null),
('Sentadilla Goblet con Kettlebell', 'Hipertrofia', 'Cuádriceps', ARRAY['Glúteos', 'Core'], 'Kettlebell', 'Sostén el kettlebell al pecho con ambas manos, baja en sentadilla profunda y sube.', true, null),

-- ============ ISQUIOSURALES (10) ============
('Peso Muerto Rumano con Barra', 'Fuerza', 'Isquiosurales', ARRAY['Glúteos', 'Dorsal', 'Trapecio'], 'Barra', 'Piernas ligeramente flexionadas, baja la barra por las piernas empujando la cadera atrás y sube extendiendo.', true, null),
('Peso Muerto Rumano con Mancuernas', 'Hipertrofia', 'Isquiosurales', ARRAY['Glúteos', 'Dorsal'], 'Mancuernas', 'Baja las mancuernas por las piernas empujando la cadera atrás y sube extendiendo la cadera.', true, null),
('Curl de Isquiosurales en Máquina', 'Hipertrofia', 'Isquiosurales', ARRAY[]::text[], 'Máquina', 'Tumbado o sentado en la máquina, flexiona las piernas llevando la almohadilla hacia los glúteos.', true, null),
('Curl de Isquiosurales con Mancuernas', 'Hipertrofia', 'Isquiosurales', ARRAY[]::text[], 'Mancuernas', 'Tumbado boca abajo, sujeta una mancuerna entre los pies y flexiona las rodillas.', true, null),
('Peso Muerto con Piernas Rectas con Barra', 'Fuerza', 'Isquiosurales', ARRAY['Glúteos', 'Dorsal', 'Trapecio'], 'Barra', 'Piernas rectas, baja la barra manteniendo la espalda neutra y sube extendiendo la cadera.', true, null),
('Good Morning con Barra', 'Fuerza', 'Isquiosurales', ARRAY['Glúteos', 'Dorsal', 'Core'], 'Barra', 'Barra en la espalda, inclina el torso adelante empujando la cadera atrás manteniendo la espalda recta.', true, null),
('Curl de Isquiosurales en Polea', 'Hipertrofia', 'Isquiosurales', ARRAY[]::text[], 'Polea', 'En polea baja con correa en el tobillo, flexiona la pierna llevando el talón hacia el glúteo.', true, null),
('Peso Muerto Rumano a Una Pierna con Mancuerna', 'Fuerza', 'Isquiosurales', ARRAY['Glúteos', 'Core'], 'Mancuernas', 'Apoyado en una pierna, baja la mancuerna empujando la cadera atrás y sube extendiendo.', true, null),
('Nordic Curl', 'Fuerza', 'Isquiosurales', ARRAY['Glúteos'], 'Peso Corporal', 'De rodillas con los tobillos fijos, baja el torso lentamente usando los isquiosurales y sube.', true, null),
('Extensión de Isquiosurales en Banco Inclinado', 'Hipertrofia', 'Isquiosurales', ARRAY[]::text[], 'Máquina', 'Tumbado en banco inclinado, flexiona las piernas llevando los talones hacia los glúteos.', true, null),

-- ============ GLÚTEOS (11) ============
('Hip Thrust con Barra', 'Fuerza', 'Glúteos', ARRAY['Isquiosurales', 'Cuádriceps'], 'Barra', 'Espalda apoyada en banco, empuja la barra hacia arriba extendiendo la cadera y aprieta el glúteo.', true, null),
('Hip Thrust con Mancuernas', 'Hipertrofia', 'Glúteos', ARRAY['Isquiosurales'], 'Mancuernas', 'Espalda apoyada en banco, empuja la mancuerna extendiendo la cadera y aprieta arriba.', true, null),
('Puente de Glúteos con Barra', 'Hipertrofia', 'Glúteos', ARRAY['Isquiosurales', 'Core'], 'Barra', 'Tumbado, empuja la barra hacia arriba elevando la cadera y aprieta el glúteo arriba.', true, null),
('Patada de Glúteo en Polea', 'Hipertrofia', 'Glúteos', ARRAY['Isquiosurales'], 'Polea', 'En polea baja con correa en el tobillo, patea la pierna atrás extendiendo la cadera.', true, null),
('Patada de Glúteo en Máquina', 'Hipertrofia', 'Glúteos', ARRAY['Isquiosurales'], 'Máquina', 'Sentado en la máquina, patea la pierna atrás extendiendo la cadera y apretando el glúteo.', true, null),
('Sentadilla Sumo con Kettlebell', 'Hipertrofia', 'Glúteos', ARRAY['Cuádriceps', 'Isquiosurales', 'Core'], 'Kettlebell', 'Pies abiertos y puntas afuera, baja en sentadilla profunda con el kettlebell entre las piernas y sube.', true, null),
('Elevación de Cadera en Banco', 'Hipertrofia', 'Glúteos', ARRAY['Isquiosurales', 'Core'], 'Peso Corporal', 'Espalda apoyada en banco, sube la cadera apretando los glúteos y baja controlado.', true, null),
('Abducción de Cadera en Máquina', 'Hipertrofia', 'Glúteos', ARRAY[]::text[], 'Máquina', 'Sentado en la máquina, abre las piernas hacia afuera apretando los glúteos medios.', true, null),
('Glute Bridge a Una Pierna', 'Fuerza', 'Glúteos', ARRAY['Isquiosurales', 'Core'], 'Peso Corporal', 'Tumbado con una pierna extendida, sube la cadera apretando el glúteo de la pierna de apoyo.', true, null),
('Zancadas Laterales con Mancuernas', 'Hipertrofia', 'Glúteos', ARRAY['Cuádriceps', 'Isquiosurales'], 'Mancuernas', 'Da un paso lateral amplio bajando la cadera y empuja volviendo a la posición inicial.', true, null),
('Hip Thrust en Multipower', 'Hipertrofia', 'Glúteos', ARRAY['Isquiosurales'], 'Multipower (Smith)', 'Espalda apoyada en banco, empuja la barra guiada extendiendo la cadera y aprieta el glúteo arriba.', true, null),

-- ============ GEMELOS (8) ============
('Elevación de Talones con Barra', 'Fuerza', 'Gemelos', ARRAY[]::text[], 'Barra', 'De pie con la barra en la espalda, sube sobre las puntas de los pies y baja lento.', true, null),
('Elevación de Talones con Mancuernas', 'Hipertrofia', 'Gemelos', ARRAY[]::text[], 'Mancuernas', 'De pie con mancuernas en las manos, sube sobre las puntas de los pies y baja controlado.', true, null),
('Elevación de Talones en Máquina', 'Hipertrofia', 'Gemelos', ARRAY[]::text[], 'Máquina', 'En la máquina, sube sobre las puntas de los pies con peso en los hombros y baja lento.', true, null),
('Elevación de Talones en Multipower', 'Hipertrofia', 'Gemelos', ARRAY[]::text[], 'Multipower (Smith)', 'Barra guiada en los hombros, sube sobre las puntas de los pies y baja en estiramiento.', true, null),
('Elevación de Talones a Una Pierna', 'Fuerza', 'Gemelos', ARRAY[]::text[], 'Peso Corporal', 'De pie sobre un escalón con una pierna, sube sobre la punta del pie y baja en estiramiento.', true, null),
('Elevación de Talones Sentado en Máquina', 'Hipertrofia', 'Gemelos', ARRAY[]::text[], 'Máquina', 'Sentado en la máquina, sube sobre las puntas de los pies enfocando el sóleo y baja lento.', true, null),
('Elevación de Talones en Prensa', 'Hipertrofia', 'Gemelos', ARRAY[]::text[], 'Máquina', 'En la prensa de piernas, empuja con las puntas de los pies extendiendo los tobillos.', true, null),
('Saltos a la Comba (Calves)', 'Fuerza', 'Gemelos', ARRAY['Cardiovascular'], 'Peso Corporal', 'Salta sobre las puntas de los pies de forma continua manteniendo los gemelos en tensión.', true, null),

-- ============ CORE (13) ============
('Plancha (Plank)', 'Fuerza', 'Core', ARRAY['Deltoides Anterior', 'Glúteos'], 'Peso Corporal', 'Apoyado en antebrazos y puntas de los pies, mantén el cuerpo recto y el core contraído.', true, null),
('Plancha Lateral', 'Fuerza', 'Core', ARRAY['Deltoides Lateral', 'Glúteos'], 'Peso Corporal', 'Apoyado en un antebrazo y el borde del pie, mantén el cuerpo recto de lado.', true, null),
('Crunch en Suelo', 'Hipertrofia', 'Core', ARRAY[]::text[], 'Peso Corporal', 'Tumbado, eleva los hombros contrayendo el abdomen y baja sin tocar completamente.', true, null),
('Crunch en Polea (Abdominal)', 'Hipertrofia', 'Core', ARRAY[]::text[], 'Polea', 'De rodillas frente a la polea alta, tira de la cuerda hacia abajo contrayendo el abdomen.', true, null),
('Elevación de Piernas Colgado', 'Fuerza', 'Core', ARRAY['Antebrazos', 'Dorsal'], 'Peso Corporal', 'Colgado de la barra, sube las piernas extendidas hasta la altura de la cadera y baja controlado.', true, null),
('Elevación de Piernas en Banco', 'Hipertrofia', 'Core', ARRAY[]::text[], 'Peso Corporal', 'Tumbado en banco, sube las piernas extendidas hasta 90 grados y baja sin tocar el suelo.', true, null),
('Russian Twist con Disco', 'Hipertrofia', 'Core', ARRAY['Deltoides Anterior'], 'Mancuernas', 'Sentado con los pies elevados, gira el torso de lado a lado con el disco entre las manos.', true, null),
('Ruedo Abdominal (Ab Wheel)', 'Fuerza', 'Core', ARRAY['Deltoides Anterior', 'Dorsal'], 'Peso Corporal', 'De rodillas, empuja el ruedo adelante extendiendo el cuerpo y vuelve contrayendo el abdomen.', true, null),
('Mountain Climbers', 'Fuerza', 'Core', ARRAY['Pectoral', 'Deltoides Anterior', 'Cuádriceps'], 'Peso Corporal', 'En posición de plancha, lleva alternadamente las rodillas al pecho a ritmo rápido.', true, null),
('Crunch en Máquina', 'Hipertrofia', 'Core', ARRAY[]::text[], 'Máquina', 'Sentado en la máquina, flexiona el torso contrayendo el abdomen y vuelve controlado.', true, null),
('Hollow Hold', 'Fuerza', 'Core', ARRAY['Cuádriceps'], 'Peso Corporal', 'Tumbado, eleva piernas y hombros manteniendo la espalda pegada al suelo en posición cóncava.', true, null),
('Dead Bug', 'Fuerza', 'Core', ARRAY[]::text[], 'Peso Corporal', 'Tumbado, extiende un brazo y la pierna opuesta manteniendo la espalda pegada al suelo y alterna.', true, null),
('Flutter Kicks', 'Hipertrofia', 'Core', ARRAY['Cuádriceps'], 'Peso Corporal', 'Tumbado, eleva las piernas y mueve alternadamente con pequeños movimientos rápidos.', true, null),

-- ============ CARDIOVASCULAR (12) ============
('Cinta de Correr', 'Cardio', 'Cardiovascular', ARRAY['Cuádriceps', 'Isquiosurales', 'Gemelos'], 'Cardio', 'Corre a ritmo constante en la cinta manteniendo una postura erguida y respiración controlada.', true, null),
('Bicicleta Estática', 'Cardio', 'Cardiovascular', ARRAY['Cuádriceps', 'Isquiosurales', 'Gemelos'], 'Cardio', 'Pedalea a ritmo constante manteniendo la espalda recta y ajustando la resistencia.', true, null),
('Bicicleta de Spinning', 'Cardio', 'Cardiovascular', ARRAY['Cuádriceps', 'Isquiosurales', 'Gemelos'], 'Cardio', 'Pedalea de pie y sentado alternando intervalos de alta y baja intensidad.', true, null),
('Remo Cardiovascular', 'Cardio', 'Cardiovascular', ARRAY['Dorsal', 'Bíceps', 'Cuádriceps', 'Isquiosurales'], 'Cardio', 'En la máquina de remo, tira empujando con las piernas y tirando de los brazos en secuencia fluida.', true, null),
('Elíptica', 'Cardio', 'Cardiovascular', ARRAY['Cuádriceps', 'Isquiosurales', 'Glúteos', 'Deltoides Anterior'], 'Cardio', 'Mueve los brazos y piernas en la elíptica manteniendo un ritmo constante.', true, null),
('Escaladora (Stair Climber)', 'Cardio', 'Cardiovascular', ARRAY['Glúteos', 'Cuádriceps', 'Isquiosurales', 'Gemelos'], 'Cardio', 'Sube los peldaños manteniendo el torso erguido y sin apoyar todo el peso en las manos.', true, null),
('Comba', 'Cardio', 'Cardiovascular', ARRAY['Gemelos', 'Deltoides Anterior', 'Antebrazos'], 'Peso Corporal', 'Salta sobre las puntas de los pies girando la comba con las muñecas a ritmo constante.', true, null),
('Sprint', 'Cardio', 'Cardiovascular', ARRAY['Cuádriceps', 'Isquiosurales', 'Glúteos', 'Gemelos'], 'Peso Corporal', 'Corre a máxima intensidad en distancias cortas con descanso completo entre series.', true, null),
('Burpees', 'Cardio', 'Cardiovascular', ARRAY['Pectoral', 'Cuádriceps', 'Tríceps', 'Core'], 'Peso Corporal', 'Baja a flexión, vuelve a posición de sentadilla y salta explosivamente arriba.', true, null),
('Jumping Jacks', 'Cardio', 'Cardiovascular', ARRAY['Deltoides Lateral', 'Cuádriceps', 'Gemelos'], 'Peso Corporal', 'Salta abriendo piernas y brazos al mismo tiempo y vuelve a la posición inicial.', true, null),
('Mountain Climbers (Cardio)', 'Cardio', 'Cardiovascular', ARRAY['Core', 'Pectoral', 'Cuádriceps'], 'Peso Corporal', 'En posición de plancha, lleva las rodillas al pecho alternando a máxima velocidad.', true, null),
('Rowing Machine (Remo Indoor)', 'Cardio', 'Cardiovascular', ARRAY['Dorsal', 'Bíceps', 'Cuádriceps', 'Trapecio'], 'Cardio', 'Empuja con las piernas y tira con los brazos en movimiento fluido manteniendo la espalda recta.', true, null)
ON CONFLICT DO NOTHING;
