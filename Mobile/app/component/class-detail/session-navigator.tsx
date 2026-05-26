import { SessionIds } from '@/types/tabs.class.dto'
import React from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Surface, Text } from 'react-native-paper'

interface Props {
  arrSessionId: SessionIds[],
  selectedId: number,
  onSelected: (sessionId: number) => void
}

const SessionNavigator = ({ arrSessionId, selectedId, onSelected }: Props) => {
  return (
    <Surface style={styles.bottomNav} elevation={1}>
      <Text variant="labelSmall"
        style={{ paddingHorizontal: 16, paddingTop: 8, color: '#7f8c8d' }}>
        Chọn buổi học:
      </Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 10 }}
      >
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          justifyContent: 'center', gap: 7,
        }}>
          {arrSessionId.length ? arrSessionId?.map((session, index) => {
            const isSelected = session.ID === selectedId
            return (
              <TouchableOpacity
                key={index}
                onPress={() => onSelected(session.ID)}
                // style này bao bên ngoài
                style={[styles.navSquare, isSelected && styles.navSquareActive]}
              >
                <Text // style này là số bên trong
                  style={[styles.navText, isSelected && styles.navTextActive]}>
                  {session.BuoiSo}
                </Text>
              </TouchableOpacity>
            )
          }) : <Text>Lớp học chưa tạo buổi học</Text>}
        </View>
      </ScrollView>
    </Surface>
  )
}

export default SessionNavigator

const styles = StyleSheet.create({
  bottomNav: { backgroundColor: '#fff', height: 126 },
  
  navSquare: {
    width: 38, height: 38, borderRadius: 5,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#dcdde1'
  },
  
  navSquareActive: {
    backgroundColor: '#3498db', // Màu xanh khi được chọn
    borderColor: '#3498db',
  },
  
  navText: { fontSize: 16, fontWeight: 'bold', color: '#7f8c8d' },
  
  navTextActive: { color: '#fff' }
})