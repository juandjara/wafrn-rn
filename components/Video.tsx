import { useEventListener } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useMemo, useState, useEffect } from 'react'
import { Pressable, View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

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
  const [showControls, setShowControls] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const source = useMemo(
    () => ({
      uri: src,
      metadata: {
        title: title ?? `WAFRN ${isAudioOnly ? 'audio' : 'video'}`,
      },
    }),
    [src, title, isAudioOnly],
  )

  const player = useVideoPlayer(source, (p) => {
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
    p.loop = true
    p.timeUpdateEventInterval = 1
    return p
  })

  useEventListener(player, 'playingChange', (ev) => setIsPlaying(ev.isPlaying))
  useEventListener(player, 'timeUpdate', (ev) => setCurrentTime(ev.currentTime))
  useEventListener(player, 'sourceLoad', (ev) => setDuration(ev.duration))

  function togglePlay() {
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
  }

  function toggleMute() {
    if (volume > 0) {
      setVolume(0)
      player.volume = 0
    } else {
      setVolume(1)
      player.volume = 1
    }
  }

  function skipForward() {
    player.seekBy(5)
  }

  function skipBackward() {
    player.seekBy(-5)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showControls && isPlaying) {
        setShowControls(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [showControls, isPlaying])

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Pressable
      className={className}
      onPress={() => setShowControls(!showControls)}
    >
      <VideoView
        nativeControls={false}
        style={{ width, height }}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
      {showControls && (
        <View className="absolute inset-0 bg-black/50 justify-between p-4">
          <View className="flex-1 justify-center items-center">
            <View className="flex-row items-center gap-5">
              <TouchableOpacity
                onPress={skipBackward}
                className="bg-black/70 rounded-full p-4"
              >
                <Ionicons name="play-back" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={togglePlay}
                className="bg-black/70 rounded-full p-5"
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={skipForward}
                className="bg-black/70 rounded-full p-4"
              >
                <Ionicons name="play-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-white flex-shrink">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity onPress={toggleMute}>
                <Ionicons
                  name={volume > 0 ? 'volume-high' : 'volume-mute'}
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  )
}
