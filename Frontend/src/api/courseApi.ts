import axiosClient from "../components/AxiosClient"
import type {  CourseType, CreateCourse } from "../components/course/CourseInterface"

export const createCourseApi = (course: CreateCourse) => {
    return axiosClient.post('/admin/courses', course)
}

export const listCoureApi = () => {
    return axiosClient.get('/admin/courses')
}

export const deleteCourseApi = (id: number) => {
    return axiosClient.patch(`/admin/courses/${id}/inactive`)
}

export const updateCourseApi = (course: CourseType) => {
    const payload: CreateCourse = {
          code: course.MaKhoaHoc,
          name: course.TenKhoaHoc,
          level: course.TrinhDo,
          courseFee: Number(course.HocPhi),
          duration: course.ThoiGian,
          totalSession: course.TongSoBuoi,
          description: course.MoTa || ""
        }
    console.log(payload)
    return axiosClient.patch(`/admin/courses/${course.ID}`, payload)
}