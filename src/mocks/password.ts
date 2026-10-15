const encoder = new TextEncoder()

export async function hashPassword(password: string, salt: string = crypto.randomUUID()) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120_000, hash: 'SHA-256' },
    key,
    256,
  )
  const hash = Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
  return { salt, hash }
}

export async function matchesPassword(
  password: string,
  credential: { salt: string; hash: string },
) {
  const candidate = await hashPassword(password, credential.salt)
  // Comparação completa para não retornar no primeiro caractere diferente.
  let difference = candidate.hash.length ^ credential.hash.length
  for (let index = 0; index < candidate.hash.length; index++)
    difference |= candidate.hash.charCodeAt(index) ^ credential.hash.charCodeAt(index)
  return difference === 0
}
