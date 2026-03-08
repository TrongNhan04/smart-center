import axiosClient from "../components/AxiosClient";
import type { ReminderTeacher } from "../components/dashboard/DashboardDTO";

export const dashboardApi = {
    getSumaries: () => axiosClient.get('dashboards/sumaries'),

    getCharts: () => axiosClient.get('dashboards/charts'),

    getSessions: () => axiosClient.get('dashboards/sessions'),

    getTasks: () => axiosClient.get(`dashboards/tasks`),

    unlock: (sessionId: number) =>
        axiosClient.post(`admin/sessions/${sessionId}/unlock`),

    reminderTeacher: (teacherId: number, body: ReminderTeacher) =>
        axiosClient.post(`dashboards/teachers/${teacherId}/reminders`, body)
}