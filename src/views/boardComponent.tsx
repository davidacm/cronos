import { useEffect, useState, useId, useRef} from 'react'
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, useDisclosure } from "@chakra-ui/react"
import { observer } from "mobx-react-lite"

import { factory, IBoard, IMarkTime, ITimer, MarkTime } from "../logic/store"

import { beepSlower, dateUtils, msToHumanTime, uuid } from '../logic/utils'


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

function ConfirmDialog(p: { title: string, msg: string, confirmLabel: string, callbackConfirm: () => void, children: any}) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef(null)

  const onConfirm = () => {
    p.callbackConfirm()
    onClose()
  }

  return (
    <>
      <Button colorScheme='red' onClick={onOpen}>
        {p.children}
      </Button>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              {p.title}
            </AlertDialogHeader>

            <AlertDialogBody>
              {p.msg}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme='red' onClick={onConfirm} ml={3}>
                {p.confirmLabel}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}


function DeleteTimerDialog(p: {board: IBoard, timer: ITimer}) {
  const confirm = () => deleteTimer(p.board, p.timer)
  return (<ConfirmDialog
    title='Delete timer'
    confirmLabel={'delete ' +p.timer.name}
    msg={`Are you sure to delete ${p.timer.name}? You can't undo this action afterwards.`}
    callbackConfirm = {confirm}
  >Delete</ConfirmDialog>)
}


export function GetInput(p: { Title: string, inputName: string, doneLabel: string, initialValue?: string, callback: (inputValue: string) => void }) {
  const [inputValue, setInputValue] = useState(p.initialValue? p.initialValue: "")
  const inputId = useId()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const onDone = () => {
    onClose()
    if (inputValue)
      p.callback(inputValue)
  }

  return (
    <>
      <Button onClick={onOpen}>{p.Title}</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader><h1>{p.Title}</h1></ModalHeader>
          <ModalBody>
            <label htmlFor={inputId}>{p.inputName} name</label>
            <input id={inputId} type="text" value={inputValue} onChange={e => setInputValue(e.currentTarget.value)} />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onDone} variant='solid'>{p.doneLabel} {p.inputName}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
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

  return (<span>{p.timer.name}. {duration}</span>)
})


export const TimersView = observer((p: { board: IBoard, WrapperTimer: (p: { timer: ITimer, lastMark: number | undefined, children: any }) => any }) => {
  const b = p.board
  console.log("construyendo board", uuid.getId(), b.history.length, b.lastMark?.time, b.lastMark?.timer?.id)
  const WrapperTimer = p.WrapperTimer

  return (<Stack direction={'column'} spacing='12px'>
    {b.mostRecent.map(v => {
      let l: number | undefined = undefined
      if (b.lastMark && v.id === b.lastMark.timer?.id)
        l = b.lastMark.time
      return (<Box key={v.id}>
        <WrapperTimer timer={v} lastMark={l}>
          <TimerComponent timer={v} lastMark={l} />
        </WrapperTimer>
      </Box>)
    })}
  </Stack>
  )
})


export const Stopwatch = observer((p: { board: IBoard }) => {

  const Wrapper = (wp: { timer: ITimer, lastMark: number | undefined, children: any }) => (
    <button
      onClick={() => toggleTimer(p.board, wp.timer, wp.lastMark)}>
        {wp.children}
    </button>
  )

  return (<Stack direction={'column'}>
    <TimersView board={p.board} WrapperTimer={Wrapper} />
    <Stack direction={'row'} spacing='24px'>
      {p.board.lastMark?.timer && (
        <Box>
          <button onClick={() => p.board.stopTimer(factory.generator.getCurrentTime())}>stop {p.board.lastMark.timer.name}</button>
        </Box>
      )}
      <Box>
        <GetInput Title='new timer' inputName='timer' doneLabel='create' callback={n => createTimer(p.board, n)} />
      </Box>
    </Stack>
  </Stack>
  )
})

export const EditTimers = observer((p: { board: IBoard }) => {
  const Wrapper = (wp: { timer: ITimer, lastMark: number | undefined, children: any }) => {
    const { getDisclosureProps, getButtonProps } = useDisclosure()
    const buttonProps = getButtonProps()
    const disclosureProps = getDisclosureProps()
    return (
      <>
        <Button {...buttonProps}>{wp.children}</Button>
        <Stack direction='row' {...disclosureProps}>
          <GetInput Title='Rename' inputName='timer' doneLabel='Save' initialValue={wp.timer.name} callback={n => renameTimer(wp.timer, n)} />
          <DeleteTimerDialog board={p.board} timer={wp.timer}/>
        </Stack>
      </>
    )
  }

  return (<Stack direction={'column'}>
    <TimersView board={p.board} WrapperTimer={Wrapper} />
      <Box>
        <GetInput Title='new' inputName='timer' doneLabel='create' callback={(n) => createTimer(p.board, n)} />
      </Box>
  </Stack>
  )
})

export const MarkTimeEntry = observer((p: {startMark: IMarkTime, endMark: IMarkTime  | undefined}) => {
  const [endTime, setEndTime] = useState(p.endMark? p.endMark.time: factory.generator.getCurrentTime())

  useEffect(() => {
    if (!p.endMark) {
      let iv = setInterval(() => setEndTime(Date.now()), 1000)
      return () => clearInterval(iv)
    }
    return undefined
  }, [p.endMark])

  return (<span>{p.startMark.timer!.name}: {msToHumanTime(endTime -p.startMark.time)}</span>)
})

export const LogView = observer((p: {board: IBoard}) => {
  // temporally just can see one day.
  const [startDate, setStartDate] = useState(dateUtils.getCurrentStartDay)
  const [endDate, setEndDate] = useState(dateUtils.sumDay(startDate, 1))
  const logRange = p.board.getHistoryBetween(startDate.getTime(), endDate.getTime())
  if (!logRange) return null

  console.log("tamanio history", logRange.length)
  const prev  = p.board.getPrevMark(startDate.getTime())
  // if a mark time is before the current start day, count the time from the start of the current day.
  if (prev && prev.timer) {
    console.log("prev is available")
    const m = MarkTime.create({time: startDate.getTime()})
    m.setTimer(prev.timer)
    logRange.unshift(m)
  }
  const items = []
  for (let i=0; i< logRange!.length-1; ++i) {
    if (!logRange[i].timer) continue
    items.push((<p key={i}><MarkTimeEntry startMark={logRange[i]} endMark={logRange[i+1]}/></p>))
  }
  console.log("ztamanio items", items.length)
  // if the last timer is still not stopped, render it with undefined endMark
  const last = logRange.at(-1)
  if (last && last!.timer)
    items.push((<p key='-1'><MarkTimeEntry startMark={last} endMark={undefined}/></p>))
  console.log("ztamanio 2 items", items.length)
  return (<Stack direction='column'>
    {items})
    </Stack>)
})
