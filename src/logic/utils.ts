export function range(start: number, end: number, step: number): number[] {
    let r: number[] = []
    for (let i = start; i < end; i += step)
        r.push(i)
    return r;
}

// the function type to get the value in a list to be used in functions like getNearest.
export type GetVal<T> = (it: T) => number | string | boolean


/**
 * get the position for the equal or greater element  just after of the given item for the specified array.
 * this function assumes the array is sorted.
 * if the key is greater than all elements in the array, -1 is returned.
 * if less is set to true, this reverse the behavior, to gett the less or equal element instead.
 * -1 is used when the conditions were not met.
 * @param val: the item to compare with, this item should be less or equals that the element to find.
 * @param arr: array of sorted elements.
 * @param fnVal: the function to get the value to be used in comparations.
 * @less: reverses the behavior. default is false.
 * @returns: the equals or greater element than the specified element, or the reverse case if less is true. -1 if the conditions were not met.
 */
export function getNearest<t>(val: number | string | boolean, arr: t[], fnVal: GetVal<t>, less: boolean = false): number {
    let max = arr.length;
    if ((max == 0) || (!less && val > fnVal(arr[max - 1])) || (less && val < fnVal(arr[0])))
        return -1
    if (max == 1)
        return 0
    if (!less && val < fnVal(arr[0]))
        return 0
    if (less && val > fnVal(arr[max - 1]))
        return max - 1
    --max;
    let min = 0;
    for (let i = 0; i <= arr.length; ++i) {
        let curPos = Math.ceil((min + max) / 2);
        let prev = fnVal(arr[curPos - 1])
        let next = fnVal(arr[curPos])
        if (prev <= val && val <= next) {
            if (prev == val)
                return curPos - 1
            if (next == val)
                return curPos
            return less ? curPos - 1 : curPos
        }
        if (prev < val)
            min = curPos;
        else
            max = curPos
    }
    return -1
}


/**
 * a helper to manage the local storage.
 */
export const tLocal = {
    /**
     * get the value from the local storage. The value will be parsed before return.
     * the default value, if given, won't be parsed.
     * @param key: the key to get from the local storage.
     * @param defaultValue: an optional value to be returned if the key is not found.
     * @returns: the value of the key if exist. Default value or null otherwise.
     */
    get(key: string, defaultValue?: any): any | null {
        let v = localStorage.getItem(key)
        return v !== null ? JSON.parse(v) : defaultValue ? defaultValue : v
    },

    /**
     * 
     * @param key: the key to asign the value.
     * @param value: an object to store. JSON.stringify will be aplied to this object.
     * @returns: true if all is OK.
     */
    set(key: string, value: any) {
        localStorage.setItem(key, JSON.stringify(value))
        return true;
    },

    remove(key: string) {
        localStorage.removeItem(key)
    }
}


// generates an unique id (consecutive number) to use as a ID. Just a temporal solution to do some tests.
export const uuid = {
    counter: 0,
    // tLocal.get('count', 0) as number,
    getId(): string {
        // tLocal.set("count", ++this.counter)
        ++this.counter
        return String(this.counter)
    }
}

export function msToHumanTime(t: number): string {
    let d = new Date(t)
    let [day, hours] = d.toISOString().split("T") as [string, string]
    hours = hours.substring(0, 8)
    let stringDays = ""
    for (let [i, v] of day.split("-").entries()) {
        let n = Number(v)
        // year
        if (i === 0 && n - 1970 > 0)
            stringDays = `${n - 1970} years, `
        // months or days.
        else if (i>0 && n - 1 > 0)
            stringDays += `${n - 1} ${i == 1 ? "months" : "days"}, `
    }
    return stringDays + hours
}

export const dateUtils = {
    getCurrentStartDay() {
        let d = new Date()
        d.setHours(0, 0, 0)
        return d
    },
    getCurrentStartWeek(): Date {
        let d = new Date(this.getCurrentStartDay())
        d = this.sumDay(d, -d.getDay())
        return d
    }    ,
    getCurrentStartMonth(): Date {
        let d = new Date(this.getCurrentStartDay())
        d.setDate(1)
        return d
    }    ,

    sumDay(date: Date, n: number): Date {
        let d = new Date(date)
        d.setDate(date.getDate() +n)
        return d
    },
    sumWeek(date: Date, n: number): Date {
        let d = new Date(date)
        d.setDate(date.getDate() +n*7)
        return d
    },
    sumMonth(date: Date, n: number): Date {
        let d = new Date(date)
        d.setMonth(date.getMonth() +n)
        return d
    },
    sumYear(date: Date, n: number): Date {
        let d = new Date(date)
        d.setFullYear(date.getFullYear() +n)
        return d
    }
}


const beepState = {
    audioContext: undefined as AudioContext | undefined,
    osc: undefined as OscillatorNode | undefined,
    waitToBreak: 0,
    isRunning: false
}

function startAudioContext() {
    if (!beepState.audioContext)
        beepState.audioContext = new AudioContext()
}


/**
 * produces a beep tone with a sine wave in the browser.
 * @param frequency: the freq of the wave. default 440.
 * @param duration: duration in ms. default is 100.
 * @param volume: the volume, default is 1. Don't use very high values or you can get distorted sounds.
 */
export function beep(frequency: number = 440, duration: number = 100, volume: number = 1) {
    startAudioContext()
    if (!beepState.audioContext)
        return
    if (beepState.osc)
        beepState.osc.stop(beepState.audioContext.currentTime)
    beepState.osc = beepState.audioContext?.createOscillator() as OscillatorNode
    let [osc, audio] = [beepState.osc, beepState.audioContext]
    let g = audio.createGain() as GainNode
    osc.connect(g)
    osc.frequency.value = frequency
    osc.type = "sine"
    g.connect(audio.destination)
    g.gain.value = volume
    osc.start(audio.currentTime)
    beepState.isRunning = true
    osc.stop(audio.currentTime + duration * 0.001)
    osc.onended = e => beepState.isRunning = false
}

const WAIT_TIME = 30

/**
 * for debug purposes. If a beep is running, this will wait WAIT_TIME ms more from the last beep to interrupt the current beep. This will allow to hear the differences between events.
 * WAIT_TIME is set to 30 ms, change it to your needs.
 * */
export function beepSlower(frequency: number = 440, duration: number = 100, volume: number = 1) {
    if (beepState.waitToBreak < 0)
        beepState.waitToBreak = 0
    if (beepState.isRunning) {
        beepState.waitToBreak += WAIT_TIME
        setTimeout(() => {
            beep(frequency, duration, volume)
            beepState.waitToBreak -= WAIT_TIME
        },
            beepState.waitToBreak)
    }
    else
        beep(frequency, duration, volume)
}
