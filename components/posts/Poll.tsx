import { PostPoll } from '@/lib/api/posts.types'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { MaterialIcons } from '@expo/vector-icons'
import clsx from 'clsx'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import colors from 'tailwindcss/colors'

export default function Poll({
  poll,
  isLoading,
  interactable,
  postId,
  onVote,
}: {
  poll: PostPoll
  isLoading?: boolean
  interactable?: boolean
  postId: string
  onVote: (votes: number[]) => void
}) {
  const me = useParsedToken()

  const { totalVotes, haveIVoted, questionMap, sortedQuestions } =
    useMemo(() => {
      const totalVotes = poll.questionPollQuestions.reduce(
        (acc, q) => acc + q.remoteReplies,
        0,
      )
      const haveIVoted = poll.questionPollQuestions.some((q) =>
        q.questionPollAnswers.some((a) => a.userId === me?.userId),
      )
      const questionMap = Object.fromEntries(
        poll.questionPollQuestions.map((q) => [q.id, q]),
      )
      const sortedQuestions = poll.questionPollQuestions.sort(
        (a, b) => a.id - b.id,
      )
      return { totalVotes, haveIVoted, questionMap, sortedQuestions }
    }, [poll, me])

  // localVote contains the ids of the questions that the user is voting for
  const [localVote, setLocalVote] = useState<number[]>([])

  const isEnded = new Date(poll.endDate) < new Date()
  const canIVote = !haveIVoted && !isLoading && !isEnded

  let buttonLabel = 'Vote'
  if (haveIVoted) {
    buttonLabel = 'Already voted'
  }
  if (isEnded) {
    buttonLabel = 'Poll ended'
  }

  function getIcon(id: number) {
    const question = questionMap[id]
    const haveIVotedThisOption = question.questionPollAnswers.find(
      (a) => a.userId === me?.userId,
    )
    const hasVote = haveIVotedThisOption || localVote.includes(id)
    if (poll.multiChoice) {
      return hasVote ? 'check-box' : 'check-box-outline-blank'
    } else {
      return hasVote ? 'radio-button-checked' : 'radio-button-unchecked'
    }
  }

  function doLocalVote(id: number) {
    if (!canIVote) {
      return
    }

    if (!interactable) {
      router.push(`/post/${postId}`)
      return
    }

    setLocalVote((prev) => {
      if (poll.multiChoice) {
        if (prev.includes(id)) {
          return prev.filter((i) => i !== id)
        } else {
          return [...prev, id]
        }
      } else {
        return [id]
      }
    })
  }

  function getQuestionPercentage(id: number) {
    const question = questionMap[id]
    return (question.remoteReplies || 0) / (totalVotes || 1)
  }

  function sendVotes() {
    onVote(localVote)
  }

  return (
    <View className="my-2">
      {sortedQuestions.map((q) => (
        <Pressable
          key={q.id}
          className={clsx('relative border border-gray-600 mb-2 rounded-xl', {
            'active:bg-white/20': canIVote,
          })}
          onPress={() => doLocalVote(q.id)}
        >
          <View className="p-2 flex-row gap-2 items-stretch">
            <MaterialIcons name={getIcon(q.id)} size={24} color="white" />
            <Text className="text-white flex-grow flex-shrink">
              {q.questionText}
            </Text>
            <Text className="text-white">{`${(
              getQuestionPercentage(q.id) * 100
            ).toFixed()} %`}</Text>
          </View>
          <View
            className={clsx(
              'absolute -bottom-0.5 left-0 right-0 mx-1',
              getQuestionPercentage(q.id) === 1
                ? 'rounded-b-lg'
                : 'rounded-bl-lg',
            )}
            style={{
              height: 3,
              backgroundColor: colors.blue[500],
              width: `${getQuestionPercentage(q.id) * 100}%`,
            }}
          />
        </Pressable>
      ))}
      <Pressable
        onPress={sendVotes}
        disabled={!canIVote || localVote.length === 0}
        className="mt-1 mb-2 p-2 bg-blue-500/75 active:bg-blue-600/50 disabled:bg-white/20 rounded-full"
      >
        <Text className="text-white text-center text-lg">{buttonLabel}</Text>
      </Pressable>
      <Text className="my-2 text-sm text-gray-200">
        {totalVotes} votes -{' '}
        {isEnded
          ? 'ended'
          : `ends at ${new Date(poll.endDate).toLocaleString()}`}
      </Text>
    </View>
  )
}
