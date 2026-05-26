import { SessionOfStu } from '@/types/tabs.class.dto'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Card, Text } from 'react-native-paper'

interface Props {
  detail: SessionOfStu
}

const SessionInfoCard = ({ detail }: Props) => {

  const formatDiemDanh = (attend: boolean | null) => {
    if (attend === null) return '---'
    return attend ? 'Có mặt' : 'Vắng mặt'
  }

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={{ gap: 8 }}>
        <View style={styles.view}>
          <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Học viên:</Text>
          <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
            {detail.HocVien}
          </Text>
        </View>

        <View style={styles.view}>
          <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Buổi số:</Text>
          <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
            {detail.BuoiSo}
          </Text>
        </View>

        {/* Trạng thái buổi học */}
        <View style={styles.view}>
          <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Trạng thái:</Text>
          <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
            {detail.TrangThai}
          </Text>
        </View>

        {/* Thời gian */}
        <View style={styles.view}>
          <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Thời gian:</Text>
          <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
            {detail.NgayHoc}, {detail.GioHoc}
          </Text>
        </View>

        {/* Điểm danh  */}
        <View style={styles.view}>
          <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Điểm danh:</Text>
          <Text
            variant="titleMedium"
            style={{
              fontWeight: 'bold',
              color: detail.DiemDanh ? '#27ae60' : '#e74c3c'
            }}
          >
            {formatDiemDanh(detail.DiemDanh)}
          </Text>
        </View>

        {/* Điểm số */}
        <View style={styles.view}>
          <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Điểm số:</Text>
          <Text variant="titleMedium"
            style={{ fontWeight: 'bold', color: '#3498db' }}>
            {detail.DiemSo ? `${detail.DiemSo} điểm` : '---'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  )
}

export default SessionInfoCard

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#eceffb',
    borderRadius: 12
  },

  view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
})