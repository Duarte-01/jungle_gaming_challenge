import type { ImgHTMLAttributes } from 'react'

export function NftImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const portrait = /^\/images\/nfts\/(emerald-ape|sage-nomad|neon-vessel|golden-beat)\.png$/.exec(
    src ?? '',
  )?.[1]
  return (
    <picture className="nft-picture">
      {portrait && (
        <>
          <source type="image/avif" srcSet={`/images/nfts/${portrait}.avif`} />
          <source type="image/webp" srcSet={`/images/nfts/${portrait}.webp`} />
        </>
      )}
      <img src={src} {...props} />
    </picture>
  )
}
