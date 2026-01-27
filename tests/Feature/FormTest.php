<?php

namespace Tests\Feature;

use App\Models\Form;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $this->workspace->members()->attach($this->user->id, ['role' => 'owner']);
    }

    public function test_can_list_forms(): void
    {
        Form::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/workspaces/{$this->workspace->id}/forms");

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_form(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/workspaces/{$this->workspace->id}/forms", [
                'title' => 'My Survey',
                'description' => 'A test survey',
            ]);

        $response->assertCreated()
            ->assertJsonFragment(['title' => 'My Survey']);

        $this->assertDatabaseHas('forms', [
            'title' => 'My Survey',
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
            'status' => 'draft',
        ]);
    }

    public function test_can_show_form_with_questions(): void
    {
        $form = Form::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/forms/{$form->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'title', 'slug', 'status', 'settings', 'questions'],
            ]);
    }

    public function test_can_update_form(): void
    {
        $form = Form::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/forms/{$form->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertOk()
            ->assertJsonFragment(['title' => 'Updated Title']);
    }

    public function test_can_publish_form(): void
    {
        $form = Form::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/forms/{$form->id}/publish");

        $response->assertOk()
            ->assertJsonFragment(['status' => 'published']);
    }

    public function test_can_close_form(): void
    {
        $form = Form::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/forms/{$form->id}/close");

        $response->assertOk()
            ->assertJsonFragment(['status' => 'closed']);
    }

    public function test_can_duplicate_form(): void
    {
        $form = Form::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
            'title' => 'Original Form',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/forms/{$form->id}/duplicate");

        $response->assertCreated()
            ->assertJsonFragment(['title' => 'Original Form (Copy)']);

        $this->assertDatabaseCount('forms', 2);
    }

    public function test_can_soft_delete_form(): void
    {
        $form = Form::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/forms/{$form->id}");

        $response->assertOk();
        $this->assertSoftDeleted('forms', ['id' => $form->id]);
    }
}
