import axiosClient from "./axiosClient";

const mobileApi = {
    login: (body: any) => axiosClient.post(`auth/login`, body),

    logout: () => axiosClient.post('auth/logout'),

    getNotis: () => axiosClient.get(`notifications`),

    updateProfile: (body: any) => axiosClient.patch('auth/profile', body),

    getDashboard: (studentId: any) =>
        axiosClient.get(`parents/students/${studentId}/dashboard`)
}

export default mobileApi