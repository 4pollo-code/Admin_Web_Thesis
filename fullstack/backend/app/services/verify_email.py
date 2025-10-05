import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import app.config as Config
import os

smtp_server = Config.Config.SMTP_SERVER
smtp_port = Config.Config.SMTP_PORT
sender_email = Config.Config.SENDER_EMAIL
password = os.getenv("APP_PASSWORD")

def verify_email(email: str):
    otp = str(random.randint(100000, 999999))

    # Build the HTML email body
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

    # Create a MIME multipart message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "🔑 Strandify - Verify Your Email"
    msg["From"] = sender_email
    msg["To"] = email

    # Attach HTML body
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, password)

        server.sendmail(sender_email, [email], msg.as_string())
        server.quit()

        return otp
    except Exception as e:
        print("Error sending email:", e)
        return None
