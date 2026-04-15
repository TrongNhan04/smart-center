import { InvoiceOfStu } from "@/types/tabs.invoice";
import { useEffect, useState } from "react";
import { Alert, FlatList, TouchableOpacity, View } from "react-native";
import { Avatar, Card, Icon, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import mobileApi from "../api";

const Invoice = () => {

  const [invoice, setInvoice] = useState<InvoiceOfStu[]>([])

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await mobileApi.getInvoiceByStuId(1)
        setInvoice(res.data)
      } catch (error) {
        Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
        console.log('Có lỗi xảy ra: ', error)
      }
    }
    fetchInvoice()
  }, [])

  const formatThoiGian = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  const renderClassItem = ({ item }: { item: InvoiceOfStu }) => {
    return (
      <TouchableOpacity
      >
        <Card mode="elevated" style={{ marginTop: 16, backgroundColor: '#fff7e6' }} >
          <Card.Title
            title={item.LopHoc}
            titleVariant="titleLarge"
            left={(props) => <Avatar.Icon {...props} icon="cash-multiple" />}
          />
          <Card.Content>

            <View style={{ gap: 8 }}>
              {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon source="alert-circle-outline" size={20} color="#FA8C16" />
                  <Text variant="titleMedium" style={{ color: '#FA8C16' }}>
                    Còn {debtInvoice.SoHDChuaTra} khoản chưa thanh toán
                  </Text>
                </View> */}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon source="calendar-alert" size={18} />
                <Text variant="bodyMedium">Đã trả: {item.DaTra}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon source="calendar-alert" size={18} />
                <Text variant="bodyMedium">Hạn thanh toán: {formatThoiGian(item.ThoiHan)}</Text>
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
        <Text variant="titleLarge"
          style={{ padding: 20, fontWeight: 'bold' }}>
          {invoice[0].HocVien}
        </Text>
      </View>

      <FlatList
        data={invoice}
        renderItem={renderClassItem}
        keyExtractor={item => item.ID.toString()} // key từ data
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        // nếu trống hiện thị thêm 
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 100, gap: 12 }}>
            <Avatar.Icon icon="book-open-variant" size={80} style={{ backgroundColor: '#fff' }} color="#dcdde1" />
            <Text variant="bodyLarge" style={{ color: '#95a5a6' }}>Không có hóa đơn học phí nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default Invoice