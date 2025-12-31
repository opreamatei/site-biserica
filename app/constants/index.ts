export const LINKS = [
    { label: "Pagina    principala", path: "" },
    { label: "Program    Liturgic", path: "Program-Liturgic" },
    { label: "Organizator  spovedanie", path: "Programator" },
    { label: "Evenimente", path: "Evenimente" },
    { label: "Calendar", path: "Calendar" },
    { label: "Cateheze", path: "Cateheze" },
    { label: "Istoric", path: "About" },
    { label: "Contact", path: "Contact" },
  ];

export function easeInOutCirc(x: number): number {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

export function easeOutCubic(x: number): number {
return 1 - Math.pow(1 - x, 3);
}
