import { NavLink } from '@/components/NavLink';
import { Plus, List, TrendingUp } from 'lucide-react';

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-20">
      <div className="container mx-auto max-w-3xl flex justify-around">
        <NavLink
          to="/"
          className="flex flex-col items-center py-3 px-6 text-muted-foreground hover:text-rose-500 transition-colors"
          activeClassName="text-rose-500"
          end
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs mt-1">新增</span>
        </NavLink>
        <NavLink
          to="/records"
          className="flex flex-col items-center py-3 px-6 text-muted-foreground hover:text-rose-500 transition-colors"
          activeClassName="text-rose-500"
        >
          <List className="h-5 w-5" />
          <span className="text-xs mt-1">記錄</span>
        </NavLink>
        <NavLink
          to="/trends"
          className="flex flex-col items-center py-3 px-6 text-muted-foreground hover:text-rose-500 transition-colors"
          activeClassName="text-rose-500"
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs mt-1">圖表</span>
        </NavLink>
      </div>
    </nav>
  );
};
