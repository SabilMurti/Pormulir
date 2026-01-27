@component('mail::message')
# Thank You, {{ $respondentName }}!

{{ $confirmationMessage }}

## Submission Details
- **Form:** {{ $formTitle }}
- **Submitted:** {{ $submittedAt }}
- **Time Spent:** {{ $timeSpent }}

@if($score !== null)
## Your Results
- **Score:** {{ $score }}
@if($passed !== null)
- **Status:** {{ $passed ? '✅ Passed' : '❌ Did not pass' }}
@endif
@endif

Thanks for your submission!<br>
{{ config('app.name') }}
@endcomponent
