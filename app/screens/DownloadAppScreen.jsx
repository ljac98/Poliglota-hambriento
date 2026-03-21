import React from 'react';
import { Btn } from '../components/Btn.jsx';

const COPY = {
  es: {
    title: 'Descargar app',
    subtitle: 'Instala Hungry Poly en tu teléfono o escanea este QR para abrirlo al instante.',
    qrTitle: 'Escanea este QR',
    qrHint: 'Ábrelo con la cámara del teléfono y te llevará directo a la app web instalable.',
    directTitle: 'Enlace directo',
    directHint: 'También puedes abrir el enlace manualmente o copiarlo para compartirlo.',
    installTitle: 'Instalar ahora',
    installHint: 'Si tu navegador soporta instalación, abre el prompt directamente desde aquí.',
    openLink: 'Abrir enlace',
    copyLink: 'Copiar enlace',
    copied: 'Enlace copiado',
    back: 'Volver',
  },
  en: {
    title: 'Download app',
    subtitle: 'Install Hungry Poly on your phone or scan this QR to open it instantly.',
    qrTitle: 'Scan this QR',
    qrHint: 'Open it with your phone camera and it will take you straight to the installable web app.',
    directTitle: 'Direct link',
    directHint: 'You can also open the link manually or copy it to share it.',
    installTitle: 'Install now',
    installHint: 'If your browser supports installation, you can open the install prompt from here.',
    openLink: 'Open link',
    copyLink: 'Copy link',
    copied: 'Link copied',
    back: 'Back',
  },
  fr: {
    title: 'Télécharger l’app',
    subtitle: 'Installe Hungry Poly sur ton téléphone ou scanne ce QR pour l’ouvrir tout de suite.',
    qrTitle: 'Scanne ce QR',
    qrHint: 'Ouvre-le avec l’appareil photo du téléphone pour accéder directement à la web app installable.',
    directTitle: 'Lien direct',
    directHint: 'Tu peux aussi ouvrir le lien manuellement ou le copier pour le partager.',
    installTitle: 'Installer maintenant',
    installHint: 'Si ton navigateur prend en charge l’installation, ouvre la fenêtre d’installation ici.',
    openLink: 'Ouvrir le lien',
    copyLink: 'Copier le lien',
    copied: 'Lien copié',
    back: 'Retour',
  },
  it: {
    title: 'Scarica app',
    subtitle: 'Installa Hungry Poly sul telefono o scansiona questo QR per aprirlo subito.',
    qrTitle: 'Scansiona questo QR',
    qrHint: 'Aprilo con la fotocamera del telefono e andrai direttamente alla web app installabile.',
    directTitle: 'Link diretto',
    directHint: 'Puoi anche aprire il link manualmente o copiarlo per condividerlo.',
    installTitle: 'Installa ora',
    installHint: 'Se il browser supporta l’installazione, apri il prompt da qui.',
    openLink: 'Apri link',
    copyLink: 'Copia link',
    copied: 'Link copiato',
    back: 'Indietro',
  },
  de: {
    title: 'App herunterladen',
    subtitle: 'Installiere Hungry Poly auf deinem Handy oder scanne diesen QR-Code, um es sofort zu öffnen.',
    qrTitle: 'Diesen QR scannen',
    qrHint: 'Öffne ihn mit der Handykamera und du landest direkt bei der installierbaren Web-App.',
    directTitle: 'Direkter Link',
    directHint: 'Du kannst den Link auch manuell öffnen oder zum Teilen kopieren.',
    installTitle: 'Jetzt installieren',
    installHint: 'Wenn dein Browser Installation unterstützt, öffne den Installationsdialog direkt hier.',
    openLink: 'Link öffnen',
    copyLink: 'Link kopieren',
    copied: 'Link kopiert',
    back: 'Zurück',
  },
  pt: {
    title: 'Descarregar app',
    subtitle: 'Instala o Hungry Poly no teu telemóvel ou lê este QR para o abrir já.',
    qrTitle: 'Lê este QR',
    qrHint: 'Abre-o com a câmara do telemóvel e vais direto para a app web instalável.',
    directTitle: 'Link direto',
    directHint: 'Também podes abrir o link manualmente ou copiá-lo para partilhar.',
    installTitle: 'Instalar agora',
    installHint: 'Se o teu navegador suportar instalação, abre o prompt diretamente aqui.',
    openLink: 'Abrir link',
    copyLink: 'Copiar link',
    copied: 'Link copiado',
    back: 'Voltar',
  },
};

export function DownloadAppScreen({ uiLang = 'es', downloadUrl, installEntryVisible, installEntryButton, onOpenInstallPrompt, onBack }) {
  const copy = COPY[uiLang] || COPY.en;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(downloadUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      alert(copy.copied);
    } catch {
      window.prompt(copy.copyLink, downloadUrl);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif",
      padding: '24px 0',
    }}>
      <div style={{
        width: 'min(1040px, 94vw)',
        background: '#16213e',
        borderRadius: 26,
        border: '2px solid #2a2a4a',
        boxShadow: '0 18px 50px rgba(0,0,0,.5)',
        padding: 'clamp(20px, 4vw, 34px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 'clamp(26px, 4vw, 40px)' }}>{copy.title}</div>
            <div style={{ color: '#c9cde2', fontSize: 15, lineHeight: 1.45, marginTop: 6, maxWidth: 720 }}>{copy.subtitle}</div>
          </div>
          <Btn onClick={onBack} color="#2a2a4a" style={{ color: '#d8ddf3' }}>{copy.back}</Btn>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
        }}>
          <div style={{
            background: 'rgba(255,255,255,.04)',
            borderRadius: 20,
            border: '1px solid rgba(255,215,0,.12)',
            padding: 20,
          }}>
            <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 22, marginBottom: 8 }}>{copy.qrTitle}</div>
            <div style={{ color: '#aeb4d0', fontSize: 13, lineHeight: 1.45, marginBottom: 14 }}>{copy.qrHint}</div>
            <div style={{
              background: '#fff7d6',
              borderRadius: 18,
              padding: 18,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <img src={qrUrl} alt="QR Hungry Poly" style={{ width: 'min(100%, 260px)', borderRadius: 12 }} />
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div style={{
              background: 'rgba(255,255,255,.04)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,.08)',
              padding: 20,
            }}>
              <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 22, marginBottom: 8 }}>{copy.directTitle}</div>
              <div style={{ color: '#aeb4d0', fontSize: 13, lineHeight: 1.45, marginBottom: 14 }}>{copy.directHint}</div>
              <div style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: '#0f1117',
                border: '1px solid rgba(255,255,255,.08)',
                color: '#d8ddf3',
                fontSize: 13,
                wordBreak: 'break-all',
                marginBottom: 12,
              }}>
                {downloadUrl}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn onClick={() => window.open(downloadUrl, '_blank')} color="#00BCD4" style={{ color: '#04101c', fontWeight: 900 }}>
                  {copy.openLink}
                </Btn>
                <Btn onClick={copyLink} color="#2a2a4a" style={{ color: '#d8ddf3' }}>
                  {copy.copyLink}
                </Btn>
              </div>
            </div>

            {installEntryVisible && (
              <div style={{
                background: 'rgba(255,215,0,.05)',
                borderRadius: 20,
                border: '1px solid rgba(255,215,0,.14)',
                padding: 20,
              }}>
                <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 22, marginBottom: 8 }}>{copy.installTitle}</div>
                <div style={{ color: '#aeb4d0', fontSize: 13, lineHeight: 1.45, marginBottom: 14 }}>{copy.installHint}</div>
                <Btn onClick={onOpenInstallPrompt} color="#FFD700" style={{ color: '#111', fontWeight: 900 }}>
                  {installEntryButton}
                </Btn>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
