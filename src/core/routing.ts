import {
    forEach,
    genKey,
    handleEvent,
    getParamsURL,
    addClass,
    removeClass,
    toString
} from '../helper/util'

export class Route {
    routes: { [propName: string]: any } = {} // 保存注册的所有路由
    routerViewID: string = 'routerView' // 路由挂载点
    redirectRoute: any // 路由重定向的hash
    stackPages: boolean = true // 多级页面缓存
    routerMap: any[] = [] // 路由遍历
    historyFlag: string = '' // 路由状态，前进，回退，刷新
    history: any[] = [] // 路由历史
    animationName: string = 'fade' // 动画
    beforeEachFunc: any
    afterEachFunc: any
    routerView: HTMLElement | null = null
    position: { [propName: string]: any } = Object.create(null)
    num: number = 0

    init(config?: { [propName: string]: any }) {
        this.routerMap = config ? config.routes : this.routerMap
        this.routerViewID = config ? config.routerViewID : this.routerViewID
        this.stackPages = config ? config.stackPages : this.stackPages

        this.routerView = document.getElementById(this.routerViewID)!
        let name = this.routerView.dataset.animationname

        if (name) {
            this.animationName = name
        }

        this.animationName = config ? config.animationName : this.animationName

        this.addRoute()

        handleEvent.addHandler(window, 'load', (event: any) => {
            event = handleEvent.getEvent(event)
            this.historyChange(event)
        })

        handleEvent.addHandler(window, 'hashchange', (event: any) => {
            event = handleEvent.getEvent(event)
            this.historyChange(event)
        })
    }

    linkTo(path: string) {
        const index = path.indexOf('?')
        if (index > -1) {
            location.hash = path + '&key=' + genKey()
        } else {
            location.hash = path + '?key=' + genKey()
        }
    }

    addRoute() {
        forEach(this.routerMap, (route, index) => {
            if (route.name === 'redirect') {
                this.redirectRoute = route.path
            } else {
                this.redirectRoute = this.routerMap[0].path
            }
            let newPath = route.path
            let path = newPath.replace(/\s*/g, '')

            this.routes[path] = {
                callback: route.callback
            }
        })
    }

    historyChange(event: any) {
        let currentHash = getParamsURL()
        let nameStr = 'router-' + this.routerViewID + '-history'
        this.history = window.sessionStorage[nameStr]
            ? JSON.parse(window.sessionStorage[nameStr])
            : []

        let back = false
        let refresh = false
        let forward = false
        let index = 0
        let len = this.history.length

        for (let i = 0; i < len; i++) {
            let history = this.history[i]
            if (history.hash === currentHash.path && history.key === currentHash.query.key) {
                index = i
                if (i === len - 1) {
                    refresh = true
                } else {
                    back = true
                }
                break
            } else {
                forward = true
            }
        }
        if (back) {
            this.historyFlag = 'back'
            this.history.pop()
            this.routes[currentHash.path].callback(currentHash)
        } else if (refresh) {
            this.historyFlag = 'refresh'
        } else {
            this.historyFlag = 'forward'
            this.history.push({
                key: currentHash.query.key,
                hash: currentHash.path,
                query: currentHash.query
            })
        }
        // console.log('historyFlag :', currentHash.query.key)
        if (!this.stackPages) {
            this.historyFlag = 'forward'
        }

        window.sessionStorage[nameStr] = JSON.stringify(this.history)
        this.urlChange()
    }
    urlChange() {
        let currentHash = getParamsURL()
        if (this.routes[currentHash.path]) {
            let self = this
            if (this.beforeEachFunc) {
                this.beforeEachFunc({
                    to: {
                        path: currentHash.path,
                        query: currentHash.query
                    },
                    next: function() {
                        self.changeView(currentHash)
                    }
                })
            } else {
                this.changeView(currentHash)
            }
        } else {
            location.hash = this.redirectRoute
        }
    }
    changeView(currentHash: any) {
        let pages = document.getElementsByClassName('details')
        let previousPage = document.getElementsByClassName('current')[0]
        let currentPage: any = null
        let currHash: any = null

        forEach(Array.from(pages), page => {
            let hash = page.dataset.hash
            if (hash === currentHash.path) {
                currHash = hash
                currentPage = this.routerView
            }
        })

        let enterName = 'enter-' + this.animationName
        let leaveName = 'leave-' + this.animationName

        if (this.historyFlag === 'back') {
            addClass(currentPage, 'current')
            if (previousPage) {
                addClass(previousPage, leaveName)
            }
            setTimeout(() => {
                if (previousPage) {
                    removeClass(previousPage, leaveName)
                }
            }, 200)
        } else if (this.historyFlag === 'forward' || this.historyFlag === 'refresh') {
            if (previousPage) {
                addClass(previousPage, 'current')
            }
            addClass(currentPage, enterName)
            setTimeout(() => {
                if (previousPage) {
                    removeClass(previousPage, 'current')
                }
                removeClass(currentPage, enterName)
                addClass(currentPage, 'current')
            }, 300)
            this.routes[currHash].callback && this.routes[currHash].callback(currentHash)
        }
        this.afterEachFunc && this.afterEachFunc(currentHash)
    }
    beforeEach(callback: () => void) {
        this.eachFunc(this.beforeEachFunc, callback, '路由切换前钩子函数不正确')
    }
    afterEach(callback: () => void) {
        this.eachFunc(this.afterEachFunc, callback, '路由切换后钩子函数不正确')
    }
    eachFunc(hook: any, callback: () => void, message: string) {
        if (toString(callback) === '[object Function]') {
            hook = callback
        } else {
            console.trace(message)
        }
    }
}
