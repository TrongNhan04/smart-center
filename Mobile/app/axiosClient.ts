import axios from "axios";
import useAuthStore from "./authStore";

const axiosClient = axios.create({
    // nhớ đổi theo ip máy đang kết nối tới wifi nào
    baseURL: 'http://192.168.1.100:3000',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Can thiệp trước khi gửi đi: gắn token vào header
axiosClient.interceptors.request.use(
    config => {
        const token = useAuthStore.getState().access_token
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// can thiệp sau khi nhận phản hồi
axiosClient.interceptors.response.use(
    response => {
        if (response.data)
            return response.data
    },
    error => {
        if (error.response?.status === 401) {
            console.log(error)
            useAuthStore.getState().logout()
        }
        return Promise.reject(error)
    }
)

export default axiosClient