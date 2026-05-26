import { SessionOfStu } from '@/types/tabs.class.dto'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Card, Icon, Text } from 'react-native-paper'

interface Props {
  detail: SessionOfStu
}

const SessionContentCard = ({detail}:Props) => {
  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={{ gap: 10 }}>
        {/* chủ đề bài học */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon source="lightbulb-on" size={22} color="#f39c12" />
            <Text variant="titleMedium" style={styles.textTitle}>
              Bài học
            </Text>
          </View>
          <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
            {detail.BaiHoc}
          </Text>
        </View>

        {/* Nội dung bài học */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon source="book-open-variant" size={20} color="#3498db" />
            <Text variant="titleMedium" style={styles.textTitle}>
              Nội dung
            </Text>
          </View>
          <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
            {detail.NoiDung}
          </Text>
        </View>

        {/* Bài tập về nhà */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon source="notebook-edit" size={20} color="#9b59b6" />
            <Text variant="titleMedium" style={styles.textTitle}>
              Bài tập về nhà
            </Text>
          </View>
          <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
            {detail.BaiTap}
          </Text>
        </View>

        {/* Nhận xét của giáo viên */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon source="comment-text" size={20} color="#27ae60" />
            <Text variant="titleMedium" style={styles.textTitle}>
              Nhận xét của giáo viên
            </Text>
          </View>
          <View >
            <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
              {detail.NhanXet}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

export default SessionContentCard

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