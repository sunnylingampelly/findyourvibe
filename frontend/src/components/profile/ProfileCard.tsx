import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Star, Heart, Bookmark } from 'lucide-react'
import { type PublicProfile } from '../../types'
import { getInitials, truncate } from '../../lib/utils'
import Badge from '../ui/Badge'
import { cn } from '../../lib/utils'

interface ProfileCardProps {
  profile: PublicProfile
  onLike?: () => void
  onSave?: () => void
  saved?: boolean
  className?: string
}

export default function ProfileCard({ profile, onLike, onSave, saved, className }: ProfileCardProps) {
  const navigate = useNavigate()

  return (
    <div
      className={cn('card overflow-hidden cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]', className)}
      onClick={() => navigate(`/profiles/${profile.id}`)}
    >
      {/* Photo */}
      <div className="relative h-52 bg-[#1C1C22]">
        {profile.profile_photo_url ? (
          <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1C1C22 0%, #252530 100%)' }}>
            <span className="text-5xl font-manrope font-bold" style={{ color: '#C8FF4D' }}>{getInitials(profile.display_name)}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {profile.companion_verification_status === 'approved' && (
            <Badge variant="verified">Verified</Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          {onSave && (
            <motion.button
              whileTap={{ scale: 0.75 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={e => { e.stopPropagation(); onSave?.() }}
              className={cn('w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm', saved ? 'text-[#0A1A00]' : 'bg-black/40 text-white/80')}
              style={saved ? { background: '#C8FF4D' } : undefined}
            >
              <Bookmark size={16} fill={saved ? 'white' : 'none'} />
            </motion.button>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="font-manrope font-bold text-white text-lg leading-tight">
                {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
              </h3>
              {profile.city && (
                <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin size={11} />{profile.city.name}
                </p>
              )}
            </div>
            {onLike && (
              <button
                onClick={e => { e.stopPropagation(); onLike?.() }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <Heart size={18} className="text-[#D98D7A]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3">
        {profile.bio && (
          <p className="text-sm text-[#8B8B9A] mb-2.5 leading-relaxed">{truncate(profile.bio, 90)}</p>
        )}

        {/* Rating */}
        {profile.avg_rating && profile.avg_rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={13} className="text-[#FF9F43] fill-[#FF9F43]" />
            <span className="text-xs font-semibold text-[#F2F0EB]">{Number(profile.avg_rating).toFixed(1)}</span>
            <span className="text-xs text-[#52525E]">({profile.rating_count})</span>
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 4).map(i => (
              <span key={i.id} className="text-xs px-2.5 py-1 bg-[#C8FF4D]/10 text-[#C8FF4D] rounded-full font-medium">{i.name}</span>
            ))}
            {profile.interests.length > 4 && (
              <span className="text-xs px-2.5 py-1 bg-[#1C1C22] text-[#52525E] rounded-full">+{profile.interests.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
