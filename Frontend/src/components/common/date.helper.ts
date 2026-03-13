import dayjs from "dayjs"

export class DateHelper {
    static PraseHHmm(time: string) {
        const [h, m] = time.split(':').map(Number)
        return { h, m }
    }

    static TimeDiff(dateCompare: string) {
        const timeNow = new Date().getTime()
        const date = new Date(dateCompare).getTime()
        return Math.floor(timeNow - date / 60000)
    }

    static ConvertHourStrToDayJS(time: string) {
        const { h, m } = this.PraseHHmm(time)
        const d = new Date()
        d.setHours(h, m, 0, 0)
        return dayjs(d)
    }

    static ISOToHHMM(s: string, e: string) {
        const start = new Date(s)
        const end = new Date(e)
        return start.toLocaleTimeString('vi-VN',
            { hour: '2-digit', minute: '2-digit' })
            + ' - ' + end.toLocaleTimeString('vi-VN',
                { hour: '2-digit', minute: '2-digit' })
    }
}