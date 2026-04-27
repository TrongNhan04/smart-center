import axiosClient from "../components/AxiosClient"
import type { CourseDto } from "../components/course/CourseDTO"

const courseApi = {
    create: (course: Partial<CourseDto>) =>
        axiosClient.post('admin/courses', course),

    update: (id: number, course: Partial<CourseDto>) =>
        axiosClient.patch(`admin/courses/${id}`, course),

    delete: (id: number) =>
        axiosClient.patch(`admin/courses/${id}/inactive`),

    restore: (id: number) =>
        axiosClient.patch(`admin/courses/${id}/restore`),

    findOne: (id: number) =>
        axiosClient.get(`admin/courses/${id}`),

    findMany: () => axiosClient.get('admin/courses'),

    findManyForCmb: () => axiosClient.get(`admin/courses/combobox`)
}

export default courseApi
