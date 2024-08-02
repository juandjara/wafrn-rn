export enum PrivacyLevel {
  PUBLIC = 0,
  FOLLOWERS_ONLY = 1,
  INSTANCE_ONLY = 2,
  UNLISTED = 3,
  DIRECT_MESSAGE = 10,
}

export const PRIVACY_LABELS = {
  [PrivacyLevel.PUBLIC]: 'Public',
  [PrivacyLevel.FOLLOWERS_ONLY]: 'Followers only',
  [PrivacyLevel.INSTANCE_ONLY]: 'Instance only',
  [PrivacyLevel.UNLISTED]: 'Unlisted',
  [PrivacyLevel.DIRECT_MESSAGE]: 'Direct message',
} as const

// names for MaterialCommunityIcons
export const PRIVACY_ICONS = {
  [PrivacyLevel.PUBLIC]: 'earth',
  [PrivacyLevel.FOLLOWERS_ONLY]: 'account-multiple',
  [PrivacyLevel.INSTANCE_ONLY]: 'server',
  [PrivacyLevel.UNLISTED]: 'lock',
  [PrivacyLevel.DIRECT_MESSAGE]: 'email',
} as const
