import axiosClient from "../components/AxiosClient";
import type { TeacherDto } from "../components/teacher/TeacherDTO";

const teacherApi = {
    create: (body: TeacherDto) =>
        axiosClient.post(`admin/teachers`, body),

    update: (teacherId: number, body: TeacherDto) => {
        const payload = {
            name: body.name,
            major: body.major
        }
        console.log("payload call api", payload)
        return axiosClient.patch(`admin/teachers/${teacherId}`, payload)
    },
    
    delete: (teacherId: number) =>
        axiosClient.patch(`admin/teachers/${teacherId}/inactive`),

    restore: (teacherId: number) =>
        axiosClient.patch(`admin/teachers/${teacherId}/restore`),

    findMany: () => axiosClient.get('/admin/teachers'),

    findOne: (teacherId: number) => 
        axiosClient.get(`admin/teachers/${teacherId}`)
}
export default teacherApi