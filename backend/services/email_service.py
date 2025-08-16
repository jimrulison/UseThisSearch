import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class EmailService:
    """Simple email service for trial reminders"""
    
    def __init__(self):
        # Email configuration (these would come from environment variables in production)
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@usethissearch.com")
        self.from_name = os.getenv("FROM_NAME", "Use This Search")
    
    async def send_trial_reminder(self, user_email: str, user_name: str, days_remaining: int):
        """Send trial expiration reminder email"""
        try:
            subject = f"⏰ Your Use This Search trial expires in {days_remaining} day{'s' if days_remaining != 1 else ''}"
            
            html_content = f"""
            <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                        .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                        .header {{ text-align: center; margin-bottom: 30px; }}
                        .logo {{ color: #2563eb; font-size: 28px; font-weight: bold; margin-bottom: 10px; }}
                        .trial-warning {{ background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                        .cta-button {{ display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                        .features {{ background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                        .feature-item {{ margin: 10px 0; display: flex; align-items: center; }}
                        .checkmark {{ color: #10b981; margin-right: 10px; font-weight: bold; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">🔍 Use This Search</div>
                            <h2>Your trial is ending soon!</h2>
                        </div>
                        
                        <div class="trial-warning">
                            <h3>⏰ {days_remaining} Day{'s' if days_remaining != 1 else ''} Remaining</h3>
                            <p>Hi {user_name}, your free trial expires soon. Don't lose access to your valuable keyword research!</p>
                        </div>
                        
                        <p>You've been exploring the power of AI-driven keyword research with Use This Search. Here's what you'll keep access to when you upgrade:</p>
                        
                        <div class="features">
                            <div class="feature-item">
                                <span class="checkmark">✓</span>
                                <span>Unlimited keyword searches (currently limited to 25/day)</span>
                            </div>
                            <div class="feature-item">
                                <span class="checkmark">✓</span>
                                <span>ACCESS to GROUP KEYWORDS feature</span>
                            </div>
                            <div class="feature-item">
                                <span class="checkmark">✓</span>
                                <span>All 6 AI content generation tools</span>
                            </div>
                            <div class="feature-item">
                                <span class="checkmark">✓</span>
                                <span>Team collaboration features</span>
                            </div>
                            <div class="feature-item">
                                <span class="checkmark">✓</span>
                                <span>Priority customer support</span>
                            </div>
                            <div class="feature-item">
                                <span class="checkmark">✓</span>
                                <span>Keep all your search history and generated content</span>
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="#" class="cta-button">Upgrade Now - Starting at $29/month</a>
                        </div>
                        
                        <p><strong>Don't wait!</strong> If you don't upgrade within {days_remaining} day{'s' if days_remaining != 1 else ''}, your account will be suspended. Your data will be saved for 30 days, giving you time to upgrade and keep everything you've created.</p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                        
                        <p><small>Questions? Reply to this email or contact us at support@usethissearch.com</small></p>
                        <p><small>Use This Search - AI-Powered Keyword Research Platform</small></p>
                    </div>
                </body>
            </html>
            """
            
            text_content = f"""
            Hi {user_name},
            
            Your Use This Search free trial expires in {days_remaining} day{'s' if days_remaining != 1 else ''}!
            
            Don't lose access to:
            • Unlimited keyword searches
            • GROUP KEYWORDS feature
            • All AI content generation tools
            • Team collaboration
            • Your search history and content
            
            Upgrade now starting at just $29/month to keep everything you've built.
            
            If you don't upgrade within {days_remaining} day{'s' if days_remaining != 1 else ''}, your account will be suspended, but we'll save your data for 30 days.
            
            Questions? Contact us at support@usethissearch.com
            
            Best regards,
            The Use This Search Team
            """
            
            await self._send_email(user_email, subject, html_content, text_content)
            logger.info(f"Sent trial reminder to {user_email} - {days_remaining} days remaining")
            
        except Exception as e:
            logger.error(f"Failed to send trial reminder to {user_email}: {e}")
    
    async def send_trial_expired_notice(self, user_email: str, user_name: str):
        """Send trial expired notice"""
        try:
            subject = "🚨 Your Use This Search trial has expired"
            
            html_content = f"""
            <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                        .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                        .header {{ text-align: center; margin-bottom: 30px; }}
                        .logo {{ color: #2563eb; font-size: 28px; font-weight: bold; margin-bottom: 10px; }}
                        .expired-notice {{ background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                        .cta-button {{ display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                        .warning {{ background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">🔍 Use This Search</div>
                            <h2>Your trial has expired</h2>
                        </div>
                        
                        <div class="expired-notice">
                            <h3>🚨 Trial Expired</h3>
                            <p>Hi {user_name}, your 7-day free trial has ended and your account is now suspended.</p>
                        </div>
                        
                        <div class="warning">
                            <p><strong>⏰ You have 30 days to upgrade</strong></p>
                            <p>We're holding all your valuable data (search history, generated content, company settings) for 30 days. After that, it will be permanently deleted.</p>
                        </div>
                        
                        <p>Upgrade now to:</p>
                        <ul>
                            <li>Restore immediate access to your account</li>
                            <li>Keep all your search history and content</li>
                            <li>Remove the 25 searches/day limit</li>
                            <li>Access GROUP KEYWORDS feature</li>
                            <li>Get priority support</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="#" class="cta-button">Upgrade Now - Keep Your Data</a>
                        </div>
                        
                        <p>Don't wait - your data will be permanently deleted in 30 days if you don't upgrade.</p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                        
                        <p><small>Questions? Contact us at support@usethissearch.com</small></p>
                    </div>
                </body>
            </html>
            """
            
            text_content = f"""
            Hi {user_name},
            
            Your Use This Search free trial has expired and your account is now suspended.
            
            IMPORTANT: You have 30 days to upgrade before your data is permanently deleted.
            
            We're holding all your search history, generated content, and settings for 30 days.
            
            Upgrade now to restore access and keep everything you've built.
            
            Plans start at just $29/month.
            
            Questions? Contact us at support@usethissearch.com
            
            The Use This Search Team
            """
            
            await self._send_email(user_email, subject, html_content, text_content)
            logger.info(f"Sent trial expired notice to {user_email}")
            
        except Exception as e:
            logger.error(f"Failed to send trial expired notice to {user_email}: {e}")
    
    async def send_data_deletion_warning(self, user_email: str, user_name: str, days_until_deletion: int):
        """Send final warning before data deletion"""
        try:
            subject = f"🚨 FINAL WARNING: Your data will be deleted in {days_until_deletion} days"
            
            html_content = f"""
            <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                        .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                        .header {{ text-align: center; margin-bottom: 30px; }}
                        .logo {{ color: #2563eb; font-size: 28px; font-weight: bold; margin-bottom: 10px; }}
                        .danger-notice {{ background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                        .cta-button {{ display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">🔍 Use This Search</div>
                            <h2>FINAL WARNING</h2>
                        </div>
                        
                        <div class="danger-notice">
                            <h3>🚨 Data Deletion in {days_until_deletion} Days</h3>
                            <p>Hi {user_name}, this is your final warning. Your account data will be permanently deleted in {days_until_deletion} days.</p>
                        </div>
                        
                        <p><strong>What will be deleted:</strong></p>
                        <ul>
                            <li>All your keyword research and search history</li>
                            <li>Generated blog titles, social posts, and content</li>
                            <li>Company settings and team data</li>
                            <li>Your entire account</li>
                        </ul>
                        
                        <p><strong>This is irreversible!</strong> Once deleted, we cannot recover your data.</p>
                        
                        <div style="text-align: center;">
                            <a href="#" class="cta-button">UPGRADE NOW - Save Your Data</a>
                        </div>
                        
                        <p>Don't lose everything you've built. Upgrade today to keep your account active.</p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                        
                        <p><small>This is an automated message. Contact support@usethissearch.com for immediate assistance.</small></p>
                    </div>
                </body>
            </html>
            """
            
            await self._send_email(user_email, subject, html_content)
            logger.info(f"Sent data deletion warning to {user_email} - {days_until_deletion} days remaining")
            
        except Exception as e:
            logger.error(f"Failed to send data deletion warning to {user_email}: {e}")
    
    async def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None):
        """Send email using SMTP"""
        try:
            # For now, we'll just log the email instead of actually sending
            # In production, you would configure SMTP settings
            
            logger.info(f"EMAIL WOULD BE SENT TO: {to_email}")
            logger.info(f"SUBJECT: {subject}")
            logger.info("EMAIL CONTENT:")
            logger.info("-" * 50)
            logger.info(text_content or "HTML content only")
            logger.info("-" * 50)
            
            # Uncomment below for actual email sending:
            """
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            """
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            raise

# Global email service instance
_email_service = None

def get_email_service() -> EmailService:
    """Get email service instance"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service