**Interior Design Website**

A small full-stack website for an interior design studio — static frontend pages with an Express + MySQL backend that serves APIs for designs, bookings, wishlist, reviews, contact messages, and auth.

**Prerequisites:**
- Node.js (18+ recommended)
- MySQL server (or MariaDB) accessible locally or remotely

**Quick Start (backend)**

1. Open a terminal and install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file in the `backend` folder (copy values as needed). Required env vars:

- `PORT` (optional, default: 5000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (database connection)
- `DB_PORT` (optional, default: 3306)
- `EMAIL_USER`, `EMAIL_PASS` (SMTP for password reset / contact notifications)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (optional admin seed)

Example minimal `.env` (do NOT commit to source control):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=interior_design_db
EMAIL_USER=youremail@example.com
EMAIL_PASS=your_email_password
PORT=5000
```

3. Start the backend:

```bash
node server.js
```

Notes:
- On first run the backend will create the database and tables automatically and seed a few sample designs. See [backend/database/db.js](backend/database/db.js) for details.
- SMTP is verified at startup; if `EMAIL_PASS` or `EMAIL_USER` is missing the server will log that status.

**Frontend (static)**

- The frontend is plain HTML/CSS/JS in the repository root. Open `index.html` in a browser, or serve the project root with a static server (e.g., `live-server` or `http-server`):

```bash
# from project root
npx http-server -c-1 . -p 8080
# then open http://localhost:8080
```

**Important files**
- Server entry: [backend/server.js](backend/server.js)
- DB initialization & pool: [backend/database/db.js](backend/database/db.js)
- API controllers: [backend/controllers](backend/controllers)
- Routes: [backend/routes](backend/routes)
- Environment helper: [backend/config/db.js](backend/config/db.js)

**Useful API endpoints**
- Health: `GET /api/health`
- Designs: `GET /api/designs`, `GET /api/designs/:id`
- Auth test: `GET /api/auth/test`
- Wishlist: `GET /api/wishlist?userId={id}`, `POST /api/wishlist`, `DELETE /api/wishlist/:id`

Example curl to list designs:

```bash
curl http://localhost:5000/api/designs
```

**Troubleshooting**
- If server fails to start: check `backend/.env` values and MySQL credentials.
- Port conflict: change `PORT` in `.env` or stop other services using the port.
- SMTP errors: verify `EMAIL_USER` and `EMAIL_PASS`, and consider app-specific passwords for Gmail.

**Next steps / suggestions**
- Add unit / integration tests for API controllers.
- Add CI workflow to run lint/tests and ensure env secrets are managed.
- Optionally containerize with Docker for consistent development environments.

---

If you want, I can now: run the frontend in a browser, wire up auth flows, or add a simple Postman collection with example requests.
# Interior Design Project

This project is organized with language-wise separation:

- `backend/` contains the Node.js and Express API.
- `frontend/html/` contains website pages.
- `frontend/css/` contains styling files.
- `frontend/js/` contains browser-side JavaScript.
- `frontend/images/` contains UI images.
- `docs/` contains API notes and the project report.

## Run the backend

```bash
cd backend
npm start
```

## Main frontend pages

- `frontend/html/index.html`
- `frontend/html/designs.html`
- `frontend/html/design-details.html`
- `frontend/html/wishlist.html`
- `frontend/html/booking.html`
- `frontend/html/contact.html`
