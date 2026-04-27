import axiosClient from "../components/AxiosClient";
import type { ReminderTeacher } from "../components/dashboard/DashboardDTO";

export const dashboardApi = {
    getSumaries: () => axiosClient.get('dashboards/sumaries'),

    getCharts: () => axiosClient.get('dashboards/charts'),

    getSessionsOfMonth: (month: number, year: number) => {
        const params = {
            month: month,
            year: year
        }
        return axiosClient.get('dashboards/sessions', {
            params: params
        })
    },    

    getTasks: () => axiosClient.get(`dashboards/tasks`),

    reminderTeacher: (teacherId: number, body: ReminderTeacher) =>
        axiosClient.post(`dashboards/teachers/${teacherId}/reminders`, body)
}