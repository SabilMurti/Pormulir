import { useFormStore } from '../stores/formStore';
import { useCallback } from 'react';
import formService from '../services/form';
import questionService from '../services/question';

export function useForm() {
  const store = useFormStore();

  const loadForm = useCallback(async (formId) => {
    try {
      const { data } = await formService.get(formId);
      store.setForm(data);
      return data;
    } catch (err) {
      console.error('Failed to load form:', err);
      throw err;
    }
  }, [store]);

  const saveForm = useCallback(async () => {
    if (!store.form || !store.isDirty) return;
    
    store.setSaving(true);
    try {
      await formService.update(store.form.id, {
        title: store.form.title,
        description: store.form.description,
        settings: store.form.settings,
      });
      store.markAsSaved();
    } catch (err) {
      console.error('Failed to save form:', err);
      throw err;
    } finally {
      store.setSaving(false);
    }
  }, [store]);

  const addQuestion = useCallback(async (type) => {
    if (!store.form) return;
    
    const newQuestion = {
      id: `temp-${Date.now()}`,
      type,
      content: '',
      description: '',
      points: 0,
      options: type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown'
        ? [{ id: `opt-${Date.now()}`, content: '', is_correct: false }]
        : null,
    };
    
    store.addQuestion(newQuestion);
    store.selectQuestion(newQuestion.id);
    
    return newQuestion;
  }, [store]);

  const saveQuestion = useCallback(async (question) => {
    if (!store.form) return;
    
    try {
      if (question.id.startsWith('temp-')) {
        // Create new question
        const created = await questionService.create(store.form.id, question);
        store.updateQuestion(question.id, { ...created, id: created.id });
      } else {
        // Update existing question
        await questionService.update(question.id, question);
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      throw err;
    }
  }, [store]);

  const deleteQuestion = useCallback(async (questionId) => {
    if (questionId.startsWith('temp-')) {
      store.deleteQuestion(questionId);
      return;
    }
    
    try {
      await questionService.delete(questionId);
      store.deleteQuestion(questionId);
    } catch (err) {
      console.error('Failed to delete question:', err);
      throw err;
    }
  }, [store]);

  return {
    form: store.form,
    questions: store.questions,
    selectedQuestionId: store.selectedQuestionId,
    selectedQuestion: store.getSelectedQuestion(),
    isDirty: store.isDirty,
    isSaving: store.isSaving,
    loadForm,
    saveForm,
    addQuestion,
    updateQuestion: store.updateQuestion,
    deleteQuestion,
    selectQuestion: store.selectQuestion,
    reorderQuestions: store.reorderQuestions,
    updateForm: store.updateForm,
    clearForm: store.clearForm,
  };
}

export default useForm;
