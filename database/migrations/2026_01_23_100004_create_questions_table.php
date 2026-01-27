<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('form_id');
            $table->enum('type', [
                'short_text', 'long_text', 'multiple_choice', 'checkboxes',
                'dropdown', 'number', 'email', 'phone', 'date', 'time',
                'file_upload', 'rating', 'scale', 'section'
            ]);
            $table->text('content');
            $table->text('description')->nullable();
            $table->json('media')->nullable();
            $table->json('validation')->nullable();
            $table->json('correct_answer')->nullable();
            $table->text('explanation')->nullable();
            $table->integer('points')->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('form_id')->references('id')->on('forms')->onDelete('cascade');
            $table->index(['form_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
