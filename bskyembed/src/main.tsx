import './index.css'

import {AppBskyFeedDefs, BskyAgent} from '@atproto/api'
import {h, render} from 'preact'

import logo from '../assets/logo.svg'
import {Container} from './container'
import {Link} from './link'
import {Post} from './post'
import {getRkey} from './utils'

const root = document.getElementById('app')
if (!root) throw new Error('No root element')

const searchParams = new URLSearchParams(window.location.search)

const agent = new BskyAgent({
  service: searchParams.get('service') || 'https://public.api.bsky.app',
})

const uri = searchParams.get('uri')

if (!uri) {
  throw new Error('No uri in query string')
}

agent
  .getPostThread({
    uri,
    depth: 0,
    parentHeight: 0,
  })
  .then(({data}) => {
    if (!AppBskyFeedDefs.isThreadViewPost(data.thread)) {
      throw new Error('Expected a ThreadViewPost')
    }
    const pwiOptOut = !!data.thread.post.author.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
    if (pwiOptOut) {
      render(<PwiOptOut thread={data.thread} />, root)
    } else {
      render(<Post thread={data.thread} />, root)
    }
  })
  .catch(err => {
    console.error(err)
    render(<ErrorMessage />, root)
  })

function PwiOptOut({thread}: {thread: AppBskyFeedDefs.ThreadViewPost}) {
  const href = `/profile/${thread.post.author.did}/post/${getRkey(thread.post)}`
  return (
    <Container href={href}>
      <Link
        href="https://bsky.social/about"
        className="transition-transform hover:scale-110 absolute top-4 right-4">
        <img src={logo as string} className="h-6" />
      </Link>
      <div className="w-full py-12 gap-4 flex flex-col items-center">
        <p className="max-w-80 text-center w-full text-textLight">
          This user has opted out of their posts being displayed on third-party
          websites
        </p>
        <Link
          href={href}
          className="max-w-80 rounded-lg bg-brand text-white color-white text-center py-1 px-4 w-full mx-auto">
          View on Bluesky
        </Link>
      </div>
    </Container>
  )
}

function ErrorMessage() {
  return (
    <Container href="https://bsky.social/about">
      <Link
        href="https://bsky.social/about"
        className="transition-transform hover:scale-110 absolute top-4 right-4">
        <img src={logo as string} className="h-6" />
      </Link>
      <p className="my-16 text-center w-full text-textLight">
        Post not found, it may have been deleted
      </p>
    </Container>
  )
}
