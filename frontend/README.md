# 💼 ERP Reimbursement Management System — Frontend

A **modern ERP-style Reimbursement Management System frontend** built using **React**, designed for enterprise-level expense tracking, multi-level approvals, and OCR-based receipt automation.

This frontend communicates with a **Java Spring Boot backend**, which further integrates with a **Python OCR microservice**.

---

# 🚀 Features

### 👥 Role Based Dashboards

* Admin Dashboard
* Manager Dashboard
* Employee Dashboard

---

### 💰 Expense Management

* Submit expenses
* Upload receipts
* Auto-fill using OCR
* View expense history
* Track approval status

---

### 🔄 Multi-Level Approval Workflow

* Sequential approvals
* Parallel approvals
* CFO override rules
* Conditional approvals

---

### 📊 Dashboard Analytics

* Total expenses
* Pending approvals
* Approved expenses
* Rejected expenses
* Category charts

---

### 🧾 OCR Receipt Upload

* Upload receipt image
* Auto extract:

  * Amount
  * Date
  * Vendor
  * Category
* Auto populate form

---

### 👨‍💼 User Management (Admin)

* Create users
* Assign roles
* Assign managers
* Manage organization

---

### ⚙️ Approval Rule Builder

* Multi-step approval flow
* Percentage rule
* CFO override
* Hybrid rule

---

# 🏗️ Architecture

Frontend communicates with:

React → Java Backend → Python OCR Service

Frontend **never directly calls OCR service**

---

# 🛠️ Tech Stack

* React (Vite)
* React Router v6
* Tailwind CSS
* Framer Motion
* Lucide React Icons
* Axios
* React Hook Form
* Context API

---

# 🎨 UI Design

ERP-style enterprise UI

* Clean dashboards
* Smooth animations
* Responsive layout
* Minimal aesthetic
* Soft shadows
* Rounded cards

---

# 📁 Project Structure

```
src/
│
├── pages/
│
├── components/
│
├── layouts/
│
├── services/
│
├── hooks/
│
├── context/
│
├── utils/
│
└── constants/
```

---

# 📱 Pages

## Authentication

* Login
* Signup

---

## Dashboards

* Admin Dashboard
* Manager Dashboard
* Employee Dashboard

---

## Expenses

* Expense List
* Submit Expense
* Expense Details

---

## Admin

* Users Management
* Approval Rules

---

## Reports

* Analytics
* Expense Reports

---

## Notifications

* Alerts
* Approval notifications

---

# 🔐 Role Based Access

### Admin

* Manage users
* Configure approval workflow
* View all expenses

---

### Manager

* Approve / reject expenses
* View team expenses

---

### Employee

* Submit expenses
* View own expenses

---

# 📷 OCR Upload Flow

1. Upload receipt
2. Frontend sends request to Java backend
3. Java calls Python OCR
4. OCR returns extracted data
5. Form auto fills

---

# ⚙️ Environment Setup

Clone repository

```
git clone <repo-url>
```

Navigate to frontend

```
cd frontend
```

Install dependencies

```
npm install
```

Run development server

```
npm run dev
```

---

# 🔌 API Configuration

Update API base URL:

```
src/services/api.js
```

Example:

```
http://localhost:8080/api
```

---

# 🎯 Core Components

Reusable components:

* Button
* Card
* Table
* Modal
* Badge
* Input
* Dropdown
* Loader

---

# ✨ Animations

Using Framer Motion:

* Page transitions
* Sidebar animation
* Modal animation
* Hover animations

---

# 🎨 Color Theme

ERP Blue
Professional Gray
Soft shadows
Minimal UI

---

# 📱 Responsive

* Mobile friendly
* Tablet friendly
* Desktop optimized

---

# 🚀 Future Enhancements

* Dark Mode
* Export to Excel
* Real-time notifications
* Advanced analytics

---

# 👩‍💻 Author

Built for ERP-style enterprise reimbursement management system.

---

# ⭐ Project Goals

* Enterprise grade UI
* Scalable architecture
* Microservices ready
* Clean frontend architecture

---

# 📜 License

MIT License

---

# 🤝 Contributing

Pull requests welcome

---

# 🚀 Status

Frontend — In Development
Backend — Java Spring Boot
OCR Service — Python

---

# 💡 Inspiration

SAP
Oracle ERP
Zoho Expense
Freshbooks
