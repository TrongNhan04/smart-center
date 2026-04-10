// import { useRouter } from 'expo-router';
// import React, { useState } from 'react';
// import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
// import { Card, Divider, Icon, IconButton, Surface, Text } from 'react-native-paper';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { SafeAreaView, View, ScrollView } from "react-native";
// import { IconButton, Card, Divider } from "react-native-paper";
// export default function SessionDetailScreen() {
//   const router = useRouter();

//   // Mặc định chọn buổi học mới nhất (phần tử đầu tiên trong mảng)
//   const [selectedId, setSelectedId] = useState(SESSIONS_DATA[0].id);

//   // Tìm dữ liệu của buổi học đang được chọn
//   const currentSession = SESSIONS_DATA.find(s => s.id === selectedId);

//   return (
//     <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

//       {/* ========================================== */}
//       {/* 1. HEADER BÊN TRÊN (Cố định) */}
//       {/* ========================================== */}
//       <Surface style={styles.stickyHeader} elevation={0}>
//         <View style={styles.headerTopRow}>
//           {/* nút quay lại danh sách lớp */}
//           <IconButton icon="arrow-left" size={24}
//             onPress={() => router.back()} style={{ marginLeft: -10 }} />
//           <Text variant="titleLarge" style={styles.className}
//             numberOfLines={1}>
//             {CLASS_INFO.TenLop}
//           </Text>
//         </View>

//         <View style={styles.headerInfoRow}>
//           <Icon source="account-tie" size={20} color="#595959" />
//           <Text variant="bodyMedium" style={{ color: '#34495e' }}>
//             GV: {CLASS_INFO.GiaoVien}</Text>
//           {/* <Text variant="labelMedium" style={styles.badge}>{CLASS_INFO.TienDo}</Text> */}
//         </View>
//       </Surface>

//       <ScrollView style={styles.contentArea} contentContainerStyle={{ padding: 16 }}>
//         {currentSession && (
//           <View style={{ gap: 16 }}>
//             <Card mode="contained" style={{ backgroundColor: '#fff' }}>
//               <Card.Content style={styles.rowBetween}>
//                 <View>
//                   <Text variant="labelMedium" style={{ color: '#7f8c8d' }}>Ngày học</Text>
//                   <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{currentSession.ngay}</Text>
//                 </View>
//                 <View style={{ alignItems: 'center' }}>
//                   <Text variant="labelMedium" style={{ color: '#7f8c8d' }}>Điểm danh</Text>
//                   <Text style={{ fontWeight: 'bold', color: currentSession.diemdanh ? '#27ae60' : '#e74c3c' }}>
//                     {currentSession.diemdanh ? "Có mặt" : "Vắng"}
//                   </Text>
//                 </View>
//                 <View style={{ alignItems: 'flex-end' }}>
//                   <Text variant="labelMedium" style={{ color: '#7f8c8d' }}>Điểm số</Text>
//                   <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#3498db' }}>
//                     {currentSession.diem !== null ? currentSession.diem : '-'}
//                   </Text>
//                 </View>
//               </Card.Content>
//             </Card>

//             <View>
//               <Text variant="titleMedium" style={styles.sectionTitle}>Nội dung giảng dạy</Text>
//               <Surface style={styles.infoBox} elevation={0}>
//                 <Text style={styles.label}>📚 Bài học:</Text>
//                 <Text style={styles.textData}>{currentSession.baihoc}</Text>
//                 <Divider style={{ marginVertical: 8 }} />

//                 <Text style={styles.label}>📝 Bài tập về nhà:</Text>
//                 <Text style={styles.textData}>{currentSession.baitap}</Text>
//                 <Divider style={{ marginVertical: 8 }} />

//                 <Text style={styles.label}>💬 Nhận xét của giáo viên:</Text>
//                 <Text style={[styles.textData, { fontStyle: 'italic', color: '#34495e' }]}>
//                   "{currentSession.nhanxet}"
//                 </Text>
//               </Surface>
//             </View>

//             <View>
//               <Text variant="titleMedium" style={styles.sectionTitle}>Tài liệu đính kèm</Text>
//               {currentSession.media.length > 0 ? (
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
//                   {currentSession.media.map((url, index) => (
//                     <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
//                   ))}
//                 </ScrollView>
//               ) : (
//                 <Text style={{ color: '#95a5a6', fontStyle: 'italic' }}>Không có tài liệu đính kèm cho buổi này.</Text>
//               )}
//             </View>
//           </View>
//         )}
//       </ScrollView>

//       {/* ========================================== */}
//       {/* 3. ĐIỀU HƯỚNG BÊN DƯỚI (Cố định, Cuộn ngang) */}
//       {/* ========================================== */}
//       <Surface style={styles.bottomNav} elevation={4}>
//         <Text variant="labelSmall" style={{ paddingHorizontal: 16, paddingTop: 8, color: '#7f8c8d' }}>
//           Chọn buổi học:
//         </Text>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 10 }}
//         >
//           {SESSIONS_DATA.map(session => {
//             const isSelected = selectedId === session.id;
//             return (
//               <TouchableOpacity
//                 key={session.id}
//                 onPress={() => setSelectedId(session.id)}
//                 style={[styles.navCircle, isSelected && styles.navCircleActive]}
//               >
//                 <Text style={[styles.navText, isSelected && styles.navTextActive]}>
//                   {session.buoiso}
//                 </Text>
//               </TouchableOpacity>
//             )
//           })}
//         </ScrollView>
//       </Surface>

//     </SafeAreaView>
//   );
// }

// // --- CSS GỌN NHẸ ---
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f5f7fa' },

//   stickyHeader: {
//     backgroundColor: '#f5f7fa',
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     paddingTop: 8,
//   },
//   headerTopRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   className: {
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     flex: 1,
//   },
//   headerInfoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: 38, 
//   },

//   // Header
//   header: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 5, backgroundColor: '#fff' },
//   headerRow: { flexDirection: 'row', alignItems: 'center' },

//   // Content
//   contentArea: { flex: 1 }, // Lệnh flex: 1 này cực kỳ quan trọng để đẩy BottomNav xuống đáy
//   rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
//   sectionTitle: { fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
//   infoBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
//   label: { fontWeight: 'bold', color: '#7f8c8d', marginBottom: 4 },
//   textData: { fontSize: 15, color: '#2c3e50', marginBottom: 4 },

//   // Media
//   mediaImage: { width: 150, height: 100, borderRadius: 8, marginRight: 10, backgroundColor: '#ddd' },

//   // Bottom Nav
//   bottomNav: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   navCircle: {
//     width: 46, height: 46, borderRadius: 23,
//     backgroundColor: '#f1f2f6',
//     justifyContent: 'center', alignItems: 'center',
//     borderWidth: 1, borderColor: '#dcdde1'
//   },
//   navCircleActive: {
//     backgroundColor: '#3498db', // Màu xanh khi được chọn
//     borderColor: '#3498db',
//     transform: [{ scale: 1.1 }] // Hiệu ứng phóng to nhẹ
//   },
//   navText: { fontSize: 16, fontWeight: 'bold', color: '#7f8c8d' },
//   navTextActive: { color: '#fff' }
// });

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Divider, Icon, IconButton, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- MOCK DATA ---
const CLASS_INFO = { TenLop: "Toán Nâng Cao - T7", GiaoVien: "Trương Ngọc Trâm" };

const SESSIONS_DATA = [
  {
    id: 's15', buoiso: 15, ngay: '28/3/2026', diem: 9, diemdanh: true,
    baihoc: 'Ôn tập phương trình bậc 2', 
    noidung:'Ôn tập phương trình bậc 2Ôn tập phương trình bậc 2Ôn tập phương trình bậc 2Ôn tập phương trình bậc 2',
    baitap: 'Làm bài 1,2,3 SGK trang 45',
    nhanxet: 'Bé tiếp thu nhanh, giải toán chính xác.',
    media: ['https://picsum.photos/id/1/200/150', 'https://picsum.photos/id/2/200/150'] // Ảnh bài giải của bé
  },
  {
    id: 's14', buoiso: 14, ngay: '21/3/2026', diem: 8, diemdanh: true,
    baihoc: 'Hệ phương trình', baitap: 'Luyện tập thêm phần thế',
    nhanxet: 'Cần cẩn thận hơn ở dấu âm dương khi chuyển vế.',
    media: [] // Hôm nay không có ảnh
  },
  {
    id: 's13', buoiso: 13, ngay: '14/3/2026', diem: null, diemdanh: false,
    baihoc: 'Đồ thị hàm số', baitap: 'Chép phạt công thức',
    nhanxet: 'Bé nghỉ ốm có phép.',
    media: []
  },
];

export default function SessionDetailScreen() {
  const router = useRouter();

  // Mặc định chọn buổi học mới nhất (phần tử đầu tiên trong mảng)
  const [selectedId, setSelectedId] = useState(SESSIONS_DATA[0].id);

  // Tìm dữ liệu của buổi học đang được chọn
  const currentSession = SESSIONS_DATA.find(s => s.id === selectedId);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* ========================================== */}
      {/* 1. HEADER BÊN TRÊN (Cố định) */}
      {/* ========================================== */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={() => router.back()} style={{ marginLeft: -10 }} />
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#2c3e50' }}>{CLASS_INFO.TenLop}</Text>
            <Text variant="bodyMedium" style={{ color: '#7f8c8d' }}>Giáo viên: {CLASS_INFO.GiaoVien}</Text>
          </View>
        </View>
      </Surface>

      {/* ========================================== */}
      {/* 2. CHI TIẾT BÊN GIỮA (Cuộn dọc) */}
      {/* ========================================== */}
      {/* Thẻ ScrollView được set flex: 1 để chiếm toàn bộ không gian còn lại ở giữa */}
      <ScrollView style={styles.contentArea} contentContainerStyle={{ padding: 16 }}>

        {currentSession && (
          <View style={{ gap: 16 }}>

            {/* thông tin chung */}
            <Card mode="contained" style={{ backgroundColor: '#fff', borderRadius: 12 }}>
              {/* gap giúp tạo khoảng cách giữa các dòng */}
              <Card.Content style={{ gap: 8 }}>

                {/* Trạng thái buổi học */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Trạng thái:</Text>
                  <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
                    Đã kết thúc
                  </Text>
                </View>

                {/* Ngày học */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Ngày học:</Text>
                  <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
                    {currentSession.ngay.slice(0, 4)}, 18:00 - 20:00
                  </Text>
                </View>

                {/* Điểm danh  */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Điểm danh:</Text>
                  <Text
                    variant="titleMedium"
                    style={{ fontWeight: 'bold', color: currentSession.diemdanh ? '#27ae60' : '#e74c3c' }}
                  >
                    {currentSession.diemdanh ? "Có mặt" : "Vắng"}
                  </Text>
                </View>

                {/* Điểm số */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Điểm số:</Text>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#3498db' }}>
                    {currentSession.diem ? `${currentSession.diem} điểm` : '---'}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Chủ đề buổi học */}
            <Card mode="contained" style={{ backgroundColor: '#fff', borderRadius: 12, marginTop: 4 }}>
              <Card.Content style={{ gap: 10 }}>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="lightbulb-on" size={22} color="#f39c12" />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      Bài học
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
                    {currentSession.baihoc}
                  </Text>
                </View>

                {/* Nội dung bài học */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="book-open-variant" size={20} color="#3498db" />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      Nội dung
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
                    {currentSession.noidung}
                  </Text>
                </View>

                {/* Bài tập về nhà */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="notebook-edit-outline" size={20} color="#9b59b6" />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      Bài tập về nhà
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
                    {currentSession.baitap}
                  </Text>
                </View>

                <Divider style={{ backgroundColor: '#f0f2f5' }} />

                {/* 3. NHẬN XÉT CỦA GIÁO VIÊN */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="comment-text-outline" size={20} color="#27ae60" />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      Nhận xét của giáo viên
                    </Text>
                  </View>

                  {/* Box nhận xét được làm nổi bật tinh tế với nền xám nhạt */}
                  <View style={{ backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginTop: 4 }}>
                    <Text variant="bodyLarge" style={{ color: '#556c82', fontStyle: 'italic', lineHeight: 24 }}>
                      "{currentSession.nhanxet}"
                    </Text>
                  </View>
                </View>

              </Card.Content>
            </Card>

            {/* PHẦN 2.3: HÌNH ẢNH/VIDEO ĐÍNH KÈM */}
            {/* <View>
              <Text variant="titleMedium" style={styles.sectionTitle}>Tài liệu đính kèm</Text>
              {currentSession.media.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {currentSession.media.map((url, index) => (
                    <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
                  ))}
                </ScrollView>
              ) : (
                <Text style={{ color: '#95a5a6', fontStyle: 'italic' }}>Không có tài liệu đính kèm cho buổi này.</Text>
              )}
            </View> */}

          </View>
        )}
      </ScrollView>

      {/* ========================================== */}
      {/* 3. ĐIỀU HƯỚNG BÊN DƯỚI (Cố định, Cuộn ngang) */}
      {/* ========================================== */}
      <Surface style={styles.bottomNav} elevation={4}>
        <Text variant="labelSmall" style={{ paddingHorizontal: 16, paddingTop: 8, color: '#7f8c8d' }}>
          Chọn buổi học:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 10 }}
        >
          {SESSIONS_DATA.map(session => {
            const isSelected = selectedId === session.id;
            return (
              <TouchableOpacity
                key={session.id}
                onPress={() => setSelectedId(session.id)}
                style={[styles.navCircle, isSelected && styles.navCircleActive]}
              >
                <Text style={[styles.navText, isSelected && styles.navTextActive]}>
                  {session.buoiso}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </Surface>

    </SafeAreaView>
  );
}

// --- CSS GỌN NHẸ ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },

  // Header
  header: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 5, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },

  // Content
  contentArea: { flex: 1 }, // Lệnh flex: 1 này cực kỳ quan trọng để đẩy BottomNav xuống đáy
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  infoBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  label: { fontWeight: 'bold', color: '#7f8c8d', marginBottom: 4 },
  textData: { fontSize: 15, color: '#2c3e50', marginBottom: 4 },

  // Media
  mediaImage: { width: 150, height: 100, borderRadius: 8, marginRight: 10, backgroundColor: '#ddd' },

  // Bottom Nav
  bottomNav: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  navCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#dcdde1'
  },
  navCircleActive: {
    backgroundColor: '#3498db', // Màu xanh khi được chọn
    borderColor: '#3498db',
    transform: [{ scale: 1.1 }] // Hiệu ứng phóng to nhẹ
  },
  navText: { fontSize: 16, fontWeight: 'bold', color: '#7f8c8d' },
  navTextActive: { color: '#fff' }
});