import { create } from 'zustand';

export const useFormStore = create((set, get) => ({
  // Current form being edited
  form: null,
  questions: [],
  isDirty: false,
  isSaving: false,
  
  // Selected question
  selectedQuestionId: null,

  // Set form
  setForm: (form) => {
    set({ form, questions: form?.questions || [], isDirty: false });
  },

  // Update form
  updateForm: (updates) => {
    set((state) => ({
      form: { ...state.form, ...updates },
      isDirty: true,
    }));
  },

  // Add question
  addQuestion: (question) => {
    set((state) => ({
      questions: [...state.questions, question],
      isDirty: true,
    }));
  },

  // Update question
  updateQuestion: (id, updates) => {
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
      isDirty: true,
    }));
  },

  // Delete question
  deleteQuestion: (id) => {
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
      selectedQuestionId: state.selectedQuestionId === id ? null : state.selectedQuestionId,
      isDirty: true,
    }));
  },

  // Reorder questions
  reorderQuestions: (newOrder) => {
    set({ questions: newOrder, isDirty: true });
  },

  // Select question
  selectQuestion: (id) => {
    set({ selectedQuestionId: id });
  },

  // Get selected question
  getSelectedQuestion: () => {
    const { questions, selectedQuestionId } = get();
    return questions.find((q) => q.id === selectedQuestionId);
  },

  // Clear form
  clearForm: () => {
    set({ form: null, questions: [], isDirty: false, selectedQuestionId: null });
  },

  // Mark as saved
  markAsSaved: () => {
    set({ isDirty: false });
  },

  // Set saving state
  setSaving: (isSaving) => {
    set({ isSaving });
  },
}));

export default useFormStore;
