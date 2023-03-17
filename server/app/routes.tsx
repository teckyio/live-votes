import { capitalize } from '@beenotung/tslib/string.js'
import { Router } from 'url-router.ts'
import { config } from '../config.js'
import { Redirect } from './components/router.js'
import type { DynamicContext } from './context'
import { o } from './jsx/jsx.js'
import type { Node } from './jsx/types'
import About, { License } from './pages/about.js'
import UserAgents from './pages/user-agents.js'
import DemoCookieSession from './pages/demo-cookie-session.js'
import Home from './pages/home.js'
import NotMatch from './pages/not-match.js'
import { then } from '@beenotung/tslib/result.js'

let titles: Record<string, string> = {}

export function getTitle(url: string): string {
  let title = titles[url] || capitalize(url.split('/')[1] || 'Home Page')
  return title
}

const StreamingByDefault = true

export type PageRoute = PageRouteOptions & (StaticPageRoute | DynamicPageRoute)

export type PageRouteOptions = {
  // streaming is enabled by default
  // HTTP headers cannot be set when streaming
  // If you need to set cookies or apply redirection, you may use an express middleware before the generic app route
  streaming?: boolean
} & Partial<MenuRoute>

export type StaticPageRoute = {
  title: string
  node: Node
  description: string
  status?: number
}
export type DynamicPageRoute = {
  resolve: (
    context: DynamicContext,
  ) => StaticPageRoute | Promise<StaticPageRoute>
}

export type MenuRoute = {
  url: string
  menuText: string
  menuUrl: string // optional, default to be same as PageRoute.url
}

export type PageRouteMatch = PageRouteOptions & StaticPageRoute

export function title(page: string) {
  return page + ' | ' + config.site_name
}

// jsx node can be used directly, e.g. `Home`
// invoke functional component with square bracket, e.g. `[Editor]`
// or invoke functional component with x-html tag, e.g. `<Editor/>

// TODO direct support alternative urls instead of having to repeat the entry
let routeDict: Record<string, PageRoute> = {
  '/': {
    title: title('Home'),
    description:
      'Getting Started with ts-liveview - a server-side rendering realtime webapp framework with progressive enhancement',
    menuText: 'Home',
    menuUrl: '/',
    node: Home.index,
  },
  '/vote/:id': {
    title: title('submit vote'),
    description: 'API Endpoint to submit your vote',
    node: <Home.SubmitVote />,
  },
  '/poll': {
    title: title('submit poll'),
    description: 'API Endpoint to create a new poll',
    node: <Home.SubmitPoll />,
  },
  '/about/:mode?': {
    title: title('About'),
    description:
      'About ts-liveview - a server-side rendering realtime webapp framework with progressive enhancement',
    menuText: 'About',
    menuUrl: '/about',
    node: About,
    streaming: true,
  },
  '/cookie-session': {
    title: title('Cookie-based Session'),
    description: 'Demonstrate accessing cookie with ts-liveview',
    menuText: 'Cookie Session',
    node: <DemoCookieSession.index />,
  },
  '/user-agents': {
    title: 'User Agents of Visitors',
    description: "User agents of this site's visitors",
    menuText: 'User Agents',
    node: UserAgents,
  },
  '/LICENSE': {
    title: 'BSD 2-Clause License of ts-liveview',
    description:
      'ts-liveview is a free open source project licensed under the BSD 2-Clause License',
    node: License,
  },
}

export let redirectDict: Record<string, string> = {
  '/server/app/pages/home.tsx': '/',
  '/server/app/app.tsx': '/about/markdown',
}

export const pageRouter = new Router<PageRoute>()

export const menuRoutes: MenuRoute[] = []

Object.entries(routeDict).forEach(([url, route]) => {
  pageRouter.add(url, { url, ...route })
  if (route.menuText) {
    menuRoutes.push({
      url,
      menuText: route.menuText,
      menuUrl: route.menuUrl || url,
    })
  }
})

Object.entries(redirectDict).forEach(([url, href]) =>
  pageRouter.add(url, {
    url,
    title: title('Redirection Page'),
    description: 'Redirect to ' + url,
    node: <Redirect href={href} />,
    status: 302,
  }),
)

export function matchRoute(
  context: DynamicContext,
): PageRouteMatch | Promise<PageRouteMatch> {
  let match = pageRouter.route(context.url)
  let route: PageRoute = match
    ? match.value
    : {
        title: title('Page Not Found'),
        description: 'This page is not found. Probably due to outdated menu.',
        node: NotMatch,
        status: 404,
      }
  if (route.streaming === undefined) {
    route.streaming = StreamingByDefault
  }
  context.routerMatch = match
  if ('resolve' in route) {
    return then(route.resolve(context), res => Object.assign(route, res))
  }
  return route
}

export function getContextSearchParams(context: DynamicContext) {
  return new URLSearchParams(
    context.routerMatch?.search || context.url.split('?').pop(),
  )
}

if (config.setup_robots_txt) {
  setTimeout(() => {
    console.log(Object.keys(routeDict).join('\n'))
  }, 1000)
}
