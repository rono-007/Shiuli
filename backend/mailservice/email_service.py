import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

def get_smtp_config():
    load_dotenv(override=True)
    return {
        "host": os.getenv("SMTP_HOST", "smtp.hostinger.com"),
        "port": int(os.getenv("SMTP_PORT", "465")),
        "email": os.getenv("SMTP_EMAIL", ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from_name": os.getenv("FROM_NAME", "Shiuli"),
        "beta_url": os.getenv("BETA_ACCESS_URL", "https://beta.shiuli.online"),
    }

def render_email_template(name: str, pin: str, email: str = "") -> str:
    config = get_smtp_config()
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
            
    html_content = html_content.replace("{{beta_url}}", config["beta_url"])
    return html_content

def send_beta_email(to_email: str, name: str, pin: str) -> bool:
    config = get_smtp_config()
    smtp_email = config["email"]
    smtp_password = config["password"]

    if not smtp_email or not smtp_password:
        raise ValueError("SMTP credentials (SMTP_EMAIL and SMTP_PASSWORD) are not configured in environment variables.")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Shiuli Beta Access PIN"
        msg["From"] = f"{config['from_name']} <{smtp_email}>"
        msg["To"] = to_email

        html_content = render_email_template(name, pin, to_email)
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP_SSL(config["host"], config["port"], timeout=10) as server:
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())
            
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")
        raise e
