import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Card, Divider, List, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mobileApi from '../api';
import useAuthStore from '../authStore';

interface StudentDashboard {
  ID: string
  HocVien: string
  BuoiHocKe: BuoiHocKe
  KetQuaGanNhat: KetQuaGanNhat[]
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
  BuoiSo: number
  NgayHoc: string
  ChuDe: string
  LopHoc: string
  TongSoBuoi: string
  NhanXetCon: string | null
  DiemDanh: boolean
  Diem: number
}

interface HoaDon {
  SoHDChuaTra: number
  ThoiHan: string // ISO date string
}

export default function Index() {
  const user = useAuthStore(state => state.user)
  const children = user?.children
  const [students, setStudents] = useState<StudentDashboard[]>([])
  const [selectedStuId, setSelectedStuId] = useState('')

  const [refresh, setRefresh] = useState(false)
  const fetchData = async () => {
    try {
      if (!children) return
      const res = await Promise.all(
        children.map(childId => mobileApi.getDashboard(childId))
      )
      // console.log(res.map(item=>item.data))
      setStudents(res.map(item => item.data))
    } catch (error) {

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* 1. CHỌN HỌC VIÊN (Dạng nút phân đoạn nhìn rất hiện đại) */}
        <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>
          Chọn học viên:
        </Text>
        <SegmentedButtons
          value={selectedStuId}
          onValueChange={(value) => setSelectedStuId(value)}
          buttons={students.map(stu => ({
            value: stu.ID.toString(),
            label: stu.HocVien,
            icon: selectedStuId === stu.ID ? 'check' : 'account-outline'
          }))}
          style={{ marginBottom: 20 }}
        />

        {/* 2. BUỔI HỌC KẾ TIẾP (Màu xanh dương - Blue) */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Lịch học sắp tới"
            subtitle={nextSession ? nextSession.Lop : "Chưa có lịch"}
            left={(props) => <Avatar.Icon {...props} icon="calendar-clock" color="#3498db" />}
          />
          <Divider />
          {nextSession ? (
            <Card.Content style={{ paddingTop: 10 }}>
              <List.Item
                title={`${nextSession.NgayHoc} | ${nextSession.GioHoc}`}
                description={`Giáo viên: ${nextSession.GiaoVien} (Buổi số: ${nextSession.BuoiSo})`}
                left={props => <List.Icon {...props} icon="clock-outline" />}
              />
            </Card.Content>
          ) : (
            <Card.Content><Text style={styles.emptyText}>Hiện chưa có lịch học mới</Text></Card.Content>
          )}
        </Card>

        {/* 3. KẾT QUẢ GẦN NHẤT (Màu xanh lá - Green) */}
        <Card style={styles.card}>
          <Card.Title
            title="Kết quả học tập"
            left={(props) => <Avatar.Icon {...props} icon="chart-line" color="#28a745" />}
          />
          <Divider />
          {lastestResult?.length ? (
            lastestResult.map((item, index) => (
              <View key={index}>
                <List.Item
                  title={`${item.LopHoc} (Buổi ${item.BuoiSo}/${item.TongSoBuoi})`}
                  description={`Điểm: ${item.Diem ?? '_'} | Điểm danh: ${item.DiemDanh}\nNhận xét: ${item.NhanXetCon || 'Không có'}`}
                  descriptionNumberOfLines={3}
                  left={props => <List.Icon {...props} icon="numeric" />}
                />
                {index < lastestResult.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <Card.Content><Text style={styles.emptyText}>Chưa có dữ liệu kết quả</Text></Card.Content>
          )}
        </Card>

        {/* 4. HÓA ĐƠN (Màu đỏ - Red) */}
        <Card style={[styles.card, { borderColor: debtInvoice ? '#dc3545' : '#ccc', borderWidth: debtInvoice ? 1 : 0 }]}>
          <Card.Title
            title="Học phí"
            left={(props) => <Avatar.Icon {...props} icon="cash-multiple" color={debtInvoice ? "#dc3545" : "#6c757d"} />}
          />
          <Divider />
          <Card.Content style={{ paddingTop: 10 }}>
            {debtInvoice ? (
              <List.Item
                title={`${debtInvoice.SoHDChuaTra} khoản chưa thanh toán`}
                titleStyle={{ color: '#dc3545', fontWeight: 'bold' }}
                description={`Hạn chót: ${formatThoiGian(debtInvoice.ThoiHan)}`}
                left={props => <List.Icon {...props} icon="alert-circle-outline" color="#dc3545" />}
              />
            ) : (
              <Text style={styles.emptyText}>Học phí đã đóng đầy đủ</Text>
            )}
          </Card.Content>
        </Card>

      </ScrollView>
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
  },
  emptyText: {
    padding: 10,
    color: 'gray',
    fontStyle: 'italic',
    textAlign: 'center'
  }
});

// const renderItem = ({ item }: { item: StudentDashboard }) => (
//   <Card style={styles.card}>
//     <Card.Title
//       title={item.HocVien || 'Chưa cập nhật'}
//       titleStyle={{ fontWeight: 'bold', fontSize: 18, color: '#2c3e50' }}
//       left={(props) => <Avatar.Text {...props}
//         label={item.HocVien ? item.HocVien.charAt(0) : 'HV'} size={40} />}
//     />
//     <Divider />
//     <Card.Content style={{ paddingHorizontal: 0 }}>
//       {/* {item.BuoiHocKe ? */}
//         <List.Item
//           title={`Sắp tới: ${item.BuoiHocKe?.Lop} (Buổi ${item.BuoiHocKe?.BuoiSo})`}
//           titleStyle={{ fontWeight: 'bold' }}
//           description={`${formatThoiGian(item.BuoiHocKe?.NgayHoc)} | ${item.BuoiHocKe?.GioHoc}\nGV: ${item.BuoiHocKe?.GiaoVien}`}
//           descriptionNumberOfLines={2}
//           left={props => <List.Icon {...props} icon="calendar-clock" color="#3498db" />}
//         />
//       {/* } */}
//       <Divider />
//       <List.Item
//         title={`Điểm: ${item.KetQuaGanNhat?.Diem} - ${item.KetQuaGanNhat?.DiemDanh ? 'Có mặt' : 'Vắng'}`}
//         titleStyle={{ color: '#28a745', fontWeight: 'bold' }}
//         description={`Ngày ${formatThoiGian(item.KetQuaGanNhat?.Ngay)}\nNhận xét: ${item.KetQuaGanNhat?.NhanXetCon || item.KetQuaGanNhat?.NhanXetLop}`}
//         descriptionNumberOfLines={3}
//         left={props => <List.Icon {...props} icon="clipboard-check-outline" color="#28a745" />}
//       />
//       <Divider />
//       <List.Item
//         title={
//           item.HoaDon?.SoHDChuaTra > 0 ?
//             `Nợ ${item.HoaDon?.SoHDChuaTra} Hóa đơn` : 'Đã đóng đủ học phí'}
//         titleStyle={{
//           color: item.HoaDon?.SoHDChuaTra > 0 ? '#dc3545' : 'gray',
//           fontWeight: 'bold'
//         }}
//         description={
//           item.HoaDon?.SoHDChuaTra > 0 ?
//             `Hạn chót: ${formatThoiGian(item.HoaDon?.ThoiHan)}` : 'Không có khoản thu nào'}
//         left={props => <List.Icon {...props} icon="receipt"
//           color={item.HoaDon?.SoHDChuaTra > 0 ? "#dc3545" : "gray"} />}
//       />
//     </Card.Content>
//   </Card>
//   // <Text>Test</Text>
// );


// <SafeAreaView style={styles.container}>
//       <Text variant="titleLarge" style={{ padding: 23, fontWeight: 'bold' }}>
//         Trang chủ
//       </Text>

//       {students?.map(stu => <Button key={stu.ID}
//         onPress={() => setSelectedStuId(stu.ID)}>
//         <Text className="font-medium">{stu.HocVien}</Text>
//       </Button>)
//       }

//       {/* buổi học kế */}
//       {nextSession ?
//         <Card>
//           <Text>Buổi học sắp tới</Text>
//           <Text>Buổi học: {nextSession.BuoiSo}</Text>
//           <Text>Lớp: {nextSession.Lop}</Text>
//           <Text>Giáo viên: {nextSession.GiaoVien}</Text>
//           <Text>Ngày học: {formatThoiGian(nextSession.NgayHoc)}</Text>
//           <Text>Giờ học: {nextSession.GioHoc}</Text>
          
//         </Card>

//         : <Card>
//           <Text>Chưa có lịch học</Text>
//         </Card>}

//       {/* các kết quả gần nhất */}
//       {lastestResult?.length ?
//         lastestResult.map(item => <Card>
//           <Text>Lớp học gần đây: {item.LopHoc}</Text>
//           <Text>Tiến độ: {item.BuoiSo}/{item.TongSoBuoi}</Text>
//           <Text>Bài học trước: {item.ChuDe}</Text>
//           <Text>Điểm danh: {item.DiemDanh} |
//             Điểm: {item.Diem ?? '_'}</Text>

//           <Text>Nhận xét của giáo viên: {item.NhanXetCon ?? 'Không có'} </Text>
//           <Text>Ngày học: {formatThoiGian(item.NgayHoc)}</Text>
//         </Card>)
        
//         : <Card>
//           <Text>Chưa có kết quả gần nhất</Text>
//         </Card>}

//       {/* hóa đơn còn nợ */}
//       {debtInvoice ?
//         <Card>
//           <Text>Nhắc nhở học phí</Text>
//           <Text>Hạn thanh toán: {formatThoiGian(debtInvoice.ThoiHan)}</Text>
//           <Text>{debtInvoice.SoHDChuaTra} khoản chưa thanh toán</Text>
//         </Card>

//         : <Card>
//           <Text>Không có hóa đơn cần thanh toán</Text>
//         </Card>}
//     </SafeAreaView>