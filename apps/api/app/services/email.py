import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.settings import settings


def _send_sync(to: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_pass)
        server.sendmail(settings.smtp_from or settings.smtp_user, to, msg.as_string())


async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.smtp_host or not settings.smtp_user:
        return False
    await asyncio.to_thread(_send_sync, to, subject, html)
    return True
