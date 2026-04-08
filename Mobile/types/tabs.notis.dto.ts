interface NotisDB {
  ID: number,
  TieuDe: string,
  NoiDung: string,
  Loai: string,
  DuLieu: JSON,
  DaDoc: boolean,
  Icon?: string,
  IconColor: string,
  ThoiGian: string
}
export default NotisDB