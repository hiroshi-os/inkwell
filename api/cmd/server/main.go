package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "modernc.org/sqlite"

	"inkwell/api/internal/server"
	"inkwell/api/internal/store"
)

func main() {
	port := getenv("PORT", "8080")
	secret := getenv("JWT_SECRET", "dev-inkwell-secret-change-me")
	dsn := getenv("DATABASE_URL", "sqlite:inkwell.db")

	db, driver, err := openDB(dsn)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(25)
	db.SetConnMaxLifetime(30 * time.Minute)

	st := store.New(db, driver)
	if err := st.Migrate(); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := st.Seed(); err != nil {
		log.Fatalf("seed: %v", err)
	}
	log.Printf("inkwell api on :%s (%s)", port, driver)
	if err := http.ListenAndServe(":"+port, server.New(st, secret)); err != nil {
		log.Fatal(err)
	}
}

func openDB(dsn string) (*sql.DB, string, error) {
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		var db *sql.DB
		var err error
		for i := 0; i < 30; i++ {
			db, err = sql.Open("pgx", dsn)
			if err == nil {
				err = db.Ping()
			}
			if err == nil {
				return db, "postgres", nil
			}
			log.Printf("waiting for postgres (%d/30): %v", i+1, err)
			time.Sleep(time.Second)
		}
		return nil, "", err
	}

	path := strings.TrimPrefix(dsn, "sqlite:")
	path = strings.TrimPrefix(path, "file:")
	if path == "" {
		path = "inkwell.db"
	}
	sqliteDSN := path
	if !strings.Contains(path, "mode=memory") && !strings.HasPrefix(path, "file:") {
		sqliteDSN = "file:" + path + "?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)"
	}
	db, err := sql.Open("sqlite", sqliteDSN)
	if err != nil {
		return nil, "", err
	}
	if err := db.Ping(); err != nil {
		return nil, "", err
	}
	return db, "sqlite", nil
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
