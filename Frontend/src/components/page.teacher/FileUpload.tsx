import { Space, Image } from "antd"


const FileUpload = () => {
  // Giả sử mảng tài liệu đính kèm của buổi học
  const attachments = [
    { id: 1, type: 'image', url: 'https://res.cloudinary.com/dgs39nlwr/image/upload/v1773545441/smart-center/fygw2b5rduv1ny27qavr.jpg' },
    { id: 1, type: 'image', url: 'https://res.cloudinary.com/dgs39nlwr/image/upload/v1773545441/smart-center/fygw2b5rduv1ny27qavr.jpg' },
    { id: 1, type: 'image', url: 'https://res.cloudinary.com/dgs39nlwr/image/upload/v1773545441/smart-center/fygw2b5rduv1ny27qavr.jpg' },
    { id: 1, type: 'image', url: 'https://res.cloudinary.com/dgs39nlwr/image/upload/v1773545441/smart-center/fygw2b5rduv1ny27qavr.jpg' },
    { id: 1, type: 'image', url: 'https://res.cloudinary.com/dgs39nlwr/image/upload/v1773545441/smart-center/fygw2b5rduv1ny27qavr.jpg' },
    { id: 2, type: 'video', url: 'https://res.cloudinary.com/.../video1.mp4' },
  ];
  return (
    <><Image.PreviewGroup>
      <Space
        wrap
        size={24}
        style={{
          width: "100%",
          justifyContent: "center",
        }}
      >
        {/* Render Ảnh */}
        {attachments
          .filter(f => f.type === "image")
          .map(img => (
            <Image
              key={img.id}
              width={200}
              height={150}
              src={img.url}
              style={{
                objectFit: "cover",
                borderRadius: 8
              }}
            />
          ))}

        {/* Render Video */}
        {attachments
          .filter(f => f.type === "video")
          .map(vid => (
            <div
              key={vid.id}
              style={{
                width: 300,
                borderRadius: 8,
                overflow: "hidden"
              }}
            >
              <video width="100%" controls preload="metadata">
                <source src={vid.url} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>
          ))}
      </Space>
    </Image.PreviewGroup></>
  )
}

export default FileUpload