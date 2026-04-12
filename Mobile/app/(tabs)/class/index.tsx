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

  useEffect(() => {

    const fetchData = async () => {
      try {
        if (!stuIdGlobal) return
        const res = await mobileApi.getClassByStuId(stuIdGlobal)
        setClassOfStu(res.data)
      } catch (error) {
        Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
        console.log('Có lỗi xảy ra: ', error)
      }
    }
    fetchData()
  }, [stuIdGlobal])

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  const handlePressToSeeClassDetail = (id: number, idBuoiHoc: number) => {
    router.push({
      pathname: '/(tabs)/class/class-detail',
      params: {
        classId: id,
        sessionId: idBuoiHoc
      }
    })
  }

  const renderClassItem = ({ item }: { item: ClassOfStu }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          handlePressToSeeClassDetail(item.ID, item.BuoiHocDuocChon)}>
        <Card mode="elevated"
          style={{
            marginBottom: 16, borderRadius: 12, backgroundColor: '#fff'
          }}
        >
          <Card.Content style={{ gap: 12 }}>

            {/* Header: Tên lớp và Trạng thái */}
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center', gap: 8
              }}>
                <Avatar.Icon icon="google-classroom" size={50} color='white'
                  style={{ backgroundColor: '#3498db' }} />
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge"
                    style={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    {item.TenLop}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: '#7f8c8d' }}>
                    Mã lớp: {item.MaLop}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={{ backgroundColor: '#f0f0f0' }} />

            {/* thông tin lớp học */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon source="account-tie" size={20} color="#595959" />
                <Text variant="bodyLarge">{item.GiaoVien}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon source="calendar-clock" size={20} color="#595959" />
                <Text variant="bodyLarge">
                  {item.LichHoc.map
                    (item => dow[item]).join(', ')} - {item.GioHoc}
                </Text>
              </View>
            </View>

            {/* Chuyên cần */}
            <View style={{
              backgroundColor: '#f8f9fa',
              padding: 12,
              borderRadius: 8,
              marginTop: 4,
              borderWidth: 1,
              borderColor: '#edf0f2'
            }}>
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text variant="titleMedium"
                  style={{ fontWeight: 'bold' }}>Chuyên cần</Text>

                <Text variant="titleMedium"
                  style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                  {item.SoBuoiDaHoc}/{item.TongSoBuoi} buổi
                </Text>
              </View>

              <ProgressBar
                progress={item.SoBuoiDaHoc / item.TongSoBuoi}
                color="#2ecc71"
                style={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' }}
              />
              {/* có mặt */}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{
                    width: 10, height: 10, borderRadius: 5,
                    backgroundColor: '#2ecc71'
                  }} />
                  <Text variant="bodyMedium">Có mặt: {item.CoMat}</Text>
                </View>
                {/* Vắng */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{
                    width: 10, height: 10, borderRadius: 5,
                    backgroundColor: '#e74c3c'
                  }} />
                  <Text variant="bodyMedium">Vắng mặt: {item.Vang}</Text>
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
      <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
      </View>

      <FlatList
        data={classOfStu}
        renderItem={renderClassItem}
        keyExtractor={item => item.ID.toString()} // key từ data
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        // nếu trông hiện thị thêm 
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 100, gap: 12 }}>
            <Avatar.Icon icon="book-open-variant" size={80} style={{ backgroundColor: '#fff' }} color="#dcdde1" />
            <Text variant="bodyLarge" style={{ color: '#95a5a6' }}>Con chưa tham gia lớp học nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ClassScreen;