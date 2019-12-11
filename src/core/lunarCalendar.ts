import { lunarCalendarData } from './lunarCalendarData'
import { LunarCalendarDataInterface } from '../types/index'
import { forEach, hasOwnProperty, zeroPadding } from '../helper/util'

class LunarCalendar {
    readonly lunarInfo: number[]
    readonly solarMonth: number[]
    readonly gan: string[]
    readonly zhi: string[]
    readonly animals: string[]
    readonly solarTerms: string[]
    readonly everyYearSolarTerms: string[]
    readonly nStr1: string[]
    readonly nStr2: string[]
    readonly nStr3: string[]
    readonly englishMonthArray: string[]
    readonly englishFullMonth: string[]
    readonly englishWeekArray: string[]
    readonly chineseWeekArray: string[]
    readonly lunarFestival: { [propName: string]: string }
    readonly solarFestival: { [propName: string]: string }
    readonly baseYear: number
    readonly indeterminateFestival: string[]
    static year: number
    static month: number
    static day: number
    static date: Date
    static lastDay: number
    static festival: string | null
    constructor(data: LunarCalendarDataInterface) {
        const {
            lunarYearsInfo,
            solarMonthDays,
            airDried,
            ganArray,
            animals,
            solarTerms,
            everyYearSolarTerms,
            lunarStr1,
            lunarStr2,
            lunarStr3,
            englishMonthArray,
            englishFullMonth,
            englishWeekArray,
            chineseWeekArray,
            lunarFestival,
            solarFestival,
            indeterminateFestival
        } = data

        this.lunarInfo = lunarYearsInfo
        this.solarMonth = solarMonthDays
        this.gan = airDried
        this.zhi = ganArray
        this.animals = animals
        this.solarTerms = solarTerms
        this.everyYearSolarTerms = everyYearSolarTerms
        this.nStr1 = lunarStr1
        this.nStr2 = lunarStr2
        this.nStr3 = lunarStr3

        this.englishMonthArray = englishMonthArray
        this.englishFullMonth = englishFullMonth
        this.englishWeekArray = englishWeekArray
        this.chineseWeekArray = chineseWeekArray

        this.lunarFestival = lunarFestival
        this.solarFestival = solarFestival
        // 不固定节日数据
        this.indeterminateFestival = indeterminateFestival

        this.baseYear = 1900
    }
    // 传入阳历年月日获得详细的公历、农历object信息
    main(y: number, m: number, d: number) {
        // 公历传参最下限
        if (y < 1900 || y > 2100 || (y === 1900 && m === 1 && d < 31)) return -1

        // 未传参  获得当天
        // tslint:disable-next-line: radix
        let date = y ? new Date(y, parseInt(m as any), d) : new Date()

        let i
        let leap = 0
        let temp = 0
        // 修正ymd参数
        y = date.getFullYear()
        m = date.getMonth() + 1
        d = date.getDate()
        let diffDays = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000

        for (i = 1900; i < 2101 && diffDays > 0; i++) {
            temp = this.getYearTotalDays(i)
            diffDays -= temp
        }
        if (diffDays < 0) {
            diffDays += temp
            i--
        }

        // 是否今天
        let currentDate = new Date()
        let isToday = false
        const isYearEqual = currentDate.getFullYear() === y
        const isMonthEqual = currentDate.getMonth() + 1 === m
        const isDayEqual = currentDate.getDate() === d

        if (isYearEqual && isMonthEqual && isDayEqual) {
            isToday = true
        }
        // 农历年
        let year = i
        leap = this.getLeapMonth(i) // 闰哪个月
        let isLeap = false

        // 效验闰月
        for (i = 1; i < 13 && diffDays > 0; i++) {
            // 闰月
            if (leap > 0 && i === leap + 1 && isLeap === false) {
                --i
                isLeap = true
                temp = this.getLeapMonthDays(year) // 计算农历闰月天数
            } else {
                temp = this.getMonthDays(year, i) // 计算农历普通月天数
            }
            // 解除闰月
            if (isLeap && i === leap + 1) {
                isLeap = false
            }
            diffDays -= temp
        }
        // 闰月导致数组下标重叠取反
        if (diffDays === 0 && leap > 0 && i === leap + 1) {
            if (isLeap) {
                isLeap = false
            } else {
                isLeap = true
                --i
            }
        }
        if (diffDays < 0) {
            diffDays += temp
            --i
        }
        // 农历月
        let month = i
        // 农历日
        let day = diffDays + 1
        // 天干地支处理
        let sm = m - 1
        let gzY = this.toGanZhiYear(year)

        // 当月的两个节气
        // bugfix-2017-7-24 11:03:38 use lunar Year Param `y` Not `year`
        let firstSolarTerm = this.getTerm(y, m * 2 - 1) // 返回当月「节」为几日开始
        let secondSolarTerm = this.getTerm(y, m * 2) // 返回当月「节」为几日开始

        // 依据12节气修正干支月
        let gzM = this.toGanZhi((y - 1900) * 12 + m + 11)
        if (d >= firstSolarTerm) {
            gzM = this.toGanZhi((y - 1900) * 12 + m + 12)
        }

        // 传入的日期的节气与否
        let isTerm = false
        let term = null
        if (firstSolarTerm === d) {
            isTerm = true
            term = this.solarTerms[m * 2 - 2]
        }
        if (secondSolarTerm === d) {
            isTerm = true
            term = this.solarTerms[m * 2 - 1]
        }
        // 日柱 当月一日与 1900/1/1 相差天数
        let dayCyclical = Date.UTC(y, sm, 1, 0, 0, 0, 0) / 86400000 + 25567 + 10
        let gzD = this.toGanZhi(dayCyclical + d - 1)
        let weekDay = this.getWeekDay(date)

        return {
            lYear: year,
            lMonth: month,
            lDay: day,
            Animal: this.getAnimal(year),
            IMonthCn: (isLeap ? '\u95f0' : '') + this.toChinaMonth(month),
            IDayCn: this.toChinaDay(day),
            cYear: y,
            cMonth: m,
            cDay: d,
            gzYear: gzY,
            gzMonth: gzM,
            gzDay: gzD,
            isToday: isToday,
            isTerm: isTerm,
            Term: term,
            weekDay: '星期' + weekDay,
            lunarFestival: this.getLunarFestival(month, day),
            solarFestival: this.getSolarFestival(y, m, d, date)
        }
    }
    isLeapYear(year: number) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    }
    // 返回农历year年一整年的总天数
    getYearTotalDays(year: number) {
        let sum = 348
        for (let i = 0x8000; i > 0x8; i >>= 1) {
            sum += this.lunarInfo[year - this.baseYear] & i ? 1 : 0
        }
        return sum + this.getLeapMonthDays(year)
    }
    // 返回农历y年闰月是哪个月；若year年没有闰月 则返回0
    getLeapMonth(year: number) {
        return this.lunarInfo[year - this.baseYear] & 0xf
    }
    // 返回农历y年闰月的天数 若该年没有闰月则返回0
    getLeapMonthDays(year: number) {
        if (this.getLeapMonth(year)) {
            return this.lunarInfo[year - this.baseYear] & 0x10000 ? 30 : 29
        }
        return 0
    }
    // 返回农历y年m月（非闰月）的总天数
    getMonthDays(year: number, month: number) {
        if (month > 12 || month < 1) return -1
        //  月份参数从1至12，参数错误返回-1
        return this.lunarInfo[year - this.baseYear] & (0x10000 >> month) ? 30 : 29
    }
    // 返回公历(!)y年m月的天数
    getSolarDays(year: number, month: number) {
        if (month > 12 || month < 1) return -1
        //  若参数错误 返回-1
        let practicalMonth = month - 1
        if (practicalMonth === 1) {
            //  2月份的闰平规律测算后确认返回28或29
            return this.isLeapYear(year) ? 29 : 28
        } else {
            return this.solarMonth[practicalMonth]
        }
    }
    // 农历年份转换为干支纪年
    toGanZhiYear(lunarYear: number) {
        const gan = (lunarYear - 4) % 10
        const zhi = (lunarYear - 4) % 12
        return this.gan[gan] + this.zhi[zhi]
    }
    // 传入offset偏移量返回干支
    // 相对甲子的偏移量
    toGanZhi(offset: number) {
        return this.gan[offset % 10] + this.zhi[offset % 12]
    }
    // 传入公历(!)y年获得该年第n个节气的公历日期
    // y公历年(1900-2100)；n二十四节气中的第几个节气(1~24)；从n=1(小寒)算起
    getTerm(year: number, month: number) {
        if (year < 1900 || year > 2100 || month < 1 || month > 24) return -1

        const _table = this.everyYearSolarTerms[year - this.baseYear]
        const _info = [
            // tslint:disable-next-line: radix
            parseInt(`0x${_table.substr(0, 5)}`).toString(),
            // tslint:disable-next-line: radix
            parseInt(`0x${_table.substr(5, 5)}`).toString(),
            // tslint:disable-next-line: radix
            parseInt(`0x${_table.substr(10, 5)}`).toString(),
            // tslint:disable-next-line: radix
            parseInt(`0x${_table.substr(15, 5)}`).toString(),
            // tslint:disable-next-line: radix
            parseInt(`0x${_table.substr(20, 5)}`).toString(),
            // tslint:disable-next-line: radix
            parseInt(`0x${_table.substr(25, 5)}`).toString()
        ]
        const _calday = []
        for (let i = 0; i < _info.length; i++) {
            _calday.push(_info[i].substr(0, 1))
            _calday.push(_info[i].substr(1, 2))
            _calday.push(_info[i].substr(3, 1))
            _calday.push(_info[i].substr(4, 2))
        }
        // tslint:disable-next-line: radix
        return parseInt(_calday[month - 1])
    }
    // 传入农历数字月份返回汉语通俗表示法
    toChinaMonth(month: number) {
        // 若参数错误 返回-1
        if (month > 12 || month < 1) return -1
        return month === 11 ? '十一 ( 冬 ) \u6708' : `${this.nStr3[month - 1]}\u6708` // 加上月字
    }
    // 传入农历日期数字返回汉字表示法
    toChinaDay(day: number) {
        let str = ''
        switch (day) {
            case 10:
                str = '\u521d\u5341'
                break
            case 20:
                str = '\u4e8c\u5341'
                break
            case 30:
                str = '\u4e09\u5341'
                break
            default:
                str = this.nStr2[Math.floor(day / 10)]
                str += this.nStr1[day % 10]
        }
        return str
    }
    // 年份转生肖[!仅能大致转换] => 精确划分生肖分界线是“立春”
    getAnimal(year: number) {
        return this.animals[(year - 4) % 12]
    }
    getWeekDay(date: Date) {
        let day = date.getDay()
        return this.chineseWeekArray[day]
    }
    getLunarFestival(month: number, day: number) {
        return this.lunarFestival[`${this.toChinaMonth(month)}${this.toChinaDay(day)}`]
    }
    getSolarFestival(year: number, month: number, day: number, date: Date) {
        let festival = null
        let nationWide = null
        const lastDay = new Date(year, month, 0).getDate()
        const festivalDate = `${zeroPadding(month)}${zeroPadding(day)}`

        festival = this.solarFestival[festivalDate]
        this.publicDateData(year, month, day, date, lastDay, festival)

        const indeterminateFestivalMonthData = [3, 5, 6, 9, 11]
        if (indeterminateFestivalMonthData.includes(month)) {
            switch (month) {
                case 3:
                    // 全国中小学生安全教育日
                    festival = this.getIndefiniteFestival(1, 4, this.indeterminateFestival[0], 3)
                    break
                case 5:
                    // 母亲节
                    festival = this.getIndefiniteFestival(0, 2, this.indeterminateFestival[1], 5)
                    // 全国助残日
                    // 这里节日会被覆盖，所以要新声明一个变量
                    nationWide = this.getIndefiniteFestival(0, 3, this.indeterminateFestival[2], 5)
                    break
                case 6:
                    // 父亲节
                    festival = this.getIndefiniteFestival(0, 3, this.indeterminateFestival[3], 6)
                    break
                case 9:
                    // 全民国防教育日
                    festival = this.getIndefiniteFestival(6, 3, this.indeterminateFestival[4], 9)
                    // 国际聋人节
                    festival = this.getIndefiniteFestival(0, 4, this.indeterminateFestival[5], 9)
                    break
                case 11:
                    // 感恩节
                    festival = this.getIndefiniteFestival(4, 4, this.indeterminateFestival[6], 11)
            }
        }

        return festival ? festival : nationWide
    }
    getIndefiniteFestival(
        endweekDay: number,
        totalCount: number,
        indefiniteFestival: string,
        festivalMonth: number
    ) {
        let week = 0
        let count = 0
        let festival = null
        LunarCalendar.date.setMonth(LunarCalendar.month - 1)
        for (let i = 1; i <= LunarCalendar.lastDay; i++) {
            LunarCalendar.date.setDate(i)
            week = LunarCalendar.date.getDay()
            if (week === endweekDay) {
                count++
                if (
                    count === totalCount &&
                    festivalMonth === LunarCalendar.month &&
                    LunarCalendar.day === i
                ) {
                    if (LunarCalendar.festival) {
                        LunarCalendar.festival += `( ${indefiniteFestival} )`
                    } else {
                        festival = indefiniteFestival
                    }
                    break
                }
            }
        }
        if (festival) {
            return festival
        } else {
            return LunarCalendar.festival
        }
    }
    publicDateData(
        year: number,
        month: number,
        day: number,
        date: Date,
        lastDay: number,
        festival: string | null
    ) {
        LunarCalendar.year = year
        LunarCalendar.month = month
        LunarCalendar.day = day
        LunarCalendar.date = date
        LunarCalendar.lastDay = lastDay
        LunarCalendar.festival = festival
    }
}

export let lunarCalendar = (year: number, month: number, day: number): any => {
    const lunarCalendar = new LunarCalendar(lunarCalendarData())
    return lunarCalendar.main(year, month, day)
}
