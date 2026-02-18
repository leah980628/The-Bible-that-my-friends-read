import React from 'react';

type IconName =
  | 'music-note' | 'folder' | 'sort' | 'shuffle' | 'repeat' | 'prev' | 'play'
  | 'pause' | 'next' | 'volume' | 'search' | 'refresh' | 'gallery'
  | 'equalizer' | 'list' | 'close' | 'chart-bar' | 'trash' | 'bible';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
}

const icons: Record<IconName, React.ReactNode> = {
  'music-note': <path strokeLinecap="round" strokeLinejoin="round" d="M7.11 8.159c.853-.635 1.87-.976 2.93-.976 2.13 0 3.841 1.743 3.841 3.914s-1.71 3.914-3.84 3.914c-1.258 0-2.37-.624-3.06-1.583M8.89 10.158V3.722h5.58v8.623l-3.35-2.01-2.23 1.338zm-3.35 6.03h5.58M8.89 3.722l-3.35 2.01" />,
  'folder': <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 015.25 7.5h13.5a2.25 2.25 0 012.25 2.25m-16.5 0v6.75a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-6.75" />,
  'sort': <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25" />,
  'shuffle': <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348L7.977 21M7.977 3l8.046 11.652M3 9h3.414a2 2 0 011.414.586l3.172 3.172a2 2 0 001.414.586H21" />,
  'repeat': <path strokeLinecap="round" strokeLinejoin="round" d="M19.95 11.05a8.25 8.25 0 00-15.9 0M3.975 12.95a8.25 8.25 0 0015.9 0m-17.925-1.025a.75.75 0 01.75-.75h1.95a.75.75 0 01.75.75v1.95a.75.75 0 01-.75.75h-1.95a.75.75 0 01-.75-.75v-1.95zm16.95 0a.75.75 0 01.75-.75h1.95a.75.75 0 01.75.75v1.95a.75.75 0 01-.75.75h-1.95a.75.75 0 01-.75-.75v-1.95z" />,
  'prev': <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811V7.189a1.5 1.5 0 00-2.39-1.242l-7.5 4.318a1.5 1.5 0 000 2.484l7.5 4.318A1.5 1.5 0 0021 16.811zM3 7.189v9.622" />,
  'play': <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />,
  'pause': <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5" />,
  'next': <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.811V7.189a1.5 1.5 0 012.39-1.242l7.5 4.318a1.5 1.5 0 010 2.484l-7.5 4.318A1.5 1.5 0 013 16.811zM19.5 7.189v9.622" />,
  'volume': <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />,
  'search': <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
  'refresh': <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183" />,
  'gallery': <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm16.5-1.5H3.75" />,
  'equalizer': <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.75M3.75 12h.75M3.75 18h.75" />,
  'list': <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />,
  'close': <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
  'chart-bar': <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
  'trash': <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.71c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
  'bible': <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
};

export const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6', ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      {...props}
    >
      {icons[name]}
    </svg>
  );
};
