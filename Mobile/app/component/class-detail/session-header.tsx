import React from 'react'
import { StyleSheet, View } from 'react-native'
import { IconButton, Surface, Text } from 'react-native-paper'

interface Props {
  tenLop?: string,
  teacher?: string,
  onBack: () => void
}

const SessionHeader = ({ tenLop, teacher, onBack }: Props) => {
  return (
    <Surface style={styles.header} elevation={1}>

      <View style={styles.headerRow}>
        <IconButton icon="arrow-left" size={24}
          onPress={onBack}
          style={{ marginLeft: -10 }} />

        <View style={{ flex: 1 }}>
          <Text variant="titleLarge" style={styles.textTitle}>
            {tenLop}</Text>
          <Text variant="bodyMedium" style={{ color: '#2c3e50' }}>
            Giáo viên: {teacher}</Text>
        </View>

      </View>
    </Surface>
  )
}

export default SessionHeader

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 5,
    backgroundColor: '#fff'
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  textTitle: { 
    fontWeight: 'bold', 
    color: '#2c3e50' 
  },
})