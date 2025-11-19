import Header from '@/components/Header'
import { Colors } from '@/constants/Colors'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { ScrollView, Text, View } from 'react-native'

export default function Privacy() {
  const sx = useSafeAreaPadding()

  return (
    <View
      style={{
        ...sx,
        flex: 1,
        paddingTop: sx.paddingTop + 60,
        backgroundColor: Colors.dark.background,
      }}
    >
      <Header title="Privacy" />
      <ScrollView>
        <Text className="text-white text-lg p-4">
          Rules:
          {'\n\n'}
          Dont be a nazi asshole. Dont harrass other people. Put CW on adult
          things and go nuts, make nuts, show nuts.
          {'\n\n'}
          Regarding our privacy policy:
          {'\n\n'}
          We do not use cookies nor third party analytic tools.
          {'\n\n'}
          Regarding what we will do with your data:
          {'\n\n'}
          We are connected with other social networks, so your posts and your
          images could be automatically stored in other servers. Your URL, your
          blog name and your avatar are public information. Your birth date,
          email and password are private and only get stored in our server.
          {'\n\n'}
          We will store your email and every once in a while send you a small
          campaing so you come back and commit some shitposts (please).
          {'\n\n'}
          We need your birth date for legal reasons. Mostly to verify that you
          are older than 13 for the legal regulations here, and older than 18 to
          see images marked as NSFW. If {"you're"} under 18 please ask your
          parents or legal tutors.
          {'\n\n'}
          We will also store your registration IP, your last login ip and the ip
          that you use when you upload a media like pic or video, so if you post
          something illegal we can comply with the authorities.
          {'\n\n'}
          If your account does not get activated in a period between a month and
          a year it might get deleted.
          {'\n\n'}
          If you want to get all the data we have about you, or there is any
          problem regarding the GDPR please email us at info@wafrn.net. This is
          a manual process and can take some time.
        </Text>
      </ScrollView>
    </View>
  )
}
