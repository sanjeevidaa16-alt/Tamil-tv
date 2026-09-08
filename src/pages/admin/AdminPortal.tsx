import React, { useState } from 'react';
import { StudioLayout } from '../../layouts/StudioLayout';
import { Dashboard } from './Dashboard';
import { VideosManage } from './Videos';
import { UploadVideo } from './UploadVideo';
import { EditVideo } from './EditVideo';
import { CategoriesManage } from './Categories';
import { FiltersManage } from './FiltersManage';
import { UsersManage } from './Users';
import { ManagersManage } from './Managers';
import { Analytics } from './Analytics';
import { AdSense } from './AdSense';
import { AdsterraHub } from './AdsterraHub';
import { ActivityLog } from './ActivityLog';
import { AdminProfile } from './AdminProfile';
import { Settings } from './Settings';
import { GeneralSettings } from './GeneralSettings';
import { DatabaseSetup } from './DatabaseSetup';

interface AdminPortalProps {
  navigate: (path: string) => void;
  initialSection?: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  navigate,
  initialSection = 'dashboard',
}) => {
  const [currentSection, setCurrentSection] = useState(initialSection);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const handleEditVideo = (videoId: string) => {
    setEditingVideoId(videoId);
    setCurrentSection('edit');
  };

  return (
    <StudioLayout
      currentSection={currentSection}
      onSelectSection={(sec) => {
        if (sec !== 'edit') setEditingVideoId(null);
        setCurrentSection(sec);
      }}
      navigate={navigate}
      isManagerPortal={false}
    >
      {currentSection === 'dashboard' && (
        <Dashboard
          navigateSection={setCurrentSection}
          navigate={navigate}
        />
      )}

      {currentSection === 'videos' && (
        <VideosManage
          onUploadClick={() => setCurrentSection('upload')}
          onEditClick={handleEditVideo}
          navigate={navigate}
        />
      )}

      {currentSection === 'upload' && (
        <UploadVideo
          onSuccess={() => setCurrentSection('videos')}
          onCancel={() => setCurrentSection('videos')}
        />
      )}

      {currentSection === 'edit' && editingVideoId && (
        <EditVideo
          videoId={editingVideoId}
          onSuccess={() => {
            setEditingVideoId(null);
            setCurrentSection('videos');
          }}
          onCancel={() => {
            setEditingVideoId(null);
            setCurrentSection('videos');
          }}
        />
      )}

      {currentSection === 'categories' && <CategoriesManage />}

      {currentSection === 'filters' && <FiltersManage />}

      {currentSection === 'users' && <UsersManage />}

      {currentSection === 'managers' && <ManagersManage />}

      {currentSection === 'analytics' && <Analytics />}

      {currentSection === 'adsense' && <AdSense />}

      {currentSection === 'adsterra' && <AdsterraHub />}

      {currentSection === 'activity' && <ActivityLog />}

      {(currentSection === 'general_settings' || currentSection === 'general') && (
        <GeneralSettings />
      )}

      {currentSection === 'database' && <DatabaseSetup />}

      {currentSection === 'profile' && <AdminProfile />}

      {currentSection === 'settings' && <Settings />}
    </StudioLayout>
  );
};
