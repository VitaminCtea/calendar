import { Calendar } from './core/calendar'
import 'style/index.sass'
import { lunarCalendar } from './core/lunarCalendar'

// tslint:disable-next-line: no-unused-expression
new Calendar('.viewContainer')
console.log(lunarCalendar(2022, 11, 4))
