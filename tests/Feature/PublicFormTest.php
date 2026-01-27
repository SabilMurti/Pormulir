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

        $response->assertNotFound();
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
}
