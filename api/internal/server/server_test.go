package server_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	_ "modernc.org/sqlite"

	"inkwell/api/internal/server"
	"inkwell/api/internal/store"
)

func testHandler(t *testing.T) http.Handler {
	t.Helper()
	dsn := "file:" + t.Name() + "?mode=memory&cache=shared&_pragma=foreign_keys(1)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	st := store.New(db, "sqlite")
	if err := st.Migrate(); err != nil {
		t.Fatal(err)
	}
	return server.New(st, "test-secret")
}

func do(t *testing.T, h http.Handler, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var rdr io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		rdr = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rdr)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	return w
}

func decode(t *testing.T, w *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatalf("json: %v body=%s", err, w.Body.String())
	}
	return out
}

func TestHealth(t *testing.T) {
	h := testHandler(t)
	w := do(t, h, "GET", "/health", "", nil)
	if w.Code != 200 {
		t.Fatalf("code %d", w.Code)
	}
}

func TestRegisterLoginAndStoryCRUD(t *testing.T) {
	h := testHandler(t)

	w := do(t, h, "POST", "/api/auth/register", "", map[string]string{
		"username": "mira", "email": "mira@example.com", "password": "password123", "displayName": "Mira Chen",
	})
	if w.Code != 201 {
		t.Fatalf("register %d %s", w.Code, w.Body.String())
	}
	auth := decode(t, w)
	token := auth["token"].(string)

	w = do(t, h, "POST", "/api/auth/login", "", map[string]string{"username": "mira", "password": "password123"})
	if w.Code != 200 {
		t.Fatalf("login %d", w.Code)
	}

	w = do(t, h, "POST", "/api/stories", token, map[string]string{
		"title": "Fog Market", "synopsis": "A stall that sells weather.", "genre": "Fantasy",
	})
	if w.Code != 201 {
		t.Fatalf("create story %d %s", w.Code, w.Body.String())
	}
	story := decode(t, w)
	id := story["id"].(string)

	w = do(t, h, "POST", "/api/stories/"+id+"/chapters", token, map[string]any{
		"title": "Stall One", "body": "The fog was priced by the hour.", "published": true,
	})
	if w.Code != 201 {
		t.Fatalf("chapter %d %s", w.Code, w.Body.String())
	}
	ch := decode(t, w)
	chID := ch["id"].(string)

	w = do(t, h, "GET", "/api/stories", "", nil)
	if w.Code != 200 {
		t.Fatalf("list %d", w.Code)
	}
	listed := decode(t, w)
	stories := listed["stories"].([]any)
	if len(stories) != 1 {
		t.Fatalf("want 1 story, got %d", len(stories))
	}

	w = do(t, h, "GET", "/api/stories/"+id+"/chapters/"+chID, "", nil)
	if w.Code != 200 {
		t.Fatalf("read chapter %d", w.Code)
	}

	// another user cannot edit
	w = do(t, h, "POST", "/api/auth/register", "", map[string]string{
		"username": "joan", "email": "joan@example.com", "password": "password123",
	})
	other := decode(t, w)["token"].(string)
	w = do(t, h, "PUT", "/api/stories/"+id, other, map[string]string{"title": "Stolen"})
	if w.Code != 403 {
		t.Fatalf("want 403, got %d %s", w.Code, w.Body.String())
	}
}

func TestFollowAndLibrary(t *testing.T) {
	h := testHandler(t)
	w := do(t, h, "POST", "/api/auth/register", "", map[string]string{
		"username": "author", "email": "a@example.com", "password": "password123",
	})
	authorTok := decode(t, w)["token"].(string)
	author := decode(t, w)["user"].(map[string]any)
	authorID := author["id"].(string)

	w = do(t, h, "POST", "/api/stories", authorTok, map[string]string{"title": "Kept", "synopsis": "x", "genre": "Mystery"})
	storyID := decode(t, w)["id"].(string)
	do(t, h, "POST", "/api/stories/"+storyID+"/chapters", authorTok, map[string]any{"title": "One", "body": "hi", "published": true})

	w = do(t, h, "POST", "/api/auth/register", "", map[string]string{
		"username": "fan", "email": "f@example.com", "password": "password123",
	})
	fanTok := decode(t, w)["token"].(string)

	w = do(t, h, "POST", "/api/users/"+authorID+"/follow", fanTok, nil)
	if w.Code != 200 {
		t.Fatalf("follow %d %s", w.Code, w.Body.String())
	}
	w = do(t, h, "GET", "/api/feed", fanTok, nil)
	if w.Code != 200 {
		t.Fatalf("feed %d", w.Code)
	}
	if len(decode(t, w)["stories"].([]any)) != 1 {
		t.Fatalf("feed empty")
	}

	w = do(t, h, "POST", "/api/stories/"+storyID+"/library", fanTok, nil)
	if w.Code != 200 {
		t.Fatalf("library add %d", w.Code)
	}
	w = do(t, h, "GET", "/api/me/library", fanTok, nil)
	if len(decode(t, w)["stories"].([]any)) != 1 {
		t.Fatalf("library empty")
	}

	w = do(t, h, "GET", "/api/stories?q=Kept", "", nil)
	if len(decode(t, w)["stories"].([]any)) != 1 {
		t.Fatalf("search missed")
	}
}

func TestDuplicateRegister(t *testing.T) {
	h := testHandler(t)
	body := map[string]string{"username": "same", "email": "s@example.com", "password": "password123"}
	if do(t, h, "POST", "/api/auth/register", "", body).Code != 201 {
		t.Fatal("first register")
	}
	w := do(t, h, "POST", "/api/auth/register", "", body)
	if w.Code != 409 {
		t.Fatalf("want 409 got %d", w.Code)
	}
}
