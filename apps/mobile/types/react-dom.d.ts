// The app uses only React DOM's portal API; React DOM ships with Expo web.
declare module 'react-dom' {
  export function createPortal(children: import('react').ReactNode, container: Element | DocumentFragment, key?: string | null): import('react').ReactPortal;
}
