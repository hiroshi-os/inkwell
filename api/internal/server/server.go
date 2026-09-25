package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"inkwell/api/internal/auth"
	"inkwell/api/internal/store"
)

type Server struct {
	Store     *store.Store
	JWTSecret string
}

type ctxKey int

const userIDKey ctxKey = 1

func New(st *store.Store, jwtSecret string) http.Handler {
	s := &Server{Store: st, JWTSecret: jwtSecret}
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders: []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "inkwell-api"})
	})

	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/register", s.register)
		r.Post("/auth/login", s.login)

		r.Group(func(r chi.Router) {
			r.Use(s.optionalAuth)
			r.Get("/stories", s.listStories)
			r.Get("/stories/{id}", s.getStory)
			r.Get("/stories/{id}/chapters/{chapterId}", s.getChapter)
			r.Get("/users/{id}", s.getUser)
			r.Get("/users/{id}/stories", s.listAuthorStories)
		})

		r.Group(func(r chi.Router) {
			r.Use(s.requireAuth)
			r.Get("/me", s.me)
			r.Patch("/me", s.patchMe)
			r.Get("/me/library", s.myLibrary)
			r.Get("/feed", s.feed)
			r.Post("/stories", s.createStory)
			r.Put("/stories/{id}", s.updateStory)
			r.Delete("/stories/{id}", s.deleteStory)
			r.Post("/stories/{id}/chapters", s.createChapter)
			r.Put("/stories/{id}/chapters/{chapterId}", s.updateChapter)
			r.Delete("/stories/{id}/chapters/{chapterId}", s.deleteChapter)
			r.Post("/stories/{id}/library", s.addLibrary)
			r.Delete("/stories/{id}/library", s.removeLibrary)
			r.Post("/users/{id}/follow", s.follow)
			r.Delete("/users/{id}/follow", s.unfollow)
		})
	})
	return r
}

func (s *Server) optionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if uid, ok := s.userFromRequest(r); ok {
			r = r.WithContext(context.WithValue(r.Context(), userIDKey, uid))
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uid, ok := s.userFromRequest(r)
		if !ok {
			writeError(w, http.StatusUnauthorized, "login required")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userIDKey, uid)))
	})
}

func (s *Server) userFromRequest(r *http.Request) (string, bool) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return "", false
	}
	uid, _, err := auth.ParseToken(s.JWTSecret, strings.TrimPrefix(h, "Bearer "))
	if err != nil {
		return "", false
	}
	return uid, true
}

func viewerID(r *http.Request) string {
	v, _ := r.Context().Value(userIDKey).(string)
	return v
}

type authBody struct {
	Username    string `json:"username"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var body authBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	body.Username = strings.TrimSpace(strings.ToLower(body.Username))
	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	body.DisplayName = strings.TrimSpace(body.DisplayName)
	if body.DisplayName == "" {
		body.DisplayName = body.Username
	}
	if !validUsername(body.Username) || !strings.Contains(body.Email, "@") || len(body.Password) < 8 {
		writeError(w, http.StatusBadRequest, "username 3-24 [a-z0-9_], valid email, password 8+")
		return
	}
	u, err := s.Store.CreateUser(body.Username, body.Email, body.Password, body.DisplayName)
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "username or email already taken")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.writeAuth(w, http.StatusCreated, u)
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var body authBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	login := strings.TrimSpace(body.Username)
	if login == "" {
		login = strings.TrimSpace(body.Email)
	}
	u, err := s.Store.Authenticate(login, body.Password)
	if errors.Is(err, store.ErrUnauthorized) {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.writeAuth(w, http.StatusOK, u)
}

func (s *Server) writeAuth(w http.ResponseWriter, status int, u *store.User) {
	token, err := auth.IssueToken(s.JWTSecret, u.ID, u.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}
	u.Email = "" // never echo email on public-ish payloads except /me
	writeJSON(w, status, map[string]any{"token": token, "user": u})
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	u, err := s.Store.GetUser(viewerID(r))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (s *Server) patchMe(w http.ResponseWriter, r *http.Request) {
	var body struct {
		DisplayName string `json:"displayName"`
		Bio         string `json:"bio"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	u, err := s.Store.UpdateProfile(viewerID(r), strings.TrimSpace(body.DisplayName), strings.TrimSpace(body.Bio))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (s *Server) listStories(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	genre := strings.TrimSpace(r.URL.Query().Get("genre"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	list, err := s.Store.ListStories(q, genre, limit, offset, viewerID(r))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"stories": list})
}

func (s *Server) getStory(w http.ResponseWriter, r *http.Request) {
	st, err := s.Store.GetStory(chi.URLParam(r, "id"), viewerID(r))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, st)
}

func (s *Server) getChapter(w http.ResponseWriter, r *http.Request) {
	ch, err := s.Store.GetChapter(chi.URLParam(r, "id"), chi.URLParam(r, "chapterId"), viewerID(r))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, ch)
}

func (s *Server) getUser(w http.ResponseWriter, r *http.Request) {
	u, err := s.Store.GetUser(chi.URLParam(r, "id"))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	u.Email = ""
	following := false
	if vid := viewerID(r); vid != "" {
		following = s.Store.IsFollowing(vid, u.ID)
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": u, "following": following})
}

func (s *Server) listAuthorStories(w http.ResponseWriter, r *http.Request) {
	u, err := s.Store.GetUser(chi.URLParam(r, "id"))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	includeDrafts := viewerID(r) == u.ID
	list, err := s.Store.ListStoriesByAuthor(u.ID, viewerID(r), includeDrafts)
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"stories": list})
}

func (s *Server) feed(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	list, err := s.Store.Feed(viewerID(r), limit)
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"stories": list})
}

func (s *Server) myLibrary(w http.ResponseWriter, r *http.Request) {
	list, err := s.Store.ListLibrary(viewerID(r))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"stories": list})
}

type storyBody struct {
	Title    string `json:"title"`
	Synopsis string `json:"synopsis"`
	Genre    string `json:"genre"`
	Status   string `json:"status"`
	CoverHue *int   `json:"coverHue"`
}

func (s *Server) createStory(w http.ResponseWriter, r *http.Request) {
	var body storyBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	hue := -1
	if body.CoverHue != nil {
		hue = *body.CoverHue
	}
	st, err := s.Store.CreateStory(viewerID(r), strings.TrimSpace(body.Title), strings.TrimSpace(body.Synopsis), strings.TrimSpace(body.Genre), body.Status, hue)
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, st)
}

func (s *Server) updateStory(w http.ResponseWriter, r *http.Request) {
	var body storyBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	st, err := s.Store.UpdateStory(chi.URLParam(r, "id"), viewerID(r), strings.TrimSpace(body.Title), strings.TrimSpace(body.Synopsis), strings.TrimSpace(body.Genre), body.Status, body.CoverHue)
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, st)
}

func (s *Server) deleteStory(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.DeleteStory(chi.URLParam(r, "id"), viewerID(r)); err != nil {
		writeStoreErr(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type chapterBody struct {
	Title     string `json:"title"`
	Body      string `json:"body"`
	Published *bool  `json:"published"`
}

func (s *Server) createChapter(w http.ResponseWriter, r *http.Request) {
	var body chapterBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	pub := true
	if body.Published != nil {
		pub = *body.Published
	}
	ch, err := s.Store.CreateChapter(chi.URLParam(r, "id"), viewerID(r), strings.TrimSpace(body.Title), body.Body, pub)
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, ch)
}

func (s *Server) updateChapter(w http.ResponseWriter, r *http.Request) {
	var body chapterBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	ch, err := s.Store.UpdateChapter(chi.URLParam(r, "id"), chi.URLParam(r, "chapterId"), viewerID(r), strings.TrimSpace(body.Title), body.Body, body.Published)
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, ch)
}

func (s *Server) deleteChapter(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.DeleteChapter(chi.URLParam(r, "id"), chi.URLParam(r, "chapterId"), viewerID(r)); err != nil {
		writeStoreErr(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) addLibrary(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.AddLibrary(viewerID(r), chi.URLParam(r, "id")); err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"inLibrary": true})
}

func (s *Server) removeLibrary(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.RemoveLibrary(viewerID(r), chi.URLParam(r, "id")); err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"inLibrary": false})
}

func (s *Server) follow(w http.ResponseWriter, r *http.Request) {
	target, err := s.Store.GetUser(chi.URLParam(r, "id"))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	if err := s.Store.Follow(viewerID(r), target.ID); err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"following": true})
}

func (s *Server) unfollow(w http.ResponseWriter, r *http.Request) {
	target, err := s.Store.GetUser(chi.URLParam(r, "id"))
	if err != nil {
		writeStoreErr(w, err)
		return
	}
	if err := s.Store.Unfollow(viewerID(r), target.ID); err != nil {
		writeStoreErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"following": false})
}

func writeStoreErr(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		writeError(w, http.StatusNotFound, "not found")
	case errors.Is(err, store.ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden")
	case errors.Is(err, store.ErrConflict):
		writeError(w, http.StatusConflict, "conflict")
	case errors.Is(err, store.ErrInvalid):
		writeError(w, http.StatusBadRequest, "invalid request")
	case errors.Is(err, store.ErrUnauthorized):
		writeError(w, http.StatusUnauthorized, "unauthorized")
	default:
		writeError(w, http.StatusInternalServerError, err.Error())
	}
}

func validUsername(s string) bool {
	if len(s) < 3 || len(s) > 24 {
		return false
	}
	for _, c := range s {
		if (c < 'a' || c > 'z') && (c < '0' || c > '9') && c != '_' {
			return false
		}
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
