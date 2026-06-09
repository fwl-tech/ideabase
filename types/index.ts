export interface User {
  id: string
  email: string
  name: string | null
  google_id: string | null
  created_at: string
}

export interface Area {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  idea_count?: number
}

export interface Idea {
  id: string
  area_id: string
  user_id: string
  title: string
  status: string | null
  problem: string | null
  solution: string | null
  commercial_models: string | null
  competitors: string | null
  demand_signals: string | null
  created_at: string
  updated_at: string
}

export interface Link {
  id: string
  idea_id: string
  url: string
  title: string | null
  summary: string | null
  added_at: string
}

export interface Note {
  id: string
  idea_id: string
  body: string
  created_at: string
}

export interface Conversation {
  id: string
  idea_id: string
  contact_name: string | null
  contact_role: string | null
  summary: string
  date: string | null
  created_at: string
}

export interface IdeaWithFeed extends Idea {
  links: Link[]
  notes: Note[]
  conversations: Conversation[]
}

export interface AreaWithIdeas extends Area {
  ideas: Idea[]
}

export type FeedItemType = 'link' | 'note' | 'conversation'

export interface FeedItem {
  type: FeedItemType
  id: string
  created_at: string
  data: Link | Note | Conversation
}

export interface SearchResult {
  idea_id: string
  idea_title: string
  area_id: string
  area_name: string
  matches: { type: string; excerpt: string }[]
}
