import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  index: number,
  imgURL: string
}

const ImageMedia = ({imgURL, index}:Props) => {
  const [visible, setVisible] = useState(false)
  const [currentImgIndex, setCurrentImgIndex] = useState(-1)
  const [images, setImages] = useState<string[]>([])

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setCurrentImgIndex(index)
          setVisible(true)
          setImages([...images, imgURL])
        }}>
        <Image
          style={styles.image}
          //key={index}
          source={{ uri: imgURL }}
        />
      </TouchableOpacity>
      {/* <ImageView
        key={currentImgIndex}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        imageIndex={currentImgIndex}
        images={images.map(item=>({uri: item}))}
      /> */}
    </>
  )
}

export default ImageMedia

const styles = StyleSheet.create({
  image: {
    width: 150, height: 100, borderRadius: 8,
    marginRight: 10, backgroundColor: '#ddd'
  }
})