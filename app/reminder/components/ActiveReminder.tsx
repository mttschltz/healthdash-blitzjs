import { Box, Checkbox, Heading, Stack, Text } from '@chakra-ui/react'
import { Reminder } from 'app/models/models'
import React, { FunctionComponent, useState, useEffect, useCallback } from 'react'

type ReminderStatus = 'pending' | 'overdue'

const calcMinutesRemaining = (d1: Date, d2: Date | null) => {
  return d2 === null ? -1 : Math.ceil((d2.getTime() - d1.getTime()) / 60000)
}

export interface ActiveReminderProps {
  reminder: Reminder
  completeTodo: (n: string) => void
  uncompleteTodo: (n: string) => void
}

export const ActiveReminder: FunctionComponent<ActiveReminderProps> = ({
  completeTodo,
  uncompleteTodo,
  reminder,
}) => {
  const [status, setStatus] = useState<ReminderStatus>('pending')
  const [minRemaining, setMinRemaining] = useState(
    calcMinutesRemaining(new Date(), reminder.nextDue)
  )

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

  useEffect(() => {
    const newMinRemaining = calcMinutesRemaining(new Date(), reminder.nextDue)
    setMinRemaining(newMinRemaining)
    if (newMinRemaining <= 0) {
      setStatus('overdue')
    } else {
      setStatus('pending')
    }

    const interval = setInterval(() => {
      const newMinRemaining = calcMinutesRemaining(new Date(), reminder.nextDue)
      setMinRemaining(newMinRemaining)
      if (newMinRemaining <= 0) {
        setStatus('overdue')
      } else {
        setStatus('pending')
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [reminder.nextDue])

  return (
    <Box spacing={2} bgColor={status === 'pending' ? 'lightgreen' : 'lightpink'}>
      <ul>
        <li>Name: {reminder.name}</li>
        <li>Interval: {reminder.interval}</li>
        <li>Completed: {reminder.completed}</li>
        <li>Next Due: {reminder.nextDue?.toISOString()}</li>
        <li>Current time: {new Date().toISOString()}</li>
        {status === 'overdue' ? (
          <li>Overdue</li>
        ) : reminder.interval === minRemaining ? (
          <li>{`${minRemaining}m left`}</li>
        ) : (
          <li>{`${minRemaining}/${reminder.interval}m left`}</li>
        )}
      </ul>
      <Stack>
        <Heading size='sm'>Todos</Heading>
        {reminder.todos.map((t, i) => {
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
