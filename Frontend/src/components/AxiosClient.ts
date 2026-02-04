import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const axiosClient = axios.create({
    baseURL: 'http://localhost:3000',
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
    response =>{
        if(response.data)
            return response.data
    },
    error => {
        if(error.response?.status===401){
            useAuthStore.getState().logout()
            window.location.href = '/'
            console.log(error)
        }
        return Promise.reject(error)
    }
)

export default axiosClient