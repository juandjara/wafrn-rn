export const INSTANCES_URL =
  process.env.INSTANCES_URL || 'https://join.wafrn.net/instances.json'

// only used for "useFediDBInstanceList", which is currently unused
export const FEDIDB_URL =
  process.env.FEDIDB_URL ||
  'https://api.fedidb.org/v1/software/wafrn/servers?limit=10'

export const RELEASES_URL =
  process.env.RELEASES_URL ||
  'https://codeberg.org/api/v1/repos/wafrn/wafrn-rn/releases/latest'

export const EXPO_PUBLIC_TENOR_KEY = process.env.EXPO_PUBLIC_TENOR_KEY || ''
