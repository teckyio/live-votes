import { o } from '../jsx/jsx.js'
import SourceCode from '../components/source-code.js'
import Style from '../components/style.js'
import { Context, getContextFormBody } from '../context.js'
import { array, id, object, string } from 'cast.ts'
import { sessions } from '../session.js'
import { VElement } from '../../../client/jsx/types'
import { ServerMessage } from '../../../client/types'
import { EarlyTerminate } from '../helpers.js'
import { Poll, proxy } from '../../../db/proxy.js'
import { db } from '../../../db/db.js'
import { filter, find } from 'better-sqlite3-proxy'
import { Link } from '../components/router.js'

let select_max_votes = db
  .prepare(
    /* sql */ `
select max(votes)
from vote_option
where poll_id = :poll_id
`,
  )
  .pluck()

let Home = (
  <div id="home">
    {Style(/* css */ `
.vote-options {
  width: fit-content;
}
.vote-option {
  border: 1px solid black;
  padding: 0.5rem;
  display: block;
  user-select: none;
}
.vote-option input {
  margin-inline-end: 0.5rem;
}
#home input[type=submit] {
  margin: 0.5rem;
  padding: 0.5rem;
}
.votes-bar {
  margin-top: 0.25rem;
  background-color: pink;
}
.votes-bar-inner {
  height: 0.5rem;
  background-color: red;
}
`)}
    <PollList />

    <form action="/poll" method="post" onsubmit="emitForm(event)">
      <h2>Create new poll</h2>
      <label>
        Title <input type="text" name="question" />
      </label>
      <br />
      <label>
        Options
        <br />
        <textarea name="options"></textarea>
      </label>
      <br />
      <input type="submit" value="Create" />
    </form>

    <SourceCode page="home.tsx" />
  </div>
)

function PollList(): VElement {
  return ['.polls', {}, proxy.poll.map(poll => <PollDetail poll={poll} />)]
}

function PollDetail(attrs: { poll: Poll }): VElement {
  let { poll } = attrs
  return [
    'form.poll#poll-' + poll.id,
    { action: '/vote/' + poll.id, method: 'post', onsubmit: 'emitForm(event)' },
    [
      <h2>Poll #{poll.id}</h2>,
      <p>{poll.question}</p>,
      VoteOptions(poll),
      <input type="submit" value="Submit" />,
    ],
  ]
}

function VoteOptions(poll: Poll): VElement {
  let maxVotes: number = select_max_votes.get({ poll_id: poll.id })
  return [
    'div.vote-options',
    {},
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    filter(proxy.vote_option, { poll_id: poll.id! }).map(({ title, votes }) => (
      <label htmlFor={title} class="vote-option">
        <input type="checkbox" name="vote" value={title} id={title} />
        {title} ({votes})
        <br />
        <div class="votes-bar">
          <div
            class="votes-bar-inner"
            style={'width:' + (votes / maxVotes) * 100 + '%'}
          ></div>
        </div>
      </label>
    )),
  ]
}

// And it can be pre-rendered into html as well

let submitVoteParser = object({
  body: object({
    vote: array(string(), { maybeSingle: true }),
  }),
  context: object({
    routerMatch: object({
      params: object({
        id: id(),
      }),
    }),
  }),
})

function SubmitVote(_attrs: {}, context: Context) {
  // console.log('context:', context)
  let body = getContextFormBody(context)
  // console.log('input:', input)
  let {
    body: { vote },
    context: {
      routerMatch: {
        params: { id: poll_id },
      },
    },
  } = submitVoteParser.parse({ body, context })

  let poll = proxy.poll[poll_id]
  vote.forEach(title => {
    let option = find(proxy.vote_option, { title })
    if (option) {
      option.votes++
    }
  })
  let options = VoteOptions(poll)
  let message: ServerMessage = [
    'update-in',
    '#poll-' + poll_id + ' ' + options[0],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [options[2]!],
  ]
  sessions.forEach(session => {
    session.ws.send(message)
  })
  throw EarlyTerminate
}

let submitPollParser = object({
  question: string({ trim: true, minLength: 1 }),
  options: string({ trim: true, minLength: 1 }),
})

function SubmitPoll(_attrs: {}, context: Context) {
  let body = getContextFormBody(context)
  let input = submitPollParser.parse(body)

  let poll_id = proxy.poll.push({ question: input.question })

  input.options.split('\n').forEach(line =>
    line.split(',').forEach(option => {
      option = option.trim()
      if (!option) return
      proxy.vote_option.push({ poll_id, title: option, votes: 0 })
    }),
  )

  return (
    <div>
      <p>Created poll #{poll_id}</p>
      <p>
        Back to <Link href="/">Home</Link>
      </p>
    </div>
  )
}

export default { index: Home, SubmitVote, SubmitPoll }
