// Precomputed PBKDF2/SHA-256 hashes for the two public demo accounts.
// New registrations and password changes still generate a random salt.
export const fixtureCredentials: Record<string, { salt: string; hash: string }> = {
  'collector-ana': {
    salt: '6db9c70c-dca8-4dac-954b-a1b100cebe21',
    hash: '7e911440929924f199ed2d67189e3eb9b4ee16f643d7acd7a740bc3560d7ae2c',
  },
  'collector-bruno': {
    salt: '10ded16e-ee6c-4af4-8a85-0aa9368816d2',
    hash: '2c69f0e02a9d20b1c1f6b146edc1c2b44b9cb7c7b7ee5839589eb7d381a29f95',
  },
}
