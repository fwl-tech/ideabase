-- Ideabase schema
CREATE SCHEMA IF NOT EXISTS ideabase;

CREATE TABLE IF NOT EXISTS ideabase.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ideabase.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ideabase.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ideabase.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES ideabase.areas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ideabase.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT,
  problem TEXT,
  solution TEXT,
  commercial_models TEXT,
  competitors TEXT,
  demand_signals TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ideabase.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideabase.ideas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ideabase.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideabase.ideas(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ideabase.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideabase.ideas(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_role TEXT,
  summary TEXT NOT NULL,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search vectors
ALTER TABLE ideabase.ideas
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(problem,'') || ' ' ||
      coalesce(solution,'') || ' ' ||
      coalesce(commercial_models,'') || ' ' ||
      coalesce(competitors,'') || ' ' ||
      coalesce(demand_signals,'')
    )
  ) STORED;

ALTER TABLE ideabase.notes
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(body,''))) STORED;

ALTER TABLE ideabase.conversations
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(summary,''))) STORED;

ALTER TABLE ideabase.links
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS ideas_search_idx ON ideabase.ideas USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS notes_search_idx ON ideabase.notes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS conversations_search_idx ON ideabase.conversations USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS links_search_idx ON ideabase.links USING GIN(search_vector);

-- Unified search function
CREATE OR REPLACE FUNCTION ideabase.search_all(query TEXT, p_user_id UUID)
RETURNS TABLE (
  idea_id UUID,
  idea_title TEXT,
  area_id UUID,
  area_name TEXT,
  match_type TEXT,
  excerpt TEXT
) AS $$
BEGIN
  RETURN QUERY
    -- Ideas
    SELECT i.id, i.title, a.id, a.name, 'idea'::TEXT,
      ts_headline('english', i.title || ' ' || coalesce(i.problem,''), plainto_tsquery('english', query))
    FROM ideabase.ideas i
    JOIN ideabase.areas a ON a.id = i.area_id
    WHERE i.user_id = p_user_id AND i.search_vector @@ plainto_tsquery('english', query)
    UNION ALL
    -- Notes
    SELECT i.id, i.title, a.id, a.name, 'note'::TEXT,
      ts_headline('english', n.body, plainto_tsquery('english', query))
    FROM ideabase.notes n
    JOIN ideabase.ideas i ON i.id = n.idea_id
    JOIN ideabase.areas a ON a.id = i.area_id
    WHERE i.user_id = p_user_id AND n.search_vector @@ plainto_tsquery('english', query)
    UNION ALL
    -- Conversations
    SELECT i.id, i.title, a.id, a.name, 'conversation'::TEXT,
      ts_headline('english', c.summary, plainto_tsquery('english', query))
    FROM ideabase.conversations c
    JOIN ideabase.ideas i ON i.id = c.idea_id
    JOIN ideabase.areas a ON a.id = i.area_id
    WHERE i.user_id = p_user_id AND c.search_vector @@ plainto_tsquery('english', query)
    UNION ALL
    -- Links
    SELECT i.id, i.title, a.id, a.name, 'link'::TEXT,
      ts_headline('english', coalesce(l.title,'') || ' ' || coalesce(l.summary,''), plainto_tsquery('english', query))
    FROM ideabase.links l
    JOIN ideabase.ideas i ON i.id = l.idea_id
    JOIN ideabase.areas a ON a.id = i.area_id
    WHERE i.user_id = p_user_id AND l.search_vector @@ plainto_tsquery('english', query);
END;
$$ LANGUAGE plpgsql;

-- Updated at trigger
CREATE OR REPLACE FUNCTION ideabase.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON ideabase.ideas
  FOR EACH ROW EXECUTE FUNCTION ideabase.update_updated_at();
