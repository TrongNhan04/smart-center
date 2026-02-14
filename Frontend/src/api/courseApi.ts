import axiosClient from "../components/AxiosClient"
import type { CourseDto } from "../components/course/CourseDTO"

const courseApi = {
    create: (course: Omit<CourseDto, 'id'>) =>
        axiosClient.post('/admin/courses', course)
    ,

    findMany: () =>
        axiosClient.get('/admin/courses')
    ,

    update: (id: number, course: Omit<CourseDto, 'id'>) =>
        axiosClient.patch(`/admin/courses/${id}`, course)
    ,

    delete: (id: number) =>
        axiosClient.patch(`/admin/courses/${id}/inactive`)
    ,

    findOne: (id: number) =>
        axiosClient.get(`/admin/courses/${id}`)

}

export default courseApi
