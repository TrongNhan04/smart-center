interface NotisDB {
  ID: number,
  TieuDe: string,
  NoiDung: string,
  Loai: string,
  DuLieu: RefData,
  DaDoc: boolean,
  Icon?: string,
  IconColor: string,
  ThoiGian: string
}
export default NotisDB

export interface RefData {
  sessionId?: number,
  classId?: number,
  studentId?: number,
  invoiceId?: number,
  receiptId?: number
}