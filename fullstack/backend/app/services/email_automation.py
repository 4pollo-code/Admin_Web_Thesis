import smtplib
from email.mime.text import MIMEText

smtp_server = "smtp.gmail.com"
smtp_port = 587
sender_email = "apollomarco1214@gmail.com"
receiver_email = ["tiangson.raphaelzoe@ue.edu.ph", "barreda.marsoncarl@ue.edu.ph"]

password = "iumq wgoa alpa wzct"  # use App Password, not your Gmail password

msg = MIMEText("This is a test email")
msg["Subject"] = "Test"
msg["From"] = sender_email
msg["To"] = ", ".join(receiver_email)

try:
    server = smtplib.SMTP(smtp_server, smtp_port)
    server.starttls()
    server.login(sender_email, password)
    for email in receiver_email:
        server.sendmail(sender_email, email, msg.as_string())
    server.quit()
    print("Email sent successfully")
except Exception as e:
    print("Error sending email:", e)

#working
