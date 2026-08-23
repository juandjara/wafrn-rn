import { InteractionControl } from './api/posts.types'

export type InteractionOption =
  | 'anyone'
  | 'none'
  | 'followers'
  | 'following'
  | 'mentioned'

export type InteractionControlChange = {
  interactionControl: InteractionControl
  canQuote: boolean
}

export const INTERACTION_OPTION_LABELS = {
  anyone: 'Anyone',
  none: 'No one',
  followers: 'Your followers',
  following: 'People you follow',
  mentioned: 'Mentioned people',
} as const

export function interactionControlToOptions(
  control: InteractionControl,
): InteractionOption[] {
  switch (control) {
    case InteractionControl.NoOne:
      return ['none']
    case InteractionControl.Followers:
      return ['followers']
    case InteractionControl.Following:
      return ['following']
    case InteractionControl.FollowersAndFollowing:
      return ['followers', 'following']
    case InteractionControl.FollowersAndMentioned:
      return ['followers', 'mentioned']
    case InteractionControl.FollowingAndMentioned:
      return ['following', 'mentioned']
    case InteractionControl.FollowersFollowersAndMentioned:
      return ['followers', 'following', 'mentioned']
    case InteractionControl.MentionedUsersOnly:
      return ['mentioned']
    // Anyone and SameAsOp
    default:
      return ['anyone']
  }
}

export function interactionOptionsToControl(options: InteractionOption[]) {
  if (options.includes('anyone')) {
    return InteractionControl.Anyone
  }
  if (options.includes('none')) {
    return InteractionControl.NoOne
  }
  if (
    options.includes('mentioned') &&
    options.includes('followers') &&
    options.includes('following')
  ) {
    return InteractionControl.FollowersFollowersAndMentioned
  }
  if (options.includes('following') && options.includes('mentioned')) {
    return InteractionControl.FollowingAndMentioned
  }
  if (options.includes('followers') && options.includes('mentioned')) {
    return InteractionControl.FollowersAndMentioned
  }
  if (options.includes('followers') && options.includes('following')) {
    return InteractionControl.FollowersAndFollowing
  }
  if (options.includes('followers')) {
    return InteractionControl.Followers
  }
  if (options.includes('following')) {
    return InteractionControl.Following
  }
  if (options.includes('mentioned')) {
    return InteractionControl.MentionedUsersOnly
  }
  // if no option is found in the array (weird, but ok) default to no interaction control (Avoid bugs > protect feature)
  return InteractionControl.Anyone
}

export function interactionControlSummary(
  canReply: InteractionControl,
  canQuote: boolean,
) {
  const replySummary = interactionControlToOptions(canReply)
    .map((opt) => INTERACTION_OPTION_LABELS[opt])
    .join(' + ')
  return `${replySummary}, ${canQuote ? 'Quotable' : 'Not quotable'}`
}
