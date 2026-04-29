import mobileApi from '@/app/api';
import useAuthStore from '@/app/authStore';
import { ClassOfStu } from '@/types/tabs.class.dto';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, TouchableOpacity, View } from 'react-native';
import { Avatar, Card, Divider, Icon, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ClassScreen = () => {
  const [classOfStu, setClassOfStu] = useState<ClassOfStu[]>([])
  const stuIdGlobal = useAuthStore(state => state.selectedStuId)
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      if (!stuIdGlobal) return
      const res = await mobileApi.getClassByStuId(stuIdGlobal)
      setClassOfStu(res.data)
    } catch (error: any) {
      Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
  }

  useEffect(() => {
    fetchData()
  }, [stuIdGlobal])

  const handleOnRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  const pressToSeeClassDetail = (id: number, buoiHocId: number) => {
    router.navigate({
      pathname: '/(tabs)/class/class-detail',
      params: {
        classId: id,
        sessionId: buoiHocId
      }
    })
  }

  const renderClassItem = ({ item }: { item: ClassOfStu }) => {
    return (
      <TouchableOpacity
        onPress={() => pressToSeeClassDetail(item.ID, item.IdBuoiCapNhatGanNhat)}
        activeOpacity={0.7}
      >
        <Card
          mode="elevated"
          style={{ marginBottom: 16, borderRadius: 12, backgroundColor: '#fff' }}
        >
          <Card.Content style={{ gap: 12 }}>
            {/* Header: Tên lớp và Trạng thái */}
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar.Icon
                  icon="google-classroom"
                  size={48}
                  color='#fff'
                  style={{ backgroundColor: '#2980b9' }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {item.TenLop}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: '#7f8c8d' }}>
                    Mã lớp: {item.MaLop}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={{ backgroundColor: '#f0f2f5' }} />

            {/* Thông tin lớp học */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon source="account-tie" size={20} color="#7f8c8d" />
                <Text variant="bodyLarge" style={{ color: '#34495e' }}>{item.GiaoVien}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon source="calendar-clock" size={20} color="#7f8c8d" />
                <Text variant="bodyLarge" style={{ color: '#34495e' }}>
                  {item.LichHoc.map(item => dow[item]).join(', ')} - {item.GioHoc}
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: '#f8f9fa', padding: 12,
              borderRadius: 8, borderWidth: 1,
              borderColor: '#f0f2f5',
              marginTop: 4
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text variant="titleMedium" style={{ color: '#2c3e50', fontWeight: '600' }}>Đã học</Text>
                <Text variant="titleMedium" style={{ color: '#3498db', fontWeight: 'bold' }}>
                  {item.SoBuoiDaHoc}/{item.TongSoBuoi} buổi
                </Text>
              </View>

              <ProgressBar
                progress={item.SoBuoiDaHoc / item.TongSoBuoi}
                color="#3498db"
                style={{ height: 6, borderRadius: 3, backgroundColor: '#e0e4e8' }}
              />

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                {/* Có mặt */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ecc71' }} />
                  <Text variant="bodyMedium" style={{ color: '#2c3e50' }}>Có mặt: {item.CoMat}</Text>
                </View>
                {/* Vắng */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#e74c3c' }} />
                  <Text variant="bodyMedium" style={{ color: '#2c3e50' }}>Vắng mặt: {item.Vang}</Text>
                </View>
              </View>
            </View>

          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f2f5' }} edges={['top']}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingRight: 8
      }}>
        <Text variant="headlineSmall"
          style={{ padding: 20, fontWeight: 'bold', color: '#2c3e50' }}>
          Lớp học - {classOfStu[0]?.HocVien}
        </Text>
      </View>

      <FlatList
        data={classOfStu}
        renderItem={renderClassItem}
        keyExtractor={item => item.ID.toString()}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 30 }}
        refreshing={refreshing}
        onRefresh={handleOnRefresh}

        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 100, gap: 12 }}>
            <Avatar.Icon icon="book-open-variant" size={80}
              style={{ backgroundColor: '#e0e4e8' }} color="#bdc3c7" />
            <Text variant="bodyLarge" style={{ color: '#7f8c8d' }}>
              Con chưa tham gia lớp học nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ClassScreen;