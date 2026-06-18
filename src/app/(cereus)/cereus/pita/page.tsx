import { redirect } from 'next/navigation';

// Pita vive ahora como app unificada en /apps/pita (workspace sobre AgentAppShell).
export default function CereusPitaRedirect() {
  redirect('/apps/pita');
}
