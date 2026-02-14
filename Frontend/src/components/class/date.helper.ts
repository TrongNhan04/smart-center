import dayjs from "dayjs"

export class DateHelper {
    static PraseHHmm(time: string) {
        const [h, m] = time.split(':').map(Number)
        return { h, m }
    }

    static ConvertHourStrToDayJS(time: string) {
        const { h, m } = this.PraseHHmm(time)
        const d = new Date()
        d.setHours(h, m, 0, 0)
        const result = dayjs(d)
        return result
    }

    static ISOToHHMM(start: Date, end: Date) {
        return start.toLocaleTimeString('vi-VN',
            { hour: '2-digit', minute: '2-digit' })
            + '-' + end.toLocaleTimeString('vi-VN',
                { hour: '2-digit', minute: '2-digit' })
    }
}