import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { ReactVideoSource, Video } from 'react-native-video'
import Loading from './Loading'

export default function VideoPlayer({
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
    () =>
      ({
        uri: src,
        metadata: {
          title: title ?? `WAFRN ${isAudioOnly ? 'audio' : 'video'}`,
        },
        bufferConfig: {
          minBufferMs: 5000, // try to have at least 5 seconds of buffer after current position
          maxBufferMs: 10000, // try to have at most 10 seconds of buffer after current position
          bufferForPlaybackMs: 2000, // must get 2 seconds of buffer before first playback
          bufferForPlaybackAfterRebufferMs: 4000, // must get 4 seconds of buffer before rebuffer
          backBufferDurationMs: 30000, // try to keep at most 30 seconds of buffer before current position
          cacheSizeMB: 0, // disable cache (only in android)
        },
      } satisfies ReactVideoSource),
    [src, title, isAudioOnly],
  )
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <View
      className={className}
      onStartShouldSetResponder={() => true}
      onTouchEnd={(ev) => {
        ev.stopPropagation()
      }}
    >
      <Video
        source={source}
        style={{ width, height }}
        resizeMode="contain"
        paused={true}
        repeat={true}
        renderLoader={() => <Loading />}
        controls
        playInBackground
        showNotificationControls={isPlaying}
        onPlaybackStateChanged={(state) => setIsPlaying(state.isPlaying)}
      />
    </View>
  )
}
