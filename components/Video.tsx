import { useVideoPlayer, VideoView } from 'expo-video'
import { useMemo } from 'react'
import { View } from 'react-native'

export default function Video({
  title,
  isAudioOnly = false,
  src,
  width,
  height,
  className,
}: {
  isAudioOnly?: boolean
  src: string
  width: number
  height: number
  title?: string
  className?: string
}) {
  const source = useMemo(
    () => ({
      uri: src,
      metadata: {
        title: title ?? `WAFRN ${isAudioOnly ? 'audio' : 'video'}`,
      },
    }),
    [src, title, isAudioOnly],
  )

  const videoPlayer = useVideoPlayer(source, (p) => {
    p.staysActiveInBackground = true
    p.addListener('playingChange', (ev) => {
      if (ev.isPlaying) {
        p.showNowPlayingNotification = true
      }
    })
    p.addListener('playToEnd', () => {
      p.showNowPlayingNotification = false
    })
    p.bufferOptions = {
      preferredForwardBufferDuration: 2, // only buffer the first 2 seconds
    }
    return p
  })

  return (
    <View
      className={className}
      onStartShouldSetResponder={() => true}
      onTouchEnd={(ev) => {
        ev.stopPropagation()
      }}
    >
      <VideoView
        style={{ width, height }}
        player={videoPlayer}
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  )
}
