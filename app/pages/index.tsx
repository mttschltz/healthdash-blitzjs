import { BlitzPage } from 'blitz'
import Layout from 'app/core/layouts/Layout'
import {
  addReminder,
  completeTodo,
  Reminder,
  Session,
  startSession,
  stopSession,
  uncompleteTodo,
  updateReminderConfig,
} from 'app/models/models'
import { useCallback, useState } from 'react'
import { Box, Button, Heading, Stack } from '@chakra-ui/react'
import React from 'react'
import { ReminderConfig, ReminderConfigValues } from 'app/reminder/components/ReminderConfig'
import { ActiveReminder } from 'app/reminder/components/ActiveReminder'

const Home: BlitzPage = () => {
  const [session, setSession] = useState<Session>(() => ({
    reminders: [],
    started: null,
    stopped: null,
  }))
  const [isSessionStarted, setIsSessionStarted] = useState(false)
  const [reminderValidities, setReminderValidities] = useState<boolean[]>([])

  const startSessionCallback = useCallback(() => {
    setSession(startSession(session))
    setIsSessionStarted(true)
  }, [session])

  const stopSessionCallback = useCallback(() => {
    setSession(stopSession(session))
    setIsSessionStarted(false)
  }, [session])

  const addReminderCallback = useCallback(
    (r: Reminder) => {
      setSession(addReminder(session, r))
      setReminderValidities([...reminderValidities, true])
    },
    [session, reminderValidities]
  )

  const updateReminderValidityCallback = useCallback(
    (i: number, valid: boolean) => {
      const newReminderValidities = [...reminderValidities]
      newReminderValidities[i] = valid
      setReminderValidities(newReminderValidities)
    },
    [reminderValidities]
  )

  const updateReminderCallback = useCallback(
    (newValues: ReminderConfigValues, i: number) => {
      const r = session.reminders[i]
      if (newValues.name !== r.name || newValues.interval !== r.interval) {
        setSession(updateReminderConfig(session, i, newValues.name, newValues.interval))
      }
      const newReminderValidities = [...reminderValidities]
      newReminderValidities[i] = true
      setReminderValidities(newReminderValidities)
    },
    [session, reminderValidities]
  )

  const completeTodoCallback = useCallback(
    (tn: string, ri: number) => {
      setSession(completeTodo(session, ri, tn))
    },
    [session]
  )

  const uncompleteTodoCallback = useCallback(
    (tn: string, ri: number) => {
      setSession(uncompleteTodo(session, ri, tn))
    },
    [session]
  )

  return (
    <Stack spacing={4}>
      <Box>
        <Heading size='md'>Session</Heading>
        <ul>
          <li>Started: {session.started?.toISOString() || 'null'}</li>
          <li>Stopped: {session.stopped?.toISOString() || 'null'}</li>
        </ul>
      </Box>
      <Box>
        {!isSessionStarted && (
          <>
            <Heading size='md'>Reminder Configs</Heading>
            <Stack spacing={2}>
              {session?.reminders.map((r, i) => (
                <ReminderConfig
                  key={i}
                  initialValues={{ interval: r.interval, name: r.name }}
                  onUpdate={(newValues, valid) => {
                    if (!valid) {
                      console.log('not valid :(')
                      updateReminderValidityCallback(i, false)
                    } else {
                      updateReminderCallback(newValues, i)
                    }
                  }}
                />
              ))}
            </Stack>
          </>
        )}
        {isSessionStarted && (
          <>
            <Heading size='md'>Reminders</Heading>
            <Stack spacing={4} maxW='md'>
              {session?.reminders.map((r, i) => (
                <ActiveReminder
                  reminder={r}
                  key={i}
                  completeTodo={(tn: string) => {
                    completeTodoCallback(tn, i)
                  }}
                  uncompleteTodo={(tn: string) => {
                    uncompleteTodoCallback(tn, i)
                  }}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>
      {!isSessionStarted && (
        <Box>
          <Button
            onClick={() => {
              addReminderCallback({
                name: 'New reminder',
                interval: 30,
                child: null,
                todos: [
                  {
                    name: 'Look away from screen',
                    complete: false,
                  },
                  {
                    name: 'Drink water',
                    complete: false,
                  },
                  {
                    name: 'Desk yoga',
                    complete: false,
                  },
                ],
                nextDue: null,
                completed: 0,
              })
            }}
          >
            Add Reminder
          </Button>
        </Box>
      )}
      <Box>
        {session.stopped || !session.started ? (
          <Button
            onClick={() => {
              startSessionCallback()
            }}
            disabled={session.reminders.length === 0 || reminderValidities.some(v => !v)}
          >
            Start
          </Button>
        ) : (
          <Button
            onClick={() => {
              stopSessionCallback()
            }}
          >
            Stop
          </Button>
        )}
      </Box>
    </Stack>
  )
}

Home.suppressFirstRenderFlicker = true
Home.getLayout = page => <Layout title='Home'>{page}</Layout>

export default Home
