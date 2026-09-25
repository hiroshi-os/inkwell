package store

import (
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"inkwell/api/internal/auth"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrConflict     = errors.New("conflict")
	ErrForbidden    = errors.New("forbidden")
	ErrUnauthorized = errors.New("unauthorized")
	ErrInvalid      = errors.New("invalid")
)

type Store struct {
	DB     *sql.DB
	Driver string // "sqlite" or "postgres"
}

func New(db *sql.DB, driver string) *Store {
	return &Store{DB: db, Driver: driver}
}

func (s *Store) q(query string) string {
	if s.Driver != "postgres" {
		return query
	}
	n := 0
	var b strings.Builder
	for i := 0; i < len(query); i++ {
		if query[i] == '?' {
			n++
			b.WriteByte('$')
			b.WriteString(strconv.Itoa(n))
		} else {
			b.WriteByte(query[i])
		}
	}
	return b.String()
}

func now() string { return time.Now().UTC().Format(time.RFC3339) }

func newID() string { return uuid.NewString() }

func (s *Store) Migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			display_name TEXT NOT NULL,
			bio TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS stories (
			id TEXT PRIMARY KEY,
			author_id TEXT NOT NULL,
			title TEXT NOT NULL,
			synopsis TEXT NOT NULL DEFAULT '',
			genre TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'published',
			cover_hue INTEGER NOT NULL DEFAULT 160,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS chapters (
			id TEXT PRIMARY KEY,
			story_id TEXT NOT NULL,
			title TEXT NOT NULL,
			body TEXT NOT NULL DEFAULT '',
			position INTEGER NOT NULL,
			published INTEGER NOT NULL DEFAULT 1,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS follows (
			follower_id TEXT NOT NULL,
			followee_id TEXT NOT NULL,
			created_at TEXT NOT NULL,
			PRIMARY KEY (follower_id, followee_id),
			FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS library (
			user_id TEXT NOT NULL,
			story_id TEXT NOT NULL,
			created_at TEXT NOT NULL,
			PRIMARY KEY (user_id, story_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_stories_status_updated ON stories(status, updated_at)`,
		`CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id)`,
		`CREATE INDEX IF NOT EXISTS idx_chapters_story ON chapters(story_id, position)`,
		`CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id)`,
	}
	for _, stmt := range stmts {
		if _, err := s.DB.Exec(stmt); err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}
	return nil
}

type User struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	Email       string `json:"email,omitempty"`
	DisplayName string `json:"displayName"`
	Bio         string `json:"bio"`
	CreatedAt   string `json:"createdAt"`
	Followers   int    `json:"followers"`
	Following   int    `json:"following"`
}

type Author struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}

type ChapterMeta struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Position  int    `json:"position"`
	Published bool   `json:"published"`
	UpdatedAt string `json:"updatedAt"`
	WordCount int    `json:"wordCount,omitempty"`
}

type Chapter struct {
	ChapterMeta
	StoryID  string `json:"storyId"`
	Body     string `json:"body"`
	PrevID   string `json:"prevId,omitempty"`
	NextID   string `json:"nextId,omitempty"`
	StoryTitle string `json:"storyTitle,omitempty"`
}

type Story struct {
	ID           string        `json:"id"`
	Title        string        `json:"title"`
	Synopsis     string        `json:"synopsis"`
	Genre        string        `json:"genre"`
	Status       string        `json:"status"`
	CoverHue     int           `json:"coverHue"`
	Author       Author        `json:"author"`
	ChapterCount int           `json:"chapterCount"`
	CreatedAt    string        `json:"createdAt"`
	UpdatedAt    string        `json:"updatedAt"`
	InLibrary    bool          `json:"inLibrary"`
	Following    bool          `json:"followingAuthor"`
	Chapters     []ChapterMeta `json:"chapters,omitempty"`
}

func (s *Store) CreateUser(username, email, password, displayName string) (*User, error) {
	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}
	u := &User{
		ID:          newID(),
		Username:    username,
		Email:       email,
		DisplayName: displayName,
		CreatedAt:   now(),
	}
	_, err = s.DB.Exec(s.q(`INSERT INTO users (id, username, email, password_hash, display_name, bio, created_at)
		VALUES (?, ?, ?, ?, ?, '', ?)`), u.ID, username, email, hash, displayName, u.CreatedAt)
	if err != nil {
		if isUnique(err) {
			return nil, ErrConflict
		}
		return nil, err
	}
	return u, nil
}

func (s *Store) Authenticate(login, password string) (*User, error) {
	var hash string
	u := &User{}
	err := s.DB.QueryRow(s.q(`SELECT id, username, email, password_hash, display_name, bio, created_at
		FROM users WHERE username = ? OR email = ?`), login, login).Scan(
		&u.ID, &u.Username, &u.Email, &hash, &u.DisplayName, &u.Bio, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUnauthorized
	}
	if err != nil {
		return nil, err
	}
	if !auth.CheckPassword(hash, password) {
		return nil, ErrUnauthorized
	}
	s.attachCounts(u)
	return u, nil
}

func (s *Store) GetUser(idOrUsername string) (*User, error) {
	u := &User{}
	err := s.DB.QueryRow(s.q(`SELECT id, username, email, display_name, bio, created_at
		FROM users WHERE id = ? OR username = ?`), idOrUsername, idOrUsername).Scan(
		&u.ID, &u.Username, &u.Email, &u.DisplayName, &u.Bio, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	s.attachCounts(u)
	return u, nil
}

func (s *Store) UpdateProfile(userID, displayName, bio string) (*User, error) {
	_, err := s.DB.Exec(s.q(`UPDATE users SET display_name = ?, bio = ? WHERE id = ?`), displayName, bio, userID)
	if err != nil {
		return nil, err
	}
	return s.GetUser(userID)
}

func (s *Store) attachCounts(u *User) {
	_ = s.DB.QueryRow(s.q(`SELECT COUNT(*) FROM follows WHERE followee_id = ?`), u.ID).Scan(&u.Followers)
	_ = s.DB.QueryRow(s.q(`SELECT COUNT(*) FROM follows WHERE follower_id = ?`), u.ID).Scan(&u.Following)
}

func (s *Store) ListStories(q, genre string, limit, offset int, viewerID string) ([]Story, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	args := []any{}
	where := `s.status = 'published'`
	if q != "" {
		where += ` AND (LOWER(s.title) LIKE ? OR LOWER(s.synopsis) LIKE ? OR LOWER(u.display_name) LIKE ?)`
		like := "%" + strings.ToLower(q) + "%"
		args = append(args, like, like, like)
	}
	if genre != "" {
		where += ` AND LOWER(s.genre) = ?`
		args = append(args, strings.ToLower(genre))
	}
	args = append(args, limit, offset)
	rows, err := s.DB.Query(s.q(`
		SELECT s.id, s.title, s.synopsis, s.genre, s.status, s.cover_hue, s.created_at, s.updated_at,
		       u.id, u.username, u.display_name,
		       (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id AND c.published = 1)
		FROM stories s
		JOIN users u ON u.id = s.author_id
		WHERE `+where+`
		ORDER BY s.updated_at DESC
		LIMIT ? OFFSET ?`), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return s.scanStories(rows, viewerID)
}

func (s *Store) ListStoriesByAuthor(authorID, viewerID string, includeDrafts bool) ([]Story, error) {
	where := `s.author_id = ?`
	args := []any{authorID}
	if !includeDrafts {
		where += ` AND s.status = 'published'`
	}
	rows, err := s.DB.Query(s.q(`
		SELECT s.id, s.title, s.synopsis, s.genre, s.status, s.cover_hue, s.created_at, s.updated_at,
		       u.id, u.username, u.display_name,
		       (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id AND c.published = 1)
		FROM stories s
		JOIN users u ON u.id = s.author_id
		WHERE `+where+`
		ORDER BY s.updated_at DESC`), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return s.scanStories(rows, viewerID)
}

func (s *Store) Feed(viewerID string, limit int) ([]Story, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	rows, err := s.DB.Query(s.q(`
		SELECT s.id, s.title, s.synopsis, s.genre, s.status, s.cover_hue, s.created_at, s.updated_at,
		       u.id, u.username, u.display_name,
		       (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id AND c.published = 1)
		FROM stories s
		JOIN users u ON u.id = s.author_id
		JOIN follows f ON f.followee_id = s.author_id
		WHERE f.follower_id = ? AND s.status = 'published'
		ORDER BY s.updated_at DESC
		LIMIT ?`), viewerID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return s.scanStories(rows, viewerID)
}

func (s *Store) scanStories(rows *sql.Rows, viewerID string) ([]Story, error) {
	out := []Story{}
	for rows.Next() {
		var st Story
		if err := rows.Scan(&st.ID, &st.Title, &st.Synopsis, &st.Genre, &st.Status, &st.CoverHue,
			&st.CreatedAt, &st.UpdatedAt, &st.Author.ID, &st.Author.Username, &st.Author.DisplayName, &st.ChapterCount); err != nil {
			return nil, err
		}
		if viewerID != "" {
			st.InLibrary = s.InLibrary(viewerID, st.ID)
			st.Following = s.IsFollowing(viewerID, st.Author.ID)
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

func (s *Store) GetStory(id, viewerID string) (*Story, error) {
	st := &Story{}
	err := s.DB.QueryRow(s.q(`
		SELECT s.id, s.title, s.synopsis, s.genre, s.status, s.cover_hue, s.created_at, s.updated_at,
		       u.id, u.username, u.display_name,
		       (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id AND c.published = 1)
		FROM stories s
		JOIN users u ON u.id = s.author_id
		WHERE s.id = ?`), id).Scan(&st.ID, &st.Title, &st.Synopsis, &st.Genre, &st.Status, &st.CoverHue,
		&st.CreatedAt, &st.UpdatedAt, &st.Author.ID, &st.Author.Username, &st.Author.DisplayName, &st.ChapterCount)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if st.Status != "published" && viewerID != st.Author.ID {
		return nil, ErrNotFound
	}
	includeDrafts := viewerID == st.Author.ID
	chWhere := `story_id = ?`
	if !includeDrafts {
		chWhere += ` AND published = 1`
	}
	rows, err := s.DB.Query(s.q(`SELECT id, title, position, published, updated_at, body FROM chapters WHERE `+chWhere+` ORDER BY position ASC`), id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	st.Chapters = []ChapterMeta{}
	for rows.Next() {
		var cm ChapterMeta
		var published int
		var body string
		if err := rows.Scan(&cm.ID, &cm.Title, &cm.Position, &published, &cm.UpdatedAt, &body); err != nil {
			return nil, err
		}
		cm.Published = published == 1
		cm.WordCount = wordCount(body)
		st.Chapters = append(st.Chapters, cm)
	}
	if viewerID != "" {
		st.InLibrary = s.InLibrary(viewerID, st.ID)
		st.Following = s.IsFollowing(viewerID, st.Author.ID)
	}
	return st, nil
}

func (s *Store) CreateStory(authorID, title, synopsis, genre, status string, coverHue int) (*Story, error) {
	if title == "" {
		return nil, ErrInvalid
	}
	if status == "" {
		status = "published"
	}
	if coverHue < 0 {
		coverHue = int(time.Now().UnixNano() % 360)
	}
	id := newID()
	ts := now()
	_, err := s.DB.Exec(s.q(`INSERT INTO stories (id, author_id, title, synopsis, genre, status, cover_hue, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`), id, authorID, title, synopsis, genre, status, coverHue, ts, ts)
	if err != nil {
		return nil, err
	}
	return s.GetStory(id, authorID)
}

func (s *Store) UpdateStory(id, authorID, title, synopsis, genre, status string, coverHue *int) (*Story, error) {
	st, err := s.GetStory(id, authorID)
	if err != nil {
		return nil, err
	}
	if st.Author.ID != authorID {
		return nil, ErrForbidden
	}
	if title == "" {
		title = st.Title
	}
	if status == "" {
		status = st.Status
	}
	hue := st.CoverHue
	if coverHue != nil {
		hue = *coverHue
	}
	_, err = s.DB.Exec(s.q(`UPDATE stories SET title=?, synopsis=?, genre=?, status=?, cover_hue=?, updated_at=? WHERE id=?`),
		title, synopsis, genre, status, hue, now(), id)
	if err != nil {
		return nil, err
	}
	return s.GetStory(id, authorID)
}

func (s *Store) DeleteStory(id, authorID string) error {
	st, err := s.GetStory(id, authorID)
	if err != nil {
		return err
	}
	if st.Author.ID != authorID {
		return ErrForbidden
	}
	_, err = s.DB.Exec(s.q(`DELETE FROM stories WHERE id = ?`), id)
	return err
}

func (s *Store) CreateChapter(storyID, authorID, title, body string, published bool) (*Chapter, error) {
	st, err := s.GetStory(storyID, authorID)
	if err != nil {
		return nil, err
	}
	if st.Author.ID != authorID {
		return nil, ErrForbidden
	}
	if title == "" {
		return nil, ErrInvalid
	}
	var pos int
	_ = s.DB.QueryRow(s.q(`SELECT COALESCE(MAX(position), 0) FROM chapters WHERE story_id = ?`), storyID).Scan(&pos)
	pos++
	id := newID()
	ts := now()
	pub := 0
	if published {
		pub = 1
	}
	_, err = s.DB.Exec(s.q(`INSERT INTO chapters (id, story_id, title, body, position, published, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`), id, storyID, title, body, pos, pub, ts, ts)
	if err != nil {
		return nil, err
	}
	_, _ = s.DB.Exec(s.q(`UPDATE stories SET updated_at = ? WHERE id = ?`), ts, storyID)
	return s.GetChapter(storyID, id, authorID)
}

func (s *Store) UpdateChapter(storyID, chapterID, authorID, title, body string, published *bool) (*Chapter, error) {
	st, err := s.GetStory(storyID, authorID)
	if err != nil {
		return nil, err
	}
	if st.Author.ID != authorID {
		return nil, ErrForbidden
	}
	ch, err := s.GetChapter(storyID, chapterID, authorID)
	if err != nil {
		return nil, err
	}
	if title == "" {
		title = ch.Title
	}
	if body == "" && ch.Body != "" && body != ch.Body {
		body = ch.Body
	}
	// allow empty body if explicitly sent — callers pass the fields they want
	pub := 0
	if ch.Published {
		pub = 1
	}
	if published != nil {
		if *published {
			pub = 1
		} else {
			pub = 0
		}
	}
	ts := now()
	_, err = s.DB.Exec(s.q(`UPDATE chapters SET title=?, body=?, published=?, updated_at=? WHERE id=? AND story_id=?`),
		title, body, pub, ts, chapterID, storyID)
	if err != nil {
		return nil, err
	}
	_, _ = s.DB.Exec(s.q(`UPDATE stories SET updated_at = ? WHERE id = ?`), ts, storyID)
	return s.GetChapter(storyID, chapterID, authorID)
}

func (s *Store) DeleteChapter(storyID, chapterID, authorID string) error {
	st, err := s.GetStory(storyID, authorID)
	if err != nil {
		return err
	}
	if st.Author.ID != authorID {
		return ErrForbidden
	}
	res, err := s.DB.Exec(s.q(`DELETE FROM chapters WHERE id = ? AND story_id = ?`), chapterID, storyID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetChapter(storyID, chapterID, viewerID string) (*Chapter, error) {
	ch := &Chapter{}
	var published int
	var authorID string
	err := s.DB.QueryRow(s.q(`
		SELECT c.id, c.story_id, c.title, c.body, c.position, c.published, c.updated_at, s.title, s.author_id
		FROM chapters c JOIN stories s ON s.id = c.story_id
		WHERE c.id = ? AND c.story_id = ?`), chapterID, storyID).Scan(
		&ch.ID, &ch.StoryID, &ch.Title, &ch.Body, &ch.Position, &published, &ch.UpdatedAt, &ch.StoryTitle, &authorID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	ch.Published = published == 1
	ch.WordCount = wordCount(ch.Body)
	if !ch.Published && viewerID != authorID {
		return nil, ErrNotFound
	}
	var prev, next sql.NullString
	_ = s.DB.QueryRow(s.q(`SELECT id FROM chapters WHERE story_id = ? AND position < ? AND published = 1 ORDER BY position DESC LIMIT 1`),
		storyID, ch.Position).Scan(&prev)
	_ = s.DB.QueryRow(s.q(`SELECT id FROM chapters WHERE story_id = ? AND position > ? AND published = 1 ORDER BY position ASC LIMIT 1`),
		storyID, ch.Position).Scan(&next)
	if prev.Valid {
		ch.PrevID = prev.String
	}
	if next.Valid {
		ch.NextID = next.String
	}
	return ch, nil
}

func (s *Store) Follow(followerID, followeeID string) error {
	if followerID == followeeID {
		return ErrInvalid
	}
	if _, err := s.GetUser(followeeID); err != nil {
		return err
	}
	_, err := s.DB.Exec(s.q(`INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)`),
		followerID, followeeID, now())
	if err != nil && isUnique(err) {
		return nil
	}
	return err
}

func (s *Store) Unfollow(followerID, followeeID string) error {
	_, err := s.DB.Exec(s.q(`DELETE FROM follows WHERE follower_id = ? AND followee_id = ?`), followerID, followeeID)
	return err
}

func (s *Store) IsFollowing(followerID, followeeID string) bool {
	var n int
	_ = s.DB.QueryRow(s.q(`SELECT COUNT(*) FROM follows WHERE follower_id = ? AND followee_id = ?`), followerID, followeeID).Scan(&n)
	return n > 0
}

func (s *Store) AddLibrary(userID, storyID string) error {
	if _, err := s.GetStory(storyID, userID); err != nil {
		return err
	}
	_, err := s.DB.Exec(s.q(`INSERT INTO library (user_id, story_id, created_at) VALUES (?, ?, ?)`), userID, storyID, now())
	if err != nil && isUnique(err) {
		return nil
	}
	return err
}

func (s *Store) RemoveLibrary(userID, storyID string) error {
	_, err := s.DB.Exec(s.q(`DELETE FROM library WHERE user_id = ? AND story_id = ?`), userID, storyID)
	return err
}

func (s *Store) InLibrary(userID, storyID string) bool {
	var n int
	_ = s.DB.QueryRow(s.q(`SELECT COUNT(*) FROM library WHERE user_id = ? AND story_id = ?`), userID, storyID).Scan(&n)
	return n > 0
}

func (s *Store) ListLibrary(userID string) ([]Story, error) {
	rows, err := s.DB.Query(s.q(`
		SELECT s.id, s.title, s.synopsis, s.genre, s.status, s.cover_hue, s.created_at, s.updated_at,
		       u.id, u.username, u.display_name,
		       (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id AND c.published = 1)
		FROM library l
		JOIN stories s ON s.id = l.story_id
		JOIN users u ON u.id = s.author_id
		WHERE l.user_id = ?
		ORDER BY l.created_at DESC`), userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return s.scanStories(rows, userID)
}

func isUnique(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "unique") || strings.Contains(msg, "duplicate") || strings.Contains(msg, "constraint")
}

func wordCount(s string) int {
	n := 0
	for _, f := range strings.Fields(s) {
		if f != "" {
			n++
		}
	}
	return n
}
