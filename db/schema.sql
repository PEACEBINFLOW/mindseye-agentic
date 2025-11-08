-- db/schema.sql
create extension if not exists timescaledb;
create extension if not exists pg_trgm;

create table if not exists events (
  id bigserial primary key,
  timestamp timestamptz not null default now(),
  type text not null,
  source text not null,
  value double precision,
  tags text[] default '{}',
  text text
);

select create_hypertable('events', by_range('timestamp'), if_not_exists => true);

create index if not exists idx_events_ts_desc on events (timestamp desc);
create index if not exists idx_events_type on events (type);
create index if not exists idx_events_source on events (source);
create index if not exists idx_events_tags on events using gin (tags);
create index if not exists idx_events_text_trgm on events using gin (text gin_trgm_ops);
