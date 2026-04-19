import axiosClient from "./axiosClient";

const mobileApi = {
    login: (body: any) => axiosClient.post(`auth/login`, body),

    logout: () => axiosClient.post('auth/logout'),

    getNotis: () => axiosClient.get(`notifications`),

    readOneNotis: (notisId: number) =>
        axiosClient.patch(`notifications/${notisId}`),

    readAllNotis: () => axiosClient.patch('notifications'),

    updateProfile: (body: any) => axiosClient.patch('auth/profile', body),

    getDashboard: (studentId: number) =>
        axiosClient.get(`parents/students/${studentId}/dashboard`),

    getClassByStuId: (id:number) => 
        axiosClient.get(`parents/students/${id}/classes`),

    getDetailByStuAndSesId: (stuId: number, sessionId:number) =>
        axiosClient.get(`parents/students/${stuId}/sessions/${sessionId}`),

    getSessionIdsByClassId: (classId:string | string []) => 
        axiosClient.get(`parents/classes/${classId}/sessions`),

    getInvoiceByStuId: (stuId:number) =>
        axiosClient.get(`parents/students/${stuId}/invoices`),
    
    getInvoiceById: (invoiceId:number) => 
        axiosClient.get(`parents/invoices/${invoiceId}`),

    payment:(orderId:string|string[]) => axiosClient.post('payments',{orderId})
}

export default mobileApi