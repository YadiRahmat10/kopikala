import { useState } from 'react';
import type { FormEvent } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { CAFE } from '../data/seed';
import { isOpen, pad2 } from '../lib/format';
import { Icon } from '../components/ui';
import type { Role } from '../data/types';

const ROLES: { key: Role; icon: string; label: string }[] = [
  { key: 'pelanggan', icon: 'person', label: 'Pelanggan' },
  { key: 'admin', icon: 'admin_panel_settings', label: 'Admin' },
];

const Login: React.FC = () => {
  const { now, loginAdmin, loginCustomer } = useApp();
  const history = useHistory();
  const [role, setRole] = useState<Role>('pelanggan');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const open = isOpen(now);

  const switchRole = (r: Role) => {
    setRole(r);
    setError('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (role === 'pelanggan') {
      if (!name.trim()) return setError('Isi nama kamu dulu ya');
      loginCustomer(name);
      history.replace('/tamu/beranda');
      return;
    }
    if (!loginAdmin(username, password)) return setError('Username atau password salah');
    history.replace('/staf/ringkasan');
  };

  return (
    <IonPage>
      <IonContent>
        <div className="pt-safe flex min-h-full flex-col justify-center gap-6 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-10">
          <div className="flex flex-col items-center text-center">
            <div className="icon-btn h-16 w-16 bg-primary-container text-secondary-container shadow-lg">
              <Icon name="local_cafe" size={34} fill />
            </div>
            <h1 className="mt-4 text-headline-xl text-primary">{CAFE.name}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">Selamat datang! Masuk untuk mulai memesan atau mengelola cafe.</p>
            <span className={`chip mt-3 ${open ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {open ? 'Buka' : 'Tutup'} : ( {pad2(CAFE.open)}.00 - {pad2(CAFE.close)}.00 )
            </span>
          </div>

          <form onSubmit={submit} className="card gap-5 p-5">
            <div className="grid grid-cols-2 rounded-2xl bg-surface-container p-1">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => switchRole(r.key)}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-label-lg transition-all ${role === r.key ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
                >
                  <Icon name={r.icon} size={20} fill={role === r.key} />
                  {r.label}
                </button>
              ))}
            </div>

            {role === 'pelanggan' ? (
              <label className="block">
                <span className="mb-2 block text-label-lg text-primary">Nama Kamu</span>
                <input
                  value={name}
                  autoComplete="given-name"
                  maxLength={40}
                  placeholder="mis. Rani"
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  className="input"
                />
                <span className="mt-1.5 block text-label-md font-medium text-on-surface-variant">Dipakai barista untuk memanggil pesananmu</span>
              </label>
            ) : (
              <div className="flex flex-col gap-4">
                <label className="block">
                  <span className="mb-2 block text-label-lg text-primary">Username</span>
                  <input
                    value={username}
                    autoComplete="username"
                    autoCapitalize="none"
                    placeholder="admin"
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    className="input"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-label-lg text-primary">Password</span>
                  <span className="relative block">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      className="input pr-12"
                    />
                    <button
                      type="button"
                      aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setShowPass((v) => !v)}
                      className="icon-btn absolute right-1.5 top-1/2 h-10 w-10 -translate-y-1/2 text-on-surface-variant"
                    >
                      <Icon name={showPass ? 'visibility_off' : 'visibility'} size={20} />
                    </button>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => { setUsername(CAFE.demoAdmin.username); setPassword(CAFE.demoAdmin.password); setError(''); }}
                  className="flex items-center gap-1.5 self-start text-label-md text-secondary"
                >
                  <Icon name="key" size={16} />
                  Pakai akun demo ({CAFE.demoAdmin.username} / {CAFE.demoAdmin.password})
                </button>
              </div>
            )}

            {error && (
              <p className="-mt-2 flex items-center gap-1.5 text-label-md text-red-700">
                <Icon name="error" size={16} />
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full">
              <Icon name="login" size={20} />
              {role === 'pelanggan' ? 'Masuk sebagai Pelanggan' : 'Masuk sebagai Admin'}
            </button>
          </form>

          <p className="flex items-start justify-center gap-1 text-center text-label-md font-medium text-on-surface-variant">
            <Icon name="location_on" size={16} className="shrink-0" />
            {CAFE.address}
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
