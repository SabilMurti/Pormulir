# Pormulir API Documentation

> Universal AI-Powered Form Builder API

**Base URL**: `http://localhost:8000/api`

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN
```

### Google OAuth

#### Get OAuth URL
```http
GET /auth/google
```

**Response**:
```json
{
  "url": "https://accounts.google.com/o/oauth2/..."
}
```

#### OAuth Callback
```http
GET /auth/google/callback?code=GOOGLE_AUTH_CODE
```

**Response**:
```json
{
  "token": "1|abc123...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://..."
  }
}
```

#### Get Current User
```http
GET /auth/me
```

**Response**:
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar_url": "https://..."
}
```

#### Logout
```http
POST /auth/logout
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

---

## Workspaces

### List Workspaces
```http
GET /workspaces
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "slug": "my-workspace-abc123",
      "role": "owner",
      "forms_count": 5
    }
  ]
}
```

### Create Workspace
```http
POST /workspaces
Content-Type: application/json

{
  "name": "My Workspace"
}
```

### Get Workspace
```http
GET /workspaces/{id}
```

### Update Workspace
```http
PUT /workspaces/{id}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Workspace
```http
DELETE /workspaces/{id}
```

### Invite Member
```http
POST /workspaces/{id}/invite
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "editor"  // owner, editor, viewer
}
```

---

## Forms

### List Forms in Workspace
```http
GET /workspaces/{workspace_id}/forms
```

### Create Form
```http
POST /workspaces/{workspace_id}/forms
Content-Type: application/json

{
  "title": "Customer Survey",
  "description": "Help us improve our service"
}
```

### Get Form
```http
GET /forms/{id}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "title": "Customer Survey",
    "slug": "customer-survey-abc123",
    "status": "draft",
    "settings": {
      "general": {
        "shuffle_questions": false,
        "limit_one_response": false
      },
      "exam_mode": {
        "enabled": false,
        "time_limit_minutes": null
      }
    },
    "questions": [...]
  }
}
```

### Update Form
```http
PUT /forms/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "settings": {
    "exam_mode": {
      "enabled": true,
      "time_limit_minutes": 30,
      "passing_score": 70,
      "show_score_after": true,
      "shuffle_options": true,
      "anti_cheat": {
        "fullscreen_required": true,
        "block_copy_paste": true,
        "detect_tab_switch": true,
        "max_violations": 3
      }
    },
    "notifications": {
      "notify_on_submission": true,
      "send_confirmation": true
    }
  }
}
```

### Delete Form
```http
DELETE /forms/{id}
```

### Duplicate Form
```http
POST /forms/{id}/duplicate
```

### Publish Form
```http
PUT /forms/{id}/publish
```

### Close Form
```http
PUT /forms/{id}/close
```

---

## Questions

### Question Types
- `short_text` - Single line text
- `long_text` - Multi-line text
- `multiple_choice` - Radio buttons (single answer)
- `checkboxes` - Multiple answers
- `dropdown` - Select dropdown
- `rating` - Star rating
- `scale` - Linear scale
- `date` - Date picker
- `time` - Time picker
- `file_upload` - File attachment
- `section` - Section divider
- `image` - Image display
- `video` - Video embed
- `matrix` - Matrix grid

### Add Question
```http
POST /forms/{form_id}/questions
Content-Type: application/json

{
  "type": "multiple_choice",
  "content": "What is your favorite color?",
  "description": "Choose one option",
  "points": 10,
  "correct_answer": null,
  "options": [
    {"content": "Red", "is_correct": false},
    {"content": "Blue", "is_correct": true},
    {"content": "Green", "is_correct": false}
  ]
}
```

### Update Question
```http
PUT /questions/{id}
Content-Type: application/json

{
  "content": "Updated question text",
  "points": 15
}
```

### Delete Question
```http
DELETE /questions/{id}
```

### Reorder Questions
```http
POST /forms/{form_id}/questions/reorder
Content-Type: application/json

{
  "order": ["question-uuid-1", "question-uuid-2", "question-uuid-3"]
}
```

---

## Public Forms

### Get Public Form
```http
GET /f/{slug}
```

**Response**:
```json
{
  "form": {
    "id": "uuid",
    "title": "Customer Survey",
    "settings": {...},
    "questions": [
      {
        "id": "uuid",
        "type": "multiple_choice",
        "content": "Question text",
        "options": [
          {"id": "uuid", "content": "Option A"},
          {"id": "uuid", "content": "Option B"}
        ]
      }
    ]
  }
}
```

### Start Session
```http
POST /f/{slug}/start
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "form-password"  // if required
}
```

**Response**:
```json
{
  "session_id": "uuid",
  "started_at": "2026-01-23T10:00:00Z",
  "time_limit_minutes": 30,
  "exam_mode": true,
  "anti_cheat_rules": {
    "fullscreen_required": true,
    "block_copy_paste": true,
    "detect_tab_switch": true
  },
  "questions": [...]  // Shuffled if enabled
}
```

### Submit Responses
```http
POST /f/{slug}/submit
Content-Type: application/json

{
  "session_id": "uuid",
  "responses": [
    {"question_id": "uuid", "answer": "option-uuid"},
    {"question_id": "uuid", "answer": ["option-1", "option-2"]},
    {"question_id": "uuid", "answer": "Free text answer"}
  ]
}
```

**Response**:
```json
{
  "message": "Thank you for your submission!",
  "submitted_at": "2026-01-23T10:30:00Z",
  "time_spent_seconds": 1800,
  "score": 85.5,
  "passed": true
}
```

### Log Violation
```http
POST /f/{slug}/violation
Content-Type: application/json

{
  "session_id": "uuid",
  "event_type": "tab_switch",
  "event_data": {"count": 1}
}
```

**Response**:
```json
{
  "violation_count": 1,
  "max_violations": 3,
  "warning": false
}
```

### Get Results
```http
GET /f/{slug}/results?session_id=uuid
```

**Response**:
```json
{
  "session_id": "uuid",
  "status": "submitted",
  "score_percentage": 85.5,
  "passed": true,
  "grade": "B",
  "total_points": 100,
  "earned_points": 85,
  "questions": [
    {
      "content": "Question text",
      "your_answer": "A",
      "is_correct": true,
      "points_earned": 10,
      "explanation": null
    }
  ]
}
```

---

## Responses

### List Responses
```http
GET /forms/{form_id}/responses?per_page=50
```

### Get Response Detail
```http
GET /forms/{form_id}/responses/{session_id}
```

### Delete Response
```http
DELETE /forms/{form_id}/responses/{session_id}
```

### Export Responses
```http
GET /forms/{form_id}/responses/export?format=xlsx
GET /forms/{form_id}/responses/export?format=csv
```

### Get Summary Statistics
```http
GET /forms/{form_id}/summary
```

**Response**:
```json
{
  "stats": {
    "total_responses": 150,
    "average_score": 78.5,
    "average_time_seconds": 1200,
    "completion_rate": 85.2
  },
  "questions": [
    {
      "id": "uuid",
      "content": "Question text",
      "type": "multiple_choice",
      "correct_rate": 72.5,
      "options": [
        {"id": "uuid", "content": "Option A", "count": 50},
        {"id": "uuid", "content": "Option B", "count": 100}
      ]
    }
  ]
}
```

---

## AI Generation

### Generate Questions from Topic
```http
POST /ai/generate
Content-Type: application/json

{
  "topic": "Laravel Eloquent ORM",
  "count": 5,
  "type": "multiple_choice",
  "difficulty": "medium",
  "language": "id"
}
```

**Parameters**:
- `topic` (required): Topic for questions
- `count` (optional): 1-20, default 5
- `type` (optional): `multiple_choice`, `checkboxes`, `short_text`, `long_text`
- `difficulty` (optional): `easy`, `medium`, `hard`
- `language` (optional): `id` (Indonesian), `en` (English)

**Response**:
```json
{
  "questions": [
    {
      "type": "multiple_choice",
      "content": "Apa fungsi dari method belongsTo() di Eloquent?",
      "points": 10,
      "correct_answer": null,
      "explanation": "...",
      "options": [
        {"content": "Option A", "is_correct": false},
        {"content": "Option B", "is_correct": true}
      ]
    }
  ],
  "count": 5
}
```

### Generate from File
```http
POST /ai/generate-from-file
Content-Type: multipart/form-data

file: [PDF/TXT/DOC file]
count: 5
type: multiple_choice
language: id
```

### Improve Question
```http
POST /ai/improve
Content-Type: application/json

{
  "question_content": "What is Laravel?",
  "instruction": "Make this question more specific and add options"
}
```

### Add AI Questions to Form
```http
POST /ai/forms/{form_id}/add-questions
Content-Type: application/json

{
  "questions": [
    {
      "type": "multiple_choice",
      "content": "Question text",
      "options": [...]
    }
  ]
}
```

### Get AI Usage Stats
```http
GET /ai/usage
```

**Response**:
```json
{
  "stats": {
    "total_questions_generated": 150,
    "total_requests": 30,
    "by_action": {
      "generate_questions": 20,
      "generate_from_file": 10
    }
  },
  "recent_logs": [...]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "message": "Record not found"
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "title": ["The title field is required."]
  }
}
```

### 500 Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details..."
}
```
