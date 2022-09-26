import { Instance, types } from "mobx-state-tree"
import persist from "./localStorage"
type ReferenceIdentifier = string | number

import { dateUtils, getNearest, uuid } from "./utils"


const Timer = types.model("timer", {
    id: types.identifier,
    name: types.string,
    lastDuration: 0
})
    .actions(self => ({
        setName(name: string) {
            self.name = name
        },
        setLastDuration(duration: number) {
            self.lastDuration = duration
        }
    }))
export interface ITimer extends Instance<typeof Timer> { }


export const MarkTime = types.model("markTime", {
    time: types.number,
    timer: types.safeReference(Timer)
})
    .actions(self => ({
        setTimer(timer: ITimer) {
            self.timer = timer
        }
    }))
export interface IMarkTime extends Instance<typeof MarkTime> { }


function getMarkTime(mark: IMarkTime): number {
    return mark.time
}


const Board = types.model("board", {
    id: types.identifier,
    name: types.string,
    timers: types.map(Timer),
    history: types.array(MarkTime),
    mostRecent: types.array(types.safeReference(Timer, { acceptsUndefined: false }))
})
    .views(self => ({
        get lastMark(): IMarkTime | undefined {
            return self.history.at(-1)
        },

        getHistoryBetween(start: number, end: number): IMarkTime[] {
            const posStart = getNearest(start, self.history, getMarkTime)
            const posEnd = getNearest(end, self.history, getMarkTime, true)
            if (posStart !== -1 && posEnd !== -1) {
                const r = self.history.slice(posStart, posEnd + 1)
                if (r.length > 0) return r
            }
            return []
        },

        getPrevMark(time: number): IMarkTime | undefined {
            const pos = getNearest(time, self.history, getMarkTime, true)
            if (pos !== -1) return self.history[pos]
            return undefined
        },
        getNextMark(time: number): IMarkTime | undefined {
            const pos = getNearest(time, self.history, getMarkTime)
            if (pos !== -1) return self.history[pos]
            return undefined
        }
    }))
    .actions(self => ({
        setName(name: string) {
            self.name = name
        },

        updateMostRecent(timer: ITimer) {
            self.mostRecent.remove(timer)
            self.mostRecent.push(timer)
        },

        addTimer(timer: ITimer) {
            self.timers.put(timer)
            this.updateMostRecent(timer)
        },

        deleteTimer(id: string) {
            self.timers.delete(id)
            // remove marks that are not stoper marks. That is, a mark with undefined timer, after another undefined timer mark.
            for (let i = 1; i < self.history.length; ++i) {
                if (self.history[i - 1].timer === undefined) {
                    self.history.splice(i, 1)
                    --i
                }
            }
            if (self.history.length > 0 && self.history[0].timer === undefined)
                self.history.splice(0, 1)
        },

        startTimer(timer: ITimer | undefined, time: number) {
            if (self.lastMark && self.lastMark.time > time) {
                throw Error("The mark time can't be less than the last mark time")
            }
            if (self.lastMark) {
                if (timer === self.lastMark.timer) return
                self.lastMark.timer?.setLastDuration(time - self.lastMark.time)
            }
            const m = MarkTime.create({ time: time })
            self.history.push(m)
            if (timer) {
                m.setTimer(timer)
                this.updateMostRecent(timer)
            }
        },

        stopTimer(time: number) {
            this.startTimer(undefined, time)
        },
        updateTimers(timers: ITimer[]) {
            for (const k of timers) {
                self.timers.put(k)
            }
        },

        updateHistory(marks: IMarkTime[]): boolean | never {
            if (marks.length == 0)
                return false
            if (self.history.length == 0)
                self.history.replace(marks)
            else if ((marks.at(-1) as IMarkTime).time < self.history[0].time)
                self.history.replace([...marks, ...self.history])
            else if ((self.lastMark as IMarkTime).time < marks[0].time)
                self.history.replace([...self.history, ...marks])
            else
                throw Error(`error updating the istory of marks. The specified items are inside the current range of the history. in board ${self.id} name: ${self.name}`)
            return true
        }
    }))
export interface IBoard extends Instance<typeof Board> { }


export interface IGenerator {
    getCurrentTime(): number
    generateUId(): string
}

export interface IFactory {
    createBoard(name: string): IBoard
    createTimer(name: string, containerId: string): ITimer
    createMarkTime(timer: ITimer, board: IBoard): IMarkTime
}


class Generator implements IGenerator {
    getCurrentTime(): number {
        return Date.now()
    }

    generateUId(): string {
        return uuid.getId()
    }
}


class Factory implements IFactory {
    public generator;
    constructor(generator: IGenerator) {
        this.generator = generator
    }

    public createBoard(name: string): IBoard {
        return Board.create({ id: this.generator.generateUId(), name: name })
    }

    public createTimer(name: string, containerId: string): ITimer {
        return Timer.create({ id: this.generator.generateUId(), name: name })
    }

    public createMarkTime(timer: ITimer, board: IBoard): IMarkTime {
        return MarkTime.create({ timer: timer.id, time: this.generator.getCurrentTime() })
    }
}

const Boards = types.model({
    boards: types.map(Board),
    currentBoard: types.safeReference(Board)
}).actions(self => ({
    addBoard(board: IBoard) {
        self.boards.put(board)
        self.currentBoard = board
    },
    deleteBoard(id: string) {
        self.boards.delete(id)
    }
}))
export interface IBoards extends Instance<typeof Boards> { }

function initialize() {
    const f = new Factory(new Generator())
    const s = Boards.create()
    const b = f.createBoard("Personal")
    s.addBoard(b)
    b.addTimer(f.createTimer("Pereceando", ""))
    b.addTimer(f.createTimer("Comiendo", ""))
    b.addTimer(f.createTimer("ejercicio", ""))
    b.addTimer(f.createTimer("durmiendo", ""))
    b.addTimer(f.createTimer("redes sociales", ""))
    b.addTimer(f.createTimer("tertulia", ""))
    b.addTimer(f.createTimer("hablar con amigos", ""))
    return { factory: f, store: s }
}

export const { factory, store } = initialize()
persist("Cronos", store)



/**
 * an easier way to show the mark time data.
 * if the duration is undefined, the duration should be updated dynamically.
 */
export class ReportMark implements IMarkTime {
    time: number
    duration: number | undefined
    timer: ITimer
    constructor(timer: ITimer, time: number, duration?: number) {
        this.time = time
        this.timer = timer
        this.duration = duration
    }
    setTimer(timer: ITimer) {
        this.timer = timer
    }
}


/**
 * an easier way to show the summary of a timer.
 * the total duration and the number of times the timer has been activated, are saved here.
 */
export class TimerSummary implements ITimer {
    id: string
    name: string
    lastDuration: number = 0
    count: number = 0
    constructor(id: string, name: string) {
        this.id = id
        this.name = name
    }
    setName(name: string) {
        this.name = name
    }

    setLastDuration(duration: number) {
        this.lastDuration += duration
    }

    addDuration(duration: number) {
        this.lastDuration += duration
    }
    addCount() {
        ++this.count
    }
}

export function getHistoryRange(startDate: Date, endDate: Date, board: IBoard): ReportMark[] {
    const logRange = board.getHistoryBetween(startDate.getTime(), endDate.getTime())
    let greatestTime = factory.generator.getCurrentTime()
    if (greatestTime > endDate.getTime()) greatestTime = endDate.getTime()
    const prev = board.getPrevMark(startDate.getTime())
    // if a mark time is before the current start range, count the time from the start of the current range to the first mark of the current range.
    if (prev && prev.timer) {
        const time = startDate.getTime()
        const duration = (logRange.length > 0? logRange[0].time: greatestTime) -time
        const m = new ReportMark(prev.timer, time, duration)
        logRange.unshift(m)
    }

    const items: ReportMark[] = []
    for (let i = 0; i < logRange!.length - 1; ++i) {
        const m = logRange[i]
        if (!m.timer) continue
        items.push(new ReportMark(m.timer, m.time, logRange[i + 1].time - m.time))
    }

    // set the duration for the last mark in the range.
    const last = logRange.at(-1)
    if (last && last!.timer)
        items.push(new ReportMark(last.timer, last.time, greatestTime -last.time))
    return items
}

export function getSummaryRange(startDate: Date, endDate: Date, board: IBoard): TimerSummary[] {
    const marks = getHistoryRange(startDate, endDate, board)
    const summary: Record<string, TimerSummary> = {}
    for (const m of marks) {
        if (!(m.timer!.id in summary))
            summary[m.timer!.id] = new TimerSummary(m.timer!.id, m.timer!.name)
        const duration = m.duration ? m.duration : factory.generator.getCurrentTime() - m.time
        summary[m.timer!.id].addDuration(duration)
        summary[m.timer!.id].addCount()
    }
    return Object.values(summary)
}
