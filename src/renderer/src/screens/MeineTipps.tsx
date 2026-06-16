import { useMemo, useState } from 'react'
import BracketTree from '../components/BracketTree'
import FlagBadge from '../components/FlagBadge'
import GroupTable from '../components/GroupTable'
import HoloSticker from '../components/HoloSticker'
import TipRow from '../components/TipRow'
import { GROUP_MATCHES, GROUP_TEAMS, GROUPS, ROUND_LABEL, SCHEDULE, TEAM_BY_ID } from '../lib/data'
import { resolveTipBracket } from '../lib/bracket'
import type { TipBracket } from '../lib/bracket'
import type { GroupId, ScheduledMatch } from '../lib/types'
import { useMyTips } from '../store'

const KO_STAGES = [
  { id: 'r32', label: '1/16', title: 'Sechzehntelfinale', matches: SCHEDULE.filter((m) => m.round === 'r32') },
  { id: 'r16', label: '1/8', title: 'Achtelfinale', matches: SCHEDULE.filter((m) => m.round === 'r16') },
  { id: 'qf', label: 'VF', title: 'Viertelfinale', matches: SCHEDULE.filter((m) => m.round === 'qf') },
  { id: 'sf', label: 'HF', title: 'Halbfinale', matches: SCHEDULE.filter((m) => m.round === 'sf') },
  {
    id: 'finals',
    label: 'Finale',
    title: 'Finale & Spiel um Platz 3',
    matches: SCHEDULE.filter((m) => m.round === 'third' || m.round === 'final')
  }
] as const

type Stage = GroupId | (typeof KO_STAGES)[number]['id'] | 'tree'

function ThirdsStrip({ bracket }: { bracket: TipBracket }) {
  if (!bracket.thirds) return null
  return (
    <div className="thirdsstrip">
      <h3>Beste Dritte — deine Rechnung</h3>
      <div className="thirdsstrip__row">
        {bracket.thirds.map((t, i) => {
          const team = TEAM_BY_ID.get(t.row.team)!
          return (
            <span key={t.group} className={`thirdchip${i < 8 ? ' thirdchip--in' : ''}`} title={team.name}>
              <FlagBadge flag={team.flag} size="sm" />
              <small>
                3{t.group} · {t.row.points}P
              </small>
            </span>
          )
        })}
      </div>
      {bracket.officialAllocation === false && (
        <p className="notice">Dritten-Zuordnung aktuell als gültige Näherung — offizielle Annexe-C-Tabelle wird nachgeliefert.</p>
      )}
    </div>
  )
}

export default function MeineTipps() {
  const [stage, setStage] = useState<Stage>('A')
  const tips = useMyTips()
  const bracket = useMemo(() => resolveTipBracket(tips), [tips])

  const tippedTotal = Object.keys(tips).length
  const tippedGroup = Object.keys(tips).filter((n) => Number(n) <= 72).length
  const tippedIn = (matches: readonly ScheduledMatch[]): number => matches.filter((m) => tips[m.match]).length
  const matchdays = [1, 2, 3] as const

  const koStage = KO_STAGES.find((s) => s.id === stage)

  return (
    <>
      <h1>Meine Tipps</h1>
      <p className="lead">
        Durchtippen bis zum Weltmeister — jeder Tipp wird sofort gespeichert. <strong>{tippedTotal}/104</strong> getippt.
      </p>

      <div className="groupchips">
        {GROUPS.map((g) => (
          <button
            key={g}
            className={`groupchip${g === stage ? ' groupchip--active' : ''}${tippedIn(GROUP_MATCHES[g]) === 6 ? ' groupchip--done' : ''}`}
            onClick={() => setStage(g)}
          >
            {g}
            <small>{tippedIn(GROUP_MATCHES[g])}/6</small>
          </button>
        ))}
        <span className="groupchips__div" />
        {KO_STAGES.map((s) => (
          <button
            key={s.id}
            className={`groupchip groupchip--ko${s.id === stage ? ' groupchip--active' : ''}${tippedIn(s.matches) === s.matches.length ? ' groupchip--done' : ''}`}
            onClick={() => setStage(s.id)}
          >
            {s.label}
            <small>
              {tippedIn(s.matches)}/{s.matches.length}
            </small>
          </button>
        ))}
        <button
          className={`groupchip groupchip--ko${stage === 'tree' ? ' groupchip--active' : ''}`}
          onClick={() => setStage('tree')}
        >
          Baum
          <small>&nbsp;</small>
        </button>
      </div>

      {stage === 'tree' ? (
        <>
          {!bracket.allGroupsComplete && (
            <p className="notice">
              Der Baum füllt sich aus deinen Gruppentipps — erst alle 72 Gruppenspiele tippen ({tippedGroup}/72).
            </p>
          )}
          <BracketTree bracket={bracket} tips={tips} />
        </>
      ) : koStage ? (
        <section className="album">
          <header className="album__head">
            <h2 className="foil">{koStage.title}</h2>
            {!bracket.allGroupsComplete && <span className="badge badge--round">Gruppen zuerst: {tippedGroup}/72</span>}
          </header>
          {koStage.id === 'r32' && <ThirdsStrip bracket={bracket} />}
          {koStage.matches.map((m) => (
            <TipRow key={m.match} match={m} tip={tips[m.match]} slots={bracket.teams[m.match]} />
          ))}
          {koStage.id === 'finals' && bracket.champion && (
            <HoloSticker gold>
              <div className="champbanner">
                <FlagBadge flag={TEAM_BY_ID.get(bracket.champion)!.flag} size="xl" />
                <div>
                  <small>Dein Weltmeister</small>
                  <strong className="foil">{TEAM_BY_ID.get(bracket.champion)!.name}</strong>
                </div>
              </div>
            </HoloSticker>
          )}
        </section>
      ) : (
        <section className="album">
          <header className="album__head">
            <h2 className="foil">Gruppe {stage}</h2>
            <div className="album__teams">
              {GROUP_TEAMS[stage as GroupId].map((t) => (
                <span key={t.id} className="album__sticker">
                  <FlagBadge flag={t.flag} size="lg" />
                  <span>{t.id}</span>
                </span>
              ))}
            </div>
          </header>
          {matchdays.map((md) => (
            <div key={md} className="album__matchday">
              <h3>Spieltag {md}</h3>
              {GROUP_MATCHES[stage as GroupId]
                .filter((m) => m.matchday === md)
                .map((m) => (
                  <TipRow key={m.match} match={m} tip={tips[m.match]} />
                ))}
            </div>
          ))}
          <div className="album__matchday">
            <h3>Tabelle — live aus deinen Tipps ({ROUND_LABEL.group})</h3>
            <GroupTable rows={bracket.tables[stage as GroupId]} />
          </div>
        </section>
      )}
    </>
  )
}
