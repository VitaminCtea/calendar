import { forEach } from './util'
import { SubScribeInterface } from '../types/index'

class SubScribe implements SubScribeInterface {
    clientList: any
    constructor() {
        this.clientList = {}
    }
    listen(key: any, func: Function) {
        if (!this.clientList[key]) {
            this.clientList[key] = []
        }
        this.clientList[key].push(func)
    }
    trigger(...rest: any) {
        let key = Array.prototype.shift.call(rest)
        let fns = this.clientList[key]
        if (!fns || fns.length === 0) return false
        forEach(fns, function(fn) {
            // @ts-ignore
            fn.apply(this, rest)
        })
    }
}

export let createEvent = (): SubScribe => new SubScribe()
