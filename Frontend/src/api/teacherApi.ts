import axiosClient from "../components/AxiosClient";
import type { TeacherDto } from "../components/teacher/TeacherDTO";

const teacherApi = {
    findMany: () => axiosClient.get('/admin/teachers'),

    restore: (teacherId: number) =>
        axiosClient.patch(`admin/teachers/${teacherId}/restore`),

    delete: (teacherId: number) =>
        axiosClient.patch(`admin/teachers/${teacherId}/inactive`),

    create: (body:TeacherDto) =>
        axiosClient.post(`admin/teachers`, body)
}
export default teacherApi