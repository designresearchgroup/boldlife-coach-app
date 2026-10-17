// Small stroke-icon set so the UI has no icon-font dependency.
const PATHS: Record<string, string[]> = {
  home: ['M3 11l9-7 9 7', 'M5 10v10h14V10'],
  book: ['M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z', 'M9 4v16'],
  card: ['M3 6h18v12H3z', 'M3 10h18'],
  mail: ['M3 5h18v14H3z', 'M3 6l9 7 9-7'],
  video: ['M15 10l6-4v12l-6-4z', 'M3 6h12v12H3z'],
  award: ['M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M9 13l-2 8 5-3 5 3-2-8'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    'M12 1v2M12 21v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5'
  ],
  screen: ['M3 4h18v12H3z', 'M8 20h8M12 16v4'],
  mic: ['M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z', 'M5 11a7 7 0 0 0 14 0M12 18v3'],
  check: ['M20 6L9 17l-5-5'],
  arrow: ['M5 12h14M13 6l6 6-6 6'],
  back: ['M19 12H5M11 18l-6-6 6-6'],
  rec: ['M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0'],
  stop: ['M6 6h12v12H6z'],
  phone: ['M21 15v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2h4l2 5-3 2a14 14 0 0 0 6 6l2-3z'],
  play: ['M7 5l12 7-12 7z'],
  pause: ['M8 5h3v14H8z', 'M13 5h3v14h-3z'],
  volume: ['M4 9v6h4l5 4V5L8 9z', 'M16 9a3 3 0 0 1 0 6'],
  mute: ['M4 9v6h4l5 4V5L8 9z', 'M17 10l4 4M21 10l-4 4'],
  expand: ['M4 9V4h5', 'M20 9V4h-5', 'M4 15v5h5', 'M20 15v5h-5'],
  replay: ['M3 12a9 9 0 1 0 2.6-6.4', 'M3 3v5h5']
}

export function Icon({ name, size = 18 }: { name: string; size?: number }): JSX.Element {
  const paths = PATHS[name] ?? []
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
