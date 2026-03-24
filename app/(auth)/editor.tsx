import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import {
  generateValueFromMentionStateAndChangedText,
  isTriggerConfig,
  useMentions,
} from 'react-native-more-controlled-mentions'
import { useCreatePostMutation } from '@/lib/api/posts'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import PostFragment from '@/components/dashboard/PostFragment'
import EditorHeader from '@/components/editor/EditorHeader'
import EditorActions, {
  EditorActionProps,
} from '@/components/editor/EditorActions'
import ImageList from '@/components/editor/EditorImages'
import EditorInput from '@/components/editor/EditorInput'
import { useMediaUploadMutation } from '@/lib/api/media'
import { formatMediaUrl } from '@/lib/formatters'
import {
  clearSelectionRangeFormat,
  EDITOR_TRIGGERS_CONFIG,
  getTextFromMentionState,
} from '@/lib/api/content'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { EditorFormState, EditorImage, useEditorData } from '@/lib/editor'
import Loading from '@/components/Loading'
import { PostUser } from '@/lib/api/posts.types'
import { useCSSVariable } from 'uniwind'
import { Colors } from '@/constants/Colors'
import AskCard from '@/components/posts/Ask'
import PostingAsSelector from '@/components/editor/PostingAsSelector'
import PrivacySelect from '@/components/PrivacySelect'
import { useAuth } from '@/lib/contexts/AuthContext'
import { PRIVACY_ORDER, PrivacyLevel } from '@/lib/api/privacy'

export default function EditorView() {
  const {
    ask,
    reply,
    context,
    formState,
    params,
    disableForceAltText,
    isLoading,
    mentionedUsers,
    replyLabel,
    privacySelectDisabled,
  } = useEditorData()
  const gray300 = useCSSVariable('--color-gray-300') as string
  const sx = useSafeAreaPadding()
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [_mentions, setMentions] = useState<PostUser[]>([])
  const [_form, setForm] = useState<EditorFormState | null>(null)

  const mentions = _mentions.length > 0 ? _mentions : mentionedUsers
  const form = _form || formState

  function update<T extends keyof EditorFormState>(
    key: T,
    value: (typeof form)[T] | ((prev: (typeof form)[T]) => (typeof form)[T]),
  ) {
    // disable updates if initial editor data is still loading
    if (!isLoading) {
      const newValue = typeof value === 'function' ? value(form[key]) : value
      setForm((_prev) => {
        const prev = _prev || formState
        return { ...prev, [key]: newValue }
      })
    }
  }

  function deleteMention(id: string) {
    setMentions(mentions.filter((u) => u.id !== id))
  }

  const uploadMutation = useMediaUploadMutation()
  const createMutation = useCreatePostMutation()

  function canPublish() {
    if (createMutation.isPending || uploadMutation.isPending) {
      return false
    }
    const invalidMedias = form.medias.some((m) => {
      return disableForceAltText ? false : !m.description
    })
    if (invalidMedias) {
      return false
    }
    return (
      form.content.length > 0 ||
      form.tags.length > 0 ||
      form.medias.length > 0 ||
      form.contentWarning.length > 0
    )
  }

  const mentionApi = useMentions({
    value: form.content,
    onChange: (value) => update('content', value),
    triggersConfig: EDITOR_TRIGGERS_CONFIG,
    onSelectionChange: setSelection,
  })

  const maxPrivacy = reply?.posts[0].privacy

  function onPublish() {
    if (!canPublish()) {
      return
    }

    Keyboard.dismiss()

    const text = getTextFromMentionState(mentionApi.mentionState)
    const editorMentionedUserIds = mentionApi.mentionState.parts
      .filter(
        (p) =>
          p.data?.id &&
          p.config &&
          isTriggerConfig(p.config) &&
          p.config.trigger === '@',
      )
      .map((p) => {
        try {
          const url = new URL(p.data!.id)
          return url.searchParams.get('id')
        } catch (err) {
          console.error(err)
          return ''
        }
      })
      .filter((s) => !!s) as string[]

    const mentionedUserIds = Array.from(
      new Set([...editorMentionedUserIds, ...mentions.map((u) => u.id)]),
    )

    createMutation.mutate({
      content: text,
      parentId: params.type === 'reply' ? params.replyId : undefined,
      askId: params.type === 'ask' ? params.askId : undefined,
      quotedPostId: params.type === 'quote' ? params.quoteId : undefined,
      editingPostId: params.type === 'edit' ? params.editId : undefined,
      contentWarning: form.contentWarningOpen ? form.contentWarning : undefined,
      privacy: form.privacy,
      joinedTags: form.tags,
      medias: form.medias.map((m) => ({
        id: m.id!,
        uri: m.uri,
        width: m.width,
        height: m.height,
        description: m.description || '',
        NSFW: m.NSFW || false,
      })),
      mentionedUserIds,
      postingAccountId: form.postingAs,
      canQuote: form.canQuote,
      canReply: form.canReply,
    })
  }

  const actions = {
    insertCharacter: (character: string) => {
      const text = mentionApi.mentionState.plainText
      const textBeforeCursor = text.substring(0, selection.start)
      const textAfterCursor = text.substring(selection.end)
      const newText = `${textBeforeCursor}${character}${textAfterCursor}`
      update(
        'content',
        generateValueFromMentionStateAndChangedText(
          mentionApi.mentionState,
          newText,
        ),
      )
    },
    wrapSelection: (start: string, end?: string) => {
      const text = mentionApi.mentionState.plainText
      const textBeforeCursor = text.substring(0, selection.start)
      const textInCursor = text.substring(selection.start, selection.end)
      if (!textInCursor) {
        return
      }
      const textAfterCursor = text.substring(selection.end)
      const newText = `${textBeforeCursor}${start}${textInCursor}${
        end || start
      }${textAfterCursor}`
      update(
        'content',
        generateValueFromMentionStateAndChangedText(
          clearSelectionRangeFormat(mentionApi.mentionState, selection),
          newText,
        ),
      )
    },
    addImages: (images: EditorImage[]) => {
      update('medias', (prev) => prev.concat(images))
      uploadMutation.mutate(
        images.map((a) => ({
          uri: a.uri,
          type: a.mimeType!,
          name: a.fileName!,
        })),
        {
          onSuccess: (data, variables) => {
            // on success, update the images with the new data
            const inputUris = variables.map((v) => v.uri)
            const otherMedias = form.medias.filter(
              (m) => !inputUris.includes(m.uri),
            )

            const newMedias = images.map((m) => {
              const dataIndex = variables.findIndex((v) => v.uri === m.uri)
              return {
                ...m,
                uri: formatMediaUrl(data[dataIndex].url || ''),
                id: data[dataIndex].id,
              }
            })

            update('medias', otherMedias.concat(newMedias))
          },
          onError: () => {
            // on error, remove from the list the images that we were trying to upload
            update('medias', (prevMedias) => {
              return (prevMedias as EditorImage[]).filter(
                (m) => !images.find((a) => a.uri === m.uri),
              )
            })
          },
        },
      )
    },
    toggleCW: () => {
      update('contentWarningOpen', !form.contentWarningOpen)
    },
    setPostingAs: (userId: string) => update('postingAs', userId),
    onInteractionControlChange: ({ canQuote, interactionControl }) => {
      update('canQuote', canQuote)
      update('canReply', interactionControl)
    },
  } satisfies EditorActionProps['actions']

  const { env } = useAuth()

  const enableDrafts = env?.ENABLE_DRAFTS
  const privacyOptions = enableDrafts
    ? PRIVACY_ORDER
    : PRIVACY_ORDER.filter((p) => p !== PrivacyLevel.DRAFT)

  return (
    <DashboardContextProvider data={context}>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          marginTop: sx.paddingTop,
          marginBottom: sx.paddingBottom,
          backgroundColor: Colors.dark.background,
        }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <EditorHeader
          isLoading={createMutation.isPending}
          canPublish={canPublish()}
          onPublish={onPublish}
        />
        <ScrollView
          id="editor-scroll"
          className="grow-0 pb-1"
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View className="absolute inset-0 flex-1 justify-center items-center">
              <Loading />
            </View>
          ) : null}
          {mentions.length > 0 && (
            <ScrollView
              horizontal
              contentContainerClassName="gap-3"
              className="shrink-0 grow-0 m-2"
            >
              {mentions.map((u) => (
                <View
                  key={u.id}
                  className="rounded-lg border border-gray-700 pl-2 flex-row items-center gap-2"
                >
                  <Text className="text-sm text-cyan-500">{u.url}</Text>
                  <Pressable
                    className="rounded-md bg-white/5 p-1"
                    onPress={() => deleteMention(u.id)}
                  >
                    <MaterialIcons name="close" size={20} color={gray300} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
          <EditorInput
            {...mentionApi}
            formState={form}
            updateFormState={update}
            selection={selection}
            mentionState={mentionApi.mentionState}
            disabled={isLoading}
            onSelectionChange={setSelection}
          />
          <ImageList
            images={form.medias}
            setImages={(images) => update('medias', images)}
            disableForceAltText={disableForceAltText}
          />
          <View className="mx-2 mb-1 mt-3 rounded-lg bg-indigo-950">
            <View className="flex-row items-center px-3 py-2 gap-2">
              <PostingAsSelector
                selectedUserId={form.postingAs}
                setSelectedUserId={(userId) => {
                  setForm({ ...form, postingAs: userId })
                }}
              />
              <Text className="text-white text-sm">is {replyLabel}</Text>
              <View className="grow" />
              <Text className="text-white text-sm">in</Text>
              <View className="shrink">
                <PrivacySelect
                  options={privacyOptions}
                  privacy={form.privacy}
                  setPrivacy={(p: PrivacyLevel) => {
                    setForm({ ...form, privacy: p })
                  }}
                  maxPrivacy={maxPrivacy}
                  disabled={privacySelectDisabled}
                  invertMaxPrivacy={params.type === 'edit'}
                />
              </View>
            </View>
            {reply ? (
              <View className="border-t border-gray-600">
                <PostFragment
                  post={reply.posts[0]}
                  collapsible={false}
                  clickable={false}
                  hasCornerMenu={false}
                />
              </View>
            ) : null}
            {ask ? <AskCard className="m-2 mt-1" ask={ask} /> : null}
          </View>
        </ScrollView>
        <EditorActions actions={actions} form={form} />
      </KeyboardAvoidingView>
    </DashboardContextProvider>
  )
}
