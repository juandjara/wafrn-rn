import { useVideoPlayer, VideoView } from "expo-video";

export default function Video({ isAudioOnly = false, src, width, height }: {
  isAudioOnly?: boolean
  src: string
  width: number
  height: number
}) {
  const videoPlayer = useVideoPlayer(src)
  return (
    <VideoView
      style={{ width, height }}
      player={videoPlayer}
      allowsFullscreen
    />
  )
}
