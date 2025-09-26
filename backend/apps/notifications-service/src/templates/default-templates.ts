import { NotificationChannel } from '@shamba/common';

export const DEFAULT_TEMPLATES = [
  {
    name: 'WELCOME_EMAIL',
    channel: NotificationChannel.EMAIL,
    subject: 'Welcome to Shamba Sure - Secure Your Family Legacy',
    body: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2E8B57; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Shamba Sure</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}} {{lastName}}!</h2>
            <p>Welcome to Shamba Sure, where we help you protect your family's legacy and ensure smooth inheritance planning.</p>
            
            <p>With your account, you can:</p>
            <ul>
                <li>Create and manage your will digitally</li>
                <li>Document your assets and assign beneficiaries</li>
                <li>Build your family tree</li>
                <li>Receive guidance on inheritance laws</li>
            </ul>
            
            <p>We're committed to helping you secure your family's future.</p>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Complete your profile</li>
                <li>Start documenting your assets</li>
                <li>Create your first will</li>
            </ol>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
            <p>Shamba Sure - Securing Generational Wealth</p>
            <p>Email: support@shambasure.com | Phone: +254 700 000 000</p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'email'],
    isActive: true,
  },
  {
    name: 'PASSWORD_RESET',
    channel: NotificationChannel.EMAIL,
    subject: 'Password Reset Request - Shamba Sure',
    body: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2E8B57; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .reset-code { font-size: 24px; font-weight: bold; color: #2E8B57; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>We received a request to reset your password for your Shamba Sure account.</p>
            
            <p>Your password reset token is:</p>
            <div class="reset-code">{{resetToken}}</div>
            
            <p><strong>This token will expire at: {{expiresAt}}</strong></p>
            
            <p>If you didn't request this reset, please ignore this email or contact our support team immediately.</p>
            
            <p>For security reasons, we recommend:</p>
            <ul>
                <li>Don't share this token with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication if available</li>
            </ul>
        </div>
        <div class="footer">
            <p>Shamba Sure - Securing Generational Wealth</p>
            <p>Email: support@shambasure.com | Phone: +254 700 000 000</p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['firstName', 'resetToken', 'expiresAt'],
    isActive: true,
  },
  {
    name: 'WILL_CREATED',
    channel: NotificationChannel.EMAIL,
    subject: 'Will Created Successfully - Shamba Sure',
    body: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2E8B57; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Will Created Successfully</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>Your will "<strong>{{willTitle}}</strong>" has been created successfully.</p>
            
            <p><strong>Current Status:</strong> {{willStatus}}</p>
            <p><strong>Created Date:</strong> {{createdDate}}</p>
            
            <p>What's next?</p>
            <ul>
                <li><strong>Review:</strong> Carefully review your will details</li>
                <li><strong>Assign Beneficiaries:</strong> Ensure all assets have designated beneficiaries</li>
                <li><strong>Activate:</strong> Once satisfied, activate your will</li>
                <li><strong>Share:</strong> Inform your trusted family members about your will</li>
            </ul>
            
            <p>Remember to update your will whenever your circumstances change (marriage, birth, acquisition of new assets, etc.).</p>
            
            <p>If you need assistance with your will, our legal guidance team is here to help.</p>
        </div>
        <div class="footer">
            <p>Shamba Sure - Securing Generational Wealth</p>
            <p>Email: support@shambasure.com | Phone: +254 700 000 000</p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['firstName', 'willTitle', 'willStatus', 'createdDate'],
    isActive: true,
  },
  {
    name: 'DOCUMENT_UPLOADED',
    channel: NotificationChannel.EMAIL,
    subject: 'Document Uploaded - Shamba Sure',
    body: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2E8B57; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Document Uploaded</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>Your document "<strong>{{documentName}}</strong>" has been successfully uploaded to Shamba Sure.</p>
            
            <p><strong>Upload Date:</strong> {{uploadDate}}</p>
            <p><strong>Current Status:</strong> {{status}}</p>
            
            <p>What happens next?</p>
            <ul>
                <li>Our system will verify the document</li>
                <li>Once verified, it will be available for your will planning</li>
                <li>You can assign this document to specific assets in your will</li>
            </ul>
            
            <p>If the document requires additional verification, we may contact you for more information.</p>
            
            <p>Thank you for keeping your records updated!</p>
        </div>
        <div class="footer">
            <p>Shamba Sure - Securing Generational Wealth</p>
            <p>Email: support@shambasure.com | Phone: +254 700 000 000</p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['firstName', 'documentName', 'uploadDate', 'status'],
    isActive: true,
  },
  {
    name: 'WILL_REMINDER',
    channel: NotificationChannel.SMS,
    subject: '',
    body: 'Hi {{firstName}}. Reminder to review your will "{{willTitle}}" on Shamba Sure. Keep your inheritance plans updated. Reply STOP to opt out.',
    variables: ['firstName', 'willTitle'],
    isActive: true,
  },
  {
    name: 'SECURITY_ALERT',
    channel: NotificationChannel.SMS,
    subject: '',
    body: 'Shamba Sure Security Alert: Unusual activity detected on your account. If this was not you, contact support immediately.',
    variables: [],
    isActive: true,
  },
];