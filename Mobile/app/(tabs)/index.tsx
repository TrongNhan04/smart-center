import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Avatar, Card, Divider, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mobileApi from '../api';
import useAuthStore from '../authStore';

interface StudentDashboard {
  ID: number
  HocVien: string
  BuoiHocKe: BuoiHocKe
  KetQuaGanNhat: KetQuaGanNhat
  HoaDon: HoaDon
}

interface BuoiHocKe {
  BuoiSo: number
  PhongHoc: string
  NgayHoc: string
  GioHoc: string
  Lop: string
  GiaoVien: string
}

interface KetQuaGanNhat {
  GiaoVien: string
  Ngay: string
  NhanXetLop: string
  NhanXetCon: string | null
  DiemDanh: boolean
  Diem: number
}

interface HoaDon {
  SoHDChuaTra: number
  ThoiHan: string // ISO date string
}

export default function Index() {
  const children = useAuthStore(state => state.user?.children)
  const [students, setStudents] = useState<StudentDashboard[]>([])
  const [refresh, setRefresh] = useState(false)
  const fetchData = async () => {
    try {
      if (!children) return
      const res = await Promise.all(
        children.map(childId => mobileApi.getDashboard(childId))
      )
      setStudents(res.map(item => item?.data))
    } catch (error) {

    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefresh(true)
    await fetchData()
    setRefresh(false)
  }

  const formatThoiGian = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  const renderItem = ({ item }: { item: StudentDashboard }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.HocVien || 'Chưa cập nhật'}
        titleStyle={{ fontWeight: 'bold', fontSize: 18, color: '#2c3e50' }}
        left={(props) => <Avatar.Text {...props}
          label={item.HocVien ? item.HocVien.charAt(0) : 'HV'} size={40} />}
      />
      <Divider />
      <Card.Content style={{ paddingHorizontal: 0 }}>
        <List.Item
          title={`Lịch: ${item?.BuoiHocKe?.Lop} (Buổi ${item?.BuoiHocKe?.BuoiSo})`}
          titleStyle={{ fontWeight: 'bold' }}
          description={`${formatThoiGian(item?.BuoiHocKe?.NgayHoc)} | ${item?.BuoiHocKe?.GioHoc}\nGV: ${item?.BuoiHocKe?.GiaoVien}`}
          descriptionNumberOfLines={2}
          left={props => <List.Icon {...props} icon="calendar-clock" color="#3498db" />}
        />
        <Divider />
        <List.Item
          title={`Điểm: ${item?.KetQuaGanNhat?.Diem} - ${item?.KetQuaGanNhat?.DiemDanh ? 'Có mặt' : 'Vắng'}`}
          titleStyle={{ color: '#28a745', fontWeight: 'bold' }}
          description={`Ngày ${formatThoiGian(item?.KetQuaGanNhat?.Ngay)}\nNhận xét: ${item?.KetQuaGanNhat?.NhanXetCon || item?.KetQuaGanNhat?.NhanXetLop}`}
          descriptionNumberOfLines={3}
          left={props => <List.Icon {...props} icon="clipboard-check-outline" color="#28a745" />}
        />
        <Divider />
        <List.Item
          title={
            item?.HoaDon?.SoHDChuaTra > 0 ?
              `Nợ ${item?.HoaDon?.SoHDChuaTra} Hóa đơn` : 'Đã đóng đủ học phí'}
          titleStyle={{
            color: item?.HoaDon?.SoHDChuaTra > 0 ? '#dc3545' : 'gray',
            fontWeight: 'bold'
          }}
          description={
            item?.HoaDon?.SoHDChuaTra > 0 ?
              `Hạn chót: ${formatThoiGian(item?.HoaDon?.ThoiHan)}` : 'Không có khoản thu nào'}
          left={props => <List.Icon {...props} icon="receipt"
            color={item?.HoaDon?.SoHDChuaTra > 0 ? "#dc3545" : "gray"} />}
        />
      </Card.Content>
    </Card>
    // <Text>Test</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="titleLarge" style={{ padding: 23, fontWeight: 'bold' }}>
        Tổng quan học tập
      </Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item?.ID.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshing={refresh}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#fff',
  }
});