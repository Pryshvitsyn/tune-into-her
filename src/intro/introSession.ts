/** In-memory JS-process lifetime only: navigation/backgrounding never reset it. */
let consumed = false;

export function hasConsumedAppIntro(): boolean { return consumed; }

/** Call before mounting the destination behind the global launch presentation. */
export function markAppIntroConsumed(): void { consumed = true; }
