export const WORD_BANK: Record<string, string[]> = {
  animals: [
    'cat', 'dog', 'fish', 'bird', 'duck', 'frog', 'bear', 'lion', 'tiger',
    'monkey', 'rabbit', 'snake', 'cow', 'pig', 'sheep', 'horse', 'mouse',
    'chicken', 'elephant', 'turtle', 'fox', 'panda', 'penguin', 'deer',
    'crab', 'bee', 'ant', 'spider', 'butterfly', 'whale', 'shark', 'dolphin',
    'zebra', 'giraffe', 'goat', 'bat', 'owl', 'snail'
  ],
  food: [
    'apple', 'banana', 'pizza', 'burger', 'cake', 'ice cream', 'cookie',
    'donut', 'egg', 'bread', 'cheese', 'milk', 'candy', 'chocolate',
    'popcorn', 'orange', 'grape', 'mango', 'watermelon', 'sandwich',
    'hotdog', 'pancake', 'lemon', 'carrot', 'potato', 'tomato', 'corn'
  ],
  objects: [
    'ball', 'book', 'chair', 'table', 'pen', 'pencil', 'cup', 'bottle',
    'bed', 'door', 'clock', 'key', 'car', 'bus', 'train', 'boat',
    'plane', 'bike', 'hat', 'shoe', 'shirt', 'glasses', 'umbrella',
    'bag', 'box', 'phone', 'lamp', 'spoon', 'fork', 'ring', 'kite'
  ],
  nature: [
    'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'tree', 'flower',
    'leaf', 'grass', 'river', 'sea', 'fire', 'mountain', 'rainbow',
    'rock', 'island', 'beach', 'wind'
  ],
  actions_and_places: [
    'house', 'school', 'park', 'room', 'road', 'sleep', 'run', 'jump',
    'dance', 'sing', 'eat', 'drink', 'swim', 'cry', 'smile', 'fly'
  ],
  pop_and_fun: [
    'baby', 'king', 'queen', 'clown', 'robot', 'ghost', 'monster',
    'alien', 'dragon', 'angel', 'heart', 'star', 'crown'
  ]
};

export class WordManager {
  // Store used words per room to avoid repeating in the same game
  private static roomUsedWords: Map<string, Set<string>> = new Map();

  public static resetRoomWords(roomId: string): void {
    this.roomUsedWords.delete(roomId);
  }

  public static getRandomWords(
    count: number = 3,
    category: string = 'all',
    customWords?: string[],
    roomId?: string
  ): string[] {
    let pool: string[] = [];

    if (customWords && customWords.length > 0) {
      pool.push(...customWords);
    }

    if (category === 'all' || !WORD_BANK[category]) {
      Object.values(WORD_BANK).forEach(catWords => {
        pool.push(...catWords);
      });
    } else {
      pool.push(...WORD_BANK[category]);
    }

    // Deduplicate pool
    pool = Array.from(new Set(pool.map(w => w.toLowerCase().trim()).filter(Boolean)));

    // Track recently used words in this room to avoid repeat selections
    let usedSet: Set<string> | undefined;
    if (roomId) {
      if (!this.roomUsedWords.has(roomId)) {
        this.roomUsedWords.set(roomId, new Set());
      }
      usedSet = this.roomUsedWords.get(roomId);
    }

    // Filter out already used words if we still have plenty of unused words
    let available = pool;
    if (usedSet && pool.length - usedSet.size >= count * 2) {
      available = pool.filter(w => !usedSet!.has(w));
    } else if (usedSet && pool.length - usedSet.size < count) {
      // If pool is running low, clear history and fresh restart
      usedSet.clear();
    }

    // High entropy Fisher-Yates shuffle
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Mark selected as used for this room
    if (usedSet) {
      selected.forEach(w => usedSet!.add(w));
    }

    return selected;
  }

  public static isCloseGuess(guess: string, target: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[\s\-_]/g, '');
    const cleanGuess = normalize(guess);
    const cleanTarget = normalize(target);

    if (cleanGuess === cleanTarget) return false;
    if (Math.abs(cleanGuess.length - cleanTarget.length) > 1) return false;

    // Levenshtein distance check for 1-character typo
    let edits = 0;
    let i = 0, j = 0;
    while (i < cleanGuess.length && j < cleanTarget.length) {
      if (cleanGuess[i] !== cleanTarget[j]) {
        edits++;
        if (edits > 1) return false;
        if (cleanGuess.length > cleanTarget.length) i++;
        else if (cleanTarget.length > cleanGuess.length) j++;
        else { i++; j++; }
      } else {
        i++;
        j++;
      }
    }
    return true;
  }
}
