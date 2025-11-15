import Header, { HEADER_HEIGHT } from '@/components/Header'
import ReportRibbon from '@/components/ribbons/ReportRibbon'
import UserCard from '@/components/user/UserCard'
import {
  useIgnoreReportMutation,
  useReportList,
  useToggleBanUserMutation,
} from '@/lib/api/admin'
import { PostUser } from '@/lib/api/posts.types'
import {
  Report,
  REPORT_SEVERITY_DESCRIPTIONS,
  REPORT_SEVERITY_LABELS,
} from '@/lib/api/reports'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { clsx } from 'clsx'
import { Link } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Unresolved', value: 'unresolved' },
  { label: 'With post', value: 'with-post' },
  { label: 'Without post', value: 'without-post' },
] as const
type FilterValue = (typeof FILTER_OPTIONS)[number]['value']

export default function ReportList() {
  const sx = useSafeAreaPadding()
  const { data, refetch, isFetching } = useReportList()
  const [filter, setFilter] = useState<FilterValue>('all')

  const filteredData = useMemo(() => {
    return (data ?? []).filter((report) => {
      if (filter === 'all') return true
      if (filter === 'resolved') return report.resolved
      if (filter === 'unresolved') return !report.resolved
      if (filter === 'with-post') return report.postId !== null
      if (filter === 'without-post') return report.postId === null
    })
  }, [data, filter])

  const filterMenu = (
    <Menu renderer={renderers.SlideInMenu}>
      <MenuTrigger>
        <MaterialCommunityIcons name="filter-menu" size={20} color="white" />
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          optionsContainer: {
            paddingBottom: sx.paddingBottom,
          },
        }}
      >
        <Text className="text-gray-700 text-lg font-medium p-4 pb-2">
          Filter
        </Text>
        {FILTER_OPTIONS.map((option) => (
          <MenuOption
            key={option.value}
            onSelect={() => setFilter(option.value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: 16,
            }}
          >
            {filter === option.value ? (
              <MaterialIcons name="radio-button-on" size={20} color="black" />
            ) : (
              <MaterialIcons name="radio-button-off" size={20} color="black" />
            )}
            <Text>{option.label}</Text>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )

  return (
    <View style={{ ...sx, flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Reports" right={filterMenu} />
      <FlashList
        data={filteredData}
        onRefresh={refetch}
        refreshing={isFetching}
        estimatedItemSize={500}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ReportListItem report={item} />}
      />
    </View>
  )
}

function ReportListItem({ report }: { report: Report }) {
  const ignoreReportMutation = useIgnoreReportMutation()
  const banMutation = useToggleBanUserMutation()
  const actionDisabled =
    ignoreReportMutation.isPending || banMutation.isPending || report.resolved

  function banUser() {
    banMutation.mutate({
      isBanned: false, // assume user is not banned previously
      userId: report.reportedUserId,
    })
  }

  return (
    <View className="p-3 bg-gray-800 rounded-lg mb-3">
      <ReportRibbon user={report.user} className="rounded-xl" />
      <View className="mt-4">
        <Text className="text-white">Reported user:</Text>
        <UserCard
          emojis={[]}
          user={report.reportedUser as PostUser}
          showFollowButtons={false}
        />
      </View>
      {report.postId ? (
        <Link
          href={`/post/${report.postId}`}
          className="text-blue-400 active:text-blue-600"
        >
          See post
        </Link>
      ) : null}
      <View className="mt-4 mb-2">
        <Text className="text-white mb-2">
          Severity:{' '}
          <Text className="text-gray-300">
            {REPORT_SEVERITY_LABELS[report.severity]}
          </Text>
        </Text>
        <View className="py-2 px-3 bg-gray-700 rounded-md">
          {/* <Text className="text-white text-sm mb-2">{}</Text> */}
          <Text className="text-white">
            {REPORT_SEVERITY_DESCRIPTIONS[report.severity]}
          </Text>
        </View>
      </View>
      <View className="my-4">
        <Text className="text-white mb-2">Description:</Text>
        <View className="py-2 px-3 bg-gray-700 rounded-md">
          <Text className="text-white">{report.description}</Text>
        </View>
      </View>
      {report.resolved ? (
        <Text className="text-white py-2 text-center">Report resolved</Text>
      ) : null}
      <View className="flex-row pt-4 gap-3 pr-3">
        <Pressable
          disabled={actionDisabled}
          className={clsx(
            'flex-row w-1/2 items-center gap-3 rounded-lg p-2',
            'bg-cyan-700/50',
            {
              'active:bg-cyan-700/75': !actionDisabled,
              'opacity-50': actionDisabled,
            },
          )}
          onPress={() => ignoreReportMutation.mutate(report.id)}
        >
          <MaterialCommunityIcons name="check" size={20} color="white" />
          <Text className="text-white">Ignore report</Text>
        </Pressable>
        <Pressable
          disabled={actionDisabled}
          className={clsx(
            'flex-row w-1/2 items-center gap-3 rounded-lg p-2',
            'bg-red-700/50',
            {
              'active:bg-red-700/75': !actionDisabled,
              'opacity-50': actionDisabled,
            },
          )}
          onPress={banUser}
        >
          <MaterialCommunityIcons name="close" size={20} color="white" />
          <Text className="text-white">Ban user</Text>
        </Pressable>
      </View>
    </View>
  )
}
