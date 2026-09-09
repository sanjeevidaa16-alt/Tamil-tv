import React from 'react';

interface UserPanelBottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const UserPanelBottomNav: React.FC<UserPanelBottomNavProps> = () => {
  // Mobile bottom navigation bar hidden per user request
  return null;
};
