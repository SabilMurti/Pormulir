<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_list_workspaces(): void
    {
        $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $workspace->members()->attach($this->user->id, ['role' => 'owner']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/workspaces');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['name' => $workspace->name]);
    }

    public function test_can_create_workspace(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/workspaces', [
                'name' => 'My Workspace',
            ]);

        $response->assertCreated()
            ->assertJsonFragment(['name' => 'My Workspace']);

        $this->assertDatabaseHas('workspaces', ['name' => 'My Workspace']);
        $this->assertDatabaseHas('workspace_members', [
            'user_id' => $this->user->id,
            'role' => 'owner',
        ]);
    }

    public function test_can_show_workspace(): void
    {
        $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $workspace->members()->attach($this->user->id, ['role' => 'owner']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/workspaces/{$workspace->id}");

        $response->assertOk()
            ->assertJsonFragment(['id' => $workspace->id]);
    }

    public function test_can_update_workspace(): void
    {
        $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $workspace->members()->attach($this->user->id, ['role' => 'owner']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/workspaces/{$workspace->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Updated Name']);
    }

    public function test_can_delete_workspace(): void
    {
        $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $workspace->members()->attach($this->user->id, ['role' => 'owner']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/workspaces/{$workspace->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('workspaces', ['id' => $workspace->id]);
    }

    public function test_can_invite_member(): void
    {
        $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $workspace->members()->attach($this->user->id, ['role' => 'owner']);
        
        $invitee = User::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/workspaces/{$workspace->id}/invite", [
                'email' => $invitee->email,
                'role' => 'editor',
            ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'User invited successfully.']);

        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $invitee->id,
            'role' => 'editor',
        ]);
    }

    public function test_viewer_cannot_update_workspace(): void
    {
        $owner = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
        $workspace->members()->attach($this->user->id, ['role' => 'viewer']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/workspaces/{$workspace->id}", [
                'name' => 'Hacked Name',
            ]);

        $response->assertForbidden();
    }

    public function test_non_member_cannot_view_workspace(): void
    {
        $owner = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/workspaces/{$workspace->id}");

        $response->assertForbidden();
    }
}
