import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: './api/.env' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendVerificationCode(email, code) {
    const mailOptions = {
        from: `"WinPack" <${process.env.EMAIL_USER}>`,
        to: email,
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
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error(`Не удалось отправить письмо: ${error.message}`);
    }
}

