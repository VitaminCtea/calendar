export let hasOwnProperty = (obj: any, key: any) => Object.prototype.hasOwnProperty.call(obj, key)

export let toString = (obj: any) => Object.prototype.toString.call(obj)

export function forEach(data: any, callback: (val: any, key: any, data: any) => void): void {
    if (data === null && typeof data === 'undefined') return
    if (typeof data !== 'object' && typeof data === 'string') {
        data = [data]
    }
    if (Array.isArray(data)) {
        let i: number
        let len: number = data.length
        for (i = 0; i < len; i++) {
            callback.call(null, data[i], i, data)
        }
    } else {
        for (let key in data) {
            if (hasOwnProperty(data, key)) {
                callback.call(null, data[key], key, data)
            }
        }
    }
}

export let zeroPadding = (day: number): string | number => (day < 10 ? `0${day}` : day)

let isNull = (el: any) => el === null

export function hasClass(el: Element, className: string): boolean {
    if (isNull(el)) return false
    const elementClassName = el.className
    return (
        elementClassName.length > 0 &&
        (elementClassName === className ||
            new RegExp('(^|\\s*)' + className + '(\\s*|$)', 'gi').test(elementClassName))
    )
}

export function addClass(el: Element, className: string) {
    if (isNull(el) || hasClass(el, className)) return
    const classNames = el.className.split(' ')
    classNames.push(className)
    el.className = classNames
        .join(' ')
        .replace(/^\s*((?:[\S\s]*\S)?)\s*$/, '$1')
        .replace(/\s+(\S+)/g, ' $1')
    return el
}

export function removeClass(el: Element, className: string) {
    if (isNull(el) || !hasClass(el, className)) return
    el.className = el.className
        .replace(new RegExp('(^|\\s*)' + className + '(\\s*|$)', 'gi'), ' ')
        .replace(/^\s*|\s*$/g, '')
    return el
}

export let handleEvent = {
    getEvent(event: any) {
        return event || (window as any).event
    },
    getTarget(event: any) {
        return event.target || event.srcElement
    },
    addHandler(el: HTMLElement | Element | Window | Document, type: string, func: Function) {
        if (window.addEventListener) {
            // @ts-ignore
            el.addEventListener(type, func, false)
        } else if ((window as any).attachEvent) {
            ;(el as any).attachEvent(type, func)
        } else {
            ;(el as any)[`on${type}`] = func
        }
    }
}

export let getContent = (el: HTMLElement | Element): string =>
    el.textContent ? el.textContent : (el as any).innerText

export let setContent = (el: HTMLElement | Element, val: any): void =>
    el.textContent ? (el.textContent = String(val)) : ((el as any).innerText = val)

let isObject = (obj: any) => typeof obj === 'object' && obj !== null

export function deepMerge(...rest: any) {
    let result = Object.create(null)
    function assignValue(val: any, key: any) {
        if (isObject(val) && isObject(result[key])) {
            result[key] = deepMerge(val, result[key])
        } else if (isObject(val)) {
            result[key] = deepMerge({}, val)
        } else {
            result[key] = val
        }
    }
    const len = rest.length
    for (let i: number = 0; i < len; i++) {
        forEach(rest[i], assignValue)
    }
    return result
}

export function extend(origin: { [propName: string]: any }, target: { [propName: string]: any }) {
    for (let key in target) {
        origin[key] = target[key]
    }
}

export function getTimeList() {
    let timeArr = []
    for (let i: number = 1; i < 24; i++) {
        let time = ''
        if (i < 12) {
            time = `上午${i}点`
        } else if (i === 12) {
            time = `下午${i}点`
        } else {
            time = `下午${i - 12}点`
        }
        timeArr.push(time)
    }
    return timeArr
}

export function getParamsURL() {
    const path = location.hash.split('?')
    const hashPath = path[0].split('#')[1]
    const params = path[1] ? path[1].split('&') : []
    const query: any = {}
    forEach(params, val => {
        const item = val.split('=') //  分割key和value
        const [key, value] = item
        query[key] = value
    })
    return {
        path: hashPath,
        query,
        params
    }
}

export function genKey() {
    let t = 'xxxxxxxx'
    return t.replace(/x/g, (c: any) => {
        const random = (Math.random() * 16) | 0
        const v = c === 'x' ? random : (random & 0x3) | 0x8
        return v.toString(16)
    })
}

export class DoublyLinkedList {
    insert: (position: number, element: any) => boolean
    append: (element: any) => boolean
    findElement: (element: any) => { index: number; element: any }
    size: () => number
    constructor() {
        class Node {
            element: any
            prev: any
            next: any
            constructor(element: any) {
                this.element = element
                this.prev = null
                this.next = null
            }
        }

        let length: number = 0
        let head: any = null

        this.insert = (position, element) => {
            if (position >= 0 && position <= length) {
                let node = new Node(element)
                let current = head
                let previous
                let index = 0
                if (position === 0) {
                    if (!head) {
                        head = node
                    } else {
                        node.next = head
                        head.prev = node
                        head = node
                    }
                } else {
                    while (index++ < position) {
                        previous = current
                        current = current.next
                    }
                    if (position !== length) {
                        // 排除末尾
                        node.next = current
                        current.prev = node
                    }
                    previous.next = node
                    node.prev = previous
                }
                length++
                return true
            } else {
                return false
            }
        }

        this.append = element => {
            let node = new Node(element)
            let current
            let previous
            if (!head) {
                head = node
            } else {
                current = head
                while (current) {
                    previous = current
                    current = current.next
                }
                previous.next = node
                node.prev = previous
            }
            length++
            return true
        }

        this.findElement = element => {
            let current = head
            let index = 0
            while (current && index < length) {
                if (current.element === element) {
                    return {
                        index,
                        element: current.element
                    }
                }
                current = current.next
                index++
            }
            return {
                index,
                element: null
            }
        }

        this.size = () => length
    }
}

export function getHash() {
    const hashPath = location.hash
    const hashIndex = hashPath.indexOf('#')
    const paramIndex = hashPath.indexOf('?')
    let hash: string
    let param: string
    if (paramIndex < 0) {
        hash = hashPath.slice(hashIndex + 1)
        param = ''
    } else {
        hash = hashPath.slice(hashIndex + 1, paramIndex)
        param = hashPath.slice(paramIndex + 1)
    }
    return [hash, param]
}
