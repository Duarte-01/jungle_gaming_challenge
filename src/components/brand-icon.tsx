type Brand =
  | 'Google'
  | 'Facebook'
  | 'Instagram'
  | 'Twitter'
  | 'LinkedIn'
  | 'YouTube'
  | 'MetaMask'
  | 'WalletConnect'
  | 'Coinbase Wallet'

/** Compact local vector marks; no external image or font requests. */
export function BrandIcon({ brand, size = 20 }: { brand: Brand; size?: number }) {
  if (brand === 'Instagram')
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  if (brand === 'YouTube')
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="m10 9 6 3-6 3Z" fill="currentColor" stroke="none" />
      </svg>
    )
  if (brand === 'MetaMask')
    return (
      <span aria-hidden="true" className="metamask-symbol">
        🦊
      </span>
    )
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {brand === 'Google' ? (
        <>
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.06v2.59A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.41 13.9a6 6 0 0 1 0-3.8V7.51H3.06a10 10 0 0 0 0 8.98l3.35-2.59Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.97c1.47 0 2.8.5 3.84 1.5l2.88-2.88A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.51l3.35 2.59A6.01 6.01 0 0 1 12 5.97Z"
          />
        </>
      ) : brand === 'Facebook' ? (
        <path d="M14 22v-9h3l.5-4H14V7c0-1.15.32-2 2-2h2V1.4A24 24 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v9Z" />
      ) : brand === 'Twitter' ? (
        <path d="M22 5.8a8.3 8.3 0 0 1-2.36.65 4.1 4.1 0 0 0 1.8-2.27 8.2 8.2 0 0 1-2.6 1 4.1 4.1 0 0 0-7 3.74 11.65 11.65 0 0 1-8.46-4.29 4.1 4.1 0 0 0 1.27 5.48 4.1 4.1 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.29 4.02 4.1 4.1 0 0 1-1.85.07 4.1 4.1 0 0 0 3.83 2.85A8.23 8.23 0 0 1 2 18.3a11.6 11.6 0 0 0 6.29 1.85c7.55 0 11.68-6.25 11.68-11.68l-.01-.53A8.35 8.35 0 0 0 22 5.8Z" />
      ) : brand === 'LinkedIn' ? (
        <>
          <circle cx="5" cy="5" r="2" />
          <path d="M3 9h4v12H3zm7 0h4v1.6c.6-1 1.7-1.9 3.4-1.9 3.6 0 4.1 2.4 4.1 5.5V21h-4v-6c0-1.4 0-3.1-1.9-3.1S14 13.3 14 14.9V21h-4Z" />
        </>
      ) : brand === 'WalletConnect' ? (
        <path d="m3 9 3-3a8.5 8.5 0 0 1 12 0l3 3-2 2-3-3a5.7 5.7 0 0 0-8 0l-3 3Zm-1 4 2-2 4 4 4-4 4 4 4-4 2 2-6 6-4-4-4 4Z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="11" fill="#1652f0" />
          <path fill="#fff" d="M16.7 7.5a6.5 6.5 0 1 0 0 9l-2-2a3.7 3.7 0 1 1 0-5Z" />
        </>
      )}
    </svg>
  )
}
