import { message, notification } from "antd"

// component bản chất là 1 hàm nên vẫn dùng trong file.ts bình thường
// khi nào return thẻ html <div>hello</div> thì không được

export class CatchError {
    static HandleError(error:any) {
      console.log('Có lỗi xảy ra',error)
      // bắt lỗi từ backend
      if (error.response) {
        const serverError = error.response?.data
        // nếu là mảng lỗi thì lấy cái đầu tiên
        if (Array.isArray(serverError.message))
          message.error(serverError.message[0]) // 
        else if (typeof serverError?.message === 'string')
          notification.error({
            title: 'Có lỗi xảy ra',
            description: error?.response?.data?.message,
            showProgress: true,
            pauseOnHover: true
          })
        else
          console.log("Có lỗi xảy ra", error)
      }
      else notification.error({title: 'Có lỗi xảy ra', description:error?.message})
    }
}