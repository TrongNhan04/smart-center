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

    getTransactions: (page: number, month?: number, year?: number) =>
        axiosClient.get(`admin/invoices/transactions`, {
            params: {
                page: page,
                month: month,
                year: year
            }
        }),

    getTransactionsById: (invoiceId: number) =>
        axiosClient.get(`admin/invoices/${invoiceId}/transactions`),
}

interface QueryDto {
    q: string,
    status?: string,
    page: number
}