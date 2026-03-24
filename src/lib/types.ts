export interface V2EXReport {
  meta: {
    postId: string
    title: string
    author: string
    url: string
    viewCount: number
    favoriteCount: number
    replyCount: number
    lastFetched: string
    totalPages: number
  }
  comments: Comment[]
  analysis: Analysis
}

export interface Comment {
  id: number // floor number
  author: string
  content: string
  replyTo: string | null
  likes: number
  isOP: boolean
  topics: string[]
  sentiment: "positive" | "neutral" | "negative"
}

export interface Analysis {
  topUsers: UserStat[]
  topicDistribution: TopicStat[]
  sentimentBreakdown: { positive: number; neutral: number; negative: number }
  hotComments: Comment[]
  opStats: { replyCount: number; responseRate: number; avgResponseTime: string }
}

export interface UserStat {
  name: string
  count: number
  isOP: boolean
}

export interface TopicStat {
  name: string
  count: number
  icon: string
  color: string
}

export interface FAQCard {
  id: string
  question: string
  opAnswer: string
  aiSummary: string
  relatedCommentIds: number[]
  frequency: number
}
