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
node server.js
```

5. Open the frontend by launching `frontend/html/index.html` in your browser or use a local server.

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health |
| GET | `/api/designs` | Get all designs |
| GET | `/api/designs/:id` | Get design details |
| POST | `/api/bookings` | Create booking |
| POST | `/api/contact` | Send contact message |
| POST | `/api/reviews` | Submit review |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | User login |

---

## 📌 Future Improvements

- Payment integration
- Image uploads
- Email notifications
- Admin analytics dashboard
- Multi-language support

---

## 👨‍💻 Author

**Rajdeep**

- GitHub: https://github.com/rajdeepk04
- Portfolio: https://rajdeepk04.github.io/portfolio/
- LinkedIn: www.linkedin.com/in/rajdeep-uiux

---

⭐ If you like this project, don't forget to give it a **Star** on GitHub!
