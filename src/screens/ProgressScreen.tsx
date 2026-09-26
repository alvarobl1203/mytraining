import { BarChart2 } from 'lucide-react';
import Placeholder from '@/components/Placeholder';

export default function ProgressScreen() {
  return (
    <Placeholder
      title="Progreso"
      message="Gráficos de 1RM, tonelaje, peso corporal y cardio. Calendario de entrenamientos. Próximamente en Fase 7."
      icon={<BarChart2 size={28} className="text-cyan-400" />}
    />
  );
}
