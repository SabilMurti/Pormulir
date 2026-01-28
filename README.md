# 🎯 Pormulir

> **Universal AI-Powered Form Builder** - Create surveys, quizzes, exams, and questionnaires with the power of artificial intelligence.

[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

## 📚 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Application Flow](#-application-flow)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Pormulir** adalah platform form builder modern yang memanfaatkan kekuatan AI (Google Gemini) untuk membantu pengguna membuat formulir dengan cepat dan efisien. Platform ini mendukung berbagai jenis formulir mulai dari survey sederhana hingga ujian dengan sistem anti-cheat yang canggih.

### Key Capabilities

- 🤖 **AI-Powered Question Generation** - Generate pertanyaan dari topik atau dokumen
- 📝 **14+ Question Types** - Dari multiple choice hingga file upload
- 🎓 **Advanced Exam Mode** - Timer, auto-grading, anti-cheat, shuffling
- 👥 **Workspace Collaboration** - Multi-user dengan role-based access
- 📊 **Rich Analytics** - Statistics, charts, dan export ke Excel/CSV
- 🔐 **Secure Authentication** - Google OAuth dengan JWT tokens

---

## ✨ Features

### 1. **Authentication & Authorization**
- Google OAuth integration dengan Laravel Sanctum
- JWT token-based authentication
- Role-based access control (Owner, Editor, Viewer)

### 2. **Workspace Management**
- Create unlimited workspaces
- Invite team members with specific roles
- Organize forms by workspace
- Workspace-level permissions

### 3. **Form Builder**
- **14 Question Types**:
  - `short_text` - Single line text input
  - `long_text` - Multi-line textarea
  - `multiple_choice` - Radio buttons (single answer)
  - `checkboxes` - Multiple selection
  - `dropdown` - Select dropdown
  - `rating` - Star rating (1-5 or 1-10)
  - `scale` - Linear scale
  - `date` - Date picker
  - `time` - Time picker
  - `file_upload` - File attachment
  - `section` - Section divider/heading
  - `image` - Image display
  - `video` - Video embed (YouTube, Vimeo)
  - `matrix` - Matrix/grid questions

- **Drag-and-Drop Interface** - Reorder questions dengan `@dnd-kit`
- **Rich Text Editor** - TipTap editor untuk question content
- **Question Settings**:
  - Required/Optional
  - Points assignment
  - Correct answer marking
  - Explanation/feedback
  - Custom validation
  
- **Form Settings**:
  - **General**: Shuffle questions, limit responses
  - **Exam Mode**: Timer, passing score, auto-grading
  - **Anti-Cheat**: Fullscreen, block copy/paste, tab switch detection
  - **Notifications**: Email on submission
  - **Password Protection**: Secure forms with password

### 4. **AI Generation (Google Gemini)**
- **Generate from Topic**: Generate 1-20 questions dari topik apapun
- **Generate from File**: Upload PDF/TXT/DOC untuk generate questions
- **Improve Questions**: AI-powered question enhancement
- **Customizable**:
  - Question count (1-20)
  - Question type
  - Difficulty level (Easy, Medium, Hard)
  - Language (Indonesian, English)
- **Usage Tracking**: Monitor AI usage dan request history

### 5. **Exam Mode**
- **Timer**: Countdown dengan auto-submit
- **Anti-Cheat System**:
  - Fullscreen mode enforcement
  - Copy/paste blocking
  - Tab/window switch detection
  - Violation logging dengan max threshold
- **Auto-Grading**: Instant scoring untuk objective questions
- **Shuffling**: Random question & option order
- **Results Display**: Score, grade, correct answers, explanations

### 6. **Response Management**
- View all submissions dengan pagination
- Individual response detail
- Statistics dashboard:
  - Total responses
  - Average score
  - Completion rate
  - Question-level analytics
- **Export**: Excel (XLSX) atau CSV dengan formatting
- Email notifications ke form creator dan respondent

### 7. **Public Form**
- Shareable link dengan clean URL (`/f/{slug}`)
- Session-based submission tracking
- Real-time validation
- Mobile-responsive design
- Accessibility support (WCAG compliant)

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Laravel** | 12 | PHP Framework |
| **MySQL** | 8.0+ | Database |
| **Laravel Sanctum** | ^4.0 | API Authentication |
| **Laravel Socialite** | ^5.16 | OAuth (Google) |
| **Google Gemini PHP** | ^4.1 | AI Integration |
| **Maatwebsite Excel** | ^3.1 | Response Export |
| **PHPUnit** | ^11.5 | Testing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2 | UI Framework |
| **Vite** | 7.2 | Build Tool |
| **React Router** | 7.13 | Routing |
| **Tailwind CSS** | 3.4 | Styling |
| **@dnd-kit** | ^6.3 | Drag & Drop |
| **TipTap** | 3.17 | Rich Text Editor |
| **Zustand** | 5.0 | State Management |
| **Axios** | 1.13 | HTTP Client |
| **Lucide React** | ^0.563 | Icons |
| **date-fns** | 4.1 | Date Utilities |

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite)                                   │   │
│  │  • Components (UI, Forms, Layout)                   │   │
│  │  • Pages (Dashboard, FormBuilder, PublicForm)       │   │
│  │  • Services (API Client)                            │   │
│  │  • Stores (Zustand - Auth, Form)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                    LARAVEL BACKEND                          │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Controllers     │  │  Services         │               │
│  │  • Auth          │  │  • GeminiService  │               │
│  │  • Workspace     │  │  • ExamService    │               │
│  │  • Form          │  └──────────────────┘               │
│  │  • Question      │                                       │
│  │  • PublicForm    │  ┌──────────────────┐               │
│  │  • Response      │  │  Exports          │               │
│  │  • AI            │  │  • ResponsesExport│               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Models (Eloquent ORM)                               │  │
│  │  User, Workspace, Form, Question, Option,            │  │
│  │  FormSession, Response, ViolationLog, AiUsageLog     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    ↕                      ↕
          ┌─────────────────┐    ┌─────────────────┐
          │  MySQL Database │    │ Google Gemini   │
          │  • 9 Tables     │    │ API (AI)        │
          └─────────────────┘    └─────────────────┘
```

### Database Schema

```
users
  ├── workspaces (many-to-many via workspace_members)
  │   └── forms
  │       ├── questions
  │       │   └── options
  │       └── form_sessions
  │           ├── responses
  │           └── violation_logs
  └── ai_usage_logs
```

**9 Core Tables**:
1. `users` - User accounts (Google OAuth)
2. `workspaces` - Workspace/Project organization
3. `workspace_members` - User-Workspace membership dengan roles
4. `forms` - Form definitions
5. `questions` - Question data
6. `options` - Multiple choice options
7. `form_sessions` - Individual submission sessions
8. `responses` - User answers
9. `violation_logs` - Anti-cheat violation tracking
10. `ai_usage_logs` - AI generation tracking

---

## 🔄 Application Flow

### 1. Authentication Flow

```
User → Click "Login with Google"
  ↓
Frontend → GET /api/auth/google
  ↓
Backend → Return Google OAuth URL
  ↓
User → Redirected to Google
  ↓
Google → User authorizes → Callback with code
  ↓
Frontend → GET /api/auth/google/callback?code=XXX
  ↓
Backend → Exchange code for user info → Create/Update user → Generate JWT
  ↓
Frontend → Store token → Redirect to Dashboard
```

### 2. Form Creation Flow

```
Dashboard → Create Workspace
  ↓
Workspace Detail → Create Form
  ↓
Form Builder:
  1. Add Questions (Manual or AI-generated)
  2. Configure Question Settings (type, options, points)
  3. Configure Form Settings (exam mode, notifications)
  4. Reorder Questions (drag-drop)
  5. Save → Publish
  ↓
Public Form Available at /f/{slug}
```

### 3. AI Generation Flow

```
User → AI Generator Page
  ↓
Option 1: Generate from Topic
  ├── Input: topic, count, type, difficulty, language
  ├── POST /api/ai/generate
  └── AI generates questions via Gemini
  
Option 2: Generate from File
  ├── Upload: PDF/TXT/DOC file
  ├── POST /api/ai/generate-from-file
  └── AI extracts content → generates questions
  
Result → Review Questions → Add to Form
```

### 4. Public Form Submission Flow

```
User → Visit /f/{slug}
  ↓
GET /api/f/{slug} → Load form data
  ↓
If Exam Mode:
  ├── POST /api/f/{slug}/start → Start session
  ├── Enforce fullscreen
  ├── Start timer
  └── Track violations
  
User fills form
  ↓
POST /api/f/{slug}/submit
  ↓
Backend:
  ├── Validate responses
  ├── Calculate score (if exam)
  ├── Save to database
  ├── Send email notifications
  └── Return results
  
If Exam Mode:
  └── Display score, grade, correct answers
```

### 5. Response Analysis Flow

```
Form Creator → Form Responses Page
  ↓
GET /api/forms/{id}/responses → List all submissions
  ↓
GET /api/forms/{id}/summary → Statistics dashboard
  ├── Total responses
  ├── Average score
  ├── Completion rate
  └── Question-level analytics
  
Export Options:
  ├── GET /api/forms/{id}/responses/export?format=xlsx
  └── GET /api/forms/{id}/responses/export?format=csv
```

---

## 🚀 Quick Start

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- npm/yarn
- MySQL 8.0+
- Google Cloud Project (for OAuth & Gemini API)

### 1. Clone Repository

```bash
git clone https://github.com/SabilMurti/Pormulir.git
cd Pormulir
```

### 2. Backend Setup

```bash
# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Configure .env
# DB_DATABASE=pormulir
# DB_USERNAME=root
# DB_PASSWORD=root
#
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-client-secret
# GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
#
# GEMINI_API_KEY=your-gemini-api-key

# Run migrations & seeders
php artisan migrate --seed

# Start backend server
php artisan serve
# Backend running at http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint
# Create .env file if needed
# VITE_API_URL=http://localhost:8000/api

# Start development server
npm run dev
# Frontend running at http://localhost:5173
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **API Documentation**: See [docs/API.md](docs/API.md)

### 5. Google Cloud Setup

#### OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Google+ API**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:8000/api/auth/google/callback`
6. Copy **Client ID** and **Client Secret** to `.env`

#### Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create API key
3. Copy to `.env` as `GEMINI_API_KEY`

---

## 📁 Project Structure

```
Pormulir/
├── app/                          # Laravel Application
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AIController.php          # AI generation endpoints
│   │   │   ├── AuthController.php        # Google OAuth
│   │   │   ├── FormController.php        # Form CRUD
│   │   │   ├── PublicFormController.php  # Public submission
│   │   │   ├── QuestionController.php    # Question management
│   │   │   ├── ResponseController.php    # Response & export
│   │   │   └── WorkspaceController.php   # Workspace management
│   │   ├── Requests/                     # Form validation
│   │   └── Resources/                    # API resources
│   ├── Models/                           # Eloquent models (9 models)
│   ├── Services/
│   │   ├── GeminiService.php            # AI integration logic
│   │   └── ExamService.php              # Exam grading & validation
│   ├── Exports/
│   │   └── ResponsesExport.php          # Excel export
│   └── Mail/                            # Email notifications
│
├── database/
│   ├── migrations/                      # Database schema
│   └── seeders/                         # Test data
│
├── routes/
│   ├── api.php                          # API routes (37 endpoints)
│   └── web.php                          # Web routes
│
├── frontend/                            # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── forms/                   # Form-specific components
│   │   │   │   ├── FormSettingsPanel.jsx
│   │   │   │   ├── QuestionCard.jsx
│   │   │   │   └── QuestionTypePicker.jsx
│   │   │   ├── layout/                  # Layout components
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── PublicLayout.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   └── ui/                      # Reusable UI components
│   │   │       ├── Alert.jsx
│   │   │       ├── Avatar.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       ├── Dropdown.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Loading.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── RichTextEditor.jsx
│   │   ├── pages/                       # Page components (11 pages)
│   │   │   ├── AIGenerator.jsx          # AI generation interface
│   │   │   ├── Dashboard.jsx            # Main dashboard
│   │   │   ├── FormBuilder.jsx          # Drag-drop form builder
│   │   │   ├── FormResponses.jsx        # Response analytics
│   │   │   ├── Forms.jsx                # Form list
│   │   │   ├── Landing.jsx              # Landing page
│   │   │   ├── Login.jsx                # Login page
│   │   │   ├── LoginCallback.jsx        # OAuth callback
│   │   │   ├── PublicForm.jsx           # Public form view
│   │   │   ├── WorkspaceDetail.jsx      # Workspace detail
│   │   │   └── Workspaces.jsx           # Workspace list
│   │   ├── services/                    # API client services
│   │   │   ├── ai.js
│   │   │   ├── api.js                   # Axios instance
│   │   │   ├── auth.js
│   │   │   ├── form.js
│   │   │   ├── publicForm.js
│   │   │   ├── question.js
│   │   │   ├── response.js
│   │   │   └── workspace.js
│   │   ├── stores/                      # Zustand state management
│   │   │   ├── authStore.js
│   │   │   └── formStore.js
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useApi.js
│   │   │   ├── useAuth.js
│   │   │   └── useForm.js
│   │   ├── utils/                       # Utilities
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   ├── App.jsx                      # Root component
│   │   ├── main.jsx                     # Entry point
│   │   └── index.css                    # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docs/
│   └── API.md                           # Complete API documentation
│
├── tests/                               # PHPUnit tests
│   ├── Feature/                         # Integration tests
│   │   ├── AuthTest.php
│   │   ├── FormTest.php
│   │   ├── PublicFormTest.php
│   │   └── WorkspaceTest.php
│   └── Unit/                            # Unit tests
│
├── .env.example                         # Environment template
├── composer.json                        # PHP dependencies
├── package.json                         # Node.js dependencies
└── README.md                            # This file
```

---

## 📖 API Documentation

### Quick Reference

| Endpoint Group | Count | Description |
|----------------|-------|-------------|
| `/api/auth/*` | 4 | Google OAuth, user profile |
| `/api/workspaces/*` | 6 | Workspace CRUD, member invites |
| `/api/forms/*` | 8 | Form CRUD, publish, duplicate |
| `/api/questions/*` | 4 | Question CRUD, reorder |
| `/api/f/{slug}/*` | 5 | Public form access, submission |
| `/api/ai/*` | 5 | AI generation, usage tracking |
| `/api/forms/{id}/responses/*` | 5 | Response management, export |
| **Total** | **37** | |

### Authentication

All protected endpoints require Bearer token:
```http
Authorization: Bearer YOUR_TOKEN
```

### Example Requests

#### Create Form
```http
POST http://localhost:8000/api/workspaces/{workspace_id}/forms
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our service"
}
```

#### Generate AI Questions
```http
POST http://localhost:8000/api/ai/generate
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "topic": "Laravel Eloquent ORM",
  "count": 10,
  "type": "multiple_choice",
  "difficulty": "medium",
  "language": "id"
}
```

#### Submit Form
```http
POST http://localhost:8000/api/f/customer-survey-abc123/submit
Content-Type: application/json

{
  "session_id": "uuid",
  "responses": [
    {"question_id": "uuid", "answer": "option-uuid"},
    {"question_id": "uuid", "answer": "Text answer"}
  ]
}
```

**Full Documentation**: See [docs/API.md](docs/API.md) for complete endpoint reference with request/response examples.

---

## 🧪 Testing

### Run All Tests

```bash
php artisan test
```

### Run Specific Test Suite

```bash
# Authentication tests
php artisan test --filter=AuthTest

# Form tests
php artisan test --filter=FormTest

# Public form submission tests
php artisan test --filter=PublicFormTest

# Workspace tests
php artisan test --filter=WorkspaceTest
```

### Test Coverage

- **29 tests, 82 assertions** ✓
- **Feature Tests**: Authentication, Workspaces, Forms, Questions, Public Forms, AI Generation
- **Unit Tests**: Models, Services, Exports

### Frontend Testing (Optional)

```bash
cd frontend

# Add testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

---

## 🌐 Deployment

### Backend (Laravel)

#### Option 1: Traditional VPS Hosting

```bash
# 1. SSH to server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/SabilMurti/Pormulir.git
cd Pormulir

# 3. Install dependencies
composer install --optimize-autoloader --no-dev

# 4. Configure environment
cp .env.example .env
nano .env  # Update production values

# 5. Generate key & migrate
php artisan key:generate
php artisan migrate --force

# 6. Set permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# 7. Configure web server (Nginx/Apache)
# Point document root to /public
```

#### Option 2: Laravel Forge (Recommended)

1. Connect Forge to your server
2. Create new site pointing to repository
3. Configure environment variables
4. Enable Quick Deploy
5. Setup SSL certificate (Let's Encrypt)

#### Option 3: Platform as a Service

- **Heroku**: Use PHP buildpack
- **Railway**: Automatic deployment from Git
- **DigitalOcean App Platform**: Laravel preset available

### Frontend (React)

#### Build for Production

```bash
cd frontend

# Build optimized bundle
npm run build

# Output: frontend/dist/
```

#### Option 1: Static Hosting (Vercel/Netlify)

```bash
# Vercel
npm install -g vercel
vercel --prod

# Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Important**: Configure redirects for SPA routing:

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify** (`netlify.toml`):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Option 2: Serve with Laravel

Move built files to Laravel `public` directory:
```bash
cp -r frontend/dist/* public/
```

Update Laravel `routes/web.php`:
```php
Route::get('/{any}', function () {
    return view('welcome'); // Or serve index.html
})->where('any', '.*');
```

### Environment Variables

**Production `.env`** (critical values):
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_HOST=production-db-host
DB_DATABASE=production_db
DB_USERNAME=production_user
DB_PASSWORD=secure_password

GOOGLE_CLIENT_ID=production-client-id
GOOGLE_CLIENT_SECRET=production-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

GEMINI_API_KEY=production-gemini-key

MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=smtp-password
```

### Post-Deployment Checklist

- [ ] Test Google OAuth login
- [ ] Test AI generation (Gemini API)
- [ ] Test email notifications
- [ ] Test form submission
- [ ] Test response export
- [ ] Verify HTTPS/SSL
- [ ] Configure backups
- [ ] Setup monitoring (Laravel Telescope, Sentry)

---

## 👥 Contributing

Contributions are welcome! Please follow these guidelines:

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/Pormulir.git
cd Pormulir
```

### 2. Create Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes
- Follow Laravel best practices
- Write tests for new features
- Update documentation if needed
- Follow existing code style

### 4. Commit Changes
```bash
git commit -m "feat: add amazing feature"
```

**Commit Convention**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Testing
- `chore:` Maintenance

### 5. Push & Create PR
```bash
git push origin feature/amazing-feature
```

Then create a Pull Request on GitHub.

### Development Guidelines

- **Backend**: Follow PSR-12 coding standard
- **Frontend**: Use ESLint configuration
- **Testing**: Write tests for critical features
- **Documentation**: Update README and API docs

---

## 📄 License

This project is open-sourced software licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Sabil Murti

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP Framework
- [React](https://react.dev) - UI Library
- [Google Gemini](https://ai.google.dev) - AI API
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Vite](https://vitejs.dev) - Frontend Build Tool
- [dnd-kit](https://dndkit.com) - Drag and Drop
- [TipTap](https://tiptap.dev) - Rich Text Editor

---

## 📞 Contact & Support

- **Developer**: Sabil Murti
- **GitHub**: [@SabilMurti](https://github.com/SabilMurti)
- **Issues**: [GitHub Issues](https://github.com/SabilMurti/Pormulir/issues)

---

**Made with ❤️ by Sabil Murti and contributors**

---

## 🗺 Roadmap

### Upcoming Features

- [ ] **Real-time Collaboration** - Multi-user form editing
- [ ] **Templates Library** - Pre-built form templates
- [ ] **Advanced Analytics** - Charts, graphs, heatmaps
- [ ] **Integrations** - Zapier, Webhooks, Google Sheets
- [ ] **White Label** - Custom branding options
- [ ] **Multi-language Support** - i18n for 10+ languages
- [ ] **Mobile Apps** - React Native mobile apps
- [ ] **Payment Integration** - Paid forms with Stripe
- [ ] **Advanced Question Types** - Signature, location, ranking
- [ ] **API Rate Limiting** - Rate limiting untuk public API

### Version History

- **v1.0.0** (2026-01-28) - Initial release
  - Core form builder
  - AI generation
  - Exam mode
  - Response analytics
