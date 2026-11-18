<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouveau message</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:25px;color:#1e293b">
    <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px">
        <h2 style="color:#2563eb">Nouveau message de contact</h2>

        <p><strong>Nom :</strong> {{ $contact->name }}</p>
        <p><strong>Email :</strong> {{ $contact->email }}</p>
        <p><strong>Sujet :</strong> {{ $contact->subject }}</p>

        <hr style="border:0;border-top:1px solid #e2e8f0">

        <h3>Message :</h3>
        <p style="white-space:pre-wrap">{{ $contact->message }}</p>

        <p style="font-size:12px;color:#64748b">
            Message #{{ $contact->id }} — Consultez votre dashboard Admin.
        </p>
    </div>
</body>
</html>
