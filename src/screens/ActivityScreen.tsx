import { Activity } from 'lucide-react';
import Placeholder from '@/components/Placeholder';

export default function ActivityScreen() {
  return (
    <Placeholder
      title="Actividad"
      message="Mapa de calor corporal, hexágono de volumen semanal y barras de volumen científico. Próximamente en Fase 4."
      icon={<Activity size={28} className="text-cyan-400" />}
    />
  );
}
