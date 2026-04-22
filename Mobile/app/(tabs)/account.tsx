import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Avatar, Button, Divider, List, Modal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mobileApi from '../api';
import useAuthStore from '../authStore';

const AccountScreen = () => {
  const router = useRouter()

  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const updateUser = useAuthStore(state => state.update)
  const [visible, setVisible] = useState(false) // tắt mở modal
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    Alert.alert(
      "Thông báo", "Xác nhận đăng xuất",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất", style: "destructive",
          onPress: async () => {
            try {
              await mobileApi.logout() // api đăng xuất
            } catch (error: any) {
              Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
              console.log('Có lỗi xảy ra: ', error?.response?.data)
            } finally {
              logout() // xóa trong authStore
              router.replace('/login') // đá về trang login
            }
          }
        }
      ]
    )
  }

  const updateAccount = async () => {
    try {
      setLoading(true)
      const payload = {
        full_name: name,
        email: email,
        phone: phone
      }
      const res = await mobileApi.updateProfile(payload)

      updateUser(res.data)
      if (email !== user?.email) {// nếu thay đổi email thì đăng nhập lại
        Alert.alert(
          'Thành công',
          'Cập nhật email thành công! Vui lòng đăng nhập lại.',
          [
            {
              text: 'OK',
              onPress: () => {
                hideModal()// Đóng modal hiện tại
                logout()// xóa token và user
                router.replace('/(auth)/login')// đá về login
              }
            }
          ],
          // không cho user bấm ra ngoài khoảng không để tắt thông báo
          { cancelable: false }
        );
      }
      hideModal()
    } catch (error: any) {
      Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
    finally { setLoading(false) }
  }

  const showModal = () => {
    setName(user?.full_name ?? '') // điền sẵn name
    setEmail(user?.email || '')
    setPhone(user?.phone ?? '')
    setVisible(true)
  }
  const hideModal = () => setVisible(false)

  // Lấy chữ cái đầu của tên để làm Avatar mặc định
  const avatarLabel = user?.full_name ?
    user?.full_name.charAt(0).toUpperCase() : 'U'

  return (
    <SafeAreaView style={styles.container}>

      {/* header và avatar */}
      <View style={styles.header}>

        <Avatar.Text size={80} label={avatarLabel}
          style={{ backgroundColor: '#3498db' }}
          labelStyle={{ color: '#f0f0f0' }} />

        <Text variant="headlineSmall" style={styles.nameText}>
          {user?.full_name || 'Người dùng ẩn danh'}
        </Text>

        <Button mode='text' icon='pencil' onPress={showModal}>
          Sửa thông tin</Button>
      </View>

      <Divider style={styles.divider} />

      {/* thông tin chi tiết */}
      <View style={styles.infoSection}>
        {/* truyền props để icon đúng vị trí, kích thước ui và theme */}
        <List.Item
          title="Email" description={user?.email || 'Chưa cập nhật'}
          left={props => <List.Icon {...props}
            icon="email-outline" color="#6c757d" />}
        />
        <Divider />

        <List.Item
          title="Số điện thoại" description={user?.phone || 'Chưa cập nhật'}
          left={props => <List.Icon {...props}
            icon="phone-outline" color="#6c757d" />}
        />
        <Divider />

        <List.Item
          title="Đổi mật khẩu"
          left={props => <List.Icon {...props} icon="lock-outline" color="#6c757d" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/change.pw')}
        />
        <Divider />
      </View>

      {/* nút đăng xuất */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          icon="logout"
          textColor="#dc3545" // Chữ màu đỏ cảnh báo
          style={styles.logoutButton}
          onPress={handleLogout}
        >Đăng xuất
        </Button>
      </View>

      <Modal
        contentContainerStyle={styles.modalContainer}
        visible={visible} onDismiss={hideModal} style={{ justifyContent: 'center' }}
      >
        {/* <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}> */}

        <Text variant='titleLarge' style={styles.modalTitle}>
          Cập nhật tài khoản
        </Text>

        <TextInput // ô họ tên
          label={'Họ và tên'} mode='outlined' style={styles.modalInput}
          value={name} onChangeText={setName}
        />

        <TextInput // ô họ tên
          label={'Email'} mode='outlined' style={styles.modalInput}
          value={email} onChangeText={setEmail}
        />

        <TextInput
          label={'Điện thoại'} mode='outlined'
          style={styles.modalInput} value={phone}
          onChangeText={setPhone} keyboardType='phone-pad'
        />

        <View style={styles.modalButtonRow}>
          <Button mode="text" onPress={hideModal}
            style={{ flex: 1 }} textColor="gray">
            Hủy
          </Button>
          <Button
            mode="contained"
            onPress={updateAccount}
            loading={loading}
            style={{ flex: 1, backgroundColor: '#3498db' }}
          >
            Lưu
          </Button>
        </View>

        {/* </KeyboardAvoidingView> */}
      </Modal>
      {/* </Portal> */}

    </SafeAreaView>
  )
}

export default AccountScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
  },
  nameText: {
    fontWeight: 'bold',
    marginTop: 12,
    color: '#2c3e50',
  },
  divider: {
    height: 1,
  },
  infoSection: {
    flex: 1, // Đẩy phần footer (nút đăng xuất) xuống cuối cùng
    marginTop: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  logoutButton: {
    borderColor: '#dc3545', // Viền đỏ
    borderRadius: 8,
    paddingVertical: 4,
  },
  modalContainer: {
    flex: 0,
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 100,
    gap: 10, 
  }
})