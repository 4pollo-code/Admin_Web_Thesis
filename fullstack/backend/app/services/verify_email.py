import smtplib
from email.mime.text import MIMEText
import random
import app.config as Config
import os

smtp_server = Config.Config.SMTP_SERVER
smtp_port = Config.Config.SMTP_PORT
sender_email = Config.Config.SENDER_EMAIL
password = os.getenv("APP_PASSWORD")

def verify_email(email: str):
    otp = str(random.randint(100000, 999999))

    # Build message
    msg = MIMEText(f"This is your OTP: {otp}. Do not share this with anyone.")
    msg["Subject"] = "Verify your email"
    msg["From"] = sender_email
    msg["To"] = email  # keep it as a plain string

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, password)

        # sendmail still expects a list of recipients, so wrap `email`
        server.sendmail(sender_email, [email], msg.as_string())
        server.quit()

        return otp
    except Exception as e:
        print("Error sending email:", e)
        return None
