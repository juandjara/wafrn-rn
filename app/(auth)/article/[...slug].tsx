import ErrorView from '@/components/errors/ErrorView'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import { useArticlePostId } from '@/lib/api/posts'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'

const HEADER_HEIGHT = 72

export default function ArticleRedirect() {
  const sx = useSafeAreaPadding()
  const { slug } = useLocalSearchParams()
  const segments = Array.isArray(slug) ? slug.join('/') : slug
  const { data: postId, error, refetch } = useArticlePostId(segments)

  if (postId) {
    return <Redirect href={`/post/${postId}?isArticle=1`} />
  }

  const header = <Header style={{ height: HEADER_HEIGHT }} title="Article" />

  if (error) {
    return (
      <View className="flex-1">
        {header}
        <ErrorView
          style={{ marginTop: sx.paddingTop + HEADER_HEIGHT + 8 }}
          message={error.message}
          onRetry={refetch}
        />
      </View>
    )
  }

  return (
    <View className="flex-1">
      {header}
      <View style={{ marginTop: sx.paddingTop + HEADER_HEIGHT }}>
        <Loading />
      </View>
    </View>
  )
}
