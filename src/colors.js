export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  
  // Foreground
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background
  bgMagenta: '\x1b[45m',
  bgBlue: '\x1b[44m',
  bgDark: '\x1b[100m',
};

export function stripAnsi(str) {
  return String(str).replace(/\x1b\[[0-9;]*m/g, '');
}

export function padColored(str, targetWidth, align = 'left') {
  const s = String(str);
  const visibleLen = stripAnsi(s).length;
  const padding = Math.max(0, targetWidth - visibleLen);
  if (align === 'right') {
    return ' '.repeat(padding) + s;
  } else if (align === 'center') {
    const left = Math.floor(padding / 2);
    const right = padding - left;
    return ' '.repeat(left) + s + ' '.repeat(right);
  }
  return s + ' '.repeat(padding);
}

export const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.brightGreen}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.brightYellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (step, total, msg) => console.log(`\n${colors.magenta}${colors.bold}─── [${step}/${total}] ${msg} ───${colors.reset}`),
  banner: (msg) => console.log(`${colors.bold}${colors.magenta}${msg}${colors.reset}`),
};
