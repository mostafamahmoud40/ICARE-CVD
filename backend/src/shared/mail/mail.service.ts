import { Injectable, Logger } from '@nestjs/common';
import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

type BrevoEmailClient = {
  sendTransacEmail(body: Record<string, unknown>): Promise<unknown>;
};

type BrevoSdkModule = {
  ApiClient: {
    instance: {
      authentications: Record<string, { apiKey: string }>;
    };
  };
  TransactionalEmailsApi: new () => BrevoEmailClient;
};

const brevoSdk = SibApiV3Sdk as unknown as BrevoSdkModule;

/**
 * MailService — transactional email via Brevo (preferred) or AWS SES fallback.
 *
 * Brevo (recommended):
 *   BREVO_API_KEY       API key from Brevo dashboard
 *   BREVO_FROM_EMAIL    Verified sender address in Brevo
 *   BREVO_FROM_NAME     Optional display name (default: iCare)
 *
 * AWS SES (legacy fallback when BREVO_API_KEY is not set):
 *   SES_REGION, SES_ACCESS_KEY_ID, SES_SECRET_ACCESS_KEY, SES_FROM_ADDRESS
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly brevoApi: BrevoEmailClient | null = this.buildBrevoClient();

  private readonly sesClient: SESClient | null = this.brevoApi
    ? null
    : this.buildSesClient();

  private buildBrevoClient(): BrevoEmailClient | null {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    if (!apiKey) return null;

    const client = brevoSdk.ApiClient.instance;
    client.authentications['api-key'].apiKey = apiKey;

    this.logger.log('Brevo email provider configured.');
    return new brevoSdk.TransactionalEmailsApi();
  }

  private buildSesClient(): SESClient | null {
    const region = process.env.SES_REGION;
    const accessKeyId = process.env.SES_ACCESS_KEY_ID;
    const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'No email provider configured (set BREVO_API_KEY or AWS SES credentials). Emails will be skipped.',
      );
      return null;
    }

    this.logger.log('AWS SES email provider configured.');
    return new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
    const safeName = this.escapeHtml(fullName);
    const loginUrl = this.resolveFrontendLoginUrl();
    const safeLoginUrl = this.escapeHtml(loginUrl);

    await this.send({
      to,
      subject: 'Welcome to ICARE CVD — your account is ready',
      text: [
        `Hello ${fullName},`,
        '',
        'Welcome to ICARE CVD! Your email has been verified and your patient account is now active.',
        '',
        'You can sign in anytime to book appointments, view your health profile, and stay connected with your care team.',
        '',
        `Sign in: ${loginUrl}`,
        '',
        'Thank you for choosing ICARE CVD for your cardiac care journey.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1A1F1E">
          <div style="background:linear-gradient(135deg,#1A5345 0%,#154434 100%);color:#fff;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85">ICARE CVD</p>
            <h1 style="margin:0;font-size:26px;font-weight:700;line-height:1.3">Welcome aboard!</h1>
            <p style="margin:10px 0 0;font-size:14px;opacity:0.92;line-height:1.5">Your account is verified and ready to use</p>
          </div>
          <div style="background:#F9F8F5;padding:28px 24px;border:1px solid #E8E6E0;border-top:none">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.5">Hello <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#374151">
              Thank you for joining <strong>ICARE CVD</strong>. Your email has been confirmed and your patient account is now active.
            </p>
            <div style="background:#fff;border:1px solid #E8E6E0;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1A5345;text-transform:uppercase;letter-spacing:0.06em">What you can do next</p>
              <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;color:#374151">
                <li>Complete your health profile</li>
                <li>Book appointments with your doctor</li>
                <li>Upload lab reports and documents</li>
                <li>Track your cardiac care journey</li>
              </ul>
            </div>
            <p style="margin:0 0 20px;text-align:center">
              <a href="${safeLoginUrl}" style="display:inline-block;padding:14px 28px;background:#1A5345;color:#fff;border-radius:999px;text-decoration:none;font-size:14px;font-weight:700;box-shadow:0 8px 20px rgba(26,83,69,0.25)">
                Continue to ICARE CVD
              </a>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7870;text-align:center">
              If you did not create this account, please contact your clinic immediately.
            </p>
          </div>
          <div style="background:#fff;padding:16px 24px;border:1px solid #E8E6E0;border-top:none;border-radius:0 0 12px 12px;text-align:center">
            <p style="margin:0;font-size:11px;color:#9CA3AF">© ICARE CVD · Cardiovascular care, simplified</p>
          </div>
        </div>
      `,
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.sendRegistrationOtpEmail(to, otp);
  }

  async sendRegistrationOtpEmail(to: string, otp: string): Promise<void> {
    const safeOtp = this.escapeHtml(otp);
    await this.send({
      to,
      subject: 'Verify your ICARE CVD account',
      text: `Your email verification code is: ${otp}\n\nEnter this code to activate your account. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1A1F1E">
          <div style="background:#1A5345;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:22px;font-weight:700">ICARE CVD</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:0.9">Verification Code</p>
          </div>
          <div style="background:#F9F8F5;padding:24px;border:1px solid #E8E6E0;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 16px;font-size:15px">Hello,</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#374151">
              Use the code below to verify your email and activate your ICARE CVD account:
            </p>
            <div style="background:#fff;border:1px solid #E8E6E0;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-family:monospace;font-size:36px;font-weight:800;color:#1A5345;letter-spacing:6px;display:inline-block">${safeOtp}</span>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6B7870">
              This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7870">
              If you did not request this code, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const safeLink = this.escapeHtml(resetLink);
    await this.send({
      to,
      subject: 'Reset your ICARE CVD password',
      text: `Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <p>Click the button below to reset your password:</p>
        <a href="${safeLink}" style="display:inline-block;padding:10px 20px;background:#1A5345;color:#fff;border-radius:6px;text-decoration:none">
          Reset Password
        </a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }

  async sendPatientAccountCreatedEmail(
    to: string,
    fullName: string,
    email: string,
    temporaryPassword: string,
  ): Promise<void> {
    const loginUrl = this.resolveFrontendLoginUrl();
    const safeName = this.escapeHtml(fullName);
    const safeEmail = this.escapeHtml(email);
    const safePassword = this.escapeHtml(temporaryPassword);
    const safeLoginUrl = this.escapeHtml(loginUrl);

    await this.send({
      to,
      subject: 'Your ICARE CVD patient account has been created',
      text: [
        `Hello ${fullName},`,
        '',
        'A patient account has been created for you on ICARE CVD.',
        '',
        `Email: ${email}`,
        `Temporary password: ${temporaryPassword}`,
        '',
        `Sign in: ${loginUrl}`,
        '',
        'Please change your password after your first login.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1A1F1E">
          <div style="background:#1A5345;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:22px;font-weight:700">ICARE CVD</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:0.9">Your patient account is ready</p>
          </div>
          <div style="background:#F9F8F5;padding:24px;border:1px solid #E8E6E0;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 16px;font-size:15px">Hello <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151">
              A patient account has been created for you. Use the credentials below to sign in.
            </p>
            <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E8E6E0;border-radius:10px;overflow:hidden">
              <tr>
                <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#6B7870;border-bottom:1px solid #E8E6E0">Email</td>
                <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1A1F1E;border-bottom:1px solid #E8E6E0">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#6B7870">Temporary password</td>
                <td style="padding:12px 16px;font-size:14px;font-family:monospace;font-weight:700;color:#1A5345;letter-spacing:0.5px">${safePassword}</td>
              </tr>
            </table>
            <p style="margin:20px 0">
              <a href="${safeLoginUrl}" style="display:inline-block;padding:12px 24px;background:#1A5345;color:#fff;border-radius:999px;text-decoration:none;font-size:14px;font-weight:700">
                Sign in to ICARE CVD
              </a>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7870">
              For your security, please change this password after your first login.
              If you did not expect this email, contact your clinic.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendAssistantAccountCreatedEmail(
    to: string,
    fullName: string,
    email: string,
    temporaryPassword: string,
  ): Promise<void> {
    const loginUrl = this.resolveFrontendLoginUrl();
    const safeName = this.escapeHtml(fullName);
    const safeEmail = this.escapeHtml(email);
    const safePassword = this.escapeHtml(temporaryPassword);
    const safeLoginUrl = this.escapeHtml(loginUrl);

    await this.send({
      to,
      subject: 'Your ICARE CVD assistant account has been created',
      text: [
        `Hello ${fullName},`,
        '',
        'A clinic assistant account has been created for you on ICARE CVD.',
        '',
        `Email: ${email}`,
        `Temporary password: ${temporaryPassword}`,
        '',
        `Sign in: ${loginUrl}`,
        '',
        'Please change your password after your first login.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1A1F1E">
          <div style="background:#1A5345;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:22px;font-weight:700">ICARE CVD</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:0.9">Your assistant account is ready</p>
          </div>
          <div style="background:#F9F8F5;padding:24px;border:1px solid #E8E6E0;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 16px;font-size:15px">Hello <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151">
              Your doctor has added you to their clinic team. Use the credentials below to sign in.
            </p>
            <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E8E6E0;border-radius:10px;overflow:hidden">
              <tr>
                <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#6B7870;border-bottom:1px solid #E8E6E0">Email</td>
                <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1A1F1E;border-bottom:1px solid #E8E6E0">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#6B7870">Temporary password</td>
                <td style="padding:12px 16px;font-size:14px;font-family:monospace;font-weight:700;color:#1A5345;letter-spacing:0.5px">${safePassword}</td>
              </tr>
            </table>
            <p style="margin:20px 0">
              <a href="${safeLoginUrl}" style="display:inline-block;padding:12px 24px;background:#1A5345;color:#fff;border-radius:999px;text-decoration:none;font-size:14px;font-weight:700">
                Sign in to ICARE CVD
              </a>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7870">
              For your security, please change this password after your first login.
              If you did not expect this email, contact your clinic.
            </p>
          </div>
        </div>
      `,
    });
  }

  private resolveFrontendLoginUrl(): string {
    const explicit = process.env.FRONTEND_URL?.trim();
    if (explicit) {
      return `${explicit.replace(/\/$/, '')}/login`;
    }

    const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
    if (corsOrigin) {
      return `${corsOrigin.replace(/\/$/, '')}/login`;
    }

    return 'http://localhost:3000/login';
  }

  private async send(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    if (!this.brevoApi && !this.sesClient) {
      throw new Error(
        'Email delivery is not configured. Set BREVO_API_KEY and BREVO_FROM_EMAIL in backend/.env.',
      );
    }

    if (this.brevoApi) {
      await this.sendViaBrevo(params);
      return;
    }

    await this.sendViaSes(params);
  }

  private async sendViaBrevo(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    const fromEmail = process.env.BREVO_FROM_EMAIL?.trim();
    if (!fromEmail) {
      throw new Error(
        'BREVO_FROM_EMAIL is not set. Add a verified sender email in backend/.env.',
      );
    }

    const fromName = process.env.BREVO_FROM_NAME?.trim() || 'iCare';

    try {
      await this.brevoApi!.sendTransacEmail({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: params.to }],
        subject: params.subject,
        textContent: params.text,
        htmlContent:
          params.html ??
          `<p>${this.escapeHtml(params.text).replace(/\n/g, '<br>')}</p>`,
      });
      this.logger.log(`Email sent to ${params.to} via Brevo`);
    } catch (err) {
      const message = this.formatBrevoError(err);
      this.logger.error(
        `Failed to send email to ${params.to} via Brevo: ${message}`,
        err,
      );
      throw new Error(message);
    }
  }

  private formatBrevoError(err: unknown): string {
    if (err && typeof err === 'object') {
      const body = (err as { response?: { body?: { message?: string } } })
        .response?.body?.message;
      if (typeof body === 'string' && body.trim()) {
        return body.trim();
      }
      if (
        'message' in err &&
        typeof err.message === 'string' &&
        err.message.trim()
      ) {
        return err.message.trim();
      }
    }
    return 'Brevo could not send the email. Check API key and sender verification.';
  }

  private async sendViaSes(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    if (!this.sesClient) {
      throw new Error('AWS SES is not configured for email delivery.');
    }

    const from = process.env.SES_FROM_ADDRESS;
    if (!from) {
      throw new Error('SES_FROM_ADDRESS is not set; cannot send email.');
    }

    const input: SendEmailCommandInput = {
      Source: from,
      Destination: { ToAddresses: [params.to] },
      Message: {
        Subject: { Data: params.subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: params.text, Charset: 'UTF-8' },
          ...(params.html && {
            Html: { Data: params.html, Charset: 'UTF-8' },
          }),
        },
      },
    };

    try {
      const response = await this.sesClient.send(new SendEmailCommand(input));
      this.logger.log(
        `Email sent to ${params.to} via SES — MessageId: ${response.MessageId}`,
      );
    } catch (err) {
      this.logger.error(`Failed to send email to ${params.to} via SES`, err);
      throw err;
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
