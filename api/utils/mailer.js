import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: './api/.env' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'WinPack <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
    console.error('[mailer] RESEND_API_KEY не задан!');
} else {
    console.log('[mailer] Resend API ключ настроен');
}

export async function sendVerificationCode(email, code) {
    console.log('[mailer] Отправка через Resend API на:', email);
    console.log('[mailer] RESEND_API_KEY:', RESEND_API_KEY ? '***настроен***' : '!!! НЕ ЗАДАН !!!');
    console.log('[mailer] FROM_EMAIL:', FROM_EMAIL);

    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY не настроен');
    }

    const body = {
        from: FROM_EMAIL,
        to: [email],
        subject: 'Код подтверждения регистрации',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #facc15;">Добро пожаловать в WinPack!</h2>
                <p>Ваш код подтверждения:</p>
                <div style="background: #f7f7f7; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1f2937; border-radius: 8px;">
                    ${code}
                </div>
                <p style="color: #6b7280; margin-top: 20px;">Код действителен 10 минут.</p>
                <p style="color: #6b7280;">Если вы не регистрировались на WinPack, просто проигнорируйте это письмо.</p>
            </div>
        `
    };

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[mailer] Resend ошибка:', data);
            throw new Error(`Resend API error: ${data.message || JSON.stringify(data)}`);
        }

        console.log('[mailer] Письмо отправлено, id:', data.id);
    } catch (error) {
        console.error('[mailer] Ошибка отправки:', error.message);
        throw new Error(`Не удалось отправить письмо: ${error.message}`);
    }
}