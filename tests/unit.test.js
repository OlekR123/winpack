import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isValidEmail, isValidPassword } from '../api/routers/auth.js';
import { saveCode, verifyCode } from '../api/utils/codeStore.js';

// Тест 1: Валидация email
describe('isValidEmail', () => {
    it('принимает корректные email-адреса и отклоняет некорректные', () => {
        // Валидные
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('test.name@domain.co.uk')).toBe(true);

        // Невалидные
        expect(isValidEmail('plain-text')).toBe(false);
        expect(isValidEmail('no@dot')).toBe(false);
        expect(isValidEmail('two @spaces.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});

// Тест 2: Валидация пароля
describe('isValidPassword', () => {
    it('принимает надёжный пароль и отклоняет слабый', () => {
        // Сильные пароли
        expect(isValidPassword('Strong123')).toBe(true);
        expect(isValidPassword('MyPass2024')).toBe(true);

        // Слабые пароли
        expect(isValidPassword('short1A')).toBe(false);         // меньше 8 символов
        expect(isValidPassword('alllowercase1')).toBe(false);   // нет заглавной
        expect(isValidPassword('ALLUPPERCASE1')).toBe(false);   // нет строчной
        expect(isValidPassword('NoDigitsHere')).toBe(false);    // нет цифр
        expect(isValidPassword(undefined)).toBe(false);         // защита от undefined
    });
});

// Тесты 3-5: Хранилище кодов подтверждения
describe('codeStore', () => {
    beforeEach(() => {
        // Восстанавливаем "настоящие" таймеры перед каждым тестом
        vi.useRealTimers();
    });

    // Тест 3: базовая работа
    it('сохраняет код и подтверждает его при правильном вводе', () => {
        const email = 'test1@example.com';
        const code = '123456';

        saveCode(email, code);

        expect(verifyCode(email, code)).toBe(true);
    });

    // Тест 4: истечение срока
    it('отклоняет код, если время жизни истекло', () => {
        vi.useFakeTimers();
        const email = 'test2@example.com';
        const code = '654321';

        saveCode(email, code, 1000);

        vi.advanceTimersByTime(2000);

        expect(verifyCode(email, code)).toBe(false);
    });

    // Тест 5: одноразовость
    it('делает код одноразовым: повторная проверка возвращает false', () => {
        const email = 'test3@example.com';
        const code = '111222';

        saveCode(email, code);

        expect(verifyCode(email, code)).toBe(true);

        // Второй раз — код не подходит (защита от replay-атаки)
        expect(verifyCode(email, code)).toBe(false);
    });
});