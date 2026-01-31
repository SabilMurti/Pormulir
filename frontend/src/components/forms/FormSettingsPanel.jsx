import { X, Settings, Clock, Shield, Bell, Shuffle, Lock } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/helpers';

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'exam', label: 'Exam Mode', icon: Clock },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function FormSettingsPanel({ isOpen, onClose, settings, onUpdate, maxResponses, onMaxResponsesChange }) {
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const handleToggle = (section, key) => {
    onUpdate({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: !settings[section]?.[key],
      },
    });
  };

  const handleChange = (section, key, value) => {
    onUpdate({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Form Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Form Behavior */}
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Form Behavior</h3>
                <div className="space-y-4">
                  <SettingItem
                    title="Shuffle Questions"
                    description="Randomize question order for each respondent"
                    checked={settings?.general?.shuffle_questions}
                    onChange={() => handleToggle('general', 'shuffle_questions')}
                  />
                  <SettingItem
                    title="Shuffle Options"
                    description="Randomize answer options for multiple choice questions"
                    checked={settings?.general?.shuffle_options}
                    onChange={() => handleToggle('general', 'shuffle_options')}
                  />
                  <SettingItem
                    title="Limit One Response"
                    description="Each person can only submit once"
                    checked={settings?.general?.limit_one_response}
                    onChange={() => handleToggle('general', 'limit_one_response')}
                  />
                  <SettingItem
                    title="Show Progress Bar"
                    description="Display completion progress to respondents"
                    checked={settings?.general?.show_progress}
                    onChange={() => handleToggle('general', 'show_progress')}
                  />
                  <SettingItem
                    title="Collect Email"
                    description="Ask respondents for their email address"
                    checked={settings?.general?.collect_email}
                    onChange={() => handleToggle('general', 'collect_email')}
                    disabled={settings?.general?.require_login} // Disable if login required
                  />
                  <SettingItem
                    title="Require Google Login"
                    description="Respondents must verify identity with Google"
                    checked={settings?.general?.require_login}
                    onChange={() => {
                        const newRequireLogin = !settings?.general?.require_login;
                        onUpdate({
                          ...settings,
                          general: {
                            ...settings?.general,
                            require_login: newRequireLogin,
                            // If enabling login, auto-enable collect email
                            ...(newRequireLogin && { collect_email: true }),
                          },
                        });
                    }}
                  />
                </div>
              </div>

              {/* Response Limits */}
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Response Limits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Max Total Responses
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={100000}
                      value={maxResponses || ''}
                      onChange={(e) => onMaxResponsesChange?.(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Unlimited (leave empty)"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Form will automatically close when this limit is reached.
                    </p>
                  </div>
                  
                  {settings?.general?.limit_one_response && settings?.general?.require_login && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-sm text-emerald-700">
                        ✓ <strong>One response per user enabled.</strong> Users must log in with Google and can only submit once.
                      </p>
                    </div>
                  )}
                  
                  {settings?.general?.limit_one_response && !settings?.general?.require_login && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-700">
                        ⚠️ <strong>Tip:</strong> Enable "Require Google Login" for more reliable duplicate prevention.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* After Submit Results */}
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">After Submit</h3>
                <div className="space-y-4">
                  <SettingItem
                    title="Show Score"
                    description="Display score immediately after submission"
                    checked={settings?.general?.show_score_after}
                    onChange={() => handleToggle('general', 'show_score_after')}
                  />
                  <SettingItem
                    title="Show Correct Answers"
                    description="Display correct/incorrect answers with explanations"
                    checked={settings?.general?.show_correct_answers}
                    onChange={() => handleToggle('general', 'show_correct_answers')}
                  />
                  <SettingItem
                    title="Allow Resubmit"
                    description="Allow respondents to submit another response"
                    checked={settings?.general?.allow_resubmit}
                    onChange={() => handleToggle('general', 'allow_resubmit')}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Thank You Message
                    </label>
                    <Input
                      value={settings?.general?.confirmation_message || ''}
                      onChange={(e) => handleChange('general', 'confirmation_message', e.target.value)}
                      placeholder="Thank you for your submission!"
                    />
                  </div>
                </div>
              </div>

              {/* Passing Score */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Grading</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Passing Score (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings?.general?.passing_score || ''}
                    onChange={(e) => handleChange('general', 'passing_score', parseInt(e.target.value) || null)}
                    placeholder="e.g., 70 (leave empty for no pass/fail)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Set a minimum score to pass. Leave empty to disable pass/fail indicator.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exam' && (
            <div className="space-y-6">
              <SettingItem
                title="Enable Exam Mode"
                description="Add time limit and anti-cheat features for exams"
                checked={settings?.exam_mode?.enabled}
                onChange={() => handleToggle('exam_mode', 'enabled')}
              />
              
              {settings?.exam_mode?.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Time Limit (minutes)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={settings?.exam_mode?.time_limit_minutes || ''}
                      onChange={(e) => handleChange('exam_mode', 'time_limit_minutes', parseInt(e.target.value))}
                      placeholder="e.g., 30"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Form will auto-submit when time runs out.
                    </p>
                  </div>
                </>
              )}

              {!settings?.exam_mode?.enabled && (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                  <p className="font-medium mb-2">💡 Exam Mode Features:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>Time limit for completing the form</li>
                    <li>Anti-cheat protection (fullscreen, tab switch detection)</li>
                    <li>Auto-submit when time runs out</li>
                  </ul>
                  <p className="mt-3 text-slate-400">
                    Note: Show score and correct answers can be enabled in General tab without Exam Mode.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <SettingItem
                title="Require Fullscreen"
                description="Force respondents to stay in fullscreen mode"
                checked={settings?.exam_mode?.anti_cheat?.fullscreen_required}
                onChange={() => handleChange('exam_mode', 'anti_cheat', {
                  ...settings?.exam_mode?.anti_cheat,
                  fullscreen_required: !settings?.exam_mode?.anti_cheat?.fullscreen_required,
                })}
              />
              <SettingItem
                title="Block Copy/Paste"
                description="Prevent copying question content"
                checked={settings?.exam_mode?.anti_cheat?.block_copy_paste}
                onChange={() => handleChange('exam_mode', 'anti_cheat', {
                  ...settings?.exam_mode?.anti_cheat,
                  block_copy_paste: !settings?.exam_mode?.anti_cheat?.block_copy_paste,
                })}
              />
              <SettingItem
                title="Detect Tab Switch"
                description="Monitor when respondents leave the exam page"
                checked={settings?.exam_mode?.anti_cheat?.detect_tab_switch}
                onChange={() => handleChange('exam_mode', 'anti_cheat', {
                  ...settings?.exam_mode?.anti_cheat,
                  detect_tab_switch: !settings?.exam_mode?.anti_cheat?.detect_tab_switch,
                })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Max Violations
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings?.exam_mode?.anti_cheat?.max_violations || 3}
                  onChange={(e) => handleChange('exam_mode', 'anti_cheat', {
                    ...settings?.exam_mode?.anti_cheat,
                    max_violations: parseInt(e.target.value),
                  })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Auto-submit after this many violations
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <SettingItem
                title="Notify on Submission"
                description="Send email when someone submits a response"
                checked={settings?.notifications?.notify_on_submission}
                onChange={() => handleToggle('notifications', 'notify_on_submission')}
              />
              <SettingItem
                title="Send Confirmation"
                description="Send confirmation email to respondents"
                checked={settings?.notifications?.send_confirmation}
                onChange={() => handleToggle('notifications', 'send_confirmation')}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ title, description, checked, onChange, disabled }) {
  return (
    <label className={cn("flex items-start gap-3", disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}>
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked || false}
        onChange={onChange}
        className="mt-1 w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
      />
      <div>
        <div className="font-medium text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
    </label>
  );
}

export default FormSettingsPanel;
