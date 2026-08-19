const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', 'utf-8');

const regex = /<div data-tour="page-video"[\s\S]*?\{activeSidePanel !== 'none' && \(/;

const jitsiCode = `      <div data-tour="page-video" className="flex-1 h-full bg-slate-900 relative shadow-2xl flex flex-col">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={\`CabuyaoCHO1-Teleconsultation-\${id}\`}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
            disableDeepLinking: true,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          }}
          userInfo={{
            displayName: user?.name || (user?.role === 'Doctor' ? 'Doctor' : 'Patient')
          }}
          onApiReady={(externalApi) => {
            externalApi.addListener('videoConferenceJoined', () => {
              if (user?.role === 'Doctor' && consultation?.status === 'scheduled') {
                api.put(\`/consultations/\${id}\`, { status: 'in_progress' }).catch(console.error);
              }
            });
            externalApi.addListener('readyToClose', () => {
              handleEndCall();
            });
          }}
          getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; }}
        />
        
        {/* Floating action button to open sidebar on mobile or if closed */}
        {activeSidePanel === 'none' && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button onClick={() => setActiveSidePanel('chat')} className="bg-indigo-600 p-3 rounded-full text-white shadow-lg hover:bg-indigo-700">
              <MessageCircle size={20} />
            </button>
            <button onClick={handleEndCall} className="bg-rose-600 p-3 rounded-full text-white shadow-lg hover:bg-rose-700">
              <PhoneOff size={20} />
            </button>
          </div>
        )}
      </div>

      {activeSidePanel !== 'none' && (`

let newContent = content.replace(regex, jitsiCode);

if (!newContent.includes('JitsiMeeting')) {
    newContent = newContent.replace("import { useState, useEffect, useRef, useCallback } from 'react';", "import { useState, useEffect, useRef, useCallback } from 'react';\nimport { JitsiMeeting } from '@jitsi/react-sdk';");
}

fs.writeFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', newContent);
console.log('Success!');
