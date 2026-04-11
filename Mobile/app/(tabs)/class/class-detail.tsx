import mobileApi from '@/app/api';
import { SessionOfStu } from '@/types/tabs.class.dto';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, IconButton, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SessionDetailScreen() {
  const router = useRouter();
  const [detailResult, setDetailResult] = useState<SessionOfStu>()
  useEffect(() => {

    const fetchData = async () => {
      try {
        const res = await mobileApi.getDetailByStuAndSesId(2,1)
        setDetailResult(res.data)
      } catch (error) {
        Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
        console.log('Có lỗi xảy ra: ', error)
      }
    }

    fetchData()
  }, [])
  // // Mặc định chọn buổi học mới nhất (phần tử đầu tiên trong mảng)
  // const [selectedId, setSelectedId] = useState(SESSIONS_DATA[0].id);

  // // Tìm dữ liệu của buổi học đang được chọn
  // const detailResult = detailResult?.BuoiHocID

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ===== 1. Header tên lớp và nút quay lại ===== */}
      <Surface style={styles.header} elevation={1}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24}
            onPress={() => router.back()} style={{ marginLeft: -10 }} />
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={styles.textTitle}>{detailResult?.TenLop}</Text>
            <Text variant="bodyMedium" style={{ color: '#2c3e50' }}>Giáo viên: {detailResult?.GiaoVien}</Text>
          </View>
        </View>
      </Surface>

      {/* ===== 2. 3 thẻ nội dung buổi học ===== */}
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}>

        {detailResult && (
          <View style={{ gap: 16 }}>

            {/* Card 1 thông tin chung */}
            <Card mode="contained" style={styles.card}>
              <Card.Content style={{ gap: 8 }}>

                {/* Trạng thái buổi học */}
                <View style={styles.view}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Trạng thái:</Text>
                  <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
                    Đã kết thúc
                  </Text>
                </View>

                {/* Ngày học */}
                <View style={styles.view}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Ngày học:</Text>
                  <Text variant="titleMedium" style={{ color: '#2c3e50' }}>
                    {detailResult.NgayHoc.slice(0, 4)}, 18:00 - 20:00
                  </Text>
                </View>

                {/* Điểm danh  */}
                <View style={styles.view}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Điểm danh:</Text>
                  <Text
                    variant="titleMedium"
                    style={{ fontWeight: 'bold', color: detailResult.DiemDanh ? '#27ae60' : '#e74c3c' }}
                  >
                    {detailResult.DiemDanh ? "Có mặt" : "Vắng"}
                  </Text>
                </View>

                {/* Điểm số */}
                <View style={styles.view}>
                  <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>Điểm số:</Text>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#3498db' }}>
                    {detailResult.DiemSo ? `${detailResult.DiemSo} điểm` : '---'}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Card 2 buổi học có gì */}
            <Card mode="contained" style={styles.card}>
              <Card.Content style={{ gap: 10 }}>
                {/* chủ đề bài học */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="lightbulb-on" size={22} color="#f39c12" />
                    <Text variant="titleMedium" style={styles.textTitle}>
                      Bài học
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
                    {detailResult.BaiHoc}
                  </Text>
                </View>

                {/* Nội dung bài học */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="book-open-variant" size={20} color="#3498db" />
                    <Text variant="titleMedium" style={styles.textTitle}>
                      Nội dung
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
                    {detailResult.NoiDung}
                  </Text>
                </View>

                {/* Bài tập về nhà */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="notebook-edit" size={20} color="#9b59b6" />
                    <Text variant="titleMedium" style={styles.textTitle}>
                      Bài tập về nhà
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
                    {detailResult.BaiTap}
                  </Text>
                </View>

                {/* Nhận xét của giáo viên */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon source="comment-text" size={20} color="#27ae60" />
                    <Text variant="titleMedium" style={styles.textTitle}>
                      Nhận xét của giáo viên
                    </Text>
                  </View>
                  <View >
                    <Text variant="bodyLarge" style={{ color: '#34495e', lineHeight: 24 }}>
                      {detailResult.NhanXet}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* card 3 hình ảnh, video hoạt động của buổi học */}
            <Card mode="contained" style={styles.card}>
              <Card.Content style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon source='album' size={20} color="#E91E63" />
                  <Text variant="titleMedium" style={styles.textTitle}>
                    Hoạt động
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  {detailResult.TepDinhKem.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {detailResult.TepDinhKem.map((url, index) => (
                        <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={{ color: '#95a5a6', fontStyle: 'italic' }}>Không có tài liệu đính kèm cho buổi này.</Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* ===== 3. điều hướng giữa các buổi học ===== */}
      <Surface style={styles.bottomNav} elevation={1}>
        <Text variant="labelSmall" style={{ paddingHorizontal: 16, paddingTop: 8, color: '#7f8c8d' }}>
          Chọn buổi học:
        </Text>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 10 }}
        >
          {/* {SESSIONS_DATA.map(session => {
            const isSelected = selectedId === session.id;
            return (
              <TouchableOpacity
                key={session.id}
                onPress={() => setSelectedId(session.id)}
                // style này bao bên ngoài
                style={[styles.navCircle, isSelected && styles.navCircleActive]}
              >
                <Text // style này là số bên trong
                  style={[styles.navText, isSelected && styles.navTextActive]}>
                  {session.buoiso}
                </Text>
              </TouchableOpacity>
            )
          })} */}
        </ScrollView>
      </Surface>

    </SafeAreaView>
  );
}

// --- CSS GỌN NHẸ ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16, paddingBottom: 10,
    paddingTop: 5, backgroundColor: '#fff'
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },

  card: { backgroundColor: '#eceffb', borderRadius: 12 },
  view: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Content
  contentArea: { flex: 1 }, // Lệnh flex: 1 này cực kỳ quan trọng để đẩy BottomNav xuống đáy
  label: { fontWeight: 'bold', color: '#7f8c8d', marginBottom: 4 },
  textTitle: { fontWeight: 'bold', color: '#2c3e50' },

  // Media
  mediaImage: {
    width: 150, height: 100, borderRadius: 8,
    marginRight: 10, backgroundColor: '#ddd'
  },

  // Bottom Nav
  bottomNav: { backgroundColor: '#fff' },
  navCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#dcdde1'
  },
  navCircleActive: {
    backgroundColor: '#3498db', // Màu xanh khi được chọn
    borderColor: '#3498db',
  },
  navText: { fontSize: 16, fontWeight: 'bold', color: '#7f8c8d' },
  navTextActive: { color: '#fff' }
});