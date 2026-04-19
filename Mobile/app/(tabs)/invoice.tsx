import { InvoiceOfStu } from '@/types/tabs.invoice';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Avatar, Badge, Button, Card, Divider, Icon, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mobileApi from '../api';
import useAuthStore from '../authStore';

const InvoiceListScreen = () => {
  const [invoices, setInvoices] = useState<InvoiceOfStu[]>([])
  const stuIdGlobal = useAuthStore(state => state.selectedStuId)
  const router = useRouter()
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!stuIdGlobal) return
        const res = await mobileApi.getInvoiceByStuId(stuIdGlobal)
        setInvoices(res.data)
      } catch (error: any) {
        Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
        console.log(error)
        console.log('Có lỗi xảy ra: ', error?.response?.data)
      }
    }
    fetchInvoice()
  }, [stuIdGlobal])

  const formatVND = (amount: any) => Number(amount).toLocaleString() + ' đ'

  // render trạng thái hóa đơn
  const renderStatusBadge = (daTra: number, tongTien: number, status: string) => {
    if (status === 'CANCELLED') return <Text>Đã hủy</Text>
    if (daTra === tongTien)
      return <Badge size={25} style={{
        paddingHorizontal: 8,
        backgroundColor: '#27ae60'
      }}>Đã thanh toán</Badge>

    else if (0 < daTra && daTra < tongTien)
      return <Badge size={25} style={{
        paddingHorizontal: 8,
        backgroundColor: '#f39c12'
      }}>Thanh toán 1 phần</Badge>

    return <Badge size={25} style={{
      paddingHorizontal: 8,
      backgroundColor: '#e74c3c'
    }}>Chưa thanh toán</Badge>

  }

  const renderInvoiceItem = ({ item }: { item: InvoiceOfStu }) => {
    const isUnpaid = item.DaTra < item.TongTien && item.TrangThai === 'ACTIVE'

    return (
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          {/* tên lớp và trạng thái thanh toán */}
          <View style={styles.rowBetween}>
            <Text variant="titleMedium"
              style={styles.className} numberOfLines={1}>
              {item.LopHoc}
            </Text>
            {renderStatusBadge(item.DaTra, item.TongTien, item.TrangThai)}
          </View>

          {/* thông tin học viên */}
          <Text variant="bodyMedium" style={styles.studentName}>
            <Icon
              source='account-school'
              size={18}
              color='#7f8c8d'
            /> Học viên: {item.HocVien}
          </Text>
          <Divider style={styles.divider} />

          {/* thông tin đã trả, tổng tiền */}
          <View style={styles.moneyContainer}>
            <View>
              <Text variant="titleMedium" style={styles.label}>Đã trả</Text>
              <Text variant="titleMedium" style={styles.paidAmount}>
                {formatVND(item.DaTra)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="titleMedium" style={styles.label}>Tổng tiền</Text>
              <Text variant="titleMedium" style={styles.totalAmount}>
                {formatVND(item.TongTien)}</Text>
            </View>
          </View>

          {/* thời hạn */}
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon source="calendar-alert" size={18} />
              <Text variant="bodyMedium" >Hạn thanh toán:</Text>
              <Text style={isUnpaid ? styles.dueDate : null}>
                {new Date(item.ThoiHan).toLocaleDateString()}
              </Text>
            </View>

            {/* nếu còn nợ thì hiện nút thanh toán */}
            {isUnpaid && (
              <Button
                buttonColor="#3498db"
                textColor='#fff'
                onPress={() => {
                  router.push({
                    pathname: '/payment',
                    params: {
                      invoiceId: item.ID,
                      code: item.MaHoaDon,
                      student: item.HocVien,
                      debt: Number(item.TongTien) - Number(item.DaTra)
                    }
                  })
                }}
              >
                Thanh toán
              </Button>
            )}
          </View>

        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingRight: 8
      }}>
        <Text variant="headlineSmall"
          style={{ padding: 20, fontWeight: 'bold' }}>
          Học phí
        </Text>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.ID.toString()}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 100, gap: 12 }}>
            <Avatar.Icon icon="receipt" size={80}
              style={{ backgroundColor: '#e0e4e8' }} color="#bdc3c7" />
            <Text variant="bodyLarge" style={{ color: '#7f8c8d' }}>
              Chưa có hóa đơn học phí nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default InvoiceListScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  className: {
    flex: 1,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  studentName: {
    marginTop: 4,
    color: '#7f8c8d',
  },
  divider: {
    marginVertical: 8,
  },
  moneyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  label: {
    color: '#7f8c8d',
    marginBottom: 4,
  },
  paidAmount: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  totalAmount: {
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  dueDate: {
    color: '#e74c3c', // hạn thanh toán màu đỏ
    fontWeight: '500',
  }
});