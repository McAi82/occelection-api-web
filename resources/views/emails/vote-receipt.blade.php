<!DOCTYPE html>
<html>
<head>
    <title>Your Voting Receipt</title>
</head>
<body>
    <h2>Thank You for Voting!</h2>
    <p>Dear {{ $userName }},</p>
    <p>This is your official receipt for voting in the <strong>{{ $electionTitle }}</strong>.</p>
    <p><strong>Receipt Code:</strong> {{ $receiptCode }}</p>
    <p><strong>Date:</strong> {{ $date }}</p>
    <p>Please keep this receipt for your records.</p>
    <hr>
    <p>Thank you for participating in the election!</p>
</body>
</html>