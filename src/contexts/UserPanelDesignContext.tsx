import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserPanelDesignId, UserPanelDesignConfig } from '../types/userPanelDesign';
import { USER_PANEL_DESIGNS, DEFAULT_USER_PANEL_DESIGN } from '../data/userPanelDesigns';
import { useSiteSettings } from './SiteSettingsContext';

interface UserPanelDesignContextType {
  designId: UserPanelDesignId;
  design: UserPanelDesignConfig;
  previewDesignId: UserPanelDesignId | null;
  activeDesign: UserPanelDesignConfig; // either previewDesign or saved design
  setPreviewDesignId: (id: UserPanelDesignId | null) => void;
  applyDesign: (id: UserPanelDesignId) => Promise<void>;
  resetToDefault: () => Promise<void>;
  allDesigns: UserPanelDesignConfig[];
  isApplying: boolean;
}

const UserPanelDesignContext = createContext<UserPanelDesignContextType | undefined>(undefined);

export const UserPanelDesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useSiteSettings();
  const [previewDesignId, setPreviewDesignId] = useState<UserPanelDesignId | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Saved design ID from site_settings (fallback to 'tamil-ott')
  const savedDesignId = (settings.user_panel_design as UserPanelDesignId) || 'tamil-ott';

  const design = useMemo(() => {
    return USER_PANEL_DESIGNS.find((d) => d.id === savedDesignId) || DEFAULT_USER_PANEL_DESIGN;
  }, [savedDesignId]);

  const activeDesign = useMemo(() => {
    if (previewDesignId) {
      return USER_PANEL_DESIGNS.find((d) => d.id === previewDesignId) || design;
    }
    return design;
  }, [previewDesignId, design]);

  // Apply CSS custom properties and HTML data attribute whenever activeDesign changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-user-panel-design', activeDesign.id);

    // Apply design tokens to CSS variables
    root.style.setProperty('--design-card-radius', activeDesign.card.cardRadius);
    root.style.setProperty('--design-btn-radius', activeDesign.components.buttonRadius);
    root.style.setProperty('--design-input-radius', activeDesign.components.inputRadius);
    root.style.setProperty('--design-modal-radius', activeDesign.components.modalRadius);
    root.style.setProperty('--design-tag-radius', activeDesign.components.tagRadius);
    root.style.setProperty('--design-card-border', activeDesign.card.cardBorder);
    root.style.setProperty('--design-card-shadow', activeDesign.card.cardShadow);

    // Dynamic class on body for specific layout tweaks
    document.body.className = document.body.className
      .replace(/design-[a-z0-9-]+/g, '')
      .trim();
    document.body.classList.add(`design-${activeDesign.id}`);
  }, [activeDesign]);

  const applyDesign = async (id: UserPanelDesignId) => {
    try {
      setIsApplying(true);
      await updateSettings({
        user_panel_design: id,
      });
      setPreviewDesignId(null);
    } catch (err) {
      console.error('Failed to apply user panel design:', err);
      throw err;
    } finally {
      setIsApplying(false);
    }
  };

  const resetToDefault = async () => {
    await applyDesign('tamil-ott');
  };

  return (
    <UserPanelDesignContext.Provider
      value={{
        designId: savedDesignId,
        design,
        previewDesignId,
        activeDesign,
        setPreviewDesignId,
        applyDesign,
        resetToDefault,
        allDesigns: USER_PANEL_DESIGNS,
        isApplying,
      }}
    >
      {children}
    </UserPanelDesignContext.Provider>
  );
};

export const useUserPanelDesign = (): UserPanelDesignContextType => {
  const context = useContext(UserPanelDesignContext);
  if (!context) {
    throw new Error('useUserPanelDesign must be used within a UserPanelDesignProvider');
  }
  return context;
};
