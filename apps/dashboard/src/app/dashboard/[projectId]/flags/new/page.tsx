import { NewFlagView } from '@/features/flags/NewFlagView'

export default async function NewFlagPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ env?: string }>
}) {
  const { projectId } = await params
  const { env } = await searchParams
  return <NewFlagView projectId={projectId} env={env ?? 'development'} />
}
