import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, UserCheck, Users, UserCog } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AIMAGS_DATA } from '../data/aimags';
import { StudentGradeLevel } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenProfile }) => {
  const { currentUser, registerUser, loginUser, resetPasswordEmail, setMainMenuTab } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState<StudentGradeLevel>('9');
  const [aimag, setAimag] = useState(AIMAGS_DATA[0].name);
  const [soum, setSoum] = useState('');
  const [school, setSchool] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Unified Login identifier & password
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !school.trim() || !phone.trim()) {
      setMessage({ text: 'Овог нэр, сургууль/байгууллага болон утасны дугаараа бөглөнө үү.', type: 'error' });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setMessage({ text: 'Өөрийн имэйл хаягаа зөв оруулна уу.', type: 'error' });
      return;
    }

    if (!registerPassword.trim()) {
      setMessage({ text: 'Нууц үгээ заавал оруулна уу.', type: 'error' });
      return;
    }

    if (registerPassword.trim().length < 4) {
      setMessage({ text: 'Нууц үг хамгийн багадаа 4 тэмдэгттэй байх ёстой.', type: 'error' });
      return;
    }

    if (registerPassword.length < 6) {
      setMessage({
        text: 'Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой (Firebase Authentication стандартын дагуу).',
        type: 'error',
      });
      return;
    }

    if (registerPassword !== confirmPassword) {
      setMessage({ text: 'Нууц үг давтсан утгатай таарахгүй байна. Шалгана уу.', type: 'error' });
      return;
    }

    const autoCode = `USR-${Date.now().toString().slice(-6)}`;
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    const result = await registerUser({
      fullName: fullName.trim(),
      grade,
      school: school.trim(),
      aimag,
      soum: soum.trim() || 'Төв',
      studentCode: autoCode,
      phone: cleanPhone,
      email: cleanEmail,
      password: registerPassword.trim(),
      role: grade === 'teacher' ? 'teacher' : 'student',
    });

    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setMessage({ text: 'Имэйл хаягаа оруулна уу.', type: 'error' });
      return;
    }

    const result = await loginUser(loginIdentifier.trim(), loginPassword);
    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      setTimeout(() => {
        if (result.isAdmin) {
          setMainMenuTab('admin_auth');
        }
        onClose();
      }, 900);
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <UserCheck className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {mode === 'register' ? 'Хэрэглэгчийн бүртгэл' : 'Системд нэвтрэх'}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {mode === 'register'
              ? 'Сайтад бүртгүүлснээр интерактив газрын зураг болон сорилыг ашиглах эрх шууд нээгдэнэ.'
              : 'Бүртгүүлсэн имэйл хаяг эсвэл утасны дугаараараа нэвтэрнэ үү.'}
          </p>

          {/* Toggle Login/Register buttons */}
          <div className="mt-4 flex rounded-lg bg-slate-100 p-1 text-xs">
            <button
              onClick={() => {
                setMode('register');
                setMessage(null);
              }}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors cursor-pointer ${
                mode === 'register' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Хэрэглэгчийн бүртгэл
            </button>
            <button
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Нэвтрэх
            </button>
          </div>

          {currentUser && onOpenProfile && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
              <div>
                <p className="font-bold text-slate-900">
                  Нэвтэрсэн: {currentUser.fullName}
                </p>
                <p className="text-[11px] text-slate-600 truncate">
                  {currentUser.school || currentUser.organization} · {currentUser.aimag}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenProfile}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <UserCog className="h-3.5 w-3.5" />
                <span>Сургууль & Мэдээлэл засах</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Registration Form */}
        {mode === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            {/* 3 Categories Selector: 9, 12, Teacher (Teams organized by admin from registered users) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Хэрэглэгчийн ангилал сонгох *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '9' as StudentGradeLevel, label: '9-р анги', icon: '🎒' },
                  { id: '12' as StudentGradeLevel, label: '12-р анги', icon: '🎓' },
                  { id: 'teacher' as StudentGradeLevel, label: 'Багш', icon: '👨‍🏫' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGrade(item.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      grade === item.id
                        ? 'border-amber-500 bg-amber-50 text-slate-950 font-bold ring-1 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-base mb-1">{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name & School */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Овог, Нэр *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Жишээ: А. Тэмүүлэн"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Сургууль / Байгууллага *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Жишээ: Нийслэлийн 1-р сургууль"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Location: Aimag & Soum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Аймаг / Хот *
                </label>
                <select
                  value={aimag}
                  onChange={(e) => setAimag(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-amber-500 focus:outline-none shadow-xs"
                >
                  {AIMAGS_DATA.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Сум / Дүүрэг
                </label>
                <input
                  type="text"
                  placeholder="Жишээ: Сүхбаатар дүүрэг"
                  value={soum}
                  onChange={(e) => setSoum(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Утасны дугаар *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="99112233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Имэйл хаяг *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Нууц үг зохиох *
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="Хамгийн багадаа 4 тэмдэгт"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Нууц үг давтах *
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="Нууц үгээ дахин оруулна уу"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
            >
              Бүртгүүлэх
            </button>
          </form>
        ) : (
          /* Unified Login Form for both Users and Admin */
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Имэйл хаяг *
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Нууц үг *
              </label>
              <input
                type="password"
                required
                placeholder="Нууц үгээ оруулна уу"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
            >
              Системд нэвтрэх
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!loginIdentifier.includes('@')) {
                  setMessage({ text: 'Эхлээд имэйл хаягаа дээрх талбарт бичнэ үү.', type: 'error' });
                  return;
                }
                const r = await resetPasswordEmail(loginIdentifier);
                setMessage({ text: r.message, type: r.success ? 'success' : 'error' });
              }}
              className="w-full text-center text-[11px] font-medium text-slate-500 hover:text-amber-700 underline cursor-pointer"
            >
              Нууц үгээ мартсан уу?
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
