import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useCurrentUser } from '@/lib/api/user'
import { useAuth } from '@/lib/contexts/AuthContext'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Link } from 'expo-router'
import { useMemo } from 'react'
import { Button, ScrollView, Text, View } from 'react-native'

export default function BlueskySettings() {
  const sx = useSafeAreaPadding()
  const { data: me } = useCurrentUser()
  const enabled = false //!!me?.bskyDid
  const { env } = useAuth()

  const bskyEmail = useMemo(() => {
    if (!me?.url || !env?.BASE_URL) {
      return ''
    }
    const sanitizedUrl = me?.url?.replaceAll('_', '-').replaceAll('.', '-')
    const domain = new URL(env.BASE_URL).hostname
    return `${sanitizedUrl}@${domain}`
  }, [me, env])

  function enableBluesky() {
    // TODO
  }

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Bluesky Settings" />
      <ScrollView>
        <View className="p-4">
          <Text className="text-white text-lg pb-2">
            Bluesky integration is{' '}
            <Text className="font-bold">
              {enabled ? 'enabled' : 'disabled'}
            </Text>
          </Text>
          {enabled ? (
            <>
              <Text className="text-white text-lg">
                Click{' '}
                <Text className="font-bold underline">
                  <Link href={`https://bsky.app/profile/${me?.bskyDid}`}>
                    here
                  </Link>
                </Text>{' '}
                to check your Bluesky account.
              </Text>
              <Text className="text-white text-lg pt-4">
                You can log in to your Bluesky account using the following
                credentials:
              </Text>
              <View className="p-3 pb-0 gap-2"></View>
              <Text className="text-white text-lg">
                <Text className="font-bold">PDS URL:</Text> at.
                {bskyEmail.split('@')[1]}
              </Text>
              <Text className="text-white text-lg">
                <Text className="font-bold">Email:</Text> {bskyEmail}
              </Text>
              <Text className="text-white text-lg">
                <Text className="font-bold">Password:</Text> your Wafrn password
              </Text>
              <View className="pt-6">
                <Button
                  title="Update Bluesky password"
                  onPress={enableBluesky}
                />
              </View>
              <Text className="text-white text-lg pt-6">
                This button will start a process that will do a couple of
                things:
              </Text>
              <View className="p-3 pb-0 gap-2">
                <Text className="text-white text-lg">
                  · Validate your current Wafrn password.
                </Text>
                <Text className="text-white text-lg">
                  · Update your Bluesky password to match your Wafrn password.
                </Text>
                <Text className="text-white text-lg">
                  · Create or replace a Bluesky "app password" with restricted
                  access. This will be used as a token to link your Wafrn
                  account with the Wafrn PDS.
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text className="text-white text-lg">
                A couple things you need to know before enabling bluesky
                integration:
              </Text>
              <View className="p-3 pb-0 gap-2">
                <Text className="text-white text-lg">
                  · Only posts marked as{' '}
                  <Text className="font-bold">public</Text> will be posted to
                  Bluesky. There is no other visibility option that Bluesky
                  supports right now.
                </Text>
                <Text className="text-white text-lg">
                  · If the corporation does something stupid in the future, the
                  wafrn dev team will do the best we can to protect you
                </Text>
                <Text className="text-white text-lg">
                  · Bluesky does not have an "accept follows" feature like we
                  do. All Bluesky follows are accepted by default.
                </Text>
                <Text className="text-white text-lg">
                  · Some Bluesky posts might be marked as "only people I follow
                  can reply" and we still don't have a working integration for
                  that, but work has started and it will come in the future.
                </Text>
                <Text className="text-white text-lg">
                  · Like with other profiles, we will not save every post of
                  every account by default. We only save as much as we need
                  depending on user interaction.
                </Text>
                <Text className="text-white text-lg"></Text>
              </View>
              <View className="pb-6">
                <Button
                  title="Enable Bluesky integration"
                  onPress={enableBluesky}
                />
              </View>
              <Text className="text-white text-lg pt-3">
                This button will start a process that will do a couple of
                things:
              </Text>
              <View className="p-3 pb-0 gap-2">
                <Text className="text-white text-lg">
                  · Validate your current Wafrn password.
                </Text>
                <Text className="text-white text-lg">
                  · Create a new Bluesky account with the email {bskyEmail} and
                  your Wafrn password.
                </Text>
                <Text className="text-white text-lg">
                  · Create a Bluesky "app password" with restricted access. This
                  will be used as a token to link your Wafrn account with the
                  Wafrn PDS.
                </Text>
              </View>
            </>
          )}
          <Text className="text-white text-lg pt-8 pb-1 font-bold">
            Something not working?
          </Text>
          <Text className="text-white text-lg">
            Keep in mind our bluesky integration is still in active development.
            Some features might not work as expected. You can read more on our{' '}
            <Text className="font-bold underline">
              <Link href="https://wafrn.net/faq/user.html#blueskyIntegration">
                FAQ / User guide
              </Link>
            </Text>{' '}
            to learn the details about our Bluesky integration.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
