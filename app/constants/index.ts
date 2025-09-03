export const LINKS = [
    { label: "Pagina principală", path: "" },
    { label: "Program Liturgic", path: "Program-Liturgic" },
    { label: "Evenimente", path: "Evenimente" },
    { label: "Calendar", path: "Calendar" },
    { label: "Prezentare Biserică", path: "About" },
    { label: "Cateheze", path: "Cateheze" },
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

export const CARD_DATA = [
  {
    id: 1,
    content: 'Istoria locului',
    route: '/istoria-locului',
  },
  {
    id: 2,
    content: 'Situatie lucrari',
    route: '/situatie-lucrari',
  },
  {
    id: 3,
    content: 'Card 3',
    route: '/card3',
  },
];