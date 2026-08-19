const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', 'utf-8');

const regex = /<JitsiMeeting[\s\S]*?getIFrameRef=\{.*?\}\s*\/>/;

const jitsiCode = `<div className="flex-1 w-full h-full relative">
          <JitsiMeeting
            domain="jitsi.member.fsf.org"
            roomName={\`CabuyaoCHO1-Teleconsultation-\${id}\`}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              prejoinPageEnabled: true,
              prejoinConfig: { enabled: true, hideDisplayName: true },
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
            getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; iframeRef.style.width = '100%'; }}
          />
        </div>`;

content = content.replace(regex, jitsiCode);
fs.writeFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', content);
console.log('Jitsi wrapper updated');
