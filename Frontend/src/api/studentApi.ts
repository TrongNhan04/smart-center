import axiosClient from "../components/AxiosClient";
import type { StudentDto } from "../components/student/StudentDTO";

export const studentApi = {
    create: (body: StudentDto) =>
        axiosClient.post(`admin/students`, body),

    update: (studentId: number, body: StudentDto) =>
        axiosClient.patch(`admin/students/${studentId}`, body),

    delete: (studentId: number) => 
        axiosClient.patch(`admin/students/${studentId}/inactive`),

    findOne: (studentId: number) =>
        axiosClient.get(`admin/students/${studentId}`),

    findMany: () => axiosClient.get(`admin/students`)
}