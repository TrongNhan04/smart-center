import StudentDashboard from '@/types/tabs.index.dto';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Card, Chip, Icon, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mobileApi from '../api';
import useAuthStore from '../authStore';

export default function Index() {
  const [students, setStudents] = useState<StudentDashboard[]>([])
  const [selectedStuId, setSelectedStuId] = useState(-1)
  const [refresh, setRefresh] = useState(false)
  const user = useAuthStore(state => state.user)
  const setStuIdGlobal = useAuthStore(state => state.setSelectedStuId)
  const children = user?.children
  const fetchData = async () => {
    try {
      if (!children) return
      const res = await Promise.all(
        children.map(childId => mobileApi.getDashboard(childId))
      )
      const data = res.map(item => item.data)
      setStudents(data)
      // nếu chưa chọn ai và có dữ liệu thì chọn em đầu tiên
      if (selectedStuId === -1 && res.length > 0)
        setSelectedStuId(data[0].ID)
    } catch (error: any) {
      Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // tìm dữ liệu cho student được chọn
  const stuData = students.find(stu => stu.ID === selectedStuId)
  const nextSession = stuData?.BuoiHocKe
  const lastestResult = stuData?.KetQuaGanNhat
  const debtInvoice = stuData?.HoaDon

  const handleRefresh = async () => {
    setRefresh(true)
    await fetchData()
    setRefresh(false)
  }

  const formatThoiGian = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refresh}
            onRefresh={handleRefresh} />
        }>

        {/* Chọn học viên */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.studentSelector}
        >
          {students?.map(stu => (
            <Chip
              key={stu.ID}
              selected={selectedStuId === stu.ID}
              onPress={() => { setSelectedStuId(stu.ID); setStuIdGlobal(stu.ID) }}
              icon={() =>
                <Icon
                  source='account-school'
                  size={20}
                  color={selectedStuId === stu.ID ? '#fff' : '#3498db'}
                />
              }
              style={[styles.chip,
              // chip được chọn NỀN xanh, ko chọn NỀN trắng
              { backgroundColor: selectedStuId === stu.ID ? '#3498db' : '#fff' }
              ]}
              textStyle={{ // được chọn CHỮ trắng, ko chọn CHỮ xanh
                color: selectedStuId === stu.ID ? '#fff' : '#3498db'
              }}
              showSelectedCheck={false}
            >
              {stu.HocVien}
            </Chip>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16 }}>

          {/* buổi học kế tiếp */}
          <Card mode="elevated" style={{ backgroundColor: '#e3f2fd', }}>
            <Card.Title
              title="Buổi học sắp tới"
              titleVariant="titleLarge"
              left={(props) =>
                <Avatar.Icon {...props} icon="calendar-clock" />}
            />
            <Card.Content>
              {nextSession ? (<>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Icon source="google-classroom" size={20} color="#3498db" />
                  <Text variant="titleMedium"
                    style={{ color: '#3498db', marginLeft: 8 }}>
                    {nextSession.Lop}
                  </Text>
                </View>

                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                  Buổi {nextSession.BuoiSo}:
                  {nextSession.ChuDe ?? "Chưa có chủ đề"}
                </Text>

                {/* Hàng chứa Giờ và Ngày */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  gap: 16, marginBottom: 8
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon source="clock-outline" size={18} />
                    <Text variant="bodyMedium">{nextSession.GioHoc}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon source="calendar-month" size={18} />
                    <Text variant="bodyMedium">{formatThoiGian(nextSession.NgayHoc)}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon source="account-tie" size={18} />
                  <Text variant="bodyMedium">Giáo viên: {nextSession.GiaoVien}</Text>
                </View>
              </>)
                :
                <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                  Chưa có lịch học mới</Text>
              }
            </Card.Content>
          </Card>

          {/* kết quả gần nhất */}
          {lastestResult?.length ? (
            lastestResult.map((item, index) => (
              <Card key={index} mode="elevated"
                style={{ marginTop: 16, backgroundColor: '#e8f5e9' }}>
                <Card.Title
                  title="Kết quả học tập"
                  titleVariant="titleLarge"
                  left={(props) => <Avatar.Icon {...props} icon="school" />}
                />
                <Card.Content>
                  <View style={{
                    flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8
                  }}>
                    <Icon source="google-classroom" size={20} />

                    <Text variant="titleMedium"
                      style={{ flex: 1, marginLeft: 8 }}>{item.LopHoc}</Text>

                    <Text variant="titleMedium"
                      style={{ color: item.DiemDanh ? '#2ecc71' : '#e74c3c' }}>
                      {item.DiemDanh ? 'Có mặt' : 'Vắng'}
                    </Text>
                  </View>

                  {/* Thanh Tiến Độ */}
                  <View style={{ marginVertical: 8 }}>
                    <View
                      style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text variant="bodyMedium">Tiến độ lớp học</Text>
                      <Text variant="bodyMedium">{item.BuoiSo}/{item.TongSoBuoi}</Text>
                    </View>
                    <ProgressBar progress={item.BuoiSo / item.TongSoBuoi}
                      color="#3498db" style={{ height: 6, borderRadius: 3 }} />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 }}>
                    <Icon source="comment-text-outline" size={18} />
                    <Text variant="bodyMedium" style={{ flex: 1, color: '#34495e' }}>
                      Nhận xét của giáo viên: {item.NhanXetCon || 'Chưa có nhận xét.'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card mode="elevated">
              <Card.Title title="Kết quả học tập" titleVariant="titleLarge"
                left={(props) => <Avatar.Icon {...props} icon="school" />} />
              <Card.Content>
                <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                  Chưa có kết quả</Text>
              </Card.Content>
            </Card>
          )}

          {/* Hóa đơn nợ */}
          <Card mode="elevated" style={{ marginTop: 16, backgroundColor: '#fff7e6' }} >
            <Card.Title
              title="Thông tin học phí"
              titleVariant="titleLarge"
              left={(props) => <Avatar.Icon {...props} icon="cash-multiple" />}
            />
            <Card.Content>
              {debtInvoice ? (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon source="alert-circle-outline" size={20} color="#FA8C16" />
                    <Text variant="titleMedium" style={{ color: '#FA8C16' }}>
                      Còn {debtInvoice.SoHDChuaTra} khoản chưa thanh toán
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon source="calendar-alert" size={18} />
                    <Text variant="bodyMedium">Hạn thanh toán: {formatThoiGian(debtInvoice.ThoiHan)}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon source="check-circle-outline" size={20} color="#27ae60" />
                  <Text variant="titleMedium" style={{ color: '#27ae60' }}>
                    Đã hoàn thành toàn bộ học phí
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#f0f2f5'
  },
  headerTitle: {
    paddingHorizontal: 23, paddingTop: 10,
    fontWeight: 'bold', color: '#2c3e50'
  },
  studentSelector: {
    paddingLeft: 16,
    marginVertical: 15,
    flexDirection: 'row'
  },
  chip: {
    marginRight: 8, height: 40
  },
});