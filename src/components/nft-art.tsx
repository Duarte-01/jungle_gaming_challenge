import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '../lib/utils'

export function NftArt({
  src,
  name,
  className,
  eager = false,
}: {
  src: string
  name: string
  className?: string
  eager?: boolean
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={cn('nft-art', className)}>
      {failed ? (
        <div className="art-fallback" role="img" aria-label={`Imagem indisponível: ${name}`}>
          <ImageOff aria-hidden="true" size={32} />
          <span>{name}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
