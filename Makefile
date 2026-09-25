.PHONY: api web test tidy

api:
	cd api && DATABASE_URL=sqlite:inkwell.db JWT_SECRET=dev-inkwell-secret-change-me go run ./cmd/server

test:
	cd api && go test ./...

web:
	cd web && npm install && npm run dev

tidy:
	cd api && go mod tidy
