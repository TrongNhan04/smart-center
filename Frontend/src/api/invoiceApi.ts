import axiosClient from "../components/AxiosClient"

export const invoiceApi = {
    findOne: (invoiceId:number) => 
        axiosClient.get(`admin/invoices/${invoiceId}`),

    findMany: (q: string, status: string) => {
        const param: { q: string, status?: string } = { q }
        if (status)
            param.status = status
        return axiosClient.get(`admin/invoices`, {
            params: param
        })
    },

    createReceipt: (invoiceId: number, amount: number) => {
        const payload = { amount: amount }
        return axiosClient.post(`admin/invoices/${invoiceId}/receipts`, payload)
    },

    createPayment: (invoiceId: number, amount: number, reason: string) => {
        const payload = { amount: amount, reason: reason }
        return axiosClient.post(`admin/invoices/${invoiceId}/payments`, payload)
    },

    getReceipById: (invoiceId: number) => 
        axiosClient.get(`admin/invoices/${invoiceId}/receipts`),

    getPaymentById: (invoiceId:number) => 
        axiosClient.get(`admin/invoices/${invoiceId}/payments`)
}