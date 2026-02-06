import axiosClient from "../components/AxiosClient"
import type { CourseDB, CourseDto } from "../components/course/CourseInterface"

const courseApi = {
    create: (course: Omit<CourseDto, 'id'>) => {
        return axiosClient.post('/admin/courses', course)
    },

    findMany: () => {
        return axiosClient.get('/admin/courses')
    },

    update: (id: number, course: Omit<CourseDto, 'id'>) => {
        return axiosClient.patch(`/admin/courses/${id}`, course)
    },

    delete: (id: number) => {
        return axiosClient.patch(`/admin/courses/${id}/inactive`)
    },

    findOne: (id: number)  =>{
        return axiosClient.get(`/admin/courses/${id}`)
    }
}

export default courseApi

// const payload: CourseDto = {
//       code: course.MaKhoaHoc,
//       name: course.TenKhoaHoc,
//       level: course.TrinhDo,
//       courseFee: Number(course.HocPhi),
//       duration: course.ThoiGian,
//       totalSession: course.TongSoBuoi,
//       description: course.MoTa || ""
//     }
// console.log(payload)