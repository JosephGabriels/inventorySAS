# Environment Variables Migration TODO

## Progress Tracker

### Backend (Django)
- [x] Update `inventory/settings.py` to use environment variables
  - [x] Remove hardcoded SECRET_KEY default
  - [x] Move ALLOWED_HOSTS to environment variable
  - [x] Move CORS_ALLOWED_ORIGINS to environment variable
  - [x] Make JWT token lifetimes configurable
  - [x] Add database pool settings to environment variables
- [x] Create `.env.example` at root level

### Frontend (Vite/React)
- [x] Update `frontend/vite.config.ts` to use environment variables
- [x] Create `frontend/.env.example`
- [x] Ensure `frontend/src/services/api.ts` properly uses VITE_API_URL

### Configuration Files
- [x] Update `.gitignore` to protect .env files
- [x] Update `render.yaml` with new environment variables
- [x] Update `README.md` with environment setup instructions
- [x] Create `ENVIRONMENT_SETUP.md` comprehensive guide

### Testing & Verification
- [ ] Verify backend loads environment variables correctly
- [ ] Verify frontend loads environment variables correctly
- [ ] Test application functionality
- [ ] Ensure no hardcoded sensitive data remains

## Environment Variables List

### Backend (.env)
- SECRET_KEY
- DEBUG
- ALLOWED_HOSTS
- CORS_ALLOWED_ORIGINS
- DATABASE_URL
- JWT_ACCESS_TOKEN_LIFETIME_DAYS
- JWT_REFRESH_TOKEN_LIFETIME_DAYS
- DB_POOL_SIZE
- DB_MAX_OVERFLOW
- DB_POOL_TIMEOUT
- DB_POOL_RECYCLE

### Frontend (frontend/.env)
- VITE_API_URL
- VITE_DEV_SERVER_PORT
- VITE_PROXY_TARGET
