<?php

namespace Tests\Feature;

use App\Models\Form;
use App\Models\FormSession;
use App\Models\Option;
use App\Models\Question;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicFormTest extends TestCase
{
    use RefreshDatabase;

    private Form $form;

    protected function setUp(): void
    {
        parent::setUp();
        
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $user->id]);
        
        $this->form = Form::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'status' => 'published',
            'settings' => (new Form())->getDefaultSettings(),
        ]);

        // Add a question
        Question::factory()->create([
            'form_id' => $this->form->id,
            'type' => 'short_text',
            'content' => 'What is your name?',
        ]);
    }

    public function test_can_get_public_form(): void
    {
        $response = $this->getJson("/api/f/{$this->form->slug}");

        $response->assertOk()
            ->assertJsonStructure([
                'form' => ['id', 'title', 'description', 'settings', 'questions'],
            ]);
    }

    public function test_cannot_get_draft_form(): void
    {
        $this->form->update(['status' => 'draft']);

        $response = $this->getJson("/api/f/{$this->form->slug}");

        $response->assertForbidden()
            ->assertJsonFragment(['code' => 'DRAFT']);
    }

    public function test_can_start_session(): void
    {
        $response = $this->postJson("/api/f/{$this->form->slug}/start", [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['session_id', 'started_at']);

        $this->assertDatabaseHas('form_sessions', [
            'form_id' => $this->form->id,
            'respondent_name' => 'John Doe',
            'respondent_email' => 'john@example.com',
            'status' => 'in_progress',
        ]);
    }

    public function test_can_submit_responses(): void
    {
        $question = $this->form->questions->first();
        
        // Start session
        $startResponse = $this->postJson("/api/f/{$this->form->slug}/start", [
            'name' => 'Jane Doe',
        ]);
        $sessionId = $startResponse->json('session_id');

        // Submit
        $response = $this->postJson("/api/f/{$this->form->slug}/submit", [
            'session_id' => $sessionId,
            'responses' => [
                ['question_id' => $question->id, 'answer' => 'Jane'],
            ],
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'submitted_at', 'time_spent_seconds']);

        $this->assertDatabaseHas('form_sessions', [
            'id' => $sessionId,
            'status' => 'submitted',
        ]);

        $this->assertDatabaseHas('responses', [
            'session_id' => $sessionId,
            'question_id' => $question->id,
        ]);
    }

    public function test_auto_grading_works(): void
    {
        // Create a question with correct answer
        $question = Question::factory()->create([
            'form_id' => $this->form->id,
            'type' => 'short_text',
            'content' => 'What is 2+2?',
            'correct_answer' => '4',
            'points' => 10,
        ]);

        // Start session
        $startResponse = $this->postJson("/api/f/{$this->form->slug}/start");
        $sessionId = $startResponse->json('session_id');

        // Submit correct answer
        $response = $this->postJson("/api/f/{$this->form->slug}/submit", [
            'session_id' => $sessionId,
            'responses' => [
                ['question_id' => $question->id, 'answer' => '4'],
            ],
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('responses', [
            'session_id' => $sessionId,
            'question_id' => $question->id,
            'is_correct' => true,
            'points_earned' => 10,
        ]);
    }

    public function test_can_log_violation(): void
    {
        // Start session
        $startResponse = $this->postJson("/api/f/{$this->form->slug}/start");
        $sessionId = $startResponse->json('session_id');

        // Log violation
        $response = $this->postJson("/api/f/{$this->form->slug}/violation", [
            'session_id' => $sessionId,
            'event_type' => 'tab_switch',
            'event_data' => ['count' => 1],
        ]);

        $response->assertOk()
            ->assertJsonStructure(['violation_count', 'max_violations', 'warning']);

        $this->assertDatabaseHas('violation_logs', [
            'session_id' => $sessionId,
            'event_type' => 'tab_switch',
        ]);
    }

    public function test_session_terminated_after_max_violations(): void
    {
        // Update settings for strict anti-cheat
        $settings = $this->form->settings;
        $settings['exam_mode']['anti_cheat']['max_violations'] = 2;
        $this->form->update(['settings' => $settings]);

        // Start session
        $startResponse = $this->postJson("/api/f/{$this->form->slug}/start");
        $sessionId = $startResponse->json('session_id');

        // Log 2 violations
        $this->postJson("/api/f/{$this->form->slug}/violation", [
            'session_id' => $sessionId,
            'event_type' => 'tab_switch',
        ]);

        $response = $this->postJson("/api/f/{$this->form->slug}/violation", [
            'session_id' => $sessionId,
            'event_type' => 'tab_switch',
        ]);

        $response->assertForbidden()
            ->assertJsonFragment(['terminated' => true]);

        $this->assertDatabaseHas('form_sessions', [
            'id' => $sessionId,
            'status' => 'violated',
        ]);
    }

    public function test_max_responses_limit_enforced(): void
    {
        // Set max responses to 2
        $this->form->update(['max_responses' => 2]);

        // Submit 2 responses successfully
        for ($i = 0; $i < 2; $i++) {
            $response = $this->postJson("/api/f/{$this->form->slug}/submit-direct", [
                'answers' => [
                    ['question_id' => $this->form->questions->first()->id, 'value' => "Answer $i"],
                ],
                'respondent_email' => "user{$i}@example.com",
            ]);
            $response->assertOk();
        }

        // Third submission should fail
        $response = $this->postJson("/api/f/{$this->form->slug}/submit-direct", [
            'answers' => [
                ['question_id' => $this->form->questions->first()->id, 'value' => 'Answer 3'],
            ],
            'respondent_email' => 'user3@example.com',
        ]);

        $response->assertForbidden()
            ->assertJsonFragment(['code' => 'MAX_RESPONSES_REACHED']);
    }

    public function test_one_response_per_user_enforced(): void
    {
        // Enable limit one response
        $settings = $this->form->settings;
        $settings['general']['limit_one_response'] = true;
        $this->form->update(['settings' => $settings]);

        // First submission
        $response = $this->postJson("/api/f/{$this->form->slug}/submit-direct", [
            'answers' => [
                ['question_id' => $this->form->questions->first()->id, 'value' => 'First Answer'],
            ],
            'respondent_email' => 'same@example.com',
        ]);
        $response->assertOk();

        // Second submission with same email should fail (based on IP since no login)
        $response = $this->postJson("/api/f/{$this->form->slug}/submit-direct", [
            'answers' => [
                ['question_id' => $this->form->questions->first()->id, 'value' => 'Second Answer'],
            ],
            'respondent_email' => 'same@example.com',
        ]);

        $response->assertForbidden()
            ->assertJsonFragment(['code' => 'ALREADY_SUBMITTED']);
    }

    public function test_require_login_enforced(): void
    {
        // Enable require login
        $settings = $this->form->settings;
        $settings['general']['require_login'] = true;
        $this->form->update(['settings' => $settings]);

        // Try to start session without auth
        $response = $this->postJson("/api/f/{$this->form->slug}/start");

        $response->assertUnauthorized()
            ->assertJsonFragment(['code' => 'LOGIN_REQUIRED']);
    }

    public function test_authenticated_user_can_submit_with_require_login(): void
    {
        // Enable require login
        $settings = $this->form->settings;
        $settings['general']['require_login'] = true;
        $this->form->update(['settings' => $settings]);

        // Create and authenticate a user
        $user = User::factory()->create();

        // Submit with authentication
        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/f/{$this->form->slug}/submit-direct", [
                'answers' => [
                    ['question_id' => $this->form->questions->first()->id, 'value' => 'Authenticated Answer'],
                ],
            ]);

        $response->assertOk();

        // Verify user info was captured
        $this->assertDatabaseHas('form_sessions', [
            'form_id' => $this->form->id,
            'user_id' => $user->id,
            'respondent_email' => $user->email,
        ]);
    }
}
