import { handleEvent } from '../helper/util'

export function mouseEvent() {
    const routerView = document.getElementById('routerView')!
    routerView.onmousedown = mousedown
}

function mousedown(event: any) {
    let target = getTarget(event)
    if (!hasAttr(target)) return

    const tds = document.querySelectorAll('.td')
    const tbody = document.querySelector('.tbody')!
    const tr = document.querySelectorAll('.tr')

    const index1 = getIndex(tds, target)
    const row2 = getRowIndex(index1)
    const [firstElement, lastElement] = getRowElement(tbody, target)

    const index3 = getIndex(tds, firstElement)
    const index4 = getIndex(tds, lastElement)

    const item = tr[row2]

    const gridcell1 = item.querySelectorAll('.gridcell')

    document.onmousemove = function(event: any) {
        let target = getTarget(event)
        if (!hasAttr(target)) return

        const index = index1
        let tdIndex = getIndex(tds, target)

        const [first, last] = getRowElement(tbody, target)
        const index2 = getIndex(tds, first)
        const index5 = getIndex(tds, last)
        const row = getRowIndex(tdIndex)
        const item = tr[row]
        const gridcell2 = item.querySelectorAll('.gridcell')

        let i = 0
        let j = 0

        if (tdIndex > index) {
            // 换行时，上一行未有颜色的就渲染颜色
            if (row > row2) {
                for (let i = index1 + 1 - index3; i < 7; i++) {
                    setColor(gridcell1[i] as HTMLElement, '#039BE5')
                }

                for (let i = 0; i <= tdIndex - index2; i++) {
                    setColor(gridcell2[i] as HTMLElement, '#039BE5')
                }

                for (let i = tdIndex - index2 + 1; i <= index5 - index2; i++) {
                    setColor(gridcell2[i] as HTMLElement, 'transparent')
                }
                // 重置后面的颜色
                resetRemaining(tds, row, tr)
            } else if (row === row2) {
                //  同行的话就渲染同行当前的 gridcell
                while (i <= row2 - 1) {
                    j = 0
                    while (j < 7) {
                        setColor(
                            tr[i].querySelectorAll('.gridcell')[j] as HTMLElement,
                            'transparent'
                        )
                        j++
                    }
                    i++
                }

                for (let i = 0; i <= index1 - index2 - 1; i++) {
                    setColor(gridcell2[i] as HTMLElement, 'transparent')
                }

                for (let i = index1 - index2 + 1; i <= tdIndex - index2; i++) {
                    setColor(gridcell2[i] as HTMLElement, '#039BE5')
                }
                // 重置同行当前鼠标后面的颜色
                for (let i = tdIndex - index3 + 1; i <= index4 - index3; i++) {
                    setColor(gridcell2[i] as HTMLElement, 'transparent')
                }
                // 重置后面的颜色
                resetRemaining(tds, row, tr)
            }
        } else if (tdIndex < index) {
            if (row < row2) {
                resetFront(row, tr)

                for (let i = 0; i < index1 - index3; i++) {
                    setColor(gridcell1[i] as HTMLElement, '#039BE5')
                }
                for (let i = 0; i < tdIndex - index2; i++) {
                    setColor(gridcell2[i] as HTMLElement, 'transparent')
                }

                let nextTr = tr[row + 1]
                let nextTds = nextTr.querySelectorAll('.gridcell')

                for (let i = 0; i < nextTds.length; i++) {
                    let item = nextTds[i]
                    setColor(item as HTMLElement, '#039BE5')
                }

                setColor(gridcell2[tdIndex - index2] as HTMLElement, '#039BE5')

                for (let i = tdIndex - index2 + 1; i <= index5 - index2; i++) {
                    setColor(gridcell2[i] as HTMLElement, '#039BE5')
                }

                for (let i = index1 - index3 + 1; i <= index4 - index3; i++) {
                    setColor(gridcell1[i] as HTMLElement, 'transparent')
                }
            } else if (row === row2) {
                resetFront(row2, tr)

                for (let i = index - index2 + 1; i < 7; i++) {
                    setColor(gridcell2[i] as HTMLElement, 'transparent')
                }

                for (let i = 0; i < tdIndex - index3; i++) {
                    setColor(gridcell2[i] as HTMLElement, 'transparent')
                }
                for (let i = tdIndex - index2; i <= index - index2; i++) {
                    setColor(gridcell2[i] as HTMLElement, '#039BE5')
                }

                i = Math.floor(tds.length / 7) - 1
                j = 0

                while (i >= row2 + 1) {
                    j = 0
                    while (j < 7) {
                        setColor(
                            tr[i].querySelectorAll('.gridcell')[j] as HTMLElement,
                            'transparent'
                        )
                        j++
                    }
                    i--
                }
            }
        } else {
            resetFront(row2, tr)

            for (let i = 0; i <= index - index2 - 1; i++) {
                setColor(gridcell2[i] as HTMLElement, 'transparent')
            }

            setColor(gridcell2[tdIndex - index2] as HTMLElement, '#039BE5')

            for (let i = index - index2 + 1; i < 7; i++) {
                setColor(gridcell2[i] as HTMLElement, 'transparent')
            }

            resetRemaining(tds, row2, tr)
        }
    }
    document.onmouseup = function() {
        document.onmousemove = null
        document.onmouseup = null
    }
}

let hasAttr = (el: HTMLElement) => !!(el.hasAttribute('role') && el.getAttribute('role') === 'td')

function getTarget(event: any) {
    event = handleEvent.getEvent(event)
    let target = handleEvent.getTarget(event)
    return target
}

function resetRemaining(tds: NodeListOf<Element>, row: number, tr: NodeListOf<Element>) {
    let i = Math.floor(tds.length / 7) - 1
    while (i > row) {
        let j = 0
        while (j < 7) {
            setColor(tr[i].querySelectorAll('.gridcell')[j] as HTMLElement, 'transparent')
            j++
        }
        i--
    }
}

function resetFront(row: number, tr: NodeListOf<Element>) {
    let i = 0
    while (i < row) {
        let j = 0
        while (j < 7) {
            setColor(tr[i].querySelectorAll('.gridcell')[j] as HTMLElement, 'transparent')
            j++
        }
        i++
    }
}

let getIndex = (tdAll: NodeListOf<Element>, target: Element | null) =>
    Array.prototype.indexOf.call(tdAll, target)

function getRowElement(tbody: Element, target: HTMLElement) {
    let tds = document.querySelectorAll('.td')
    let index = getIndex(tds, target)
    let row = getRowIndex(index)
    let child = tbody?.children[row + 1]
    let { firstElementChild, lastElementChild } = child
    return [firstElementChild, lastElementChild]
}

let getRowIndex = (index: number) => Math.floor(index / 7)

function setColor(el: HTMLElement, color: string) {
    el.style.backgroundColor = color
}
