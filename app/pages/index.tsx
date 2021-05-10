import { BlitzPage } from "blitz"
import Layout from "app/core/layouts/Layout"

const Home: BlitzPage = () => {
  return <div>Empty page</div>
}

Home.suppressFirstRenderFlicker = true
Home.getLayout = (page) => <Layout title="Home">{page}</Layout>

export default Home
