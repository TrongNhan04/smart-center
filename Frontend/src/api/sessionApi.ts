import axiosClient from "../components/AxiosClient";
import type { SessionDto, TSessionDetail } from "../components/session/SessionDTO";

export const sessionApi = {
    getDetailsById: (sessionId: number) =>
        axiosClient.get(`sessions/${sessionId}`),

    getByClassId: (classId: number) =>
        axiosClient.get(`admin/classes/${classId}/sessions`),

    getCompletedByTeacherId: (teacherId: number) =>
        axiosClient.get(`admin/teachers/${teacherId}/sessions-completed`),

    getCompletedByStudentId: (studentId: number) =>
        axiosClient.get(`admin/students/${studentId}/sessions-completed`),

    generateAuto: (classId: number) =>
        axiosClient.post(`admin/sessions-auto/classes/${classId}`),

    generateManual: (classId: number, body: SessionDto) =>
        axiosClient.post(`admin/sessions-manual/classes/${classId}`, body),

    getFileUpload: (sessionId:number) => 
        axiosClient.get(`api/sessions/${sessionId}/file-upload`),

    unlock: (sessionId: number) =>
        axiosClient.post(`admin/sessions/${sessionId}/unlock`),

    refuseUnlock:(sessionId:number) => 
        axiosClient.post(`admin/sessions/${sessionId}/refuse-unlock`),

    cancel: (sessionId: number, reason: string) =>
        axiosClient.patch(`admin/sessions/${sessionId}/cancel`, reason),

    saveDraft: (sessionId: number, body:TSessionDetail) =>
        axiosClient.put(`teacher/sessions/${sessionId}/result-draft`, body),

    submitted: (sessionId: number, body:TSessionDetail) =>
        axiosClient.put(`teacher/sessions/${sessionId}/result-submit`,body),
}