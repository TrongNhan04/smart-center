import { Space, Image } from "antd"
import { useEffect, useState } from "react"
import { sessionApi } from "../../api/sessionApi"
import { CatchError } from "../common/catch.error"

interface Props {
  sessionId: number
  reload: number,
  getOldFile: (data:any) => void
}

interface fileFormat {
  ID: number,
  KQBuoiHocID: number,
  TepID: string,
  URL: string,
  LoaiTep: string
}

const FileUpload = ({ sessionId, reload, getOldFile }: Props) => {
  const [fileAttachs, setFileAttachs] = useState<fileFormat[]>([])
  // Giả sử mảng tài liệu đính kèm của buổi học
  const fetchFileUpload = async () => {
    try {
      const res = await sessionApi.getFileUpload(sessionId)
      setFileAttachs(res.data)
      const formated = res.data.map((item: fileFormat, index:number) => ({
        uid: item.TepID,
        name: `Tệp đính kèm ${index+1}`,
        status: 'done',
        url: item.URL,
        public_id: item.TepID,
        resource_type: item.LoaiTep
      }))
      getOldFile(formated)
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  useEffect(() => {
    if (!sessionId) return
    fetchFileUpload()
  }, [sessionId, reload])

  const images: fileFormat[] = []
  const videos: fileFormat[] = []
  for (const file of fileAttachs) {
    if (file.LoaiTep === 'image')
      images.push(file)
    if (file.LoaiTep === 'video')
      videos.push(file)
  }

  return (
    <><Image.PreviewGroup>
      <Space
        wrap size={24}
        style={{
          width: "100%",
         // justifyContent: "center",
        }}
      >
        {/* Render Ảnh */}
        {images.map(img => (
          <Image
            key={img.ID}
            width={205}
            height={150}
            src={img.URL}
            style={{
              objectFit: "cover",
              borderRadius: 8
            }}
          />
        ))}

        {/* Render Video */}
        {videos.map(vid => (
          <div
            key={vid.ID}
            style={{
              width: 205,
              borderRadius: 8,
              overflow: "hidden"
            }}
          >
            <video width="100%" controls preload="metadata">
              <source src={vid.URL} type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        ))}
      </Space>
    </Image.PreviewGroup></>
  )
}

export default FileUpload