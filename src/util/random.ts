export function shuffle<T>(data: T[]): void {
    for (let i = 0; i < data.length - 1; i++) {
        const r = Math.floor(Math.random() * (data.length - i)) + i;
        const tmp = data[r];
        data[r] = data[i];
        data[i] = tmp;
    }
}

export function pickRandom<T>(data: T[]): T {
    return data[Math.floor(Math.random() * data.length)];
}
