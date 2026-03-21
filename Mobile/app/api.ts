import axiosClient from "./axiosClient";

const mobileApi = {
    login: (body: any) => axiosClient.post(`auth/login`,body),

    logout: () => axiosClient.post('auth/logout'),

    getNotis: () => axiosClient.get(`notifications`)
}

export default mobileApi