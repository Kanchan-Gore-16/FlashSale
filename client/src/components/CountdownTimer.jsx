import { useEffect, useState } from 'react';

export default function CountdownTimer({ targetTime, onExpire, intervalMs = 1000 }) {
    const [remaining, setRemaining] = useState(() => {
        const t = new Date(targetTime).getTime();
        return Math.max(0, t - Date.now());
    });

    useEffect(() => {
        const t = new Date(targetTime).getTime();
        function tick() {
            const diff = t - Date.now();
            setRemaining(Math.max(0, diff));
            if (diff <= 0 && onExpire) {
                onExpire();
            }
        }

        tick();
        const id = setInterval(tick, intervalMs);
        return () => clearInterval(id);
    }, [targetTime, onExpire, intervalMs]);

    const seconds = Math.floor(remaining / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');

    return <span>{mm}:{ss}</span>;
}
