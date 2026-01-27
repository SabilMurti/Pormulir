@component('mail::message')
# New Form Submission

**{{ $formTitle }}** has received a new response.

## Respondent Details
- **Name:** {{ $respondentName }}
- **Email:** {{ $respondentEmail }}
- **Submitted:** {{ $submittedAt }}
- **Time Spent:** {{ $timeSpent }}
@if($score)
- **Score:** {{ $score }}
@endif

@component('mail::button', ['url' => $formUrl])
View All Responses
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
