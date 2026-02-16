export enum PrivacyLevel {
  PUBLIC = 0,
  FOLLOWERS_ONLY = 1,
  INSTANCE_ONLY = 2,
  UNLISTED = 3,
  DIRECT_MESSAGE = 10,
  DRAFT = 30,
}

export const PRIVACY_LABELS = {
  [PrivacyLevel.PUBLIC]: 'Public',
  [PrivacyLevel.FOLLOWERS_ONLY]: 'Followers only',
  [PrivacyLevel.INSTANCE_ONLY]: 'Instance only',
  [PrivacyLevel.UNLISTED]: 'Unlisted',
  [PrivacyLevel.DIRECT_MESSAGE]: 'Direct message',
  [PrivacyLevel.DRAFT]: 'Draft',
} as const

export const PRIVACY_DESCRIPTIONS = {
  [PrivacyLevel.PUBLIC]: 'Visible to everyone',
  [PrivacyLevel.FOLLOWERS_ONLY]: 'Visible to your followers only',
  [PrivacyLevel.INSTANCE_ONLY]: 'Visible to users on this instance only',
  [PrivacyLevel.UNLISTED]:
    'Visible to everyone but does not appear in searches or public feeds',
  [PrivacyLevel.DIRECT_MESSAGE]: 'Visible to mentioned users only',
  [PrivacyLevel.DRAFT]: `Visible only to you, won't federate to other platforms or create any notifications`,
}

// names for MaterialCommunityIcons
export const PRIVACY_ICONS = {
  [PrivacyLevel.PUBLIC]: 'earth',
  [PrivacyLevel.FOLLOWERS_ONLY]: 'account-multiple',
  [PrivacyLevel.INSTANCE_ONLY]: 'server',
  [PrivacyLevel.UNLISTED]: 'lock',
  [PrivacyLevel.DIRECT_MESSAGE]: 'email',
  [PrivacyLevel.DRAFT]: 'archive',
} as const

export const PRIVACY_ORDER = [
  PrivacyLevel.PUBLIC,
  PrivacyLevel.UNLISTED,
  PrivacyLevel.FOLLOWERS_ONLY,
  PrivacyLevel.INSTANCE_ONLY,
  PrivacyLevel.DIRECT_MESSAGE,
  PrivacyLevel.DRAFT,
]

/** returns true if a is less private than b */
export function isLessPrivateThan(a: PrivacyLevel, b: PrivacyLevel) {
  return PRIVACY_ORDER.indexOf(a) < PRIVACY_ORDER.indexOf(b)
}
