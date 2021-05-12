import { BlitzPage } from 'blitz'
import Layout from 'app/core/layouts/Layout'
import {
  addReminder,
  Reminder,
  Session,
  startSession,
  stopSession,
  updateReminderConfig,
} from 'app/models/Session'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
} from '@chakra-ui/react'
import React from 'react'
import { Formik, Field, Form, useFormikContext } from 'formik'
import debounce from 'just-debounce-it'

interface ReminderConfigProps {
  initialValues: Partial<ReminderConfigValues>
  onUpdate: (values: ReminderConfigValues, valid: Boolean) => void
}
interface ReminderConfigValues {
  name: string
  interval: number
}

type ReminderConfigValuesStrings = Omit<ReminderConfigValues, 'interval'> & { interval: string }

const AutoSave = ({ debounceMs }) => {
  const formik = useFormikContext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSubmit = useCallback(
    debounce(() => formik.submitForm(), debounceMs),
    [debounceMs, formik.submitForm, debounce]
  )

  React.useEffect(() => {
    debouncedSubmit()
  }, [debouncedSubmit, formik.values])

  return null
}

const validateReminderValues = (
  onUpdate: (values: ReminderConfigValues, valid: Boolean) => void
) => (values: ReminderConfigValuesStrings) => {
  const errors: Partial<ReminderConfigValuesStrings> = {}
  let hasErrors

  if (!values.name) {
    errors.name = 'Required'
    hasErrors = true
  }
  if (!parseInt(values.interval, 10)) {
    errors.interval = 'Required'
    hasErrors = true
  }
  if (hasErrors) {
    onUpdate({ name: '', interval: 0 }, false)
  }
  return errors
}

const ReminderConfig: FunctionComponent<ReminderConfigProps> = ({ initialValues, onUpdate }) => {
  return (
    <Formik
      initialValues={{
        name: initialValues?.name || '',
        interval: initialValues?.interval || '',
      }}
      validate={validateReminderValues(onUpdate)}
      onSubmit={values => {
        return new Promise(resolve =>
          setTimeout(() => {
            console.log('submitted', JSON.stringify(values, null, 2))
            onUpdate(
              {
                ...values,
                interval:
                  typeof values.interval === 'number'
                    ? values.interval
                    : parseInt(values.interval, 10),
              },
              true
            )
            resolve(null)
          }, 500)
        )
      }}
      render={() => (
        <Form>
          <AutoSave debounceMs={200} />
          <Stack spacing={4} maxW='md' bgColor='lightgray' p={2}>
            <Field name='name'>
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.name && form.touched.name}>
                  <FormLabel htmlFor='name'>Name</FormLabel>
                  <Input {...field} id='name' placeholder='name' />
                  <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name='interval'>
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.interval && form.touched.interval}>
                  <FormLabel htmlFor='interval'>Interval</FormLabel>
                  <Input {...field} id='interval' placeholder='' />
                  <FormErrorMessage>{form.errors.interval}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Stack>
        </Form>
      )}
    />
  )
}

type ReminderStatus = 'pending' | 'overdue'

const calcMinutesRemaining = (d1: Date, d2: Date | null) => {
  return d2 === null ? -1 : Math.ceil((d2.getTime() - d1.getTime()) / 60000)
}

const ActiveReminder: FunctionComponent<{ reminder: Reminder }> = ({ reminder }) => {
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
                <ActiveReminder reminder={r} key={i} />
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
                todos: [],
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
