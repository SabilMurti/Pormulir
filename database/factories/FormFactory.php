<?php

namespace Database\Factories;

use App\Models\Form;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Form>
 */
class FormFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'created_by' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'slug' => fn () => Str::slug(fake()->sentence(2)) . '-' . Str::random(8),
            'status' => 'draft',
            'settings' => (new Form())->getDefaultSettings(),
            'theme' => [
                'primary_color' => fake()->hexColor(),
                'background_color' => '#F3F4F6',
            ],
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => 'published']);
    }

    public function closed(): static
    {
        return $this->state(fn () => ['status' => 'closed']);
    }
}
