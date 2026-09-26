import { Dumbbell } from 'lucide-react';
import Placeholder from '@/components/Placeholder';

export default function TrainScreen() {
  return (
    <Placeholder
      title="Entrenar"
      message="Aquí podrás iniciar tu entrenamiento del día con cronómetro de descanso y registro de series. Próximamente en Fase 5."
      icon={<Dumbbell size={28} className="text-cyan-400" />}
    />
  );
}
