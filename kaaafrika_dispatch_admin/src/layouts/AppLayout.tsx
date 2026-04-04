import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, string> = {
  '/':             'Dashboard',
  '/dispatchers':  'Dispatchers',
  '/deliveries':   'Deliveries',
  '/live-map':     'Live Map',
  '/wallet':       'Wallet Transactions',
  '/settings':     'Settings',
};

function getPageTitle(pathname: string): string {
  if (pathname.match(/^\/dispatchers\/\d+/)) return 'Dispatcher Details';
  if (pathname.match(/^\/deliveries\/\d+/)) return 'Delivery Details';
  return pageTitles[pathname] ?? 'Dashboard';
}

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <Header title={getPageTitle(pathname)} />
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
