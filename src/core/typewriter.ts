/**
 * {
 *      source: document.getElementById('source'),
 *       output: document.getElementById('output'),
 *       delay: 120,
 *       done: function () {
 *           return true
 *       }
 *   }
 */
import { deepMerge } from '../helper/util'

export class Typewriter {
    options: { [propName: string]: any }
    source: any
    output: any
    delay: number
    done: Function
    chain: { [propName: string]: any }
    static stop: boolean
    static flag: boolean

    constructor(options: { [propName: string]: any } = {}) {
        let { source, output, delay = 120, done } = options
        this.options = options
        this.source = source
        this.output = output
        this.delay = delay
        this.chain = {
            parent: null,
            dom: this.output,
            val: []
        }
        if (typeof done !== 'function') {
            this.options.done = function() {
                // doSomething
            }
        }
        this.done = this.options.done
        Typewriter.flag = false
        Typewriter.stop = false
    }
    init() {
        this.chain.val = this.convert(this.source, this.chain.val)
    }
    convert(source: any, arr: any[]) {
        let children = this.toArray(source.childNodes)
        for (let i = 0; i < children.length; i++) {
            const node = children[i]
            if ((node as HTMLElement).nodeType === 3) {
                arr = arr.concat((node as HTMLElement).nodeValue!.split(''))
            } else if ((node as HTMLElement).nodeType === 1) {
                arr.push({
                    dom: node,
                    val: this.convert(node as HTMLElement, [])
                })
            }
        }
        return arr
    }
    toArray(childNodes: any) {
        return Array.from(childNodes)
    }
    print(dom: Element | Node | HTMLElement, val: any, callback: () => void) {
        dom.appendChild(document.createTextNode(val))
        if (!Typewriter.flag) {
            requestAnimationFrame(callback)
        }
    }
    play(chain: any) {
        if (Typewriter.stop) return
        if (!chain.val.length) {
            if (chain.parent) this.play(chain.parent)
            else {
                Typewriter.flag = true
                this.done()
            }
            return
        }

        let current = chain.val.shift()
        if (typeof current === 'string') {
            this.print(chain.dom, current, () => {
                this.play(chain)
            })
        } else {
            let dom = document.createElement(current.dom.nodeName)
            let attrs = this.toArray(current.dom.attributes)
            for (let i = 0; i < attrs.length; i++) {
                const attr = attrs[i]
                dom.setAttribute((attr as any).name, (attr as any).value)
            }
            chain.dom.appendChild(dom)
            current.parent = chain
            current.dom = dom
            this.play(current.val.length ? current : current.parent)
        }
    }
    start() {
        Typewriter.stop = false
        this.init()
        this.play(this.chain)
    }
}
