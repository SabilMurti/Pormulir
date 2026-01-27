<?php

namespace Database\Seeders;

use App\Models\Form;
use App\Models\Option;
use App\Models\Question;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo user
        $user = User::create([
            'name' => 'Demo User',
            'email' => 'demo@pormulir.test',
            'google_id' => 'demo-google-id-12345',
            'avatar_url' => 'https://ui-avatars.com/api/?name=Demo+User',
        ]);

        // Create workspace
        $workspace = Workspace::create([
            'name' => 'Demo Workspace',
            'slug' => 'demo-workspace-' . Str::random(6),
            'owner_id' => $user->id,
            'settings' => [],
        ]);

        $workspace->members()->attach($user->id, ['role' => 'owner']);

        // Create sample survey form
        $surveyForm = Form::create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Customer Satisfaction Survey',
            'description' => 'Help us improve by sharing your feedback!',
            'slug' => 'customer-survey-' . Str::random(8),
            'status' => 'published',
            'settings' => (new Form())->getDefaultSettings(),
            'theme' => [
                'primary_color' => '#3B82F6',
                'background_color' => '#F3F4F6',
            ],
        ]);

        // Add questions to survey
        $this->createQuestion($surveyForm, [
            'type' => 'short_text',
            'content' => 'What is your name?',
            'sort_order' => 1,
        ]);

        $q2 = $this->createQuestion($surveyForm, [
            'type' => 'multiple_choice',
            'content' => 'How satisfied are you with our service?',
            'sort_order' => 2,
        ]);

        foreach (['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] as $i => $opt) {
            Option::create([
                'question_id' => $q2->id,
                'content' => $opt,
                'sort_order' => $i,
            ]);
        }

        $this->createQuestion($surveyForm, [
            'type' => 'rating',
            'content' => 'Rate our customer support',
            'description' => '1 = Poor, 5 = Excellent',
            'validation' => ['min' => 1, 'max' => 5],
            'sort_order' => 3,
        ]);

        $this->createQuestion($surveyForm, [
            'type' => 'long_text',
            'content' => 'Any suggestions for improvement?',
            'sort_order' => 4,
        ]);

        // Create sample quiz/exam form
        $examForm = Form::create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Laravel Basics Quiz',
            'description' => 'Test your Laravel knowledge!',
            'slug' => 'laravel-quiz-' . Str::random(8),
            'status' => 'published',
            'settings' => array_merge((new Form())->getDefaultSettings(), [
                'exam_mode' => [
                    'enabled' => true,
                    'time_limit_minutes' => 10,
                    'shuffle_options' => true,
                    'show_score_after' => true,
                    'passing_score' => 60,
                    'anti_cheat' => [
                        'fullscreen_required' => false,
                        'block_copy_paste' => true,
                        'detect_tab_switch' => true,
                        'max_violations' => 3,
                    ],
                ],
            ]),
        ]);

        $q1 = $this->createQuestion($examForm, [
            'type' => 'multiple_choice',
            'content' => 'What command creates a new Laravel project?',
            'points' => 10,
            'correct_answer' => null, // Will set after creating options
            'sort_order' => 1,
        ]);

        $options1 = [
            ['content' => 'laravel new project', 'is_correct' => false],
            ['content' => 'composer create-project laravel/laravel', 'is_correct' => true],
            ['content' => 'npm init laravel', 'is_correct' => false],
            ['content' => 'php artisan new project', 'is_correct' => false],
        ];

        foreach ($options1 as $i => $opt) {
            $o = Option::create([
                'question_id' => $q1->id,
                'content' => $opt['content'],
                'is_correct' => $opt['is_correct'],
                'sort_order' => $i,
            ]);
            if ($opt['is_correct']) {
                $q1->update(['correct_answer' => $o->id]);
            }
        }

        $q2 = $this->createQuestion($examForm, [
            'type' => 'multiple_choice',
            'content' => 'Which file defines application routes for web?',
            'points' => 10,
            'sort_order' => 2,
        ]);

        $options2 = [
            ['content' => 'routes/api.php', 'is_correct' => false],
            ['content' => 'routes/web.php', 'is_correct' => true],
            ['content' => 'app/routes.php', 'is_correct' => false],
            ['content' => 'config/routes.php', 'is_correct' => false],
        ];

        foreach ($options2 as $i => $opt) {
            $o = Option::create([
                'question_id' => $q2->id,
                'content' => $opt['content'],
                'is_correct' => $opt['is_correct'],
                'sort_order' => $i,
            ]);
            if ($opt['is_correct']) {
                $q2->update(['correct_answer' => $o->id]);
            }
        }

        $this->createQuestion($examForm, [
            'type' => 'short_text',
            'content' => 'What is the default port for Laravel development server?',
            'points' => 10,
            'correct_answer' => '8000',
            'explanation' => 'Laravel\'s built-in development server runs on port 8000 by default.',
            'sort_order' => 3,
        ]);

        echo "✓ Created demo user: demo@pormulir.test\n";
        echo "✓ Created workspace: Demo Workspace\n";
        echo "✓ Created survey form: Customer Satisfaction Survey\n";
        echo "✓ Created exam form: Laravel Basics Quiz\n";
    }

    private function createQuestion(Form $form, array $data): Question
    {
        return Question::create([
            'form_id' => $form->id,
            ...$data,
        ]);
    }
}
