import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type Method = {
  id?: number | null
  method: string
}

export type Url = {
  id?: number | null
  url: string
}

export type UserAgent = {
  id?: number | null
  user_agent: string
}

export type RequestLog = {
  id?: number | null
  method_id: number
  method?: Method
  url_id: number
  url?: Url
  user_agent_id: number | null
  user_agent?: UserAgent
  timestamp: number
}

export type Poll = {
  id?: number | null
  question: string
}

export type VoteOption = {
  id?: number | null
  title: string
  votes: number
  poll_id: number
  poll?: Poll
}

export type DBProxy = {
  method: Method[]
  url: Url[]
  user_agent: UserAgent[]
  request_log: RequestLog[]
  poll: Poll[]
  vote_option: VoteOption[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    method: [],
    url: [],
    user_agent: [],
    request_log: [
      /* foreign references */
      ['method', { field: 'method_id', table: 'method' }],
      ['url', { field: 'url_id', table: 'url' }],
      ['user_agent', { field: 'user_agent_id', table: 'user_agent' }],
    ],
    poll: [],
    vote_option: [
      /* foreign references */
      ['poll', { field: 'poll_id', table: 'poll' }],
    ],
  },
})
