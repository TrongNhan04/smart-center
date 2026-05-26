import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  src: string
}

const VideoMedia = ({ src }: Props) => {
  const player = useVideoPlayer(src);
  const videoViewRef = useRef<VideoView>(null);

  return (
    <TouchableOpacity onPress={() => videoViewRef.current?.enterFullscreen()}>
      <VideoView
        ref={videoViewRef}
        style={styles.video}
        player={player}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
      />
    </TouchableOpacity>
  )
}

export default VideoMedia

const styles = StyleSheet.create({
  video: {
    width: 150, height: 100, borderRadius: 8,
    marginRight: 10, backgroundColor: '#ddd'
  },
});