import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing-page';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const legacyWorkspaceKeys = ['view', 'scenario', 'objective'];
  if (legacyWorkspaceKeys.some((key) => params[key] !== undefined)) {
    const query = new URLSearchParams();
    for (const key of legacyWorkspaceKeys) {
      const value = params[key];
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
      else if (value) query.set(key, value);
    }
    redirect(`/app${query.size ? `?${query}` : ''}`);
  }
  return <LandingPage />;
}
