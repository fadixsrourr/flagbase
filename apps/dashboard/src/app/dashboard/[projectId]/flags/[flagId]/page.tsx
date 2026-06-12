import { FlagDetailView } from '@/features/flags/FlagDetailView'

export default async function FlagDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; flagId: string }>
  searchParams: Promise<{ env?: string }>
}) {
  const { projectId, flagId } = await params
  const { env } = await searchParams
  return <FlagDetailView projectId={projectId} env={env ?? 'development'} flagId={flagId} />
}
