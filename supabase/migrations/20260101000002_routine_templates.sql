create or replace view public.muscle_last_hit as
select
  ws.workout_id,
  w.user_id,
  w.finished_at,
  e.primary_muscle as muscle,
  1.0 as weight,
  ws.created_at
from public.workout_sets ws
join public.workouts w on w.id = ws.workout_id
join public.exercises e on e.id = ws.exercise_id
where ws.completed = true and w.finished_at is not null
union all
select
  ws.workout_id,
  w.user_id,
  w.finished_at,
  unnest(e.secondary_muscles) as muscle,
  0.5 as weight,
  ws.created_at
from public.workout_sets ws
join public.workouts w on w.id = ws.workout_id
join public.exercises e on e.id = ws.exercise_id
where ws.completed = true and w.finished_at is not null
  and array_length(e.secondary_muscles, 1) > 0;

alter view public.muscle_last_hit set (security_invoker = true);