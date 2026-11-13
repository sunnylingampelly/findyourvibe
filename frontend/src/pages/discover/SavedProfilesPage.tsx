import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'
import ProfileCard from '../../components/profile/ProfileCard'
import { ProfileCardSkeleton } from '../../components/ui/Skeleton'
import type { PublicProfile } from '../../types'

export default function SavedProfilesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['saved-profiles'],
    queryFn: () => discoverApi.getSavedProfiles(),
  })

  const unsave = useMutation({
    mutationFn: (id: string) => discoverApi.unsaveProfile(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saved-profiles'] }); toast('Removed from saved', 'info') },
  })

  const saved = data?.data?.data ?? []

  return (
    <AppShell>
      <PageHeader title="Saved Profiles" back />
      <div className="screen-scroll overflow-y-auto px-4 pb-4 space-y-3" style={{ height: 'calc(100dvh - 72px)' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <ProfileCardSkeleton key={i} />)
        ) : saved.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔖</div>
            <h3 className="font-manrope font-semibold text-[#F2F0EB] mb-1">No saved profiles</h3>
            <p className="text-sm text-[#A1AAA5]">Save profiles you like to find them easily later</p>
          </div>
        ) : saved.map((item: { id: string; user: PublicProfile }, i: number) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ProfileCard
              profile={item.user}
              onSave={() => unsave.mutate(item.id)}
              saved
            />
          </motion.div>
        ))}
      </div>
    </AppShell>
  )
}
