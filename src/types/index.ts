export interface LunarCalendarDataInterface {
    readonly lunarYearsInfo: number[]
    readonly solarMonthDays: number[]
    readonly airDried: string[]
    readonly ganArray: string[]
    readonly animals: string[]
    readonly solarTerms: string[]
    readonly everyYearSolarTerms: string[]
    readonly lunarStr1: string[]
    readonly lunarStr2: string[]
    readonly lunarStr3: string[]
    readonly englishMonthArray: string[]
    readonly englishFullMonth: string[]
    readonly englishWeekArray: string[]
    readonly englishFullWeekArray: string[]
    readonly chineseWeekArray: string[]
    readonly lunarFestival: { [propName: string]: string }
    readonly solarFestival: { [propName: string]: string }
    readonly indeterminateFestival: string[]
}

export interface SubScribeInterface {
    clientList: { [propName: string]: any }
    listen(key: any, func: Function): void
    trigger(): void
}
