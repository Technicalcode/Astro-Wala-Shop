export function parseColor(colorString) {
  if (!colorString || typeof document === 'undefined' || typeof window === 'undefined') return null;
  
  const div = document.createElement("div");
  div.style.color = "rgb(0, 0, 0)";
  div.style.display = "none";
  document.body.appendChild(div);
  
  // Set to a unique color to detect if the assignment works
  div.style.color = "rgb(1, 2, 3)";
  div.style.color = colorString;
  
  const computed = window.getComputedStyle(div).color;
  document.body.removeChild(div);
  
  if (computed === "rgb(1, 2, 3)") {
      return null;
  }
  
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
      return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
          a: match[4] ? parseFloat(match[4]) : 1
      };
  }
  return null;
}

export function getLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
}

export function getContrastingColor(colorString) {
  const parsed = parseColor(colorString);
  if (!parsed) return "#000000";
  const lum = getLuminance(parsed);
  // WCAG recommendation for contrast threshold is around 0.179 for midpoint
  return lum > 0.179 ? "#000000" : "#ffffff";
}
