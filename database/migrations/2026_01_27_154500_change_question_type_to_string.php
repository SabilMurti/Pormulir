<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Change enum to string to support more types easily
            $table->string('type')->change();
        });
    }

    public function down(): void
    {
        // Revert to enum if possible
        Schema::table('questions', function (Blueprint $table) {
             // Changing back to enum is risky if data exists outside enum values.
             // We'll define a larger enum if reverting.
             $table->enum('type', [
                'short_text', 'long_text', 'multiple_choice', 'checkboxes',
                'dropdown', 'number', 'email', 'phone', 'date', 'time',
                'file_upload', 'rating', 'scale', 'section', 'image', 'video', 'matrix'
            ])->change();
        });
    }
};
