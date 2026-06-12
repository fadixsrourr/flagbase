import { FlagsView } from '@/features/flags/FlagsView'

export default async function FlagsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ env?: string }>
}) {
  const { projectId } = await params
  const { env } = await searchParams
  return <FlagsView projectId={projectId} environmentKey={env ?? 'development'} />
}
