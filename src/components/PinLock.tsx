'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface PinLockProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 4;

export function PinLock({ onUnlock }: PinLockProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const verify = useCallback(async (pin: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem('taskmelater-auth', 'true');
        onUnlock();
      } else {
        setError(true);
        setDigits(Array(PIN_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [onUnlock]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError(false);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (value && index === PIN_LENGTH - 1) {
      const pin = newDigits.join('');
      if (pin.length === PIN_LENGTH) {
        verify(pin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const pin = digits.join('');
      if (pin.length === PIN_LENGTH) {
        verify(pin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pasted) return;
    const newDigits = Array(PIN_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    if (pasted.length === PIN_LENGTH) {
      verify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">📋</span>
          <h1 className="text-xl font-semibold text-foreground">TaskMeLater</h1>
          <p className="text-sm text-muted">Enter PIN to continue</p>
        </div>

        <div className="flex gap-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={`
                w-14 h-16 text-center text-2xl font-bold rounded-xl border-2
                bg-muted-bg text-foreground outline-none transition-all duration-150
                focus:ring-2 focus:ring-accent focus:border-accent
                disabled:opacity-50
                ${error ? 'border-danger animate-[shake_0.3s_ease-in-out]' : 'border-card-border'}
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-danger font-medium">
            Incorrect PIN. Try again.
          </p>
        )}

        {loading && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        )}
      </div>
    </div>
  );
}
