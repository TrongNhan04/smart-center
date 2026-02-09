// cho modal, form gửi backend   
export interface CourseDto { 
  id?: number
  code: string,
  name: string,
  level: string,
  duration: number,
  courseFee: number,
  totalSession: number,
  description?: string|null
}

// cho table hiển thị
export interface CourseDB {
  ID: number,
  MaKhoaHoc: string,
  TenKhoaHoc: string,
  TrinhDo: string,
  HocPhi: number,
  ThoiGian: number,
  TongSoBuoi: number,
  TrangThai: string,
  MoTa?: string,
}

export const mapRecordToForm = (record: CourseDB): CourseDto => {
  return {
    id: record.ID,
    code: record.MaKhoaHoc,
    name: record.TenKhoaHoc,
    level: record.TrinhDo,
    courseFee: Number(record.HocPhi),
    duration: record.ThoiGian,
    totalSession: record.TongSoBuoi,
    description: record.MoTa
  }
}

/*Tóm tắt chiến thuật code:
Tạo state editingRecord.

Bấm Sửa -> setEditingRecord(record) -> Mở Modal.

Modal mở -> Check có editingRecord không? -> Có thì điền vào Form via setFieldsValue.

Bấm Lưu -> Check có editingRecord không? -> Có thì gọi API PUT, Không thì gọi POST.

Xong việc -> Reset Form, Reset editingRecord.*/