import { BlitzPage } from "blitz"
import Layout from "app/core/layouts/Layout"
import { addReminder, Reminder, Session, startSession, stopSession } from "app/models/Session"
import { useCallback, useState } from "react"
import { Box, Button, Heading, Stack } from "@chakra-ui/react"

const Home: BlitzPage = () => {
  const [session, setSession] = useState<Session>(() => ({
    reminders: [],
    started: null,
    stopped: null,
  }))
  const [isSessionStarted, setIsSessionStarted] = useState(false)

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
        <Heading size="md">Reminders</Heading>
        <Stack spacing={2}>
          {session?.reminders.map((r, i) => (
            <Box key={i} spacing={2}>
              <ul>
                <li>Name: {r.name}</li>
                <li>Interval: {r.interval}</li>
                <li>Completed: {r.completed}</li>
                <li>Next Due: {r.nextDue?.toISOString()}</li>
              </ul>
            </Box>
          ))}
        </Stack>
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
