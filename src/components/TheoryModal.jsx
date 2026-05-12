import React from 'react';
import { Info, HelpCircle, BookOpen } from 'lucide-react';

const TheoryModal = ({ isOpen, onClose, topic, content }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <BookOpen size={20} color="#3b82f6" />
            <h2 style={styles.title}>{topic} - Scientific Principles</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={styles.content}>
          {content || "No detailed theory available for this module yet. Keep exploring!"}
        </div>
        <div style={styles.footer}>
          "Science is a way of thinking much more than it is a body of knowledge." — Carl Sagan
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    animation: 'modalFadeIn 0.3s ease-out',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#f8fafc',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 5px',
  },
  content: {
    padding: '24px',
    color: '#cbd5e1',
    lineHeight: '1.6',
    fontSize: '14px',
    overflowY: 'auto',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #1e293b',
    fontSize: '11px',
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  }
};

export default TheoryModal;
