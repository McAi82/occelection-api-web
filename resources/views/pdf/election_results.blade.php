<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Election Results - {{ $data->title }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 3px 0; color: #666; }
        .position-section { margin-top: 20px; }
        .position-title { font-size: 14px; font-weight: bold; background: #e9ecef; padding: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        th { background: #4a90d9; color: white; padding: 6px; text-align: left; }
        td { padding: 5px 8px; border-bottom: 1px solid #ddd; }
        .winner { background: #d4edda; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $data->title }}</h1>
        <p>Type: {{ $data->election_type }} | Status: {{ ucfirst($data->status) }}</p>
        <p>{{ \Carbon\Carbon::parse($data->voting_start)->format('M d, Y') }} - {{ \Carbon\Carbon::parse($data->voting_end)->format('M d, Y') }}</p>
    </div>

    @foreach($data->positions as $position)
    <div class="position-section">
        <div class="position-title">{{ $position->title }}</div>
        <table>
            <thead>
                <tr>
                    <th>Candidate</th>
                    <th>Partylist</th>
                    <th>Votes</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($position->candidates as $candidate)
                <tr class="{{ $candidate->winner ? 'winner' : '' }}">
                    <td>{{ $candidate->first_name }} {{ $candidate->last_name }}</td>
                    <td>{{ $candidate->partylist_name ?? 'Independent' }}</td>
                    <td>{{ $candidate->votes }}</td>
                    <td>{{ $candidate->winner ? '🏆 Winner' : '' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endforeach

    <div class="footer">
        Generated on {{ now()->format('F d, Y h:i A') }} | Opol Community College Election System
    </div>
</body>
</html>