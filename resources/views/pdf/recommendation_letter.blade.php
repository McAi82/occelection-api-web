<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Recommendation Letter</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            margin: 40px;
            color: #1a1a1a;
            line-height: 1.6;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #1a1a1a;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 22px;
            margin: 0;
            letter-spacing: 1px;
        }

        .header p {
            margin: 4px 0;
            font-size: 14px;
        }

        .content {
            margin: 30px 0;
        }

        .content p {
            font-size: 14px;
            text-align: justify;
        }

        .signature {
            margin-top: 50px;
            text-align: right;
        }

        .signature .line {
            border-top: 1px solid #1a1a1a;
            width: 250px;
            display: inline-block;
            margin-top: 40px;
        }

        .signature .label {
            font-size: 12px;
            margin-top: 4px;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #555;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }

        .details {
            margin: 20px 0;
        }

        .details td {
            padding: 4px 8px;
        }

        .details .label {
            font-weight: bold;
            width: 120px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Republic of the Philippines</h1>
        <h2>Opol Community College</h2>
        <p>Opol, Misamis Oriental</p>
        <h3 style="margin-top: 10px;">RECOMMENDATION LETTER FOR CANDIDACY</h3>
    </div>

    <div class="content">
        <p>Date: <strong>{{ $date }}</strong></p>
        <p>To the Commission on Elections (COMELEC),</p>
        <p>This is to recommend <strong>{{ $user->first_name }} {{ $user->last_name }}</strong> (Student ID: {{ $user->student_id }}) as a candidate for the position of <strong>{{ $form['selectedPosition'] ?? 'N/A' }}</strong> in the upcoming {{ $election->title }}.</p>

        <p>The applicant has submitted the required application form and has been verified by the administration. We find the applicant to be a bona fide student of Opol Community College with good moral character and academic standing.</p>

        <p>We recommend the applicant for consideration by the COMELEC for final approval.</p>

        <div class="details">
            <table>
                <tr>
                    <td class="label">Name:</td>
                    <td>{{ $user->first_name }} {{ $user->last_name }}</td>
                </tr>
                <tr>
                    <td class="label">Student No.:</td>
                    <td>{{ $user->student_id }}</td>
                </tr>
                <tr>
                    <td class="label">Course:</td>
                    <td>{{ $form['course'] ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Year Level:</td>
                    <td>{{ $form['currentYear'] ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Position:</td>
                    <td>{{ $form['positionCSG'] ? 'CSG' : ($form['positionSC'] ? 'Student Council' : '') }}</td>
                </tr>
                <tr>
                    <td class="label">Department:</td>
                    <td>{{ $form['department'] ?? 'N/A' }}</td>
                </tr>
            </table>
        </div>

        <p>We hope for your favorable action on this application.</p>
    </div>

    <div class="signature">
        <div>
            <div class="line"></div>
            <div class="label">Signature of Administrator</div>
            <div style="margin-top: 8px;"><strong>{{ $application->adminApprovedBy ? $application->adminApprovedBy->first_name . ' ' . $application->adminApprovedBy->last_name : 'Admin' }}</strong></div>
            <div style="font-size: 12px;">Date: {{ $application->admin_approved_at ? $application->admin_approved_at->format('F d, Y') : '' }}</div>
        </div>
    </div>

    <div class="footer">
        This is a system-generated document. No signature is required for digital copy.
    </div>
</body>

</html>