import React from 'react';
import { Home, Film, Search, User, Tv, Compass } from 'lucide-react';
import { useUserPanelDesign } from '../../contexts/UserPanelDesignContext';

interface UserPanelBottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const UserPanelBottomNav: React.FC<UserPanelBottomNavProps> = ({ currentPath, navigate }) => {
  const { activeDesign } = useUserPanelDesign();

  // Show bottom nav if the design explicitly specifies it or in mobile views for appropriate designs
  if (!activeDesign.layout.hasBottomNav) {
    return null;
  }

  const navItems = [
    { label: 'Home', tamil: 'முகப்பு', path: '/', icon: Home },
    { label: 'Videos', tamil: 'வீடியோக்கள்', path: '/videos', icon: Film },
    { label: 'TV Hub', tamil: 'சேனல்கள்', path: '/videos?channel=all', icon: Tv },
    { label: 'Profile', tamil: 'சுயவிவரம்', path: '/profile', icon: User },
  ];

  return (
    <nav
      id="user-panel-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t backdrop-blur-xl transition-all"
      style={{
        backgroundColor: activeDesign.id === 'glass-tv' ? 'rgba(10, 12, 20, 0.75)' : 'rgba(7, 8, 14, 0.95)',
        borderColor: activeDesign.card.cardBorder,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path.split('?')[0]);

          return (
            <button
              key={item.path}
              id={`bottom-nav-${item.label.toLowerCase()}`}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-16 h-full text-[10px] font-semibold transition-all group relative"
              style={{
                color: isActive ? 'var(--color-primary, #e11d48)' : 'var(--color-text-muted, #94a3b8)',
              }}
            >
              {isActive && (
                <span
                  className="absolute top-0 w-8 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-primary, #e11d48)' }}
                />
              )}
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="truncate max-w-[56px]">{item.tamil}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
