import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.hostinger.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME = os.getenv("FROM_NAME", "Shiuli")
BETA_ACCESS_URL = os.getenv("BETA_ACCESS_URL", "https://beta.shiuli.online")

def render_email_template(name: str, pin: str, email: str = "") -> str:
    template_path = os.path.join(os.path.dirname(__file__), "templates", "beta_access.html")
    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Ensure pin is exactly 5 digits for the placeholders, pad if needed
    pin_str = str(pin).strip().zfill(5)
    
    html_content = html_content.replace("{{name}}", name)
    html_content = html_content.replace("{{email}}", email)
    for i in range(5):
        if i < len(pin_str):
            html_content = html_content.replace(f"{{{{pin_{i+1}}}}}", pin_str[i])
        else:
            html_content = html_content.replace(f"{{{{pin_{i+1}}}}}", "0")
            
    html_content = html_content.replace("{{beta_url}}", BETA_ACCESS_URL)
    return html_content

def send_beta_email(to_email: str, name: str, pin: str) -> bool:
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise ValueError("SMTP credentials are not configured in environment variables.")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Shiuli Beta Access PIN"
        msg["From"] = f"{FROM_NAME} <{SMTP_EMAIL}>"
        msg["To"] = to_email

        html_content = render_email_template(name, pin, to_email)
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
            
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")
        raise e
