import axiosClient from "../components/AxiosClient"

export const invoiceApi = {
    findMany: (q: string, status: string) => {
        const param: { q: string, status?: string } = { q }
        if (status)
            param.status = status
        return axiosClient.get(`admin/invoices`, {
            params: param
        })
    }
}