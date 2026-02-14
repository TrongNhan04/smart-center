import axiosClient from "../components/AxiosClient"
import type { ClassDto } from "../components/class/ClassDTO"

const classApi = {
    getClassesOfCourse: (courseId: number) =>
        axiosClient.get(`/admin/courses/${courseId}/classes`),

    create: (body: ClassDto) =>
        axiosClient.post(`/admin/classes`, body),

    findMany: () => axiosClient.get(`/admin/classes`),

    detele: (id: number) =>
        axiosClient.patch(`/admin/classes/${id}/closed`),

    // tên lớp, giáo viên, sĩ số, phòng học, mô tả
    updateRunning: (id: number, body: ClassDto) => {
        const { name, teacherId, classSize, room, description } = body
        const payload = { name, teacherId, classSize, room, description }
        return axiosClient.patch(`/admin/classes/${id}`, payload)
    },

    updateOpen: (id: number, body: ClassDto) => {
        const { code, courseId, ...rest } = body
        const payload = { rest }
        return axiosClient.patch(`/admin/classes/${id}`, payload)
    },
        
    findOne: (id: number) => axiosClient.get(`/admin/classes/${id}`)
}

export default classApi