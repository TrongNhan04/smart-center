import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  onPress: () => void,
  imgURL: string
}

const ImageMedia = ({ imgURL, onPress }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}>
      <Image
        style={styles.image}
        source={{ uri: imgURL }}
      />
    </TouchableOpacity>
  )
}

export default ImageMedia

const styles = StyleSheet.create({
  image: {
    width: 150, height: 100, borderRadius: 8,
    marginRight: 10, backgroundColor: '#ddd'
  }
})