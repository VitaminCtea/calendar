import {
    forEach,
    zeroPadding,
    addClass,
    removeClass,
    handleEvent,
    setContent,
    getContent,
    getTimeList,
    hasClass,
    getHash
} from '../helper/util'
import { lunarCalendarData } from './lunarCalendarData'
import { lunarCalendar } from './lunarCalendar'
import { createEvent } from '../helper/subScribe'
import { SubScribeInterface } from '../types/index'
import { Route } from './routing'
import { strategies, ArrowStrategies } from '../views/strategy'
import { mouseEvent } from './createReminders'

function style(this: any, style: { [propName: string]: string }, FSM: string) {
    for (let key in style) {
        this.listEl.style[key] = style[key]
    }
    this.element.setState(this.element[FSM])
}

abstract class BaseState {
    protected element: any
    protected listEl: any
    constructor(element: { [propName: string]: any }, listEl: HTMLElement | Element) {
        this.element = element
        this.listEl = listEl
    }
    abstract play(): void
}

class OriginState extends BaseState {
    play() {
        style.call(
            this,
            { opacity: '0', transform: 'translate3d(0, -10px, 0) scale(0)' },
            'showState'
        )
    }
}
class ShowState extends BaseState {
    play() {
        style.call(
            this,
            { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' },
            'originState'
        )
    }
}

class State {
    button: HTMLElement | Element | null
    list: any
    showState: any
    originState: any
    currentState: any
    constructor(button: HTMLElement | Element, list: any) {
        this.button = button
        this.list = list
        this.showState = new ShowState(this, list)
        this.originState = new OriginState(this, list)
    }
    init() {
        this.currentState = this.showState
        ;(this.button as any).onclick = () => {
            this.currentState.play()
        }
    }
    setState(newState: any) {
        this.currentState = newState
    }
}

export class Calendar {
    private containerEl: Element
    private currentTotalDays: number
    private currentMonthWeekDay: number
    private englishMonthArray: Array<string>
    private englishWeekArray: Array<string>
    private englishFullWeekArray: Array<string>
    private currentMonth: number
    private currentDay: number
    private chineseWeekArray: Array<string>
    private englishFullMonth: Array<string>
    private currentYear: number
    private currentWeek: number
    private index: number
    private middleYear: number
    private newYear: number
    private newMonth: number
    private newDay: number
    private timeArr: string[]
    private stateList: State | null
    newHTML: string
    route: Route = new Route()
    routerView: HTMLElement | null = null
    show: HTMLElement | null | Element = null
    days: number
    arrow: any = null
    arrowLeft: HTMLElement | null = null
    arrowRight: HTMLElement | null = null
    private createEvent: SubScribeInterface
    constructor(selector: string) {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()
        const newDate = new Date(year, month + 1, 0)
        const firstDayOfWeek = new Date(year, month, 1)

        this.containerEl = document.querySelector(selector)!

        this.currentTotalDays = newDate.getDate()
        this.currentMonthWeekDay = firstDayOfWeek.getDay()

        this.currentMonth = month
        this.currentYear = year
        this.currentDay = date.getDate()
        this.currentWeek = date.getDay()

        // 月份数据
        const {
            englishMonthArray,
            englishFullMonth,
            englishWeekArray,
            chineseWeekArray,
            englishFullWeekArray
        } = lunarCalendarData()
        this.englishMonthArray = englishMonthArray
        this.englishFullWeekArray = englishFullWeekArray

        this.englishFullMonth = englishFullMonth

        // 星期数据
        this.englishWeekArray = englishWeekArray
        this.chineseWeekArray = chineseWeekArray

        this.index = 0
        this.middleYear = this.currentYear

        this.newYear = this.currentYear
        this.newMonth = month
        this.newDay = this.currentDay

        this.createEvent = createEvent()
        this.createEvent.listen('emit', this.subscribeFunc.bind(this))

        // 时间列表
        this.timeArr = getTimeList()

        this.newHTML = ''

        this.stateList = null

        this.days = this.currentDay

        this.init()
    }
    init() {
        this.containerEl.appendChild(this.createElement())
        this.containerEl.appendChild(this.createRemindersView())
        this.deleteFirstLine(this.currentWeek, this.getQuerySelector('.mainDays'))
        this.addDayOfMonthClass()
        this.bindEvent()

        // 路由
        this.routerView = document.getElementById('routerView')!
        this.show = this.getQuerySelector('.show')

        this.arrowLeft = this.getQuerySelector('.icon-arrow-left1') as HTMLElement
        this.arrowRight = this.getQuerySelector('.icon-arrow-right1') as HTMLElement

        const that = this
        const config = {
            routerViewID: 'routerView', // 路由切换的挂载点 id
            stackPages: true, // 多级页面缓存
            animationName: 'fade', // 切换页面时的动画
            routes: [
                {
                    path: '/day',
                    name: 'day',
                    callback: function() {
                        that.setHTML(
                            that.routerView!,
                            { optionVal: 1 },
                            that.createTimeView(),
                            '日',
                            'view'
                        )
                        that.setLayerContent(['昨天', '次日'])
                        that.arrowLeft!.dataset.type = that.arrowRight!.dataset.type = 'day'
                    }
                },
                {
                    path: '/week',
                    name: 'week',
                    callback: function() {
                        that.setHTML(
                            that.routerView!,
                            { optionVal: 7 },
                            that.createTimeView(),
                            '周'
                        )
                        that.setLayerContent(['上周', '下周'])
                        that.arrowLeft!.dataset.type = that.arrowRight!.dataset.type = 'week'
                    }
                },
                {
                    path: '/month',
                    name: 'month',
                    callback: function() {
                        that.setHTML(that.routerView!, {}, '', '月', 'monthView')
                        that.setLayerContent(['上个月', '下个月'])
                        that.arrowLeft!.dataset.type = that.arrowRight!.dataset.type = 'month'
                    }
                },
                {
                    path: '/year',
                    name: 'year',
                    callback: function() {
                        that.setYearHTML(that.routerView!, that.chineseWeekArray, '年')
                        that.setLayerContent(['上一年', '下一年'])
                        that.arrowLeft!.dataset.type = that.arrowRight!.dataset.type = 'year'
                    }
                },
                {
                    path: '/fourDays',
                    name: 'fourDays',
                    callback: function() {
                        that.setHTML(
                            that.routerView!,
                            { optionVal: 4 },
                            that.createTimeView(),
                            '4天'
                        )
                        that.setLayerContent(['上一时间段', '下一时间段'])
                        that.arrowLeft!.dataset.type = that.arrowRight!.dataset.type = 'fourDays'
                    }
                }
            ]
        }

        this.route.init(config)
    }
    setHTML(
        el: HTMLElement | Element,
        obj: { [propName: string]: any },
        template: string,
        content: string,
        view: string = 'view',
        year: number = this.currentYear,
        month: number = this.currentMonth,
        day: number = this.currentDay
    ) {
        el.innerHTML = strategies(view, year, month, day, obj, template ? template : null)
        this.show!.innerHTML = content
    }
    setYearHTML(
        el: HTMLElement | Element,
        weekArr: string[],
        content: string,
        year: number = this.currentYear,
        month: number = this.currentMonth,
        day: number = this.currentDay
    ) {
        el.innerHTML = strategies('yearView', weekArr, year, month, day)

        this.show!.innerHTML = content
    }
    setLayerContent(layerArr: string[]) {
        // 设置箭头弹出层内容
        let layerText = this.getQuerySelector('.layer').firstElementChild
        let layerText2 = this.getQuerySelector('.layer2').firstElementChild
        layerText!.innerHTML = layerArr.shift()!
        layerText2!.innerHTML = layerArr.shift()!
    }
    createElement() {
        let fragment = document.createDocumentFragment()
        fragment.appendChild(this.createLeftView())
        fragment.appendChild(this.createCalendarView())
        return fragment
    }
    createCalendarView() {
        const doc = document
        const rightContainer = doc.createElement('div')

        const monthList = doc.createElement('ul')
        const headerYear = doc.createElement('header')

        // 创建表格
        const table = doc.createElement('table')
        const thead = doc.createElement('thead')
        const tbody = doc.createElement('tbody')

        const fragmentWeek = doc.createDocumentFragment()

        const yearList = monthList.cloneNode(false)
        const yearContent = rightContainer.cloneNode(false)

        const arrowLeftIcon = doc.createElement('span')
        const arrowRightIcon = arrowLeftIcon.cloneNode(false)

        // 设置属性
        addClass(yearList as HTMLElement, 'yearList')

        addClass(yearContent as HTMLElement, 'yearContent')
        addClass(arrowLeftIcon as HTMLElement, 'icon-arrow-left')
        addClass(arrowRightIcon as HTMLElement, 'icon-arrow-right')

        addClass(rightContainer as HTMLElement, 'calendarContainer')
        addClass(thead, 'headerWeek')
        addClass(tbody, 'mainDays')
        addClass(monthList, 'monthList')
        addClass(table as HTMLElement, 'dateTable')
        ;(table as any).cellSpacing = '0'
        // ;(table as any).border = '1'
        ;(table as any).cellpadding = '0'

        addClass(headerYear, 'headerYear')
        // String(this.currentYear)
        headerYear.innerHTML = `
            <time datetime="2014-09-20" class="icon">
                <em>${this.englishFullWeekArray[this.currentWeek]}</em>
                <strong>${this.englishFullMonth[this.currentMonth]}</strong>
                <span>${this.currentDay}</span>
            </time>
        `
        let html = ''
        // 生成月份
        forEach(this.englishMonthArray, val => {
            html += `<li class="monthItem">${val}</li>`
        })
        // 生成星期
        // 周天样式
        const sunday = 0
        const saturday = 6
        forEach(this.englishWeekArray, (val, index) => {
            const th = doc.createElement('th')
            if (index === sunday || index === saturday) addClass(th, 'sunday')
            addClass(th, 'weekItem')
            th.innerHTML = val
            fragmentWeek.appendChild(th)
        })

        // 插入
        monthList.innerHTML = html
        thead.appendChild(fragmentWeek)

        tbody.innerHTML = this.createDate(
            this.currentMonthWeekDay,
            this.currentTotalDays,
            this.currentYear,
            this.currentMonth
        )

        table.appendChild(thead)
        table.appendChild(tbody)

        rightContainer.appendChild(headerYear)
        ;(yearList as any).innerHTML = this.createYear(this.currentYear - 3, this.currentYear + 3)

        yearContent.appendChild(arrowLeftIcon)

        yearContent.appendChild(yearList)
        yearContent.appendChild(arrowRightIcon)

        rightContainer.appendChild(yearContent)

        rightContainer.appendChild(monthList)
        rightContainer.appendChild(table)

        return rightContainer
    }
    createLeftView() {
        const doc = document
        const detailsContent = doc.createElement('div')
        const dateContent = detailsContent.cloneNode(false)
        const squareBar = detailsContent.cloneNode(false)
        const headerIconContainer = doc.createElement('div')
        const menuIcon = doc.createElement('span')
        const moreIcon = menuIcon.cloneNode(false)
        const englishContent = detailsContent.cloneNode(false)
        const chineseContent = detailsContent.cloneNode(false)
        const listContainer = detailsContent.cloneNode(false)
        const englishWeekDay = doc.createElement('h1')
        const englishMonthAndDay = englishWeekDay.cloneNode(false)
        const listTitle = englishWeekDay.cloneNode(false)
        const remindersList = doc.createElement('ul')

        addClass(menuIcon, 'icon-menu')
        addClass(moreIcon as HTMLElement, 'icon-more')
        addClass(moreIcon as HTMLElement, 'icon-more-vert')
        addClass(detailsContent, 'detailsContent')
        addClass(dateContent as HTMLElement, 'dateContent')
        addClass(squareBar as HTMLElement, 'squareBar')
        addClass(headerIconContainer, 'headerIcon')
        addClass(englishContent as HTMLElement, 'englishContent')
        addClass(chineseContent as HTMLElement, 'chineseContent')
        addClass(listContainer as HTMLElement, 'listContainer')
        addClass(listTitle as HTMLElement, 'listTitle')
        addClass(englishWeekDay, 'englishWeekDay')
        addClass(englishMonthAndDay as HTMLElement, 'englishMonthAndDay')
        addClass(remindersList, 'remindersList')

        const englishWeek = this.englishFullWeekArray[this.currentWeek]
        const englishMonth = this.englishFullMonth[this.currentMonth]
        const englishDay = this.currentDay
        const chineseWeek = this.chineseWeekArray[this.currentWeek]
        const chineseMonth = zeroPadding(this.currentMonth + 1)
        const chineseDay = englishDay

        let {
            gzYear,
            Animal,
            IMonthCn,
            IDayCn,
            gzMonth,
            gzDay,
            solarFestival
        } = this.generatorLunarCalendarDay(this.currentYear, this.currentMonth, this.currentDay)
        ;(chineseContent as any).innerHTML = `
            <div class="content">
                <div class="date">
                    <span class="dateContentDate">${chineseMonth}月${chineseDay}日</span>
                    <span class="dateContentWeek">星期${chineseWeek}</span>
                    <span class="dateFestival">${solarFestival ? solarFestival : ''}</span>
                </div>
                <div class="lunar">
                    <div class="lunarYear">${gzYear}【 ${Animal} 】年</div>
                    <div class="lunarDay">农历${IMonthCn}${IDayCn}</div>
                </div>
                <div class="lunarDetails">
                    <span class="lunarDetailsMonth">${gzMonth}月</span>
                    <span class="lunarDetailsDay">${gzDay}日</span>
                </div>
            </div>
        `
        ;(listTitle as HTMLElement).innerHTML = 'REMINDERS'
        englishWeekDay.innerHTML = `${englishWeek}`
        ;(englishMonthAndDay as HTMLElement).innerHTML = `${englishMonth} ${englishDay}RD`

        let testArray = [
            '你是我的小呀小苹果',
            '怎么爱你都不嫌多',
            '红红的小脸温暖我的心窝',
            '点亮我生命的火火火'
        ]
        for (let i = 0; i < testArray.length; i++) {
            let li = doc.createElement('li')
            addClass(li, 'listItem')
            li.innerHTML = `<span class="icon-check"></span>${i + 1}. ${testArray[i]}`
            remindersList.appendChild(li)
        }

        listContainer.appendChild(listTitle)
        listContainer.appendChild(remindersList)

        detailsContent.appendChild(squareBar)
        detailsContent.appendChild(dateContent)

        englishContent.appendChild(englishWeekDay)
        englishContent.appendChild(englishMonthAndDay)

        headerIconContainer.appendChild(menuIcon)
        headerIconContainer.appendChild(moreIcon)

        dateContent.appendChild(headerIconContainer)
        dateContent.appendChild(englishContent)
        dateContent.appendChild(chineseContent)
        dateContent.appendChild(listContainer)

        return detailsContent
    }
    createRemindersView() {
        let { IDayCn, cYear, cMonth, IMonthCn } = this.generatorLunarCalendarDay(
            this.currentYear,
            this.currentMonth,
            this.currentDay
        )

        const reminders = document.createElement('div')
        addClass(reminders, 'reminders')

        reminders.innerHTML = `
            <div class="main" id="main">
                <div class="header">
                    <div class="dateContent">
                        <h1 class="date" id="date1">${cYear}年${zeroPadding(cMonth)}月</h1>
                        <span class="lunar" id="lunar1">农历${IMonthCn}${IDayCn}</span>
                    </div>
                    <div class="icon">
                        <div class="icon-container">
                            <span class="icon-arrow-left1"></span>
                            <div class="layer">
                                <span class="layerText"></span>
                            </div>
                        </div>
                        <div class="icon-container">
                            <span class="icon-arrow-right1"></span>
                            <div class="layer2">
                                <span class="layerText"></span>
                            </div>
                        </div>
                    </div>
                    ${this.createSelectList()}
                </div>
                <div id="routerView" data-animationname="fade"></div>
            </div>
        `
        return reminders
    }
    createSelectList() {
        let list = [
            {
                chinese: '日',
                letter: 'D',
                data_index: 1
            },
            {
                chinese: '周',
                letter: 'W',
                data_index: 7
            },
            {
                chinese: '月',
                letter: 'M'
            },
            {
                chinese: '年',
                letter: 'Y'
            },
            {
                chinese: '日程',
                letter: 'A'
            },
            {
                chinese: '4天',
                letter: 'X'
            }
        ]

        const hashArr = ['/day', '/week', '/month', '/year', '', '/fourDays']
        const view = ['view', 'view', 'monthView', 'yearView', '', 'view']
        let html = `
            <div class="select">
                <div class="button" role="button">
                    <span class="show">日</span>
                    <span class="icon-caret"></span>
                </div>
                <div class="list">
        `
        forEach(list, (val, index) => {
            html += `
                <div class="details" ${
                    val.data_index ? `data-index=${val.data_index}` : ''
                } data-hash="${hashArr[index]}" data-view="${view[index]}">
                    <span class="chinese">${val.chinese}</span>
                    <span class="letter">${val.letter}</span>
                </div>
            `
        })
        html += '</div></div>'
        return html
    }
    createTimeView() {
        let html = `
            <div class="time">
                <div class="placeholder"></div>
                    <ul>
        `
        forEach(this.timeArr, val => {
            html += `<li class="itemTime">${val}</li>`
        })

        html += '</ul></div>'
        return html
    }
    createDate(currentMonthWeekDay: number, currentTotalDays: number, year: number, month: number) {
        // 天数对应星期几
        let html: string = '<tr class="weekDays">'
        for (let i: number = 0; i < currentMonthWeekDay; i++) {
            html += '<td class="nullDay"></td>'
        }

        // 生成天数
        for (let i: number = 1; i <= currentTotalDays; i++) {
            const { isTerm, Term, IDayCn, lunarFestival } = this.generatorLunarCalendarDay(
                year,
                month,
                i
            )
            const isSimultaneous = Term && lunarFestival
            const val = lunarFestival || Term || IDayCn
            const createHTML = isSimultaneous
                ? `<br><p class="${isSimultaneous &&
                      'festival'}">${lunarFestival}</p><p class="${isSimultaneous &&
                      'solarTerms'}">(${Term})</p>`
                : `<br><p class="${
                      isTerm ? 'solarTerms' : lunarFestival ? 'festival' : 'lunarCalendar'
                  }">${val}</p>`

            if ((i - 1 + currentMonthWeekDay) % 7 === 0) {
                //  换行
                html += `</tr><tr class="weekDays"><td class="day">${zeroPadding(
                    i
                )}${createHTML}</td>`
            } else {
                html += `<td class="day">${zeroPadding(i)}${createHTML}</td>`
            }
        }
        return html
    }
    createYear(startYear: number, endYear: number) {
        let html = ''
        for (; startYear <= endYear; startYear++) {
            html += `<li class="${
                startYear === this.currentYear ? 'year currentYearStyle' : 'year'
            }">${startYear}</li>`
        }
        return html
    }
    addDayOfMonthClass() {
        this.publicClassNameMethod(
            this.currentTotalDays,
            this.currentDay,
            'day',
            'todayStyle',
            addClass
        )
        const length = this.englishMonthArray.length
        this.publicClassNameMethod(
            length,
            this.currentMonth + 1,
            'monthItem',
            'currentMonthStyle',
            addClass
        )
    }
    publicClassNameMethod(
        total: number,
        currentMonth: number,
        className: string,
        classVal: string,
        func: Function
    ) {
        for (let i: number = 0; i < total; i++) {
            if (i + 1 === currentMonth) {
                const current = document.getElementsByClassName(className)[i]
                func(current, classVal)
                break
            }
        }
    }
    bindEvent() {
        const iconArrowLeft = document.querySelector('.icon-arrow-left')!
        const iconArrowRight = document.querySelector('.icon-arrow-right')!
        const year = document.getElementsByClassName('year')
        const yearList = document.querySelector('.yearList')!
        const monthList = document.querySelector('.monthList')!
        const days = this.getQuerySelector('.mainDays')
        const time = this.getQuerySelector('time')
        const day = document.getElementsByClassName('day')
        const select = this.getQuerySelector('.list')
        const button = this.getQuerySelector('.button')

        const prev = this.getQuerySelector('.icon-arrow-left1')
        const next = this.getQuerySelector('.icon-arrow-right1')

        handleEvent.addHandler(iconArrowLeft, 'click', this.arrowEvent.bind(this, year, 'prev'))
        handleEvent.addHandler(iconArrowRight, 'click', this.arrowEvent.bind(this, year))
        handleEvent.addHandler(yearList, 'click', this.setNewYear.bind(this))
        handleEvent.addHandler(monthList, 'click', this.setNewMonth.bind(this))
        handleEvent.addHandler(days, 'click', this.setNewDay.bind(this))
        handleEvent.addHandler(time, 'click', this.backToToday.bind(this, days, day))
        handleEvent.addHandler(time, 'click', this.backToToday.bind(this, days, day))
        handleEvent.addHandler(select, 'click', this.changeRouterView.bind(this, select))

        handleEvent.addHandler(prev, 'click', this.previous.bind(this))
        handleEvent.addHandler(next, 'click', this.next.bind(this))

        // 提醒
        mouseEvent()

        this.arrow = new ArrowStrategies(this.currentYear, this.currentMonth, this.currentDay)

        // 选择菜单显示隐藏
        this.stateList = new State(button, select)
        this.stateList.init()
    }
    previous() {
        const type = this.arrowLeft!.dataset.type
        this.sameSetDateMethod(type!, 'prev')
    }
    next() {
        const type = this.arrowRight!.dataset.type
        this.sameSetDateMethod(type!, 'next')
    }
    sameSetDateMethod(type: string, flag: string) {
        let callback = this.prevFunc()
        const [hash] = getHash()
        flag = flag + hash.slice(1, 2).toUpperCase() + hash.slice(2)
        switch (type) {
            case 'day':
                this.arrow.start(callback.bind(this), flag)
                break
            case 'week':
                callback = this.prevFunc({ optionVal: 7 }, this.createTimeView(), '周')
                this.arrow.start(callback.bind(this), flag)
                break
            case 'month':
                callback = this.prevFunc({}, '', '月', 'monthView')
                this.arrow.start(callback.bind(this), flag)
                break
            case 'year':
                callback = this.setYearHTML.bind(
                    this,
                    this.routerView!,
                    this.chineseWeekArray,
                    '年'
                )
                this.arrow.start(callback.bind(this), flag)
                break
            case 'fourDays':
                callback = this.prevFunc({ optionVal: 4 }, this.createTimeView(), '4天')
                this.arrow.start(callback.bind(this), flag)
                break
        }
    }
    prevFunc(
        obj: { [propName: string]: any } = { optionVal: 1 },
        template: string = this.createTimeView(),
        flag: string = '日',
        view: string = 'view'
    ) {
        return (this.setHTML as any).bind(this, this.routerView!, obj, template, flag, view)
    }
    arrowEvent(yearList: any, type: string) {
        type === 'prev' ? this.index++ : this.index--
        this.middleYear = this.currentYear - this.index * this.chineseWeekArray.length
        yearList = Array.from(yearList)
        let currentYear

        forEach(yearList, (val, index) => {
            if (index === 3 && this.middleYear === this.currentYear) {
                currentYear = val
            }
            removeClass(val, 'currentYearStyle')
            setContent(val, this.middleYear - 3 + index)
        })
        if (currentYear) {
            addClass(currentYear, 'currentYearStyle')
        }
    }
    setNewYear(event: any) {
        const [target, targetContent] = this.publicGetTarget(event)
        if (target.tagName.toLowerCase() === 'ul') return
        let [week, totalDays] = this.specifiedYearAndMonth(targetContent, this.newMonth)
        const [tbodyEl, yearsEl] = this.getElements('.mainDays', 'year')
        this.newYear = targetContent
        //  @ts-ignore
        this.createEvent.trigger('emit', this.newYear, this.newMonth, totalDays)
        this.publicSetNewDate(target, yearsEl, tbodyEl, week, totalDays, 'currentYearStyle')
    }
    setNewMonth(event: any) {
        const [target] = this.publicGetTarget(event)
        if (target.tagName.toLowerCase() === 'ul') return
        const [mothList, monthItem] = this.getElements('.mainDays', 'monthItem')
        const elIndex = Array.prototype.indexOf.call(monthItem, target)
        this.newMonth = elIndex
        let [week, totalDays] = this.specifiedYearAndMonth(this.newYear, this.newMonth)
        //  @ts-ignore
        this.createEvent.trigger('emit', this.newYear, this.newMonth, totalDays)

        this.publicSetNewDate(
            target,
            monthItem,
            mothList,
            week,
            totalDays,
            'currentMonthStyle',
            this.newYear,
            elIndex
        )
    }
    setNewDay(event: any) {
        const [target] = this.publicGetTarget(event)
        let val
        target.tagName.toLowerCase() === 'td'
            ? (val = target.firstChild)
            : (val = target.parentNode.firstChild)
        const targetContent = +getContent(val)
        this.newDay = targetContent
        //  @ts-ignore
        this.createEvent.trigger('emit', this.newYear, this.newMonth, targetContent)
    }
    backToToday(tbody: Element, day: any) {
        if (this.currentYear === this.newYear && this.currentMonth === this.newMonth) return
        //  @ts-ignore
        this.createEvent.trigger('emit', this.currentYear, this.currentMonth, this.currentDay)
        // 重置年列表
        const yearList = this.getQuerySelector('.yearList')
        yearList.innerHTML = this.createYear(this.currentYear - 3, this.currentYear + 3)
        // 重置月份列表
        const monthItem = document.getElementsByClassName('monthItem')
        forEach(Array.from(monthItem), (val, index) => {
            if (index === this.currentMonth) {
                addClass(val, 'currentMonthStyle')
            } else {
                removeClass(val, 'currentMonthStyle')
            }
        })
        // 重置日期(天)
        tbody.innerHTML = this.createDate(
            this.currentMonthWeekDay,
            this.currentTotalDays,
            this.currentYear,
            this.currentMonth
        )
        forEach(Array.from(day), (val, index) => {
            if (index + 1 === this.currentDay) {
                addClass(val, 'todayStyle')
            }
        })
        // 如果是星期日的话，那么第一行为空，删除
        this.deleteFirstLine(this.currentWeek, this.getQuerySelector('.mainDays'))
        // 重置年月
        this.newYear = this.currentYear
        this.newMonth = this.currentMonth
    }
    // 提醒页面
    changeRouterView(select: any, event: any) {
        event = handleEvent.getEvent(event)
        let target = handleEvent.getTarget(event)
        if (hasClass(target, 'list')) return
        if (!hasClass(target, 'details')) {
            target = target.parentNode
        }

        // 隐藏菜单
        select.style.transform = 'translate3d(0, -10px, 0) scale(0)'
        select.style.opacity = 0

        // 避免重复渲染同一个路由
        const data = JSON.parse(window.sessionStorage['router-routerView-history'])
        const lastData = data[data.length - 1]

        if (lastData.hash !== target.dataset.hash) {
            // 更新url
            const hash = target.dataset.hash
            this.route.linkTo(`#${hash}`)
        }

        // 重置状态
        this.stateList!.init()
    }
    publicGetTarget(event: any) {
        event = handleEvent.getEvent(event)
        let target = handleEvent.getTarget(event)
        let targetContent = +getContent(target)
        return [target, targetContent]
    }
    specifiedYearAndMonth(
        targetYear: number = this.currentYear,
        targetMonth: number = this.currentMonth
    ) {
        let date = new Date(targetYear, targetMonth, 1)
        let date2 = new Date(targetYear, targetMonth + 1, 0)
        return [date.getDay(), date2.getDate()]
    }
    getElements(parentEl: string, childList: string) {
        const el = document.querySelector(parentEl)!
        const childListEl = document.getElementsByClassName(childList)
        return [el, childListEl]
    }
    publicSetNewDate(
        target: HTMLElement,
        days: any,
        tbody: any,
        week: number,
        totalDays: number,
        className: string,
        year: number = this.newYear,
        month: number = this.newMonth
    ) {
        days = Array.from(days)
        forEach(days, el => {
            // 判断是否是当前点击元素
            if (target.isSameNode(el)) {
                addClass(target, className)
            } else {
                removeClass(el, className)
            }
        })
        tbody.innerHTML = this.createDate(week, totalDays, year, month)
        this.deleteFirstLine(week, tbody)
        if (this.newYear === this.currentYear) {
            if (month && month !== this.currentMonth) {
                this.publicClassNameMethod(
                    totalDays,
                    this.currentDay,
                    'day',
                    'todayStyle',
                    removeClass
                )
            }
            if (this.newMonth === this.currentMonth) {
                this.publicClassNameMethod(
                    totalDays,
                    this.currentDay,
                    'day',
                    'todayStyle',
                    addClass
                )
            }
        }
    }
    deleteFirstLine(weekDay: number, mainDays: any) {
        // 第一天是星期日的话，删除
        if (weekDay === 0) {
            // @ts-ignore
            mainDays.removeChild(mainDays.firstElementChild)
        }
    }
    subscribeFunc(...rest: any) {
        let [newYear, newMonth, currentDay] = rest
        if (this.currentYear === newYear && this.currentMonth === newMonth) {
            newYear = this.currentYear
            newMonth = this.currentMonth
            currentDay = this.currentDay
        }
        let data = this.generatorLunarCalendarDay(newYear, newMonth, currentDay)
        let date = new Date(newYear, newMonth, currentDay)
        data['weekDay'] = date.getDay()

        const selectorArray = [
            '.englishWeekDay',
            '.englishMonthAndDay',
            '.dateContentDate',
            '.dateContentWeek',
            '.dateFestival',
            '.lunarYear',
            '.lunarDay',
            '.lunarDetailsMonth',
            '.lunarDetailsDay'
        ]
        this.setDateContent(data, selectorArray)
    }
    setDateContent(data: { [propName: string]: any }, selectorArray: any) {
        const elAll = this.getCalendarLeftViewDateEl(selectorArray)
        forEach(elAll, (val: any, index: number) => {
            setContent(elAll[index], this.setTemplate(data)[index])
        })
    }
    getCalendarLeftViewDateEl(selectorArray: Array<string>) {
        return selectorArray.map((item: any) =>
            item instanceof Element ? item : this.getQuerySelector(item)
        )
    }
    getQuerySelector($selector: string) {
        return document.querySelector($selector)!
    }
    setTemplate(data: { [propName: string]: any }) {
        return [
            this.englishFullWeekArray[data.weekDay],
            `${this.englishFullMonth[data.cMonth - 1]} ${zeroPadding(data.cDay)}\u0052\u0044`, //  RD
            `${zeroPadding(data.cMonth)}\u6708${zeroPadding(data.cDay)}\u65e5`, // 月日
            `\u661f\u671f${this.chineseWeekArray[data.weekDay]}`, //  星期
            `${data.solarFestival ? data.solarFestival : ''}`,
            `${data.gzYear} 【 ${data.Animal} 】\u5e74`, //  年
            `\u519c\u5386${data.IMonthCn}${data.IDayCn}`, //  农历
            `${data.gzMonth}\u6708`, //  月
            `${data.gzDay}\u65e5` //  日
        ]
    }
    generatorLunarCalendarDay(year: number, month: number, day: number) {
        return lunarCalendar(year, month, day)
    }
}
