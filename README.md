# 🏡 Luxe Interiors – Interior Design Website

A modern full-stack Interior Design Website built using **HTML, CSS, JavaScript, Node.js, Express.js, and MySQL**. The application allows users to browse interior designs, view project details, book consultations, save favorite designs to a wishlist, submit reviews, and contact the design team through a responsive and user-friendly interface.

---

## 🚀 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Tools:** Git, GitHub, VS Code

---

## ✨ Features

- Responsive and modern UI
- Interior design gallery
- Design details page
- Wishlist functionality
- Consultation booking system
- Customer reviews
- Contact form
- User authentication
- Password reset via email
- RESTful APIs
- Admin dashboard

---

## 📁 Project Structure

```
frontend/
├── html/
├── css/
├── js/
└── images/

backend/
├── config/
├── controllers/
├── database/
├── middleware/
├── routes/
└── server.js

docs/
README.md
```

---

## ⚙️ Installation

1. Clone the repository
```bash
git clone https://github.com/rajdeepk04/interior-design-website.git
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Create a `.env` file

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=interior_design_db
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
PORT=5000
```

4. Start the server
```bash
npm run start
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
