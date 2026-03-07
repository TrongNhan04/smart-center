import axiosClient from "../components/AxiosClient";

export const dashboardApi = {
    getSumaries: () => axiosClient.get('dashboards/sumaries'),

    getFinanceChart: () => axiosClient.get('dashboards/charts'),

    getSessions: () => axiosClient.get('dashboards/sessions'),

    getTasks: () => axiosClient.get(`dashboards/tasks`)
}