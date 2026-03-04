import axiosClient from "../components/AxiosClient"
import type { PaymentDto, ReceiptDto } from "../components/invoice/InvoiceDTO"

export const invoiceApi = {
    findOne: (invoiceId: number) =>
        axiosClient.get(`admin/invoices/${invoiceId}`),

    findMany: (query: QueryDto) => {
        const param: QueryDto = { q: query.q, page: query.page }
        if (query.status)
            param.status = query.status
        return axiosClient.get(`admin/invoices`, {
            params: param
        })
    },

    createReceipt: (invoiceId: number, body: ReceiptDto) =>
        axiosClient.post(`admin/invoices/${invoiceId}/receipts`, body),

    createPayment: (invoiceId: number, body: PaymentDto) =>
        axiosClient.post(`admin/invoices/${invoiceId}/payments`, body),

    getReceiptById: (invoiceId: number) =>
        axiosClient.get(`admin/invoices/${invoiceId}/receipts`),

    getPaymentById: (invoiceId: number) =>
        axiosClient.get(`admin/invoices/${invoiceId}/payments`),

    getAllReceipt_Payment: (page: number) =>
        axiosClient.get(`admin/invoices/receipts-payments`, {
            params: {
                page: page
            }
        })
}

interface QueryDto {
    q: string,
    status?: string,
    page: number
}