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

    // chỉ lấy tên lớp, giáo viên, sĩ số, phòng học, mô tả
    updateRunning: (id: number, body: ClassDto) => {
        const { name, teacherId, classSize, room, description } = body
        const payload = { name, teacherId, classSize, room, description }
        return axiosClient.patch(`/admin/classes/${id}`, payload)
    },

    // bỏ code và courseId
    updateOpen: (id: number, body: ClassDto) => {
        const { code, courseId, ...rest } = body
        console.log("payload update class open: ", rest)
        return axiosClient.patch(`/admin/classes/${id}`, rest)
    },
        
    findOne: (id: number) => axiosClient.get(`/admin/classes/${id}`)
}

export default classApi