import email
from email import policy
import csv
import io
import json
import hashlib
from typing import Dict, Any, List

def parse_eml(raw_content: bytes) -> Dict[str, Any]:
    msg = email.message_from_bytes(raw_content, policy=policy.default)
    
    headers = {
        "from": msg.get("From", ""),
        "to": msg.get("To", ""),
        "cc": msg.get("Cc", ""),
        "bcc": msg.get("Bcc", ""),
        "subject": msg.get("Subject", ""),
        "date": msg.get("Date", ""),
        "message_id": msg.get("Message-ID", ""),
        "reply_to": msg.get("Reply-To", ""),
        "received": [str(h) for h in msg.get_all("Received", [])]
    }

    body = ""
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            
            if "attachment" in content_disposition:
                filename = part.get_filename() or f"attachment_{len(attachments)+1}.dat"
                payload = part.get_payload(decode=True) or b""
                sha256 = hashlib.sha256(payload).hexdigest()
                attachments.append({
                    "filename": filename,
                    "content_type": content_type,
                    "size": len(payload),
                    "sha256": sha256
                })
            elif content_type == "text/plain" and not body:
                body = part.get_payload(decode=True).decode(errors="replace")
            elif content_type == "text/html" and not body:
                # Sanitized HTML body
                body = part.get_payload(decode=True).decode(errors="replace")
    else:
        body = msg.get_payload(decode=True).decode(errors="replace")

    return {
        "headers": headers,
        "body": body,
        "attachments": attachments
    }

def parse_csv_dataset(content_str: str) -> List[Dict[str, str]]:
    reader = csv.DictReader(io.StringIO(content_str))
    return [row for row in reader]

def extract_image_exif_metadata(exif_dict: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "metadata_type": "Embedded file metadata",
        "notice": "EXIF metadata is unverified file telemetry - requires investigator confirmation",
        "data": exif_dict
    }
