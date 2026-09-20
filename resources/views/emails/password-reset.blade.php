<!DOCTYPE html>
<html>
<head>
    <title>Password Reset Request</title>
</head>
<body>
    <h2>Password Reset Request</h2>
    <p>Dear {{ $userName }},</p>
    <p>You requested to reset your password. Click the link below to proceed:</p>
    <p><a href="{{ $resetUrl }}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
</body>
</html>