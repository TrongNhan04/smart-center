import axiosClient from "../components/AxiosClient";
import type { SessionDto } from "../components/session/SessionDTO";

export const sessionApi = {
    getByClassId: (classId: number) =>
        axiosClient.get(`admin/classes/${classId}/sessions`),
    
    getDetailsById: (sessionId: number) =>
        axiosClient.get(`teacher/sessions/${sessionId}`),

    getCompletedByTeacherId: (teacherId: number) =>
        axiosClient.get(`admin/teachers/${teacherId}/sessions-completed`),

    getCompletedByStudentId: (studentId: number) =>
        axiosClient.get(`admin/students/${studentId}/sessions-completed`),

    generateAuto: (classId: number) =>
        axiosClient.post(`admin/sessions-auto/classes/${classId}`),

    generateManual: (classId: number, body: SessionDto) =>
        axiosClient.post(`admin/sessions-manual/classes/${classId}`, body),

    unlock: (sessionId: number) =>
        axiosClient.post(`admin/sessions/${sessionId}/unlock`),

    cancel: (sessionId: number, reason: string) =>
        axiosClient.patch(`admin/sessions/${sessionId}/cancel`, reason),


}