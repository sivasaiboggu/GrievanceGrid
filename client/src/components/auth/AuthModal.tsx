import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { 
  Modal, 
  Button, 
  FormGroup, 
  TextInput, 
  Select, 
  Alert 
} from '../../design-system';
import { Building2, KeyRound, User, Mail, Lock, ShieldCheck, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, switchDemoRole } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('CITIZEN');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
        onClose();
      } else if (mode === 'REGISTER') {
        await register({ name, email, password, role, phone });
        onClose();
      } else if (mode === 'FORGOT') {
        setInfoMsg('A municipal credential reset link has been dispatched to your registered address.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole: Role) => {
    setLoading(true);
    setError('');
    try {
      await switchDemoRole(targetRole);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'LOGIN' ? 'Municipal System Login' : mode === 'REGISTER' ? 'Register Citizen Account' : 'Password Recovery'}
      subtitle="Institutional Civic Access & RBAC Portal"
      icon={<Building2 size={20} color="var(--civic-primary-action)" />}
      maxWidth="480px"
    >
      {error && (
        <Alert variant="danger" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {infoMsg && (
        <Alert variant="success" onClose={() => setInfoMsg('')}>
          {infoMsg}
        </Alert>
      )}

      {/* Quick 1-Click Demo Personas */}
      <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--civic-border)', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--civic-text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
          One-Click Role Demonstration Switcher
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <Button 
            type="button"
            variant="secondary"
            size="sm"
            style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            onClick={() => handleQuickDemo('CITIZEN')}
          >
            Citizen
          </Button>
          <Button 
            type="button"
            variant="secondary"
            size="sm"
            style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            onClick={() => handleQuickDemo('MUNICIPAL_OFFICER')}
          >
            Officer
          </Button>
          <Button 
            type="button"
            variant="secondary"
            size="sm"
            style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            onClick={() => handleQuickDemo('FIELD_WORKER')}
          >
            Field Worker
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'REGISTER' && (
          <>
            <FormGroup label="Full Legal Name" required>
              <TextInput
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Ramesh Kumar"
                required 
              />
            </FormGroup>

            <FormGroup label="Municipal Access Role" required>
              <Select
                value={role} 
                onChange={(e: any) => setRole(e.target.value)}
                options={[
                  { value: 'CITIZEN', label: 'Citizen (Grievance Reporting & Tracking)' },
                  { value: 'MUNICIPAL_OFFICER', label: 'Municipal Officer (Review, Triage & Verification)' },
                  { value: 'FIELD_WORKER', label: 'Field Worker (Technical Remediation & Proofs)' }
                ]}
              />
            </FormGroup>
          </>
        )}

        <FormGroup label="Registered Email" required>
          <TextInput 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="name@grievancegrid.gov.in"
            required 
          />
        </FormGroup>

        {mode !== 'FORGOT' && (
          <FormGroup label="Password" required>
            <TextInput 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </FormGroup>
        )}

        <Button 
          type="submit" 
          variant="primary" 
          fullWidth
          size="lg"
          style={{ marginTop: '8px' }} 
          isLoading={loading}
        >
          {mode === 'LOGIN' ? 'Sign In to Portal' : mode === 'REGISTER' ? 'Create Account' : 'Send Reset Link'}
        </Button>
      </form>

      {/* Mode Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--civic-primary-action)' }}>
        {mode === 'LOGIN' ? (
          <>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--civic-primary-action)', cursor: 'pointer', padding: 0 }} onClick={() => setMode('FORGOT')}>
              Forgot Password?
            </button>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--civic-primary-action)', fontWeight: 700, cursor: 'pointer', padding: 0 }} onClick={() => setMode('REGISTER')}>
              Create Citizen Account
            </button>
          </>
        ) : (
          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--civic-primary-action)', fontWeight: 700, margin: '0 auto', cursor: 'pointer', padding: 0 }} onClick={() => setMode('LOGIN')}>
            Back to Sign In
          </button>
        )}
      </div>
    </Modal>
  );
};
