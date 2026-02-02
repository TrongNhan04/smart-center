import { useState } from 'react';
import { Button } from 'antd';
import AddCourseModal from './Course';

const CourseList = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button type="primary" onClick={() => setIsOpen(true)}>
        + Thêm khóa học
      </Button>

      {/* Hiển thị Modal UI */}
      <AddCourseModal 
        open={isOpen} 
        onCancel={() => setIsOpen(false)} 
      />
    </div>
  );
};

export default CourseList