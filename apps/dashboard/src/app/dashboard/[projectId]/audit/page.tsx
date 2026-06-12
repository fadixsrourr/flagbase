import { AuditView } from '@/features/flags/AuditView'

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ env?: string }>
}) {
  const { projectId } = await params
  const { env } = await searchParams
  return <AuditView projectId={projectId} env={env ?? 'development'} />
}
