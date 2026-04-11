import NotisDB from '@/types/tabs.notis.dto';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { Avatar, Divider, IconButton, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mobileApi from '../api';

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
    } catch (error) {
      Alert.alert('Thông báo', 'Lỗi tải thông báo!');
      console.log('Có lỗi xảy ra: ', error)
    }
  }

  useEffect(() => {
    fetchNotis()
  }, [])

  const formatTime = (str: string) => new Date(str)
    .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    .replace('-', '/')

  const handleRefresh = async () => {
    setRefresh(true)
    await fetchNotis()
    setRefresh(false)
  }

  const handleReadNotis = async (id?: number) => {
    try {
      if(id) await mobileApi.readOneNotis(id)
      else await mobileApi.readAllNotis()
      fetchNotis()
    } catch (error) {
      Alert.alert('Thông báo', 'Lỗi tải thông báo!');
      console.log('Có lỗi xảy ra: ', error)
    }
  }

  const renderItem = ({ item }: any) => {
    return (
      <List.Item
        key={item.ID}
        onPress={() => handleReadNotis(item.ID)}
        title={item.TieuDe}
        titleStyle={{
          fontWeight: item.DaDoc ? '400' : 'bold',
          color: item.DaDoc ? '#595959' : '#1a1a1a'
        }}
        description={item.NoiDung}
        descriptionNumberOfLines={2}

        // dùng avatar.icon để có hình tròn bao quanh icon
        left={props => (
          <View style={{ justifyContent: 'center', paddingLeft: 8 }}>
            <Avatar.Icon
              {...props} icon={item.Icon || 'bell-outline'}
              size={40} color="#fff"
              style={{ backgroundColor: item.IconColor || '#3498db' }}
            />
          </View>
        )}

        // right này của listItem để hiển thị ngày có thông báo
        right={() => (
          <View style={{
            justifyContent: 'center', alignItems: 'flex-end',
            paddingRight: 8
          }}>
            <Text variant="labelMedium"
              style={{
                fontWeight: item.DaDoc ? '400' : 'bold',
                color: item.DaDoc ? '#595959' : '#1a1a1a',
                marginBottom: 4
              }}>
              {formatTime(item.ThoiGian) || 'Vừa xong'}
            </Text>
          </View>
        )}

        //đổi màu cho tin chưa đọc
        style={{
          backgroundColor: item.DaDoc ? '#fff' : '#f0f7ff',
          paddingVertical: 8
        }}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      {/* Header có thêm nút đánh dấu đã đọc hết */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingRight: 8
      }}>
        <Text variant="headlineSmall"
          style={{ padding: 20, fontWeight: 'bold' }}>
          Thông báo
        </Text>
        <IconButton
          icon="check-all"
          size={20}
          onPress={() => handleReadNotis()}
        />
      </View>
      <Divider/>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.ID.toString()}
        ItemSeparatorComponent={() =>
          <Divider style={{ backgroundColor: '#f0f0f0' }} />}

        refreshing={refresh}
        onRefresh={handleRefresh}

        // múa may 1 xíu nếu không có thông báo nào hết
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', marginTop: 100, gap: 12 }}>
            <Avatar.Icon
              icon="bell-off-outline" size={80}
              style={{ backgroundColor: '#f5f5f5' }} color="#d9d9d9"
            />
            <Text variant="bodyLarge" style={{ color: '#bfbfbf' }}>
              Bạn không có thông báo nào
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default Notis