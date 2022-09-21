import { SyntheticEvent, useEffect, useRef, useState } from 'react'
import { Box, Button, Divider, Drawer, FormControlLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Radio, RadioGroup, Stack } from '@mui/material'
import { Add as AddIcon, ArrowLeftRounded, ArrowRight, ArrowRightRounded, Stop as StopIcon, TimelapseRounded } from '@mui/icons-material'

import { observer } from "mobx-react-lite"


import { ButtonNewDialog, ConfirmDialog, GetInputDialog, Item, useToggleFocus } from "./components"

import { factory, getHistoryRange, getSummaryRange, IBoard, IMarkTime, ITimer, ReportMark, TimerSummary } from "../logic/store"
import { dateUtils, msToHumanTime, uuid } from '../logic/utils'


function createTimer(board: IBoard, name: string) {
  board.addTimer(factory.createTimer(name, board.id))
}

function deleteTimer(board: IBoard, timer: ITimer) {
  board.deleteTimer(timer.id)
}

function renameTimer(timer: ITimer, name: string) {
  timer.setName(name)
}

function toggleTimer(board: IBoard, t: ITimer, lastMark: number | undefined) {
  const time = factory.generator.getCurrentTime()
  if (lastMark) board.stopTimer(time)
  else board.startTimer(t, time)
}




export const TimerComponent = observer((p: { timer: ITimer, lastMark: number | undefined }) => {
  const [duration, setDuration] = useState(msToHumanTime(p.timer.lastDuration))
  useEffect(() => {
    if (p.lastMark) {
      setDuration(msToHumanTime(0))
      let iv = setInterval(() => p.lastMark && setDuration(msToHumanTime(Date.now() - p.lastMark)), 1000)
      return () => clearInterval(iv)
    }
    setDuration(msToHumanTime(p.timer.lastDuration))
    return undefined
  }, [p.lastMark])

  return (<>{p.timer.name}. {duration}</>)
})

type WrapperTimerNode = (p: { timer: ITimer, lastMark: number | undefined, children: any }) => any
export const TimersView = observer((p: { board: IBoard, WrapperTimer: WrapperTimerNode }) => {
  const { board, WrapperTimer } = p

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 100000
      console.log("actualizando scroll", uuid.getId())
    }
  })
  console.log("construyendo board", uuid.getId(), board.history.length, board.lastMark?.time, board.lastMark?.timer?.id)

  return (<Box style={{ maxHeight: 500, overflow: 'auto' }} ref={listRef}>
    <List>
      {board.mostRecent.map(v => {
        let l: number | undefined = undefined
        if (board.lastMark && v.id === board.lastMark.timer?.id)
          l = board.lastMark.time
        return (<ListItem key={v.id} sx={{ width: '100vw' }}>
          <WrapperTimer timer={v} lastMark={l}>
            <TimerComponent timer={v} lastMark={l} />
          </WrapperTimer>
        </ListItem>)
      })}
    </List>
  </Box>
  )
})


export const TimersFooter = observer((p: { board: IBoard }) => {
  return (<>
    <Divider />
    <Stack spacing={2} direction='row' sx={{ width: '100%' }}>
      {p.board.lastMark?.timer && (
        <Button onClick={() => p.board.stopTimer(factory.generator.getCurrentTime())} startIcon={<StopIcon />}>
          stop {p.board.lastMark.timer.name}
        </Button>
      )}
      <ButtonNewDialog labelOpen='new timer' title='new Timer' labelInput='timer name' labelConfirm='create' onOk={(n) => createTimer(p.board, n)} />
    </Stack>
  </>)
})


export const Stopwatch = observer((p: { board: IBoard }) => {
  const Wrapper = (wp: { timer: ITimer, lastMark: number | undefined, children: any }) => (
    <ListItemButton autoFocus={wp.lastMark !== undefined}
      onClick={() => toggleTimer(p.board, wp.timer, wp.lastMark)}>
      {wp.lastMark !== undefined && (<ListItemIcon><TimelapseRounded /></ListItemIcon>)}
      <ListItemText>
        {wp.children}
      </ListItemText>
    </ListItemButton>
  )

  return (<Box sx={{ width: '100vw', position: 'fixed', bottom: 0 }}>
    <Stack spacing={2}>
      <Box>
        <TimersView board={p.board} WrapperTimer={Wrapper} />
      </Box>
      <TimersFooter board={p.board} />

    </Stack>
  </Box>
  )
})

export const EditTimers = observer((p: { board: IBoard }) => {

  const Wrapper = (wp: { timer: ITimer, lastMark: number | undefined, children: any }) => {
    const [openDrawer, toggleDrawer, focusRef, setFocus] = useToggleFocus<HTMLButtonElement>()
    const [openDialog, setOpenDialog] = useState(0)

    const handleCloseDialog = () => {
      setOpenDialog(0)
      setFocus()
    }

    const rename = (v: string) => {
      renameTimer(wp.timer, v)
      handleCloseDialog()
    }

    const _delete = (v: string) => {
      deleteTimer(p.board, wp.timer)
      handleCloseDialog()
    }

    const handleKeyMouse = (event: React.KeyboardEvent | React.MouseEvent) => {
      if (event.type === 'keydown') {
        const key = (event as React.KeyboardEvent).key
        if (key !== 'Escape') return
      }
      toggleDrawer()
    };

    switch (openDialog) {
      case 1:
        return (<GetInputDialog title={`Rename timer ${wp.timer.name}`} labelInput='Timer name' onCancel={handleCloseDialog} labelConfirm='rename' onOk={rename} open={openDialog === 1} initialValue={wp.timer.name} />)
      case 2:
        return (<ConfirmDialog
          title={`Delete timer ${wp.timer.name}?`}
          description={`Are you sure to delete the timer ${wp.timer.name}? This action will delete this timer and it's related activity. This action can't be undone`}
          onCancel={handleCloseDialog}
          labelConfirm={`Delete ${wp.timer.name}`}
          onOk={_delete}
          open={openDialog === 2}
        />)
      default:
        return (<>
          <Button ref={focusRef} onClick={toggleDrawer}>{wp.children}</Button>
          <Drawer open={openDrawer} onClick={handleKeyMouse} onKeyDown={handleKeyMouse} >
            <List>
              <ListItem disablePadding>
                <ListItemButton autoFocus onClick={() => setOpenDialog(1)}>
                  <ListItemText primary="Rename" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => setOpenDialog(2)}>
                  <ListItemText primary="Delete" />
                </ListItemButton>
              </ListItem>
            </List>
          </Drawer>
        </>)
    }
  }

  return (<Box sx={{ width: '100vw' }}>
    <Stack spacing={2}>
      <Box style={{ maxHeight: 500, overflow: 'auto', position: 'fixed', bottom: 35 }}>
        <List style={{}}>
          <TimersView board={p.board} WrapperTimer={Wrapper} />
        </List>
      </Box>
      <Box style={{ maxHeight: 25, position: 'fixed', bottom: 0, width: '100%' }}>
        <Divider />
        <Stack spacing={2} direction='row'>
          {p.board.lastMark?.timer && (
            <Box>
              <button onClick={() => p.board.stopTimer(factory.generator.getCurrentTime())}>stop {p.board.lastMark.timer.name}</button>
            </Box>
          )}
          <Box>
            <ButtonNewDialog labelOpen='new timer' title='new Timer' labelInput='timer' labelConfirm='create' onOk={(n) => createTimer(p.board, n)} />
          </Box>
        </Stack>
      </Box>
    </Stack>
  </Box>
  )
})

export function MarkTimeEntry(p: { mark: ReportMark }) {
  const mark = p.mark
  const [duration, setDuration] = useState(mark.duration ? mark.duration : factory.generator.getCurrentTime() - mark.time)

  useEffect(() => {
    if (!mark.duration) {
      let iv = setInterval(() => setDuration(Date.now() - mark.time), 1000)
      return () => clearInterval(iv)
    }
    return undefined
  }, [p.mark])

  return (<tr>
    <td>
      {mark.timer!.name}
    </td>
    <td>
      {new Date(mark.time).toLocaleTimeString()}
    </td>
    <td>
      {msToHumanTime(duration)}
    </td>
  </tr>)
}


interface IDatePicker {
  startDate: Date
  endDate: Date
  setStartDate(d: Date): void
  setEndDate(d: Date): void
}


function useDatePicker(): IDatePicker {
  const [startDate, setStartDate] = useState<Date>(dateUtils.getCurrentStartDay)
  const [endDate, setEndDate] = useState<Date>(dateUtils.sumDay(startDate, 1))
  return { startDate, endDate, setStartDate, setEndDate }
}


function RangeDatePicker(props: { dateRange: IDatePicker }) {
  const d = props.dateRange
  const [rangeType, setRangeType] = useState("day")

  type FNStart = () => Date
  type FNSum = (d: Date, n: number) => Date
  const setRange = (fnStart: FNStart, fnSum: FNSum) => {
    const start = fnStart()
    d.setStartDate(start)
    d.setEndDate(fnSum(start, 1))
  }
  const addToRange = (fnSum: FNSum, n: number) => {
    d.setStartDate(fnSum(d.startDate, n))
    d.setEndDate(fnSum(d.endDate, n))
  }
  const fnSumbs: Record<string, [FNStart, FNSum]> = {
    day: [dateUtils.getCurrentStartDay, dateUtils.sumDay],
    week: [dateUtils.getCurrentStartWeek, dateUtils.sumWeek],
    month: [dateUtils.getCurrentStartMonth, dateUtils.sumMonth]
  }

  const onSelectRadio = (e: SyntheticEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value
    setRangeType(v)
    setRange(fnSumbs[v]![0], fnSumbs[v][1])
  }

  return (<div>
    <RadioGroup defaultValue="day" onChange={onSelectRadio}>
      <Stack direction="row">
        <FormControlLabel label="Day" value="day" control={<Radio />} />
        <FormControlLabel label="Week" value="week" control={<Radio />} />
        <FormControlLabel label="Month" value="month" control={<Radio />} />
      </Stack>
    </RadioGroup>
    <Stack direction="row">
      <Button onClick={() => addToRange(fnSumbs[rangeType][1], -1)} startIcon={<ArrowLeftRounded />}>Prev {rangeType}</Button>
      <Button onClick={() => addToRange(fnSumbs[rangeType][1], 1)} endIcon={<ArrowRightRounded />}>Next {rangeType}</Button>
    </Stack>
    <Button>from: {d.startDate.toLocaleDateString()}, to: {d.endDate.toLocaleDateString()}</Button>
  </div>)
}


function ListHistory(p: { marks: ReportMark[] }) {
  return (<table>
    <tr>
      <th>
        timer
      </th>
      <th>
        date
      </th>
      <th>
        Duration
      </th>
    </tr>
    {p.marks.map((v, i) => (<MarkTimeEntry key={i} mark={v} />))}
  </table>)
}


function SumaryHistory(p: { summary: TimerSummary[] }) {
  const [data, setData] = useState([...p.summary])
  const [sortBy, setSortBy] = useState("duration")
  const fnSorts = {
    duration: (a: TimerSummary, b: TimerSummary) => a.lastDuration == b.lastDuration ? 0 : a.lastDuration > b.lastDuration ? -1 : 1,
    count: (a: TimerSummary, b: TimerSummary) => a.count == b.count ? 0 : a.count > b.count ? -1 : 1
  }
  const handleSort = () => {
    switch (sortBy) {
      case "duration":
        setData([...p.summary].sort(fnSorts.duration))
        break
      case "count":
        setData([...p.summary].sort(fnSorts.count))
        break
    }
  }

  useEffect(() => {
    handleSort()
  }, [p.summary])
  return (<table>
    <tr>
      <th>
        timer
      </th>
      <th>
        <Button onClick={() => setSortBy("duration")}>
          Total duration
        </Button>
      </th>
      <th>
        <Button onClick={() => setSortBy("count")}>
          Count
        </Button>
      </th>
    </tr>
    {data.map((v) => (<tr key={v.id}>
      <td>
        {v.name}
      </td>
      <td>
        {msToHumanTime(v.lastDuration)}
      </td>
      <td>
        {v.count}
      </td>
    </tr>))}
  </table>)
}

export const LogView = observer((p: { board: IBoard }) => {
  const date = useDatePicker()

  return (<Box sx={{ width: '100vh' }}>
    <Stack spacing={2}>
      <RangeDatePicker dateRange={date} />
      <ListHistory marks={getHistoryRange(date.startDate, date.endDate, p.board)} />
    </Stack>
  </Box>)
})


export const SummaryView = observer((p: { board: IBoard }) => {
  const date = useDatePicker()

  return (<Box sx={{ width: '100vh' }}>
    <Stack spacing={2}>
      <RangeDatePicker dateRange={date} />
      <SumaryHistory summary={getSummaryRange(date.startDate, date.endDate, p.board)} />
    </Stack>
  </Box>)
})
