interface IAsyncLocalStorage {
    clear(): Promise<void>
    getItem(key: string): Promise<string>
    removeItem(key: string): Promise<void>
    setItem(key: string, value: string): Promise<void>
  }
  
  export const AsyncLocalStorage: IAsyncLocalStorage = {
    // must use wrapper functions when passing localStorage functions
    clear /* ignore next */ ()
    {
      return callWithPromise(() => window.localStorage.clear())
    },
    getItem (key) {
      return callWithPromise(() => window.localStorage.getItem(key))
    },
    removeItem /* istanbul ignore next */ (key) {
      return callWithPromise(() => window.localStorage.removeItem(key))
    },
    setItem (key, value) {
      return callWithPromise(() => window.localStorage.setItem(key, value))
    }
  }
  
  function callWithPromise (func: Function, ...args: any[]): Promise<any> {
    try {
      return Promise.resolve(func(...args))
    } catch (err) {
      /* istanbul ignore next */
      return Promise.reject(err)
    }
  }
  
  export default AsyncLocalStorage