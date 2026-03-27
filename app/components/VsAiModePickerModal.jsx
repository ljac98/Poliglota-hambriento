import React from 'react';
import { Btn } from './Btn.jsx';
import { Modal } from './Modal.jsx';
import vsiaImg from '../../imagenes/vsia.png';

export function VsAiModePickerModal({
  open,
  hasHat,
  normalStartDisabled,
  onClose,
  onStartNormal,
  onStartTutorial,
  T,
}) {
  if (!open) return null;

  return (
    <Modal title={T('vsAiModePickerTitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ color: '#d8ddf3', fontSize: 14, lineHeight: 1.45 }}>
          {T('vsAiModePickerDesc')}
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <button
            type="button"
            onClick={onStartNormal}
            disabled={normalStartDisabled}
            style={{
              width: '100%',
              borderRadius: 16,
              padding: '14px 16px',
              border: normalStartDisabled ? '1px solid rgba(255,255,255,0.08)' : '2px solid rgba(255,215,0,0.35)',
              background: normalStartDisabled ? 'rgba(255,255,255,0.04)' : 'linear-gradient(180deg, rgba(255,215,0,0.14), rgba(255,255,255,0.04))',
              color: normalStartDisabled ? '#7f859f' : '#fff4b3',
              textAlign: 'left',
              cursor: normalStartDisabled ? 'not-allowed' : 'pointer',
              fontFamily: "'Fredoka',sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <img src={vsiaImg} alt={T('vsAiModePickerNormalLabel')} style={{ width: 38, height: 38, objectFit: 'contain', opacity: normalStartDisabled ? 0.55 : 1 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 900 }}>{T('vsAiModePickerNormalLabel')}</span>
              <span style={{ fontSize: 12, color: normalStartDisabled ? '#7f859f' : '#c8cde4' }}>
                {!hasHat ? T('vsAiModePickerNormalNeedHat') : T('vsAiModePickerNormalReady')}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={onStartTutorial}
            style={{
              width: '100%',
              borderRadius: 16,
              padding: '14px 16px',
              border: '2px solid rgba(78,205,196,0.3)',
              background: 'linear-gradient(180deg, rgba(78,205,196,0.16), rgba(255,255,255,0.04))',
              color: '#d7fffb',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: "'Fredoka',sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <img src={vsiaImg} alt={T('vsAiModePickerTutorialLabel')} style={{ width: 38, height: 38, objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 900 }}>{T('vsAiModePickerTutorialLabel')}</span>
              <span style={{ fontSize: 12, color: '#b9dad8' }}>{T('vsAiModePickerTutorialDesc')}</span>
            </div>
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn onClick={onClose} color="#2a2a4a" style={{ color: '#fff' }}>
            {T('close')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
