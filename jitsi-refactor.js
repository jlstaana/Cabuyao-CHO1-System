const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', 'utf-8');

const startIndex = content.indexOf('<div className={lex-1 flex flex-col bg-slate-950 relative');
const endIndex = content.indexOf('{/* Dynamic Side Panel */}');

if (startIndex === -1 || endIndex === -1) {
    console.log('Could not find markers');
    process.exit(1);
}

const jitsiCode = \
            <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden transition-all duration-300">
              <JitsiMeeting
                domain="meet.jit.si"
                roomName={\\\CabuyaoCHO1-Teleconsultation-\\\\\\}
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
                      api.put(\\\/consultations/\\\\\\, { status: 'in_progress' }).catch(console.error);
                    }
                  });
                }}
                getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; }}
              />
            </div>
            \;

content = content.substring(0, startIndex) + jitsiCode + content.substring(endIndex);

// Add import
if (!content.includes('JitsiMeeting')) {
    content = content.replace("import { useState, useEffect, useRef, useCallback } from 'react';", "import { useState, useEffect, useRef, useCallback } from 'react';\\nimport { JitsiMeeting } from '@jitsi/react-sdk';");
}

fs.writeFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', content);
console.log('Success');
