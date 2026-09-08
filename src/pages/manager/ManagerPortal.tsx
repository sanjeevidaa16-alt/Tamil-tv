import React, { useState } from 'react';
import { StudioLayout } from '../../layouts/StudioLayout';
import { ManagerDashboard } from './ManagerDashboard';
import { VideosManage } from '../admin/Videos';
import { UploadVideo } from '../admin/UploadVideo';
import { EditVideo } from '../admin/EditVideo';
import { Profile } from '../user/Profile';

interface ManagerPortalProps {
  navigate: (path: string) => void;
  initialSection?: string;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({
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
      isManagerPortal={true}
    >
      {currentSection === 'dashboard' && (
        <ManagerDashboard
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

      {currentSection === 'profile' && <Profile navigate={navigate} />}
    </StudioLayout>
  );
};
