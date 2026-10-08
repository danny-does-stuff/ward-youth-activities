CREATE TABLE youths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE UNIQUE INDEX youths_name_lower ON youths (lower(name));

CREATE TABLE event_youth (
  event_id INTEGER NOT NULL,
  youth_id INTEGER NOT NULL,
  PRIMARY KEY (event_id, youth_id)
);

INSERT INTO youths (name)
SELECT DISTINCT trim(participant_name)
FROM events
WHERE trim(participant_name) != '';

INSERT INTO event_youth (event_id, youth_id)
SELECT e.id, y.id
FROM events e
JOIN youths y ON lower(y.name) = lower(trim(e.participant_name));

CREATE TABLE events_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  location_name TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

INSERT INTO events_new (
  id,
  title,
  starts_at,
  ends_at,
  location_name,
  address,
  contact_name,
  contact_email,
  contact_phone,
  notes,
  approved,
  created_at
)
SELECT
  id,
  title,
  starts_at,
  ends_at,
  location_name,
  address,
  contact_name,
  contact_email,
  contact_phone,
  notes,
  approved,
  created_at
FROM events;

DROP TABLE events;
ALTER TABLE events_new RENAME TO events;

CREATE TABLE event_youth_new (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  youth_id INTEGER NOT NULL REFERENCES youths(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, youth_id)
);

INSERT INTO event_youth_new (event_id, youth_id)
SELECT event_id, youth_id FROM event_youth;

DROP TABLE event_youth;
ALTER TABLE event_youth_new RENAME TO event_youth;
