import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl
import certifi

# --- Load config ---
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")  # Only for SMTP
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

# --- Set SSL environment for local dev (optional, helps cert verification) ---
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()


def verify_email(email: str) -> str | None:

    otp = str(random.randint(100000, 999999))

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px;">
        <div style="max-width: 520px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">
            Welcome to <span style="color:#4CAF50;">Strandify</span>
          </h2>
          <p style="font-size: 16px; color: #333; text-align: center;">
            To finish setting up your account, please use the following
            <strong>One-Time Password (OTP)</strong>:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4CAF50; padding: 12px 20px; border: 2px solid #4CAF50; border-radius: 6px; display: inline-block;">
              {otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #555; text-align: center;">
            This code will expire in <strong>5 minutes</strong>.<br>
            If you did not request this, you can safely ignore this email.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 13px; color: #999; text-align: center;">
            &copy; {2025} Strandify. All rights reserved.<br>
            Please do not share this code with anyone.
          </p>
        </div>
      </body>
    </html>
    """

    # --- Use SendGrid API if key is available ---
    if SENDGRID_API_KEY:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email=SENDER_EMAIL,
                to_emails=email,
                subject="🔑 Strandify - Verify Your Email",
                html_content=html_content
            )
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            sg.send(message)
            return otp
        except Exception as e:
            print("SendGrid error:", e)
            return None

    # --- Fallback to SMTP (local dev) ---
    else:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "🔑 Strandify - Verify Your Email"
            msg["From"] = SENDER_EMAIL
            msg["To"] = email
            msg.attach(MIMEText(html_content, "html"))

            context = ssl.create_default_context(cafile=certifi.where())
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SENDER_EMAIL, APP_PASSWORD)
                server.sendmail(SENDER_EMAIL, [email], msg.as_string())

            return otp
        except Exception as e:
            print("SMTP error:", e)
            return None
