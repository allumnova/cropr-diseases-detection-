import { getSystemState } from '@/lib/store';
import { DashboardShell } from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const initialState = getSystemState();
  return <DashboardShell initialState={initialState} />;
}
