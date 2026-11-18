<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Réponse à votre demande</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:25px;color:#1e293b">
    <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px">
        <h2 style="color:#2563eb">Réponse à votre message</h2>

        <p>Bonjour {{ $contact->name }},</p>

        <p style="white-space:pre-wrap;line-height:1.7">
            {{ $replyBody }}
        </p>

        <hr style="border:0;border-top:1px solid #e2e8f0">

        <p style="font-size:12px;color:#64748b">
            Votre demande initiale : {{ $contact->subject }}
        </p>

        <p>Cordialement,<br>L'équipe Gym</p>
    </div>
</body>
</html>
