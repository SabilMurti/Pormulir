# Pormulir

> Universal AI-Powered Form Builder API

## Features

- 🔐 **Google OAuth** - Secure authentication with JWT tokens
- 📝 **14 Question Types** - Multiple choice, text, rating, file upload, etc.
- 🤖 **AI Generation** - Generate questions from topics or documents (Gemini)
- 🎯 **Exam Mode** - Timer, anti-cheat, auto-grading, shuffling
- 📊 **Analytics** - Response statistics, completion rates
- 📤 **Export** - Excel/CSV export with styled formatting
- 📧 **Notifications** - Email alerts for submissions

## Tech Stack

- **Framework**: Laravel 12
- **Database**: MySQL
- **Auth**: Laravel Sanctum + Socialite
- **AI**: Google Gemini API
- **Export**: Maatwebsite Excel

## Quick Start

```bash
# Clone & install
git clone <repo-url>
cd pormulir
composer install

# Configure
cp .env.example .env
php artisan key:generate

# Set your credentials in .env
DB_DATABASE=pormulir
DB_USERNAME=root
DB_PASSWORD=root
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GEMINI_API_KEY=your-gemini-key

# Run
php artisan migrate --seed
php artisan serve
```

## API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

### Quick Reference

| Endpoint Group | Routes | Description |
|----------------|--------|-------------|
| `/api/auth/*` | 4 | Google OAuth, user profile |
| `/api/workspaces/*` | 6 | Workspace CRUD, invites |
| `/api/forms/*` | 8 | Form CRUD, publish, duplicate |
| `/api/questions/*` | 4 | Question CRUD, reorder |
| `/api/f/{slug}/*` | 5 | Public form, submit, results |
| `/api/ai/*` | 5 | AI generation, usage |
| **Total** | **37** | |

## Testing

```bash
# Run all tests
php artisan test

# Run specific suite
php artisan test --filter=PublicFormTest
```

**29 tests, 82 assertions** ✓

## Project Structure

```
app/
├── Http/Controllers/
│   ├── AuthController.php        # Google OAuth
│   ├── WorkspaceController.php   # Workspaces
│   ├── FormController.php        # Forms
│   ├── QuestionController.php    # Questions
│   ├── ResponseController.php    # Responses & Export
│   ├── PublicFormController.php  # Public submission
│   └── AIController.php          # AI generation
├── Services/
│   ├── GeminiService.php         # AI integration
│   └── ExamService.php           # Exam logic
├── Models/ (9 models)
└── Exports/ResponsesExport.php   # Excel export
```

## License

MIT
