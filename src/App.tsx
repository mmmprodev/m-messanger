import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { AuthModal } from './components/auth/AuthModal';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { ChatInfoDrawer } from './components/chat/ChatInfoDrawer';
import { SideMenuDrawer } from './components/sidebar/SideMenuDrawer';
import { NewChatModal } from './components/modals/NewChatModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MediaLightbox } from './components/modals/MediaLightbox';
import { CallModal } from './components/modals/CallModal';

function MessengerApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { activeChat, setActiveChatId } = useChat();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Call modal state
  const [activeCall, setActiveCall] = useState<{ isVideo: boolean; contactName: string; contactAvatar?: string; contactColor?: string } | null>(null);

  // Lightbox state
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; name?: string } | null>(null);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-[#0e1621] flex flex-col items-center justify-center text-white select-none">
        <div className="w-16 h-16 rounded-full bg-[#2481cc]/20 border border-[#2481cc]/30 flex items-center justify-center animate-pulse mb-4">
          <span className="w-8 h-8 rounded-full border-2 border-[#2481cc] border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-[#708499]">Telegram Web yuklanmoqda...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  const handleStartCall = (isVideo: boolean) => {
    if (!activeChat) return;
    setActiveCall({
      isVideo,
      contactName: activeChat.title,
      contactAvatar: activeChat.avatar,
      contactColor: activeChat.avatarColor
    });
  };

  return (
    <div className={`w-screen h-screen flex overflow-hidden ${isDarkMode ? 'bg-[#0e1621]' : 'theme-light bg-[#e6ebf0]'}`}>
      {/* 1. Left Sidebar: Chats list */}
      <Sidebar
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        isMobileChatOpen={!!activeChat}
      />

      {/* 2. Main Chat Area */}
      <div className={`flex-1 h-full flex ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        <ChatArea
          onBackMobile={() => setActiveChatId(null)}
          onOpenInfo={() => setIsInfoDrawerOpen(prev => !prev)}
          onStartCall={handleStartCall}
          onOpenLightbox={(url, name) => setActiveLightbox({ url, name })}
        />

        {/* 3. Right Info Drawer (Desktop/Tablet) */}
        {isInfoDrawerOpen && activeChat && (
          <ChatInfoDrawer
            onClose={() => setIsInfoDrawerOpen(false)}
            onOpenNewChat={() => setIsNewChatOpen(true)}
          />
        )}
      </div>

      {/* Slide-out Menu Drawer */}
      <SideMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* New Chat / Group Modal */}
      {isNewChatOpen && (
        <NewChatModal onClose={() => setIsNewChatOpen(false)} />
      )}

      {/* Settings / Profile Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Media Lightbox */}
      {activeLightbox && (
        <MediaLightbox
          imageUrl={activeLightbox.url}
          imageName={activeLightbox.name}
          onClose={() => setActiveLightbox(null)}
        />
      )}

      {/* Call Modal */}
      {activeCall && (
        <CallModal
          contactName={activeCall.contactName}
          contactAvatar={activeCall.contactAvatar}
          contactColor={activeCall.contactColor}
          isVideo={activeCall.isVideo}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <MessengerApp />
      </ChatProvider>
    </AuthProvider>
  );
}
