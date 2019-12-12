import { lunarCalendar } from '../core/lunarCalendar'
import { getTimeList, zeroPadding, getHash } from '../helper/util'
import { LunarCalendarData } from '../core/lunarCalendarData'

class Strategies extends LunarCalendarData {
    private count: number
    constructor() {
        super()
        this.count = 1
    }
    view(
        year: number,
        month: number,
        day: number,
        obj: { optionVal: number },
        template: string
    ): string {
        let html = `
            <div class="content">
                ${template}
                <div class="viewTable">
                    <table cellspacing="0">
                        <thead>
        `
        let timeArr = getTimeList()
        let endDay = 0
        let startDay = 0

        const date = new Date(year, month, day)
        const d = date.getDate()
        const w = date.getDay()

        const date2 = new Date()
        const y1 = date2.getFullYear()
        const m1 = date2.getMonth()
        const d1 = date2.getDate()

        switch (obj.optionVal) {
            case 1:
                startDay = day
                endDay = startDay
                break
            case 4:
                startDay = d - 1
                endDay = startDay + 3
                break
            case 7:
                // 得出初始渲染是哪天
                startDay = d - w
                endDay = startDay + 6
                break
        }

        for (let i: number = startDay; i <= endDay; i++) {
            let { weekDay, cDay, IDayCn, isTerm, Term, lMonth } = lunarCalendar(year, month, i)

            const week = weekDay.slice(2)

            let nov = this.lunarStr3[lMonth - 1]
            nov = nov === '冬' ? '十一' : nov === '腊' ? '十二' : nov
            nov += '月'

            html += `
                <th>
                    <div class="${
                        obj.optionVal > 1 && y1 === year && m1 === month && d1 === i
                            ? 'current'
                            : 'date1'
                    }">
                        <span class="week1">周${week}</span>
                        <div class="content1">
                            <span class="day1">${cDay}</span>
                            <span class="lunar1">${
                                isTerm ? Term : IDayCn === '初一' ? nov : IDayCn
                            }</span>
                        </div>
                    </div>
                </th>
            `
        }

        html += '</thead><tbody>'

        for (let i: number = 0; i < timeArr.length; i++) {
            html += `<tr>`
            for (let j = 0; j < obj.optionVal; j++) {
                html += '<td></td>'
            }
            html += '</tr>'
        }

        html += '</tbody></table></div></div>'

        return html
    }
    monthView(year: number, month: number) {
        let html = '<table class="view">'
        const weekArr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        let next = 0
        let i = 0
        let startDay = 0

        const date1 = new Date(year, month, 1)
        const d = date1.getDay()

        const date3 = new Date(year, month, 0)
        const w1 = date3.getDay()
        const lastDay1 = date3.getDate()

        const date2 = new Date(year, month + 1, 0)
        const lastDay = date2.getDate()
        const week = date2.getDay()
        // 当前日期
        const date4 = new Date()
        const y1 = date4.getFullYear()
        const m2 = date4.getMonth()
        const d4 = date4.getDate()

        if (week === 0) {
            html += '<tr>'
        }

        for (let i = 0; i < d; i++) {
            const { isTerm, Term, IDayCn } = lunarCalendar(year, month - 1, lastDay1 - w1 + i)
            const createHTML = isTerm
                ? `
                <div class="c">
                    <span class="tableWeek">${weekArr[i]}</span>
                    <div class="other">
                        <span class="disableD">${lastDay1 - w1 + i}</span>
                        <span class="disableL">( ${Term} )</span>
                    </div>
                </div>
            `
                : `
                <div class="c">
                    <span class="tableWeek">${weekArr[i]}</span>
                    <div class="other">
                        <span class="disableD">${lastDay1 - w1 + i}</span>
                        <span class="disableL">( ${IDayCn} )</span>
                    </div>
                </div>
            `
            html += `<td>${createHTML}</td>`
            next = i
        }

        let showMonth = (cMonth: number, i: number) =>
            `${i === 1 ? `${zeroPadding(cMonth)}月${zeroPadding(i)}日` : zeroPadding(i)}`

        for (let i = 1; i <= 6 - w1; i++) {
            const { isTerm, Term, IDayCn, cMonth } = lunarCalendar(year, month, i)
            next++
            const isCurrentDay = y1 === year && m2 === month && d4 === i
            const createHTML = isTerm
                ? `
                <div class="c">
                    <span class="tableWeek">${weekArr[next]}</span>
                    <div class="other">
                        <span class="${isCurrentDay ? 'currentDay' : 'd'}">${showMonth(
                      cMonth,
                      i
                  )}</span>
                        <span class="${isCurrentDay ? 'currentLunarDay' : 'l'}">( ${Term} )</span>
                    </div>
                </div>
            `
                : `
                <div class="c">
                    <span class="tableWeek">${weekArr[next]}</span>
                    <div class="other">
                        <span class="${isCurrentDay ? 'currentDay' : 'd'}">${showMonth(
                      cMonth,
                      i
                  )}</span>
                        <span class="${isCurrentDay ? 'currentLunarDay' : 'l'}">( ${IDayCn} )</span>
                    </div>
                </div>
            `
            html += `<td>${createHTML}</td>`
            startDay = i
        }

        i = startDay + 1
        // 生成天数
        for (; i <= lastDay; i++) {
            const { isTerm, Term, IDayCn, cMonth } = lunarCalendar(year, month, i)
            const isCurrentDay = y1 === year && m2 === month && d4 === i
            const createHTML = isTerm
                ? `
                <div class="c">
                    ${
                        d === 0
                            ? `<span class="tableWeek">${
                                  weekArr[i - 1] ? weekArr[i - 1] : ''
                              }</span>`
                            : ''
                    }
                    <div class="other">
                        <span class="${isCurrentDay ? 'currentDay' : 'd'}">${showMonth(
                      cMonth,
                      i
                  )}</span>
                        <span class="${isCurrentDay ? 'currentLunarDay' : 'l'}">( ${Term} )</span>
                    </div>
                </div>
            `
                : `
                <div class="c">
                    ${
                        d === 0
                            ? `<span class="tableWeek">${
                                  weekArr[i - 1] ? weekArr[i - 1] : ''
                              }</span>`
                            : ''
                    }
                    <div class="other">
                        <span class="${isCurrentDay ? 'currentDay' : 'd'}">${showMonth(
                      cMonth,
                      i
                  )}</span>
                        <span class="${isCurrentDay ? 'currentLunarDay' : 'l'}">( ${IDayCn} )</span>
                    </div>
                </div>
            `

            if ((i - 1 + d) % 7 === 0) {
                //  换行
                html += `<tr><td>${createHTML}</td>`
            } else {
                html += `<td>${createHTML}</td>`
            }
        }

        // 渲染剩余的天数. 即：上个月是30号，星期三， 那么剩余的表格数就是6 - 3 = 3格
        // 渲染出下个月的天，即：1， 2， 3
        for (i = 1; i <= 6 - week; i++) {
            // 获取下个月
            const { isTerm, Term, IDayCn, cMonth } = lunarCalendar(year, month + 1, i)
            const createHTML = isTerm
                ? `
                <div class="c">
                    <div class="other">
                        <span class="disableD">${showMonth(cMonth, i)}</span>
                        <span class="disableL">( ${Term} )</span>
                    </div>
                </div>
            `
                : `
                <div class="c">
                    <div class="other">
                        <span class="disableD">${showMonth(cMonth, i)}</span>
                        <span class="disableL">( ${IDayCn} )</span>
                    </div>
                </div>
            `
            html += `<td>${createHTML}</td>`
        }

        html += '</tr></table>'

        return html
    }
    yearView(weekArr: string[], year: number) {
        let html = `
            <div class="yearContent">
        `
        const monthArr = [
            '一月',
            '二月',
            '三月',
            '四月',
            '五月',
            '六月',
            '七月',
            '八月',
            '九月',
            '十月',
            '十一月',
            '十二月'
        ]

        const date = new Date()
        const newYear = date.getFullYear()
        const newMonth = date.getMonth()
        const newDay = date.getDate()

        for (let i = 0; i < 12; i++) {
            const date1 = new Date(year, i, 1)
            const date2 = new Date(year, i + 1, 0)
            const date3 = new Date(year, i, 0)

            const firstDayWeek = date1.getDay()
            const lastDay = date2.getDate()
            const prevDays = date3.getDate()
            const week = date2.getDay()
            // 星期
            html += `
                <div class="itemYear">
                    <div class="weekContainer">
                        <span class="week">${monthArr[i]}</span>
                    </div>`
            html += '<table><thead><tr>'

            for (let i = 0; i < weekArr.length; i++) {
                html += `<th>${weekArr[i]}</th>`
            }

            html += '</tr></thead>'
            html += '<tbody><tr>'
            let isWeekend = false
            // 上个月的天数
            if (firstDayWeek > 0) {
                let d = 0
                while (d < firstDayWeek) {
                    html += `<td class="remainder">${prevDays - (firstDayWeek - 1) + d}</td>`
                    d++
                }
            } else {
                isWeekend = true
            }

            // 记录行数
            let row = 1
            // 当前月的天数
            for (let j = 1; j <= lastDay; j++) {
                const date4 = new Date(year, i, j)
                const day = date4.getDate()
                const month = date4.getMonth()
                if ((j - 1 + firstDayWeek) % 7 === 0) {
                    row++
                    html += `</tr><tr><td><div class="${
                        newYear === year && newMonth === month && newDay === day ? 'current' : 'td'
                    }">${zeroPadding(j)}</div></td>`
                } else {
                    html += `<td><div class="${
                        newYear === year && newMonth === month && newDay === day ? 'current' : 'td'
                    }">${zeroPadding(j)}</div</td>`
                }
            }

            // 如果第一天为周日的话，行数 - 1
            if (isWeekend) {
                row--
            }
            // 补于下个月的天数
            if (row < 6) {
                if (week === 6) {
                    html += '<tr>'
                }
                let index = 1
                for (let i = 0; i < 6 - row; i++) {
                    for (let j = 1; j <= 7 - (week + 1); j++) {
                        html += `<td class="disableDay">${zeroPadding(j)}</td>`
                        index++
                    }

                    html += '</tr><tr>'
                    const count = index

                    for (; index < 7 + count; index++) {
                        html += `<td class="disableDay">${zeroPadding(index)}</td>`
                    }
                }
            } else if (row === 6) {
                let totalCount = 7
                if (week === 0) {
                    --totalCount
                } else {
                    totalCount = 6 - week
                }
                for (let index = 1; index <= totalCount; index++) {
                    html += `<td class="disableDay">${zeroPadding(index)}</td>`
                }
            }
            html += '</tr>'
            html += '</tbody></table></div>'
        }

        html += '</div>'

        return html
    }
}

export function strategies(...rest: any[]) {
    const s: any = new Strategies()
    let name = rest[0]
    if (!isNaN(name)) {
        name = 'view'
    } else {
        name = rest.shift()
    }
    return s[name].apply(s, rest)
}

export class ArrowStrategies {
    private year: number
    private month: number
    private day: number
    private date: HTMLElement | null
    private lunar: HTMLElement | null
    private changeMonth: number
    private changeYear: number
    private changeDay: number
    constructor(year: number, month: number, day: number) {
        this.year = year
        this.month = month
        this.day = day
        this.date = document.getElementById('date1')
        this.lunar = document.getElementById('lunar1')

        this.changeYear = this.year
        this.changeMonth = this.month
        this.changeDay = this.day
    }
    ['/day'](callback: (...rest: any) => void, flag: string) {
        if (flag === 'prevDay') --this.changeDay
        else if (flag === 'nextDay') ++this.changeDay
        this.publicMethod(callback)
    }
    ['/week'](callback: (...rest: any) => void, flag: string) {
        if (flag === 'prevWeek') this.changeDay -= 7
        else if (flag === 'nextWeek') this.changeDay += 7
        this.publicMethod(callback)
    }
    ['/month'](callback: (...rest: any) => void, flag: string) {
        if (flag === 'prevMonth') --this.changeMonth
        else if (flag === 'nextMonth') ++this.changeMonth
        this.publicMethod(callback)
    }
    ['/year'](callback: (...rest: any) => void, flag: string) {
        if (flag === 'prevYear') --this.changeYear
        else if (flag === 'nextYear') ++this.changeYear
        this.publicMethod(callback)
    }
    ['/fourDays'](callback: (...rest: any) => void, flag: string) {
        if (flag === 'prevFourDays') this.changeDay -= 4
        else if (flag === 'nextFourDays') this.changeDay += 4
        this.publicMethod(callback)
    }
    publicMethod(callback: (...rest: any) => void) {
        const date = new Date(this.changeYear, this.changeMonth, this.changeDay)
        const y = date.getFullYear()
        const m = date.getMonth()
        const d = date.getDate()

        let { IDayCn, cYear, cMonth, IMonthCn } = lunarCalendar(y, m, d)

        this.setHeaderHTML([`${cYear}年${zeroPadding(cMonth)}月`, `农历${IMonthCn}${IDayCn}`])
        callback(y, m, d)
    }
    setHeaderHTML(val: string[]) {
        this.date!.innerHTML = val[0]
        this.lunar!.innerHTML = val[1]
    }
    start(callback: (...rest: any) => void, flag: string) {
        const [path] = getHash()
        ;(this as any)[path].call(this, callback, flag)
    }
}
