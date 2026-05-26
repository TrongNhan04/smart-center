import { TepDinhKem } from '@/types/tabs.class.dto'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import ImageView from 'react-native-image-viewing'
import { Card, Icon, Text } from 'react-native-paper'
import ImageMedia from './image.media'
import VideoMedia from './video.media'

interface Props {
  imageList: TepDinhKem[],
  videoList: TepDinhKem[]
}

const SessionMediaCard = ({ imageList, videoList }: Props) => {
  const [visible, setVisible] = useState(false)
  const [currentImgIndex, setCurrentImgIndex] = useState(-1)
  const hasMedia = imageList.length > 0 || videoList.length > 0

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={{ gap: 8 }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon source='album' size={20} color="#E91E63" />
          <Text variant="titleMedium" style={styles.textTitle}>
            Hoạt động
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          
          {hasMedia ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              
              {imageList?.map((item, index) => (
                <ImageMedia // hiển 1 ảnh
                  key={index}
                  imgURL={item.URL}
                  onPress={() => {
                    setCurrentImgIndex(index)
                    setVisible(true)
                  }}
                />
              ))}

              <ImageView // hiện full ảnh 
                key={currentImgIndex}
                visible={visible}
                onRequestClose={() => setVisible(false)}
                imageIndex={currentImgIndex}
                images={imageList ? imageList.map(item => ({ uri: item.URL })) : []}
              />

              {videoList?.map((item, index) =>
                <VideoMedia key={index} src={item.URL} />
              )}

            </ScrollView>
          ) 
          
          : (
            <Text style={{ color: '#95a5a6', fontStyle: 'italic' }}
            >Không có tệp đính kèm cho buổi này.</Text>
          )}
        
        </View>
      </Card.Content>
    </Card>
  )
}

export default SessionMediaCard

const styles = StyleSheet.create({
  textTitle: {
    fontWeight: 'bold',
    color: '#2c3e50'
  },

  card: {
    backgroundColor: '#eceffb',
    borderRadius: 12
  },
})