import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Divider, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mobileApi from '../api';

interface NotisDB {
  ID: string,
  TieuDe: string,
  NoiDung: string,
  Loai: string,
  DuLieu: JSON,
  DaDoc: boolean,
  Icon?: string,
  IconColor: string,
  CreatedAt: string
}


const Notis = () => {
  const [notifications, setNotifications] = useState<NotisDB[]>([])
  const [refresh, setRefresh] = useState(false)

  const fetchNotis = async () => {
    try {
      const res = await mobileApi.getNotis()

      const formated = res.data.items.map((item: NotisDB) => {
        let icon = ''
        let iconColor = ''
        switch (item.Loai) {
          case 'SESSION_RESULT':
            icon = 'clipboard-check-outline'
            iconColor = '#28a745'
            break
          case 'INVOICE':
          case 'RECEIPT':
            icon = 'receipt'
            iconColor = '#f39c12'
            break
          case 'SESSION_CANCEL':
            icon = 'calendar-remove-outline'
            iconColor = '#dc3545'
            break
          default:
            icon = 'information-outline'
            iconColor = '#2596be'
        }
        return {
          ...item,
          Icon: icon,
          IconColor: iconColor
        }
      })

      setNotifications(formated)
      // console.log(res.data.items)
    } catch (error) {
      Alert.alert('Thông báo', 'Lỗi tải thông báo!');
      console.log('Có lỗi xảy ra: ', error)
    }
  }

  useEffect(() => {
    fetchNotis()
  }, [])

  const handleRefresh = async () => {
    setRefresh(true)
    await fetchNotis()
    setRefresh(false)
  }

  const renderItem = ({ item }: any) => (
    <List.Item
      title={item.TieuDe} 
      titleStyle={{ fontWeight: item.DaDoc ? 'normal' : 'bold' }}
      // description={`${item.NoiDung}\n${item.CreatedAt}`}
      description={`${item.NoiDung}`}
      descriptionNumberOfLines={2} // tối đa 2 dòng

      left={props => (
        <List.Icon {...props} icon={item.Icon} color={item.IconColor}
        />
      )}

      style={{ backgroundColor: item.DaDoc ? '#fff' : '#f0f8ff' }}
    />
  )

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="titleLarge" style={{ padding: 23, fontWeight: 'bold' }}>
        Thông báo
      </Text>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.ID}
        ItemSeparatorComponent={() => <Divider />}

        refreshing={refresh}
        onRefresh={handleRefresh}

        ListEmptyComponent={
          <View>
            <Text style={{ color: 'gray' }}>Không có thông báo nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

export default Notis

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // alignItems: 'center',
    // justifyContent: 'center'
  },
  // text: {
  //   color: #25292e
  // },
  // button: {
  //   fontSize: 20,
  //   textDecorationLine: 'underline',
  //   color: '#25292e'
  // }
})