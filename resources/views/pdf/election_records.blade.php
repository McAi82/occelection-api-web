<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Election Records {{ $year }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #4a90d9; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
        .summary { margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .summary-item { display: inline-block; margin-right: 30px; }
        .summary-item strong { font-size: 16px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Election Records - Year {{ $year }}</h1>
        <p>Generated on {{ now()->format('F d, Y') }}</p>
    </div>

    <div class="summary">
        <span class="summary-item">Total Elections: <strong>{{ $data->total_elections }}</strong></span>
        <span class="summary-item">Total Voters: <strong>{{ $data->total_voters }}</strong></span>
        <span class="summary-item">Votes Cast: <strong>{{ $data->total_votes_cast }}</strong></span>
        <span class="summary-item">Avg Turnout: <strong>{{ $data->avg_turnout }}%</strong></span>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Election Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Positions</th>
                <th>Candidates</th>
                <th>Voters</th>
                <th>Votes Cast</th>
                <th>Turnout</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data->elections as $index => $election)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $election->title }}</td>
                <td>{{ $election->election_type }}</td>
                <td>{{ ucfirst($election->status) }}</td>
                <td>{{ $election->positions_count }}</td>
                <td>{{ $election->candidates_count }}</td>
                <td>{{ $election->voters_total }}</td>
                <td>{{ $election->voters_voted }}</td>
                <td>{{ $election->turnout_percentage }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>