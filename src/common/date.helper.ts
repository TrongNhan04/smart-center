import { ConflictException } from "@nestjs/common";

export class DateHelper {
    // format giờ và phút
    static parseHHmm(time: string) {
        const [h, m] = time.split(':').map(Number);
        return { h, m };
    }

    // ghép ngày và giờ
    static combineDateAndTime(dateOnly: Date, hhmm: string) {
        const { h, m } = this.parseHHmm(hhmm);
        const d = new Date(dateOnly);
        d.setHours(h, m, 0, 0);
        return d;
    }

    // kiểm tra lịch - hiện tại = bao nhiêu phút
    static CheckTimeWindow(time: Date) {
        const now = new Date().getTime()
        const timeLeft = time.getTime() - now
        return Math.floor(timeLeft / 60000)
    }

    // kiểm tra giờ bắt đầu + kết thúc và sĩ số
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
}