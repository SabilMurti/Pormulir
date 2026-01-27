<?php

namespace Database\Factories;

use App\Models\Form;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Question>
 */
class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'form_id' => Form::factory(),
            'type' => fake()->randomElement(Question::TYPES),
            'content' => fake()->sentence() . '?',
            'description' => fake()->optional()->sentence(),
            'media' => null,
            'validation' => null,
            'correct_answer' => null,
            'explanation' => null,
            'points' => fake()->randomElement([0, 5, 10]),
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }

    public function shortText(): static
    {
        return $this->state(fn () => ['type' => 'short_text']);
    }

    public function multipleChoice(): static
    {
        return $this->state(fn () => ['type' => 'multiple_choice']);
    }

    public function withPoints(int $points): static
    {
        return $this->state(fn () => ['points' => $points]);
    }
}
