<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFormRequest;
use App\Http\Requests\UpdateFormRequest;
use App\Http\Resources\FormResource;
use App\Models\Form;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class FormController extends Controller
{
    public function index(Request $request, Workspace $workspace): AnonymousResourceCollection
    {
        $this->authorize('view', $workspace);

        $forms = $workspace->forms()
            ->withCount(['questions', 'sessions'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return FormResource::collection($forms);
    }

    public function listAll(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        
        // Get all forms from workspaces where user is a member
        $forms = Form::whereHas('workspace', function ($query) use ($user) {
            $query->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        })
        ->withCount(['questions', 'sessions'])
        ->orderBy('updated_at', 'desc')
        ->get();

        return FormResource::collection($forms);
    }

    public function storeStandalone(StoreFormRequest $request): FormResource
    {
        // Require workspace_id in body
        $request->validate(['workspace_id' => 'required|exists:workspaces,id']);
        
        $workspace = Workspace::findOrFail($request->workspace_id);
        $this->authorize('update', $workspace);

        $form = new Form($request->validated());
        $form->workspace_id = $workspace->id;
        $form->created_by = $request->user()->id;
        $form->slug = Str::slug($form->title) . '-' . Str::random(8);
        $form->settings = $form->getDefaultSettings();
        $form->save();

        return new FormResource($form->load('creator'));
    }

    public function store(StoreFormRequest $request, Workspace $workspace): FormResource
    {
        $this->authorize('update', $workspace);

        $form = new Form($request->validated());
        $form->workspace_id = $workspace->id;
        $form->created_by = $request->user()->id;
        $form->slug = Str::slug($form->title) . '-' . Str::random(8);
        $form->settings = $form->getDefaultSettings();
        $form->save();

        return new FormResource($form->load('creator'));
    }

    public function show(Form $form): FormResource
    {
        $this->authorize('view', $form->workspace);

        return new FormResource(
            $form->load(['creator', 'questions.options', 'workspace'])
                ->loadCount('sessions')
        );
    }

    public function update(UpdateFormRequest $request, Form $form): FormResource
    {
        $this->authorize('update', $form->workspace);

        $form->update($request->validated());

        return new FormResource($form->load('creator'));
    }

    public function destroy(Form $form): JsonResponse
    {
        $this->authorize('update', $form->workspace);

        $form->delete();

        return response()->json(['message' => 'Form deleted successfully']);
    }

    public function duplicate(Request $request, Form $form): FormResource
    {
        $this->authorize('update', $form->workspace);

        $newForm = $form->replicate();
        $newForm->title = $form->title . ' (Copy)';
        $newForm->slug = Str::slug($newForm->title) . '-' . Str::random(8);
        $newForm->status = 'draft';
        $newForm->created_by = $request->user()->id;
        $newForm->save();

        // Duplicate questions and options
        foreach ($form->questions as $question) {
            $newQuestion = $question->replicate();
            $newQuestion->form_id = $newForm->id;
            $newQuestion->save();

            foreach ($question->options as $option) {
                $newOption = $option->replicate();
                $newOption->question_id = $newQuestion->id;
                $newOption->save();
            }
        }

        return new FormResource($newForm->load(['creator', 'questions.options']));
    }

    public function publish(Form $form): FormResource
    {
        $this->authorize('update', $form->workspace);

        $form->update(['status' => 'published']);

        return new FormResource($form);
    }

    public function close(Form $form): FormResource
    {
        $this->authorize('update', $form->workspace);

        $form->update(['status' => 'closed']);

        return new FormResource($form);
    }
}
