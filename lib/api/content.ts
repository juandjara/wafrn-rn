import { DashboardContextData } from '../contexts/DashboardContext'
import { Post, PostThread, PostUser } from './posts.types'
import { formatCachedUrl, formatMediaUrl } from '../formatters'
import { EmojiGroup, type EmojiBase, type EmojiReaction } from './emojis'
import {
  isTriggerConfig,
  TriggersConfig,
  useMentions,
} from 'react-native-more-controlled-mentions'
import {
  ALL_MUTE_SOURCES,
  getPrivateOptionValue,
  MuteSource,
  MuteType,
  type PrivateOption,
  PrivateOptionNames,
  type Settings,
} from './settings'
import { PrivacyLevel } from './privacy'
import { Timestamps } from './types'
import { collapseWhitespace, replaceInlineImages } from './html'
import { Dimensions } from 'react-native'
import { POST_MARGIN } from './posts'

export const HTTP_LINK_REGEX = /(https?:\/\/[^\s$.?#].[^\s]*)/gi
export const MENTION_REGEX = /@[\w-\.]+@?[\w-\.]*/gi
export const MENTION_LINK_REGEX = /(\[@[\w-\.]+@?[\w-\.]*\]\([^(^)]+\))/gi
export const COLOR_REGEX = /(\[fg=#[0-9a-fA-F]{6}\]\(.*?\))/gi
export const WAFRNMEDIA_REGEX =
  /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm
export const INLINE_MEDIA_REGEX = /!\[media-(\d+)\]/gi

const AI_REPLACE_REGEX = /(\bAI\b)|(\bhttps?:\/\/[^\s$.?#].[^\s]*\b)/gi

export function isEmptyRewoot(post: Post, context: DashboardContextData) {
  if (post.isRewoot) {
    return true
  }

  if (!!post.content || !!post.content_warning) {
    return false
  }
  if (!post.parentId) {
    // a rewoot must have a parent id, if not, it is just an empty post (maybe from a bsky briding bug)
    return false
  }

  const hasMedias = context.medias.some((m) => m.postId === post.id)
  const hasTags = context.tags.some((t) => t.postId === post.id)
  return !hasMedias && !hasTags
}

export function replaceEmojis(text: string, emojis: EmojiBase[]) {
  for (const emoji of emojis) {
    const url = formatCachedUrl(formatMediaUrl(emoji.url))
    text = text.replaceAll(
      emoji.name,
      `<img width="24" height="24" src="${url}" alt="${emoji.name.replaceAll(':', '')}" />`,
    )
  }
  return text
}

export function processPostContent(
  post: Post,
  context: DashboardContextData,
  options: PrivateOption[],
) {
  if (post.content === '<p></p>') {
    return ''
  }

  let content = (post.content ?? '').replace(WAFRNMEDIA_REGEX, '')
  const enableReplaceAIWord = getPrivateOptionValue(
    options,
    PrivateOptionNames.EnableReplaceAIWord,
  )
  const replaceAIWord = getPrivateOptionValue(
    options,
    PrivateOptionNames.ReplaceAIWord,
  )
  if (enableReplaceAIWord && replaceAIWord) {
    content = content.replace(AI_REPLACE_REGEX, (match, g1, g2) => {
      if (g1 && !g2) {
        return `<em>${replaceAIWord}</em>`
      }
      return match
    })
  }

  if (!isBlueskyPost(post, context)) {
    content = collapseWhitespace(content)
  }

  const ids =
    context.emojiRelations.postEmojiRelation
      .filter((e) => e.postId === post.id)
      .map((e) => e.emojiId) ?? []

  const emojis =
    context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []

  return replaceEmojis(content, emojis)
}

export function isBlueskyPost(post: Post, context: DashboardContextData) {
  return (
    !!post.bskyUri &&
    context.users.some((u) => u.id === post.userId && u.url.startsWith('@'))
  )
}

export function getUserEmojis(user: PostUser, context: DashboardContextData) {
  const ids =
    context.emojiRelations.userEmojiRelation
      .filter((e) => e.userId === user.id)
      .map((e) => e.emojiId) ?? []
  return context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
}

export function isUnicodeHeart(emoji: unknown) {
  if (!emoji || typeof emoji !== 'string') {
    return false
  }
  return emoji === '❤️' || emoji === '❤' || emoji === '♥️' || emoji === '♥'
}

export function getReactions(post: Post, context: DashboardContextData) {
  const emojis = Object.fromEntries(
    context.emojiRelations.emojis.map((e) => [e.id, e]),
  )
  type Reaction = {
    id: string
    user: PostUser
    emoji: EmojiReaction
  }
  const users = Object.fromEntries(context.users.map((u) => [u.id, u]))

  const reactions: Reaction[] = []
  for (const r of context.emojiRelations.postEmojiReactions) {
    if (r.postId === post.id) {
      const user = users[r.userId]
      if (!user) {
        continue
      }
      const emoji = r.emojiId ? emojis[r.emojiId] : r.content
      reactions.push({
        id: `${r.emojiId}-${r.userId}`,
        user,
        emoji,
      })
    }
  }
  const grouped = new Map<string, EmojiGroup>()
  for (const r of reactions) {
    const key = typeof r.emoji === 'string' ? r.emoji : r.emoji.name
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        users: [],
        emoji: r.emoji,
      })
    }
    grouped.get(key)!.users.push(r.user!)
  }
  return [...grouped.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function isValidURL(str: string) {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

function matchHosts(href: string, hosts: string[]) {
  if (!isValidURL(href)) {
    return false
  }
  const host = new URL(href).host
  return hosts.some((h) => {
    return host === h || host.endsWith(`.${h}`)
  })
}

const YT_HOSTS = ['youtube.com', 'youtu.be']
export function isValidYTLink(href: string) {
  return matchHosts(href, YT_HOSTS)
}

const TENOR_HOSTS = ['media.tenor.com']
export function isTenorLink(href: string) {
  return matchHosts(href, TENOR_HOSTS)
}

const GIPHY_HOSTS = ['giphy.com']
export function isGiphyLink(href: string) {
  return matchHosts(href, GIPHY_HOSTS)
}

export function getYoutubeImage(ytLink: string) {
  if (!isValidURL(ytLink)) {
    return null
  }
  const url = new URL(ytLink)
  let videoId = null as string | null
  if (url.host.endsWith('youtube.com')) {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v')
    }
    if (url.pathname.startsWith('/shorts')) {
      videoId = url.pathname.split('/').pop() ?? null
    }
  }
  if (url.host === 'youtu.be') {
    videoId = url.pathname.replace('/', '')
  }
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/0.jpg`
  }
  return null
}

type MentionApi = ReturnType<typeof useMentions>

export function clearSelectionRangeFormat(
  state: MentionApi['mentionState'],
  selection: { start: number; end: number },
) {
  const rangesWithFormat = state.parts.filter((part) => {
    const start = part.position.start
    const end = part.position.end
    return selection.start < end && selection.end > start
  })
  if (rangesWithFormat.length === 0) {
    return state
  }
  return {
    ...state,
    parts: state.parts.map((part) => {
      if (rangesWithFormat.includes(part)) {
        return {
          text: part.text,
          position: part.position,
        }
      }
      return part
    }),
  }
}

export function processContentWarning(
  post: Post,
  options: PrivateOption[],
  softMutedWords: string[],
) {
  const isMuted = softMutedWords.length > 0
  const formattedWords = softMutedWords.map((w) => `"${w}"`).join(', ')
  const disableCW = getPrivateOptionValue(options, PrivateOptionNames.DisableCW)
  const separator = post.content_warning ? ' - ' : ''

  const contentWarning = isMuted
    ? `${post.content_warning || ''}${separator}Contains muted words: ${formattedWords}`
    : post.content_warning

  const initialCWOpen = disableCW ? !isMuted : !contentWarning

  return { contentWarning, initialCWOpen }
}

export function getTextFromMentionState(
  mentionState: MentionApi['mentionState'],
) {
  let text = ''
  for (const part of mentionState.parts) {
    const trigger =
      part.config && isTriggerConfig(part.config) && part.config.trigger
    if (trigger === '@') {
      text += part.data?.name || part.text
      continue
    }
    if (trigger === '**') {
      text += `<strong>${part.text}</strong>`
      continue
    }
    if (trigger === '#?') {
      text += `<span class="wafrn-color" style="color: ${part.data?.id}">${part.text}</span>`
      continue
    }
    // if (trigger === 'http') {
    //   text += `<a href="${part.text}" target="_blank" rel="noopener noreferrer">${part.text}</a>`
    // }
    text += part.text
  }
  // text = text.replace(/\n/g, '<br>')
  return text
}

export const EDITOR_TRIGGERS_CONFIG: TriggersConfig<
  'mention' | 'emoji' | 'bold' | 'color' | 'link'
> = {
  mention: {
    trigger: '@',
    pattern: MENTION_LINK_REGEX,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'deepskyblue',
    },
    getTriggerData: (match) => {
      const [first, last] = match.split('](')
      if (!first || !last) {
        return { trigger: '@', original: match, name: match, id: match }
      }
      const name = first.replace('[', '')
      const id = last.replace(')', '')
      return {
        trigger: '@',
        original: match,
        name,
        id,
      }
    },
    getTriggerValue: (suggestion) => `[${suggestion.name}](${suggestion.id})`,
    getPlainString: (triggerData) => triggerData.name,
  },
  emoji: {
    trigger: ':',
    pattern: /(:\w+:)/gi,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'deepskyblue',
    },
    getTriggerData: (match) => {
      return {
        trigger: ':',
        original: match,
        name: match,
        id: match,
      }
    },
    getTriggerValue: (suggestion) => suggestion.name,
    getPlainString: (triggerData) => triggerData.name,
  },
  bold: {
    trigger: '**',
    pattern: /(\*\*.*?\*\*)/gi,
    textStyle: {
      fontWeight: 'bold',
    },
    // How to parse regex match and get required for data for internal logic
    getTriggerData: (match) => {
      const text = match.replace(/\*\*/g, '')
      return {
        original: match,
        trigger: '**',
        name: text,
        id: text,
      }
    },

    // How to generate internal mention value from selected suggestion
    getTriggerValue: (suggestion) => `**${suggestion.name}**`,

    // How the highlighted mention will appear in TextInput for user
    getPlainString: (triggerData) => triggerData.name,
  },
  color: {
    trigger: '#?',
    pattern: COLOR_REGEX,
    textStyle: (data) => ({
      color: data?.id,
    }),
    // How to parse regex match and get required for data for internal logic
    getTriggerData: (match) => {
      const [first, last] = match.split('](')
      const color = first.replace('[fg=', '')
      const text = last.replace(')', '')
      return {
        original: match,
        trigger: '#?',
        name: text,
        id: color,
      }
    },

    // How to generate internal mention value from selected suggestion
    getTriggerValue: (suggestion) =>
      `[fg=${suggestion.id}](${suggestion.name})`,

    // How the highlighted mention will appear in TextInput for user
    getPlainString: (triggerData) => triggerData.name,
  },
  link: {
    trigger: 'http',
    pattern: HTTP_LINK_REGEX,
    textStyle: {
      color: 'deepskyblue',
      fontWeight: 'medium',
    },
    getTriggerData: (match) => {
      return {
        trigger: 'http',
        original: match,
        name: match,
        id: match,
      }
    },
    getTriggerValue: (suggestion) => suggestion.name,
    getPlainString: (triggerData) => triggerData.name,
  },
}

export function separateInlineMedias(
  post: Post,
  context: DashboardContextData,
  options: PrivateOption[],
) {
  const disableNSFWCloak = getPrivateOptionValue(
    options,
    PrivateOptionNames.DisableNSFWCloak,
  )
  const medias = context.medias
    .filter((m) => m.postId === post.id)
    .map((m) => ({
      ...m,
      NSFW: disableNSFWCloak ? false : m.NSFW,
    }))
    .sort((a, b) => a.mediaOrder - b.mediaOrder)

  const inlineMediaMatches = post.content.match(INLINE_MEDIA_REGEX) || []
  return {
    medias: medias.slice(inlineMediaMatches.length),
    inlineMedias: medias.slice(0, inlineMediaMatches.length),
  }
}

export function getAskData(post: Post, context: DashboardContextData) {
  const ask = context.asks.find((a) => a.postId === post.id)
  if (!ask) {
    return null
  }
  const askUser = context.users.find((u) => u.id === ask.userAsker)
  return {
    user: askUser,
    userEmojis: askUser ? getUserEmojis(askUser, context) : [],
    question: ask.question,
  }
}

export function groupPostReactions(post: Post, context: DashboardContextData) {
  const reactions = getReactions(post, context)
  const fullReactions = [] as EmojiGroup[]
  const likeUsers = [] as PostUser[]
  const users = Object.fromEntries(context.users.map((u) => [u.id, u]))

  for (const like of context.likes) {
    if (like.postId === post.id) {
      const user = users[like.userId]
      if (user) {
        likeUsers.push(user)
      }
    }
  }

  for (const r of reactions) {
    if (isUnicodeHeart(r.emoji)) {
      likeUsers.push(...r.users)
    } else {
      fullReactions.push(r)
    }
  }

  if (likeUsers.length) {
    return [
      {
        id: `${post.id}-likes`,
        emoji: '❤️' as EmojiReaction,
        users: likeUsers,
      },
    ].concat(fullReactions)
  }

  return fullReactions
}

function getAppliedMute(
  post: Post,
  context: DashboardContextData,
  options: PrivateOption[],
) {
  const isRewoot = isEmptyRewoot(post, context)
  const rewootedPost = isRewoot ? (post as PostThread).ancestors?.[0] : null
  if (rewootedPost) {
    return getAppliedMute(rewootedPost, context, options)
  }

  const tags = context.tags
    .filter((t) => t.postId === post.id)
    .map((t) => `#${t.tagName.trim().toLocaleLowerCase()}`)
  const postText = `${post.content?.trim().toLocaleLowerCase()} ${tags.join(' ')}`
  const user = context.users.find((u) => u.id === post.userId)
  const isBlueskyPost = post.bskyUri && user?.url.startsWith('@')
  const isLocalPost = !post.remotePostId && !user?.url.startsWith('@')
  const isFediversePost = post.remotePostId && !post.bskyUri

  const mutedWordsLine = getPrivateOptionValue(
    options,
    PrivateOptionNames.MutedWords,
  )
  const mutedWords = getPrivateOptionValue(
    options,
    PrivateOptionNames.AdvancedMutedWords,
  )
  if (mutedWordsLine.trim().length > 0) {
    mutedWords.push({
      words: mutedWordsLine,
      muteType: MuteType.Soft,
      muteSources: ALL_MUTE_SOURCES,
    })
  }

  const applicableBySource = mutedWords.filter((b) => {
    if (isBlueskyPost) {
      return b.muteSources.includes(MuteSource.Bluesky)
    }
    if (isLocalPost) {
      return b.muteSources.includes(MuteSource.Local)
    }
    if (isFediversePost) {
      return b.muteSources.includes(MuteSource.Fediverse)
    }
    return false
  })

  const softMutedWords = new Set<string>()
  const hardMutedWords = new Set<string>()

  for (const m of applicableBySource) {
    const words = m.words.split(',').map((w) => w.trim().toLocaleLowerCase())
    for (const word of words) {
      if (word.length > 0 && postText.includes(word)) {
        if (m.muteType === MuteType.Soft) {
          softMutedWords.add(word)
        } else {
          hardMutedWords.add(word)
        }
      }
    }
  }

  return {
    softMutedWords: Array.from(softMutedWords),
    hardMutedWords: Array.from(hardMutedWords),
  }
}

/**
 * sort posts from older to newer
 * used to sort ancestors in a thread and replies in a post detail
 * based on the `createdAt` field, so post editing does not alter sort order
 */
export function sortPosts(a: Timestamps, b: Timestamps) {
  const aTime = new Date(a.createdAt).getTime()
  const bTime = new Date(b.createdAt).getTime()
  return aTime - bTime
}

function getHiddenUserIds(settings?: Settings) {
  const mutedIds = settings?.mutedUsers || []
  const blockedIds = settings?.blockedUsers || []
  return [...new Set([...mutedIds, ...blockedIds])]
}

export type DerivedPostData = ReturnType<typeof getDerivedPostState>

export function getDerivedPostState(
  post: Post,
  context: DashboardContextData,
  settings?: Settings,
) {
  const options = settings?.options || []
  const user = context.users.find((u) => u.id === post.userId)
  const userEmojis = user ? getUserEmojis(user, context) : []
  let postContent = processPostContent(post, context, options)
  const tags = context.tags
    .filter((t) => t.postId === post.id)
    .map((t) => t.tagName)

  // this processes the option "wafrn.disableNSFWCloak"
  const { medias, inlineMedias } = separateInlineMedias(post, context, options)

  if (inlineMedias.length) {
    const width = Dimensions.get('window').width
    const isQuote = context.quotedPosts.some((p) => p.id === post.id)
    const contentWidth = width - POST_MARGIN - (isQuote ? POST_MARGIN : 0)
    postContent = replaceInlineImages(postContent, inlineMedias, contentWidth)
  }

  const quotedPostId = /* !isQuote &&  */ context.quotes.find(
    (q) => q.quoterPostId === post.id,
  )?.quotedPostId
  const quotedPost = quotedPostId
    ? context.quotedPosts.find((p) => p.id === quotedPostId)
    : undefined
  const ask = getAskData(post, context)
  const poll = context.polls.find((p) => p.postId === post.id)
  const reactions = groupPostReactions(post, context)

  // edition is considered if the post was updated more than 1 minute after it was created
  const isEdited =
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() >
    1000 * 60

  // this proccesses the options "wafrn.mutedWords" and "wafrn.advancedMutedWords"
  const { softMutedWords, hardMutedWords } = getAppliedMute(
    post,
    context,
    options,
  )

  // this proccesses the options "wafrn.disableCW"
  const { contentWarning, initialCWOpen } = processContentWarning(
    post,
    options,
    softMutedWords,
  )

  const isRewoot = isEmptyRewoot(post, context)
  const isHidden = isRewoot || hardMutedWords.length > 0

  if (hardMutedWords.length > 0) {
    console.log(
      '[getDerivedPostState] hiding post becuase of hardMutedWords:',
      hardMutedWords,
    )
  }

  const hiddenLinks = medias
    .filter((m) => m.mediaType === 'text/html')
    .map((m) => m.url)
  if (quotedPost?.remotePostId) {
    hiddenLinks.push(quotedPost.remotePostId)
  }

  let mentionedUsers = [] as PostUser[]
  const isFedi = !!post.remotePostId && !post.bskyUri
  const isReply = !!post.parentId
  if (!isFedi && isReply) {
    const userMap = Object.fromEntries(context.users.map((u) => [u.id, u]))
    const mentionedUserIds = context.mentions
      .filter((m) => m.post === post.id && m.userMentioned !== post.userId)
      .map((m) => m.userMentioned)

    mentionedUsers = Array.from(new Set(mentionedUserIds)).map(
      (id) => userMap[id],
    )
  }

  return {
    user,
    userEmojis,
    postContent,
    tags,
    medias,
    quotedPost,
    ask,
    poll,
    reactions,
    isEdited,
    contentWarning,
    initialCWOpen,
    hiddenLinks,
    mentionedUsers,
    isHidden,
  }
}

export type DerivedThreadData = ReturnType<typeof getDerivedThreadState>

export function getDerivedThreadState(
  thread: Post | PostThread,
  context: DashboardContextData,
  settings?: Settings,
) {
  const isRewoot = isEmptyRewoot(thread, context)
  const isReply = !!thread.parentId && !isRewoot

  const threadAncestorLimit = getPrivateOptionValue(
    settings?.options || [],
    PrivateOptionNames.ThreadAncestorLimit,
  )

  let ancestors = ((thread as PostThread).ancestors || []).sort(sortPosts)
  let interactionPost = thread as Post

  if (isRewoot) {
    const rewootAncestor = ancestors.find((a) => a.id === thread.parentId)
    if (rewootAncestor) {
      interactionPost = { ...rewootAncestor, notes: thread.notes }
      ancestors = ancestors.filter((a) => a.id !== rewootAncestor.id)
    }
  }

  const ancestorLimitReached = ancestors.length >= threadAncestorLimit
  // this is the shape the array will have if thread ancestor limit is not reached (ex. for threads with only or two posts)
  let posts = [...ancestors, interactionPost] as (Post | null)[]
  let morePostsCount = 0
  if (ancestorLimitReached) {
    if (threadAncestorLimit === 1) {
      posts = [interactionPost]
    } else if (threadAncestorLimit === 2) {
      // writing null here so that is what will be extracted as `firstPost` later
      posts = [null, ancestors[ancestors.length - 1], interactionPost]
      morePostsCount = ancestors.length - 1
    } else {
      // the `-1` modifier makes the slice starting from the tail of ancestors
      // the `-2` subtraction accounts for the fact that we are already showing 2 other posts
      // `threadAncestorLimit` is a minimum of 3 in this part of the code, so `tail` will at least have one element
      const tail = ancestors.slice(-1 * (threadAncestorLimit - 2))
      posts = [ancestors[0], ...tail, interactionPost].filter(Boolean)
      morePostsCount = ancestors.length - 2
    }
  }
  const [firstPost, ...threadPosts] = posts

  function isFollowersOnly(post: Post) {
    const privacyIsFollowersOnly = post.privacy === PrivacyLevel.FOLLOWERS_ONLY
    const amIFollowing = settings?.followedUsers?.includes(post.userId)
    return privacyIsFollowersOnly && !amIFollowing
  }

  const postHidden =
    (isRewoot && interactionPost.isDeleted) ||
    isFollowersOnly(thread) ||
    ancestors.some(isFollowersOnly)

  const hiddenUserIds = getHiddenUserIds(settings)
  const userHidden =
    (firstPost ? hiddenUserIds.includes(firstPost.userId) : false) ||
    threadPosts.some((a) => a && hiddenUserIds.includes(a.userId))

  return {
    isRewoot,
    isReply,
    interactionPost,
    postHidden: postHidden || userHidden,
    firstPost,
    threadPosts: threadPosts.filter((t) => !!t),
    morePostsCount,
  }
}
