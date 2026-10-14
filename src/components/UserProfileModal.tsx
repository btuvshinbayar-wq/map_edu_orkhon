import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  UserCog,
  Building2,
  MapPin,
  Phone,
  Mail,
  Lock,
  Key,
  Save,
  ShieldCheck,
  UserCheck,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AIMAGS_DATA } from '../data/aimags';
import { StudentGradeLevel, User } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null; // Optional: if admin is editing a specific user's profile
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { currentUser, updateUserProfile } = useApp();

  const editingUser = targetUser || currentUser;
  const canEditCategory = currentUser?.role === 'admin';

  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState<StudentGradeLevel>('9');
  const [school, setSchool] = useState('');
  const [aimag, setAimag] = useState(AIMAGS_DATA[0].name);
  const [soum, setSoum] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && editingUser) {
      setFullName(editingUser.fullName || '');
      setGrade(editingUser.grade || '9');
      setSchool(editingUser.school || editingUser.organization || '');
      setAimag(editingUser.aimag || AIMAGS_DATA[0].name);
      setSoum(editingUser.soum || '');
      setPosition(editingUser.position || editingUser.notes || '');
      setPhone(editingUser.phone || '');
      setEmail(editingUser.email || '');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(null);
    }
  }, [isOpen, editingUser]);

  if (!isOpen || !editingUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !school.trim()) {
      setMessage({
        text: 'Овог нэр болон сургууль/байгууллагын нэрийг заавал бөглөнө үү.',
        type: 'error',
      });
      return;
    }

    if (!phone.trim()) {
      setMessage({
        text: 'Утасны дугаараа заавал оруулна уу.',
        type: 'error',
      });
      return;
    }

    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        setMessage({
          text: 'Шинэ нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой.',
          type: 'error',
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({
          text: 'Шинэ нууц үг давтсан утгатай таарахгүй байна.',
          type: 'error',
        });
        return;
      }
    }

    const res = await updateUserProfile({
      userId: editingUser.id,
      fullName: fullName.trim(),
      school: school.trim(),
      aimag,
      soum: soum.trim() || 'Төв',
      grade,
      phone: phone.trim(),
      email: email.trim(),
      position: position.trim(),
      password: newPassword.trim() ? newPassword.trim() : undefined,
    });

    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
              <UserCog className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {targetUser && targetUser.id !== currentUser?.id
                  ? 'Хэрэглэгчийн мэдээлэл засах'
                  : 'Миний мэдээлэл & Сургууль засах'}
              </h2>
              <p className="text-xs text-slate-500">
                Овог нэр, сургууль/байгууллага, аймаг/хот болон бусад хувийн мэдээллээ шинэчлэх
              </p>
            </div>
          </div>

          {/* Account Status Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-700">
              Код: {editingUser.studentCode || editingUser.id}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold ${
                editingUser.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : editingUser.status === 'pending'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {editingUser.role === 'admin' ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              {editingUser.status === 'approved'
                ? 'Уралдааны эрх баталгаажсан'
                : editingUser.status === 'pending'
                ? 'Сорил & Газрын зургийн эрх нээлттэй'
                : 'Хүлээгдэж буй'}
            </span>
            {editingUser.teamName && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 font-bold text-indigo-700">
                <Award className="h-3.5 w-3.5" />
                Баг: {editingUser.teamName}
              </span>
            )}
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold ${
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

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Category Selector */}
          {editingUser.role !== 'admin' && (
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Хэрэглэгчийн ангилал *
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
                    disabled={!canEditCategory}
                    onClick={() => canEditCategory && setGrade(item.id)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-center transition-all ${canEditCategory ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${
                      grade === item.id
                        ? 'border-amber-500 bg-amber-50 text-slate-950 font-bold ring-1 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
              {!canEditCategory && (
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Ангиллыг бүртгүүлсний дараа зөвхөн админ өөрчилнө (уралдаан ангиллаар явагддаг).
                </p>
              )}
            </div>
          )}

          {/* Full Name & School */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Овог, Нэр *
              </label>
              <input
                type="text"
                required
                placeholder="Жишээ: А. Тэмүүлэн"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                <span>Сургууль / Байгууллага *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Жишээ: Нийслэлийн 1-р сургууль"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full rounded-xl border border-amber-300 bg-amber-50/30 px-3.5 py-2.5 font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Location: Aimag & Soum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                <MapPin className="h-3.5 w-3.5 text-sky-600" />
                <span>Аймаг / Хот *</span>
              </label>
              <select
                value={aimag}
                onChange={(e) => setAimag(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none shadow-2xs"
              >
                {AIMAGS_DATA.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Сум / Дүүрэг
              </label>
              <input
                type="text"
                placeholder="Жишээ: Сүхбаатар дүүрэг"
                value={soum}
                onChange={(e) => setSoum(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Class / Position / Additional Info */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Анги бүлэг / Албан тушаал (Сонголттой)
            </label>
            <input
              type="text"
              placeholder={
                grade === 'teacher'
                  ? 'Жишээ: Газарзүйн багш, Заах аргын нэгдлийн ахлагч'
                  : 'Жишээ: 9А анги (эсвэл чиглүүлэгч багшийн нэр)'
              }
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>Утасны дугаар *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="99112233"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                <Mail className="h-3.5 w-3.5 text-indigo-600" />
                <span>Имэйл хаяг *</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Optional Password Change */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Нууц үг солих (Сонголттой)
              </span>
              <span className="text-[11px] text-slate-400">
                Солихгүй бол хоосон орхино уу
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="password"
                  placeholder="Шинэ нууц үг (6+ тэмдэгт)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Шинэ нууц үг давтах"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Болих
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Мэдээлэл хадгалах</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
