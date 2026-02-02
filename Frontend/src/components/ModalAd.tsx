import React, { useState } from 'react';
import { Button, Modal } from 'antd';
// import { useAuthStore } from '../store/useAuthStore';
// import { useNavigate } from 'react-router-dom';

const ModalAD: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // const user = useAuthStore(state => state.user)
 // const logout = useAuthStore(state => state.logout)

  // const handleLogout = () => {
  //   logout()
  //   navigate('/login')
  // }

  return (
    <>
      <Button type="primary" onClick={showModal}>
        Open Modal
      </Button>
      <Modal
        title="Basic Modal"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
      {/* <Button onClick={handleLogout} danger>Đăng xuất</Button> */}
    </>
  );
};

export default ModalAD;