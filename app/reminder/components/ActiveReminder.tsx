import { Box, Checkbox, Heading, Stack, Text } from '@chakra-ui/react'
import { Reminder, Todo } from 'app/models/models'
import React, { FunctionComponent, useState, useEffect, useCallback } from 'react'

type ReminderStatus = 'pending' | 'overdue'

const calcMinutesRemaining = (d1: Date, d2: Date | null) => {
  return d2 === null ? -1 : Math.ceil((d2.getTime() - d1.getTime()) / 60000)
}

export interface ActiveReminderManagerProps {
  reminder: Reminder
  completeTodo: (tn: string) => void
  uncompleteTodo: (tn: string) => void
  completeChildTodo: (ctn: string) => void
  uncompleteChildTodo: (ctn: string) => void
}

interface ActiveReminderProps {
  name: string
  interval: number
  todos: Todo[]

  completed: number
  nextDue: Date | null

  minRemaining: number | null
  status: ReminderStatus
  parentMinRemaining?: number | null
  parentName?: string
  updateTodoCallback: (tn: string, checked: boolean) => void
}

const ActiveReminder: FunctionComponent<ActiveReminderProps> = ({
  completed,
  interval,
  name,
  nextDue,
  todos,
  status,
  minRemaining,
  parentName,
  parentMinRemaining,
  updateTodoCallback,
}) => {
  return (
    <Box spacing={2} bgColor={status === 'pending' ? 'lightgreen' : 'lightpink'}>
      <ul>
        {parentName && (
          <li>
            {parentMinRemaining}m left until {parentName}
          </li>
        )}
        <li>Name: {name}</li>
        <li>Interval: {interval}</li>
        <li>Completed: {completed}</li>
        <li>Next Due: {nextDue?.toISOString()}</li>
        <li>Current time: {new Date().toISOString()}</li>
        {status === 'overdue' ? (
          <li>Overdue</li>
        ) : interval === minRemaining ? (
          <li>{`${minRemaining}m left`}</li>
        ) : (
          <li>{`${minRemaining}/${interval}m left`}</li>
        )}
      </ul>
      <Stack>
        <Heading size='sm'>Todos</Heading>
        {todos.map((t, i) => {
          return status === 'overdue' ? (
            <Checkbox
              key={i}
              size='lg'
              onChange={e => {
                updateTodoCallback(t.name, e.target.checked)
              }}
              colorScheme='red'
            >
              {t.name}
            </Checkbox>
          ) : (
            <Text fontSize='lg'>{t.name}</Text>
          )
        })}
      </Stack>
    </Box>
  )
}

const shouldParentOverrideChild = (parentReminder: Reminder, childReminder: Reminder | null) => {
  return (
    childReminder === null || // no child
    // parent has less remaining, with 1 min buffer
    // use times not minRemaining as rounding causes problems
    (parentReminder.nextDue !== null &&
      childReminder.nextDue !== null &&
      parentReminder.nextDue <= new Date(childReminder.nextDue.getTime() + 60000)) ||
    // parent is overdue
    (parentReminder.nextDue !== null && parentReminder.nextDue <= new Date())
  )
}

export const ActiveReminderManager: FunctionComponent<ActiveReminderManagerProps> = ({
  completeTodo,
  uncompleteTodo,
  completeChildTodo,
  uncompleteChildTodo,
  reminder: parentReminder,
}) => {
  const childReminder = parentReminder.child
  const [minRemainingChild, setMinRemainingChild] = useState<number | null>(null)
  const [minRemainingParent, setMinRemainingParent] = useState<number | null>(null)
  const [childIsActive, setChildIsActive] = useState(false)
  const [status, setStatus] = useState<ReminderStatus>('pending')

  const updateTodoCallback = useCallback(
    (tn: string, checked: boolean) => {
      if (checked) {
        completeTodo(tn)
      } else {
        uncompleteTodo(tn)
      }
    },
    [completeTodo, uncompleteTodo]
  )

  const updateChildTodoCallback = useCallback(
    (tn: string, checked: boolean) => {
      if (checked) {
        completeChildTodo(tn)
      } else {
        uncompleteChildTodo(tn)
      }
    },
    [completeChildTodo, uncompleteChildTodo]
  )

  useEffect(() => {
    const update = () => {
      if (shouldParentOverrideChild(parentReminder, childReminder) || childReminder === null) {
        const newMinRemainingParent = calcMinutesRemaining(new Date(), parentReminder.nextDue)
        setChildIsActive(false)
        setStatus(newMinRemainingParent <= 0 ? 'overdue' : 'pending')
        setMinRemainingParent(newMinRemainingParent)
        const newMinRemainingChild = calcMinutesRemaining(
          new Date(),
          childReminder?.nextDue || null
        )
        setMinRemainingChild(newMinRemainingChild)
      } else {
        const newMinRemainingChild = calcMinutesRemaining(new Date(), childReminder.nextDue)
        setChildIsActive(true)
        setStatus(newMinRemainingChild <= 0 ? 'overdue' : 'pending')
        setMinRemainingChild(newMinRemainingChild)
        const newMinRemainingParent = calcMinutesRemaining(new Date(), parentReminder.nextDue)
        setMinRemainingParent(newMinRemainingParent)
      }
    }
    update()

    const interval = setInterval(update, 2000)

    return () => clearInterval(interval)
  }, [childReminder, parentReminder])

  return childIsActive && childReminder ? (
    <ActiveReminder
      completed={childReminder.completed}
      interval={childReminder.interval}
      minRemaining={minRemainingChild}
      name={childReminder.name}
      nextDue={childReminder.nextDue}
      status={status}
      todos={childReminder.todos}
      updateTodoCallback={updateChildTodoCallback}
      parentMinRemaining={minRemainingParent}
      parentName={parentReminder.name}
    />
  ) : (
    <ActiveReminder
      completed={parentReminder.completed}
      interval={parentReminder.interval}
      minRemaining={minRemainingParent}
      name={parentReminder.name}
      nextDue={parentReminder.nextDue}
      status={status}
      todos={parentReminder.todos}
      updateTodoCallback={updateTodoCallback}
    />
  )
}
