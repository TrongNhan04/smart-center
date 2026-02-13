import { ConflictException } from "@nestjs/common";
import { addDays, addMonths, addWeeks, startOfDay, startOfMonth, startOfWeek } from "date-fns";

export class DateHelper {
    // format giờ và phút, input "HH:mm" -> h = "HH", m = "mm"
    static parseHHmm(time: string) {
        const [h, m] = time.split(':').map(Number)
        return { h, m }
    }

    // ghép ngày và giờ
    static combineDateAndTime(dateOnly: Date, hhmm: string) {
        const { h, m } = this.parseHHmm(hhmm)
        const d = new Date(dateOnly)
        d.setHours(h, m, 0, 0)
        return d
    }

    //kiểm tra khoảng ngày hợp lệ
    static FromDateToDateValidator(fromDate: Date, toDate: Date) {
        if (fromDate >= toDate)
            throw new ConflictException('Từ ngày phải nhỏ hơn đến ngày')
    }

    // kiểm tra thời gian trong lịch - hiện tại = bao nhiêu phút
    static CheckTimeWindow(time: Date) {
        const now = new Date().getTime()
        const timeLeft = time.getTime() - now
        return Math.floor(timeLeft / 60000)
    }

    // kiểm tra giờ bắt đầu + kết thúc
    static ValidateTimeRange(startTime: string, endTime: string) {
        // tách giờ bởi dấu ":" và chuyển thành số 
        const startTimeSplit = startTime.split(":").map(Number)
        // tổng số phút = giờ * 60 + phút --> để so sánh
        const startMinutes = startTimeSplit[0] * 60 + startTimeSplit[1]
        const endTimeSplit = endTime.split(":").map(Number)
        const endMinutes = endTimeSplit[0] * 60 + endTimeSplit[1]

        if (startMinutes < 420 || endMinutes > 1260)// 7h-21h
            throw new ConflictException('Open from 7am to 9pm')
        if (startMinutes >= endMinutes)
            throw new ConflictException('End time must greater than start time')
    }

    // kiểm tra trùng thời gian
    static TimeOverlap<T>(aStart: T, aEnd: T, bStart: T, bEnd: T, isTime: boolean) {
        if (isTime)
            return aStart < bEnd && bStart < aEnd
        return aStart <= bEnd && bStart <= aEnd
    }

    // lấy đầu tháng này đến đầu tháng kia
    static GetStartEndOfMonth(now: Date) {
        const start = startOfMonth(now)// ngày đầu tháng
        const end = startOfMonth(addMonths(now, 1)) // ngày đầu tháng sau
        return { start, end }
    }

    // lấy đầu tuần đến trước đầu tuần sau
    static GetStartEndOfWeek(now: Date){
        const start = startOfWeek(now)
        const end = startOfWeek(addWeeks(now,1))
        const sow = new Date(start.setDate(start.getDate()+1))
        const eow = new Date(end.setDate(end.getDate()+1))
        return {sow, eow}
    }

    // lấy đầu ngày hôm nay đến đầu ngày mai
    static GetStartEndOfDay(now: Date) {
        const start = startOfDay(now)// ngày đầu tháng
        const end = startOfDay(addDays(now, 1)) // ngày đầu tháng sau
        return { start, end }
    }

    // format giờ ISO 2026-01-10T03:30:00.000Z về dạng "HH:mm"
    static ISOToHHMM(start: Date, end: Date) {
        return start.toLocaleTimeString('vi-VN',
            { hour: '2-digit', minute: '2-digit' })
            + '-' + end.toLocaleTimeString('vi-VN',
                { hour: '2-digit', minute: '2-digit' })
    }
}