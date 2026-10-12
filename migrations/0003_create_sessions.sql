-- Migration number: 0003 	 2026-10-08T12:43:08.775Z
-- =========================================================
-- USER SESSIONS
-- =========================================================

CREATE TABLE sessions (
    id          INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  INTEGER NOT NULL,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TEXT,
    revoked_at  TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) STRICT;


CREATE INDEX idx_sessions_user
    ON sessions(user_id);


CREATE INDEX idx_sessions_expires
    ON sessions(expires_at);