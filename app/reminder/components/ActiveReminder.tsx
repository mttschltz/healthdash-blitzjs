import { Box } from '@chakra-ui/react'
import { Reminder } from 'app/models/models'
import React, { FunctionComponent, useState, useEffect } from 'react'

type ReminderStatus = 'pending' | 'overdue'

const calcMinutesRemaining = (d1: Date, d2: Date | null) => {
  return d2 === null ? -1 : Math.ceil((d2.getTime() - d1.getTime()) / 60000)
}

export const ActiveReminder: FunctionComponent<{ reminder: Reminder }> = ({ reminder }) => {
  const [status, setStatus] = useState<ReminderStatus>('pending')
  const [minRemaining, setMinRemaining] = useState(
    calcMinutesRemaining(new Date(), reminder.nextDue)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'overdue') {
        return
      }
      const newMinRemaining = calcMinutesRemaining(new Date(), reminder.nextDue)
      setMinRemaining(newMinRemaining)
      if (newMinRemaining <= 0) {
        setStatus('overdue')
      }
    }, 2000)

    return () => clearInterval(interval)
  })

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
    </Box>
  )
}
