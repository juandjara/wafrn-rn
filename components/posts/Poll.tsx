import { PostPoll } from "@/lib/api/posts.types"
import { useParsedToken } from "@/lib/contexts/AuthContext"
import { MaterialIcons } from "@expo/vector-icons"
import clsx from "clsx"
import { useMemo, useState } from "react"
import { View, Text, Pressable } from "react-native"
import colors from "tailwindcss/colors"

export default function Poll({ poll, isLoading, onVote }: {
  poll: PostPoll
  isLoading?: boolean
  onVote: (indexes: number[]) => void
}) {
  const me = useParsedToken()
  const totalVotes = useMemo(() => poll.questionPollQuestions.reduce((acc, q) => acc + q.remoteReplies, 0), [poll])
  const haveIVoted = useMemo(() => (
    isLoading || poll.questionPollQuestions.some((q) => (
      q.questionPollAnswers.some((a) => a.userId === me?.userId)
    ))
  ), [isLoading, poll, me])
  const [localVote, setLocalVote] = useState<number[]>([])
  const isEnded = new Date(poll.endDate) < new Date()
  
  function getIcon(index: number) {
    const question = poll.questionPollQuestions[index]
    const haveIVotedThisOption = question.questionPollAnswers.find((a) => a.userId === me?.userId)
    const hasVote = haveIVotedThisOption || localVote.includes(index)
    if (poll.multiChoice) {
      return hasVote ? "check-box" : "check-box-outline-blank"
    } else {
      return hasVote ? "radio-button-checked" : "radio-button-unchecked"
    }
  }

  function doLocalVote(index: number) {
    if (haveIVoted || isEnded) {
      return
    }

    setLocalVote((prev) => {
      if (poll.multiChoice) {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index)
        } else {
          return [...prev, index]
        }
      } else {
        return [index]
      }
    })
  }

  function getQuestionPercentage(index: number) {
    const question = poll.questionPollQuestions[index]
    return ((question.remoteReplies || 0) / (totalVotes || 1))
  }

  function sendVotes() {
    onVote(localVote.map((i) => poll.questionPollQuestions[i].id))
  }

  return (
    <View className="my-2">
      {poll.questionPollQuestions.map((q, i) => (
        <Pressable
          key={q.id}
          className={clsx(
            'relative border border-gray-600 mb-2 rounded-xl',
            // getQuestionPercentage(i) > 0 ? 'rounded-t-xl' : 'rounded-xl',
            {
              'active:bg-white/20': !haveIVoted,
            },
          )}
          onPress={() => doLocalVote(i)}
        >
          <View className="p-2 flex-row gap-2 items-stretch">
            <MaterialIcons name={getIcon(i)} size={24} color="white" />
            <Text className="text-white flex-grow flex-shrink">{q.questionText}</Text>
            <Text className="text-white">{`${(getQuestionPercentage(i) * 100).toFixed()} %`}</Text>
          </View>
          <View
            className={clsx(
              'absolute -bottom-0.5 left-0 right-0 mx-1',
              getQuestionPercentage(i) === 1 ? 'rounded-b-lg' : 'rounded-bl-lg',
            )}
            style={{
              height: 3,
              backgroundColor: colors.blue[500],
              width: `${getQuestionPercentage(i) * 100}%`
            }}
          />
        </Pressable>
      ))}
      <Pressable
        onPress={sendVotes}
        disabled={haveIVoted || localVote.length === 0}
        className="mt-1 mb-2 p-2 bg-blue-500/75 active:bg-blue-600/50 disabled:bg-white/20 rounded-full"
      >
        <Text className="text-white text-center text-lg">
          {haveIVoted ? "Already voted" : "Vote"}
        </Text>
      </Pressable>
      <Text className="my-2 text-sm text-gray-200">
        {totalVotes} votes - {isEnded ? 'ended' : `ends at ${new Date(poll.endDate).toLocaleString()}`}
      </Text>
    </View>
  )
}
