const darkColorPalette = [
    '#1f2937', // slate
    '#6d1138', // gray
    '#4b5563', // zinc
    '#111827', // dark
    '#1e40af', // blue
    '#065f46', // emerald
    '#78350f', // amber brown
    '#8d7406', // orange red
    '#6b21a8', // purple
    '#064e3b', // deep teal
  ];

  export function getColorFromId(id) {
    const digit = parseInt(String(id).slice(-1), 10); // Get least significant digit
    return darkColorPalette[digit];
  }
  