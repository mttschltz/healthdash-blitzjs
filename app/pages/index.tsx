import { BlitzPage } from "blitz"
import Layout from "app/core/layouts/Layout"
import {
  addReminder,
  Reminder,
  Session,
  startSession,
  stopSession,
  updateReminderConfig,
} from "app/models/Session"
import { FunctionComponent, useCallback, useState } from "react"
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
} from "@chakra-ui/react"
import React from "react"
import { Formik, Field, Form, useFormikContext } from "formik"
import debounce from "just-debounce-it"

interface ReminderConfigProps {
  initialValues: Partial<ReminderConfigValues>
  onUpdate: (values: ReminderConfigValues, valid: Boolean) => void
}
interface ReminderConfigValues {
  name: string
  interval: number
}

type ReminderConfigValuesStrings = Omit<ReminderConfigValues, "interval"> & { interval: string }

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
    errors.name = "Required"
    hasErrors = true
  }
  if (!parseInt(values.interval, 10)) {
    errors.interval = "Required"
    hasErrors = true
  }
  if (hasErrors) {
    onUpdate({ name: "", interval: 0 }, false)
  }
  return errors
}

const ReminderConfig: FunctionComponent<ReminderConfigProps> = ({ initialValues, onUpdate }) => {
  return (
    <Formik
      initialValues={{
        name: initialValues?.name || "",
        interval: initialValues?.interval || "",
      }}
      validate={validateReminderValues(onUpdate)}
      onSubmit={(values) => {
        return new Promise((resolve) =>
          setTimeout(() => {
            console.log("submitted", JSON.stringify(values, null, 2))
            onUpdate(
              {
                ...values,
                interval:
                  typeof values.interval === "number"
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
          <Stack spacing={4} maxW="md" bgColor="lightgray" p={2}>
            <Field name="name">
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.name && form.touched.name}>
                  <FormLabel htmlFor="name">Name</FormLabel>
                  <Input {...field} id="name" placeholder="name" />
                  <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="interval">
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.interval && form.touched.interval}>
                  <FormLabel htmlFor="interval">Interval</FormLabel>
                  <Input {...field} id="interval" placeholder="" />
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

const Home: BlitzPage = () => {
  const [session, setSession] = useState<Session>(() => ({
    reminders: [],
    started: null,
    stopped: null,
  }))
  const [isSessionStarted, setIsSessionStarted] = useState(false)
  const [canSessionStart, setCanSessionStart] = useState(false)

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
    },
    [session]
  )

  const updateReminderCallback = useCallback(
    (newValues: ReminderConfigValues, i: number) => {
      const r = session.reminders[i]
      if (newValues.name !== r.name || newValues.interval !== r.interval) {
        setSession(updateReminderConfig(session, i, newValues.name, newValues.interval))
      }
    },
    [session]
  )

  return (
    <Stack spacing={4}>
      <Box>
        <Heading size="md">Session</Heading>
        <ul>
          <li>Started: {session.started?.toISOString() || "null"}</li>
          <li>Stopped: {session.stopped?.toISOString() || "null"}</li>
        </ul>
      </Box>
      <Box>
        {!isSessionStarted && (
          <>
            <Heading size="md">Reminder Configs</Heading>
            <Stack spacing={2}>
              {session?.reminders.map((r, i) => (
                <ReminderConfig
                  key={i}
                  initialValues={{ interval: r.interval, name: r.name }}
                  onUpdate={(newValues, valid) => {
                    if (!valid) {
                      console.log("not valid :(")
                      setCanSessionStart(false)
                    } else {
                      updateReminderCallback(newValues, i)
                      setCanSessionStart(true)
                    }
                  }}
                />
              ))}
            </Stack>
          </>
        )}
        {isSessionStarted && (
          <>
            <Heading size="md">Reminders</Heading>
            <Stack spacing={4} maxW="md">
              {session?.reminders.map((r, i) => (
                <Box key={i} spacing={2} bgColor="lightgreen">
                  <ul>
                    <li>Name: {r.name}</li>
                    <li>Interval: {r.interval}</li>
                    <li>Completed: {r.completed}</li>
                    <li>Next Due: {r.nextDue?.toISOString()}</li>
                  </ul>
                </Box>
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
                name: "New reminder",
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
            disabled={!canSessionStart}
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
Home.getLayout = (page) => <Layout title="Home">{page}</Layout>

export default Home
