import { BlitzPage } from "blitz"
import Layout from "app/core/layouts/Layout"
import { Session, startSession, stopSession } from "app/models/Session"
import { useCallback, useState } from "react"
import { Button } from "@chakra-ui/react"

const Home: BlitzPage = () => {
  const [session, setSession] = useState<Session>(() => ({
    reminders: [],
    started: null,
    stopped: null,
  }))

  const startSessionCallback = useCallback(() => {
    setSession(startSession(session))
  }, [session])

  const stopSessionCallback = useCallback(() => {
    setSession(stopSession(session))
  }, [session])

  return (
    <div>
      <ul>
        <li>Started: {session.started?.toLocaleDateString("en-US") || "null"}</li>
        <li>Stopped: {session.stopped?.toLocaleDateString("en-US") || "null"}</li>
      </ul>
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
    </div>
  )
}

Home.suppressFirstRenderFlicker = true
Home.getLayout = (page) => <Layout title="Home">{page}</Layout>

export default Home
