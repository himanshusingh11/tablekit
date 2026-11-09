export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  city: string;
  department: string;
  salary: number;
  startDate: Date;
  active: boolean;
};

const FIRST = [
  'Aarav',
  'Maya',
  'Liam',
  'Zara',
  'Noah',
  'Isha',
  'Omar',
  'Lena',
  'Kai',
  'Priya',
  'Leo',
  'Sofia',
  'Arjun',
  'Nora',
  'Ethan',
  'Ava',
  'Ravi',
  'Mia',
  'Yusuf',
  'Chloe',
];
const LAST = [
  'Sharma',
  'Chen',
  'Garcia',
  'Okafor',
  'Smith',
  'Patel',
  'Kim',
  'Müller',
  'Rossi',
  'Singh',
  'Nguyen',
  'Silva',
  'Haddad',
  'Novak',
  'Kowalski',
  'Ito',
];
const CITIES = [
  'Bengaluru',
  'Berlin',
  'Lisbon',
  'Toronto',
  'Tokyo',
  'Nairobi',
  'Austin',
  'Delhi',
  'Sydney',
  'Seoul',
  'Paris',
  'Mumbai',
];
const DEPTS = [
  'Engineering',
  'Design',
  'Sales',
  'Support',
  'Finance',
  'Marketing',
  'Legal',
  'Operations',
];

/** Small deterministic PRNG so every visitor sees the same data. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makePeople(count: number, seed = 42): Person[] {
  const rand = mulberry32(seed);
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
  const start = new Date(2015, 0, 1).getTime();
  const span = new Date(2026, 0, 1).getTime() - start;
  const out: Person[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    out[i] = {
      id: String(i + 1),
      firstName,
      lastName,
      email: `${firstName}.${lastName}${i}@example.com`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase(),
      age: 21 + Math.floor(rand() * 45),
      city: pick(CITIES),
      department: pick(DEPTS),
      salary: Math.round(40_000 + rand() * 160_000),
      startDate: new Date(start + Math.floor(rand() * span)),
      active: rand() > 0.2,
    };
  }
  return out;
}

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
