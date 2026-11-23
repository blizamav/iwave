"""Sonda sin credenciales: TLS/STARTTLS, EHLO y QUIT; nunca autentica ni envía."""
import concurrent.futures
import json
import smtplib
import ssl


def probe(port):
    try:
        context = ssl.create_default_context()
        if port == 465:
            client = smtplib.SMTP_SSL("smtp.zoho.com", port, timeout=8, context=context)
        else:
            client = smtplib.SMTP("smtp.zoho.com", port, timeout=8)
            client.ehlo("contact-check.invalid")
            client.starttls(context=context)
        code, _ = client.ehlo("contact-check.invalid")
        result = {"host": "smtp.zoho.com", "port": port, "tls_verified": True,
                  "ehlo": code, "auth_methods": client.esmtp_features.get("auth", ""),
                  "authentication_attempted": False, "email_sent": False}
        client.quit()
        return result
    except Exception as error:
        return {"host": "smtp.zoho.com", "port": port, "result": type(error).__name__}


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for result in pool.map(probe, [465, 587]):
            print(json.dumps(result))
