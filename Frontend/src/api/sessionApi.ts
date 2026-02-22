import axiosClient from "../components/AxiosClient";
import type { SessionDto } from "../components/session/SessionDTO";

export const sessionApi = {
    getSessionOfClass: (classId: number) =>
        axiosClient.get(`admin/classes/${classId}/sessions`),

    autoGenerate: (classId: number) =>
        axiosClient.post(`admin/sessions-auto/classes/${classId}`),

    manualGenarate: (classId: number, body: SessionDto) =>
        axiosClient.post(`admin/sessions-manual/classes/${classId}`, body),

    unlockSession: (sessionId: number) =>
        axiosClient.post(`admin/sessions/${sessionId}/unlock`),

    cancelSession: (sessionId: number, reason: string) =>
        // console.log("reason đưa cho api:",reason)
        axiosClient.patch(`admin/sessions/${sessionId}/cancel`, reason),

    getSessionResult: (sessionId: number) => 
        axiosClient.get(`teacher/sessions/${sessionId}`)
}