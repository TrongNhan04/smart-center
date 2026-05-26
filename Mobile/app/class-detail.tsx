import mobileApi from '@/app/api';
import useAuthStore from '@/app/authStore';
import SessionContentCard from '@/app/component/class-detail/session-content-card';
import SessionHeader from '@/app/component/class-detail/session-header';
import SessionInfoCard from '@/app/component/class-detail/session-info-card';
import SessionMediaCard from '@/app/component/class-detail/session-media-card';
import SessionNavigator from '@/app/component/class-detail/session-navigator';
import { SessionIds, SessionOfStu } from '@/types/tabs.class.dto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SessionDetailScreen() {
  const router = useRouter();
  const { classId, sessionId, studentId } = useLocalSearchParams()
  const buoiHocId = Number(sessionId) // id buổi học có kết quả gần nhất
  const [detailResult, setDetailResult] = useState<SessionOfStu>()
  const [arrSessionId, setArrSessionId] = useState<SessionIds[]>([])
  const [selectedId, setSelectedId] = useState(buoiHocId) // id buổi học được chọn
  const stuIdGlobal = useAuthStore(state => state.selectedStuId)

  useEffect(() => {//useEffect 1 lấy tất cả id buổi học của lớp
    const fetchSessionIds = async () => {
      try {
        const res = await mobileApi.getSessionIdsByClassId(classId)
        setArrSessionId(res.data) // mảng id buổi học
      } catch (error: any) {
        Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
        console.log('Có lỗi xảy ra: ', error)
      }
    }
    fetchSessionIds()
  }, [classId])

  //useEffect 2 tải kết quả buổi học từ id buổi học được chọn
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!stuIdGlobal || !sessionId) return
        //const id = selectedId ? selectedId : buoiHocId
        const stuIdSearchParam = studentId ?? stuIdGlobal
        const res = await mobileApi
          .getDetailByStuAndSesId(Number(stuIdSearchParam), selectedId)
        setDetailResult(res.data)
      } catch (error) {
        Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
        console.log('Có lỗi xảy ra: ', error)
      }
    }

    fetchData()
  }, [classId, selectedId, stuIdGlobal])

  const imageList = detailResult?.TepDinhKem
    .filter(item => item.LoaiTep === 'image')

  const videoList = detailResult?.TepDinhKem
    .filter(item => item.LoaiTep === 'video')

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* ===== 1. Header tên lớp và nút quay lại ===== */}
      <SessionHeader
        tenLop={detailResult?.TenLop}
        teacher={detailResult?.GiaoVien}
        onBack={() => router.back()}
      />

      {/* ===== 2. 3 thẻ nội dung buổi học ===== */}
      <ScrollView
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}>

        {detailResult && (
          <View style={{ gap: 16 }}>
            {/* Card 1 thông tin chung */}
            <SessionInfoCard detail={detailResult} />

            {/* Card 2 buổi học có gì */}
            <SessionContentCard detail={detailResult} />

            {/* card 3 hình ảnh, video hoạt động của buổi học */}
            <SessionMediaCard
              imageList={imageList ?? []}
              videoList={videoList ?? []}
            />
          </View>
        )}
      </ScrollView>

      {/* ===== 3. điều hướng giữa các buổi học ===== */}
      <SessionNavigator
        arrSessionId={arrSessionId}
        onSelected={setSelectedId}
        selectedId={selectedId ?? buoiHocId}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Content
  contentArea: { flex: 1 }, // flex 1 để đẩy BottomNav xuống đáy
  label: { fontWeight: 'bold', color: '#7f8c8d', marginBottom: 4 },
});