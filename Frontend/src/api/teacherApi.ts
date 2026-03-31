import axiosClient from "../components/AxiosClient";
import type { TeacherDto } from "../components/teacher/TeacherDTO";

const teacherApi = {
    create: (body: TeacherDto) =>
        axiosClient.post(`admin/teachers`, body),

    update: (teacherId: number, body: Partial<TeacherDto>) => {
        const payload = {
            name: body.name,
            major: body.major
        }
        return axiosClient.patch(`admin/teachers/${teacherId}`, payload)
    },

    delete: (teacherId: number) =>
        axiosClient.patch(`admin/teachers/${teacherId}/inactive`),

    restore: (teacherId: number) =>
        axiosClient.patch(`admin/teachers/${teacherId}/restore`),

    findMany: () => axiosClient.get('admin/teachers'),

    findManyForCmb: () => axiosClient.get('admin/teachers/combobox'),

    findOne: (teacherId: number) =>
        axiosClient.get(`admin/teachers/${teacherId}`),

    getSchedule: (startDate: string | Date, endDate: string | Date) =>
        axiosClient.get(`teachers/sessions-week`, {
            params: {
                startDate: startDate,
                endDate: endDate
            }
        }),

    requestUnlock: (sessionId: number, reason: string) => {
        const body = { reason: reason }
        return axiosClient.post(`sessions/${sessionId}/request-unlock`, body)
    }


}
export default teacherApi