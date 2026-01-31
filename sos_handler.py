"""
SOS Emergency Escalation Handler
=================================

Sends emergency alerts via SMS/call using Twilio.

CRITICAL DESIGN PRINCIPLE:
- Works on cellular network (SMS doesn't require data internet)
- Simple, clear emergency messages
- No diagnosis, no prescription - just urgency + vitals
- Respects professional boundaries
"""

import os
from typing import Dict, Optional

# Twilio import (optional - graceful fallback if not installed)
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False


class SOSHandler:
    """
    Sends emergency alerts via Twilio SMS/voice.
    
    Environment variables required:
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    - TWILIO_PHONE_NUMBER (system's Twilio number)
    - EMERGENCY_CONTACT_PHONE (recipient's phone number)
    - EMERGENCY_CONTACT_NAME (name of contact/authority)
    """
    
    def __init__(self):
        """Initialize Twilio client if credentials available."""
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.emergency_contact = os.getenv("EMERGENCY_CONTACT_PHONE")
        self.contact_name = os.getenv("EMERGENCY_CONTACT_NAME", "Emergency Authority")
        
        self.client = None
        self.is_configured = False
        
        if TWILIO_AVAILABLE and self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                self.is_configured = True
            except Exception as e:
                print(f"Warning: Twilio initialization failed: {e}")
                self.is_configured = False
    
    def format_sos_message(self, triage_result: Dict, language: str = "en") -> str:
        """
        Format emergency alert message from triage result.
        
        Args:
            triage_result: Output from triage_patient()
            language: Language code (en, hi, mr) - use English for emergency clarity
        
        Returns:
            str: Formatted SMS/alert message
        """
        priority = triage_result.get("priority", "UNKNOWN")
        score = triage_result.get("score", "?")
        reasons = triage_result.get("reasons", [])
        
        # Emergency messages always in English for clarity
        # (critical emergency info should not be ambiguous across languages)
        message_lines = [
            "EMERGENCY ALERT - MEDICAL TRIAGE",
            f"Priority: {priority} (Score: {score}/10)",
            ""
        ]
        
        # Add clinical findings (vitals already captured in reasons)
        if reasons:
            message_lines.append("Clinical Findings:")
            for reason in reasons[:3]:  # Limit to 3 most critical findings
                message_lines.append(f"• {reason}")
        
        message_lines.extend([
            "",
            "Immediate assistance required.",
            "Alert sent by Emergency Triage System",
            "SDG 3: Ensure healthy lives and promote well-being"
        ])
        
        return "\n".join(message_lines)
    
    def send_sms(self, triage_result: Dict, recipient_phone: Optional[str] = None) -> Dict:
        """
        Send SOS alert via SMS.
        
        Args:
            triage_result: Output from triage_patient()
            recipient_phone: Override recipient phone number
        
        Returns:
            dict: {
                "success": bool,
                "message": str,
                "sid": str (if successful),
                "error": str (if failed)
            }
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "Twilio not configured. Set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, EMERGENCY_CONTACT_PHONE"
            }
        
        target_phone = recipient_phone or self.emergency_contact
        if not target_phone:
            return {
                "success": False,
                "error": "No emergency contact phone number configured"
            }
        
        try:
            message_text = self.format_sos_message(triage_result)
            
            message = self.client.messages.create(
                body=message_text,
                from_=self.twilio_number,
                to=target_phone
            )
            
            return {
                "success": True,
                "message": f"SOS alert sent to {target_phone}",
                "sid": message.sid
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"SMS send failed: {str(e)}"
            }
    
    def send_voice_call(self, triage_result: Dict, recipient_phone: Optional[str] = None) -> Dict:
        """
        Send SOS alert via voice call with TwiML message.
        
        Args:
            triage_result: Output from triage_patient()
            recipient_phone: Override recipient phone number
        
        Returns:
            dict: {success: bool, message: str, sid: str (if successful)}
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "Twilio not configured"
            }
        
        target_phone = recipient_phone or self.emergency_contact
        if not target_phone:
            return {
                "success": False,
                "error": "No emergency contact phone number configured"
            }
        
        try:
            priority = triage_result.get("priority", "UNKNOWN")
            
            # Create TwiML message (voice-friendly)
            twiml_message = f"""
            <Response>
                <Say voice="alice">
                    Emergency Alert from Medical Triage System.
                    Priority Level: {priority}.
                    Immediate assistance required.
                    Check SMS for full clinical details.
                </Say>
            </Response>
            """
            
            call = self.client.calls.create(
                to=target_phone,
                from_=self.twilio_number,
                twiml=twiml_message
            )
            
            return {
                "success": True,
                "message": f"Voice alert call placed to {target_phone}",
                "sid": call.sid
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Voice call failed: {str(e)}"
            }
    
    def validate_phone_number(self, phone: str) -> bool:
        """
        Basic validation of phone number format.
        Should be in E.164 format: +[country code][number]
        Example: +919876543210 (India), +12025551234 (USA)
        """
        if not phone:
            return False
        
        # Check if starts with + and has 10-15 digits
        phone_cleaned = phone.replace(" ", "").replace("-", "")
        return phone_cleaned.startswith("+") and len(phone_cleaned) >= 11 and len(phone_cleaned) <= 15
    
    def get_configuration_status(self) -> Dict:
        """
        Return current SOS configuration status.
        Useful for debugging and UI display.
        """
        return {
            "twilio_installed": TWILIO_AVAILABLE,
            "credentials_configured": self.is_configured,
            "account_sid": "configured" if self.account_sid else "missing",
            "phone_number": self.twilio_number or "missing",
            "emergency_contact": self.emergency_contact or "missing",
            "contact_name": self.contact_name
        }


# Demo function for testing without Twilio
def demo_sos_message(triage_result: Dict) -> str:
    """
    Generate demo SOS message (for testing without Twilio).
    Shows what message would be sent.
    """
    handler = SOSHandler()
    return handler.format_sos_message(triage_result)


# ═══════════════════════════════════════════════════════════
# PUBLIC INTERFACE - send_sos_alert()
# This is the function called by app.py
# ═══════════════════════════════════════════════════════════

def send_sos_alert(triage_result: Dict, emergency_contact: str, twilio_config: Dict) -> Dict:
    """
    Send emergency alert via SMS or voice call.
    
    PUBLIC FUNCTION - Called from app.py
    
    Args:
        triage_result: Dict from triage_patient() with:
            - priority: "CRITICAL" | "MODERATE" | "STABLE"
            - score: 0-10
            - reasons: list of clinical findings
            - recommended_action: str
        emergency_contact: Phone number to contact (e.g., "+91-9876543210" or "112")
        twilio_config: Dict with:
            - account_sid: Twilio Account SID
            - auth_token: Twilio Auth Token
            - from_phone: Twilio sender phone number (optional if messaging_service_sid provided)
            - messaging_service_sid: Twilio Messaging Service SID (optional)
    
    Returns:
        Dict with:
            - status: "sent" or "failed"
            - message: Formatted alert message
            - error: (optional) Error message if failed
    """
    
    # Create handler and use it
    handler = SOSHandler()
    
    # Check if Twilio is configured
    account_sid = twilio_config.get('account_sid')
    auth_token = twilio_config.get('auth_token')
    from_phone = twilio_config.get('from_phone')
    messaging_service_sid = twilio_config.get('messaging_service_sid')
    
    # If not configured, return helpful message
    if not (account_sid and auth_token and (from_phone or messaging_service_sid)):
        # Format the message anyway for preview
        message = handler.format_sos_message(triage_result)
        return {
            'status': 'failed',
            'message': message,
            'error': 'Twilio not configured. Set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and either TWILIO_FROM_PHONE or TWILIO_MESSAGING_SERVICE_SID'
        }
    
    # Try to send via Twilio
    try:
        # Try SMS first
        if TWILIO_AVAILABLE:
            client = Client(account_sid, auth_token)
            message_text = handler.format_sos_message(triage_result)
            
            try:
                # Use Messaging Service SID if available, otherwise use from_phone
                if messaging_service_sid:
                    msg = client.messages.create(
                        body=message_text,
                        messaging_service_sid=messaging_service_sid,
                        to=emergency_contact
                    )
                else:
                    msg = client.messages.create(
                        body=message_text,
                        from_=from_phone,
                        to=emergency_contact
                    )
                
                return {
                    'status': 'sent',
                    'message': message_text,
                    'method': 'SMS',
                    'twilio_sid': msg.sid
                }
            except Exception as sms_error:
                # SMS failed, try voice call (only with from_phone)
                if from_phone:
                    try:
                        call = client.calls.create(
                            url='https://demo.twilio.com/docs/voice.xml',
                            to=emergency_contact,
                            from_=from_phone
                        )
                        
                        return {
                            'status': 'sent',
                            'message': message_text,
                            'method': 'Voice Call (SMS fallback)',
                            'twilio_sid': call.sid
                        }
                    except Exception as call_error:
                        return {
                            'status': 'failed',
                            'message': message_text,
                            'error': f'SMS failed: {str(sms_error)}\nVoice call failed: {str(call_error)}'
                        }
                else:
                    return {
                        'status': 'failed',
                        'message': message_text,
                        'error': f'SMS failed: {str(sms_error)}'
                    }
        else:
            message_text = handler.format_sos_message(triage_result)
            return {
                'status': 'failed',
                'message': message_text,
                'error': 'Twilio library not installed'
            }
    
    except Exception as e:
        message_text = handler.format_sos_message(triage_result)
        return {
            'status': 'failed',
            'message': message_text,
            'error': f'Error: {str(e)}'
        }


if __name__ == "__main__":
    # Test
    print("SOS Handler Module Loaded")
    print(f"Twilio Available: {TWILIO_AVAILABLE}")
    
    # Demo triage result
    demo_result = {
        "priority": "CRITICAL",
        "score": 10,
        "reasons": [
            "Oxygen saturation critically low (below 90%) - respiratory system severely compromised",
            "Blood pressure critically low (below 90 mmHg) - tissue perfusion compromised"
        ]
    }
    
    print("\nDemo SOS Message:")
    handler = SOSHandler()
    print(handler.format_sos_message(demo_result))
    
    # Check configuration
    print("\nConfiguration Status:")
    print(handler.get_configuration_status())
