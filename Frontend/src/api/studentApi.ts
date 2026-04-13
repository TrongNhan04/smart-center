import axiosClient from "../components/AxiosClient";
import type { StudentDto } from "../components/student/StudentDTO";

export const studentApi = {
    create: (body: StudentDto) =>
        axiosClient.post(`admin/students`, body),

    update: (studentId: number, body:Partial<StudentDto>) =>
        axiosClient.patch(`admin/students/${studentId}`, body),

    delete: (studentId: number) =>
        axiosClient.patch(`admin/students/${studentId}/inactive`),

    findOne: (studentId: number) =>
        axiosClient.get(`admin/students/${studentId}`),

    findMany: (q: string, status: string) => {
        const param: { q: string, status?: string } = { q: q }
        if (status)
            param.status = status
        return axiosClient.get(`admin/students`, {
            params: param
        })
    },

    findManyForCmb: () => axiosClient.get(`admin/students/combobox`),

    getClassResultById: (studentId:number, classId: number) => 
        axiosClient.get(`admin/students/${studentId}/classes/${classId}`),

    getInvoicesById: (stuId:number) => 
        axiosClient.get(`admin/students/${stuId}/invoices`)
}