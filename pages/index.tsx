import { fetchCurrentRaces, Race } from 'lib/scraper'
import { isAfter, parseISO } from 'date-fns'
import { format as formatDateTime, utcToZonedTime } from 'date-fns-tz'
import { Inter } from '@next/font/google'
import getNow from 'helpers/now'
import useSWR from 'swr'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap'
})

export type HomeProps = {
  initialRaces: Race[]
}

const getLocalRaceTime = (time: string, tz: string) => {
  try {
    const zonedTime = utcToZonedTime(time, tz)
    return formatDateTime(zonedTime, 'MMM d, h:mm a')
  } catch (err) {
    return <Dash />
  }
}

const getLiveStatus = (time: string) => {
  try {
    const now = getNow()
    return isAfter(now, parseISO(time))
  } catch (err) {
    return false
  }
}

const Dash = () => (
  <span className="dash">&mdash;</span>
)

const Label = (props: React.PropsWithChildren) => {
  return (
    <span className="mobile-label">{props.children}</span>
  )
}

const Live = () => {
  return (
    <span className="live">Live</span>
  )
}

const fetcher = (url: string) =>
  fetch(url)
  .then(r => r.json())

export default function Home({ initialRaces = [] }: HomeProps) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const { data: races } = useSWR('/api/races', fetcher, {
    fallbackData: initialRaces,
    refreshInterval: 30000,
    revalidateOnMount: true,
  })

  return (
    <main className={`container ${inter.className}`}>
      <h1>Super Metroid Choozo Randomizer<br />2022 Schedule</h1>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th className="heading_live"><span>Live</span></th>
            <th>Players</th>
            <th>Channel</th>
            <th>Commentary</th>
            <th>Tracking</th>
          </tr>
        </thead>
        <tbody>
          {races?.map((race: Race, i: number) => {
            // @ts-ignore
            const time = getLocalRaceTime(race.datetime, tz)
            // @ts-ignore
            const live = getLiveStatus(race.datetime)
            return (
              <tr key={i}>
                <td className="column_time">
                  <div className="column-inner">
                    <Label>Time</Label>
                    {time}
                  </div>
                </td>
                <td className="column_live">
                  <div className="column-inner">
                    {live && <Live />}
                  </div>
                </td>
                <td className="column_players">
                  <Label>Players</Label>
                  {race.runners?.join(' vs ')}
                </td>
                <td className="column_channel">
                  <Label>Channel</Label>
                  {race.channel ? (
                  <a href={race.channel.url} target="_blank" rel="noopenner noreferrer">
                    {race.channel.name}
                  </a>
                  ) : <Dash />}
                </td>
                <td className="column_commentary">
                  <Label>Commentary</Label>
                  {race.commentary?.join(', ') || <Dash />}
                </td>
                <td className="column_tracking">
                  <Label>Tracking</Label>
                  {race.tracking?.join(', ') || <Dash />}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}

export async function getStaticProps() {
  const races:Promise<Race[]> = await fetchCurrentRaces()
  return {
    props: {
      initialRaces: races,
    },
    revalidate: 10,
  }
}
