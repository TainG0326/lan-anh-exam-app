import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { updateProfile, uploadAvatar, getMe } from '../services/authService';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Save,
  Camera,
  Calendar,
  CheckCircle2,
  Shield,
  Settings2,
  Bell,
  BellOff,
  Phone,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

type ProfileTab = 'personal' | 'security' | 'preferences';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [memberSince, setMemberSince] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('student-notifications-enabled');
    return stored !== null ? stored === 'true' : true;
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phonePrefix: '+84',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let joined = localStorage.getItem('student-member-since');
    if (!joined) {
      joined = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      localStorage.setItem('student-member-since', joined);
    }
    setMemberSince(joined);
  }, []);

  useEffect(() => {
    if (!user) return;

    const storedPhone = user.phone || '';
    let digits = storedPhone.replace(/\D/g, '').slice(-10);

    for (let digitLen = digits.length - 1; digitLen >= 9; digitLen--) {
      const candidate = digits.slice(0, digitLen);
      if (candidate + candidate === digits) {
        digits = candidate;
        break;
      }
    }
    if (digits.length > 10 && digits.length > 0) {
      let found = false;
      for (let dl = digits.length - 1; dl >= 9; dl--) {
        if (digits.slice(0, dl) + digits.slice(0, dl) === digits) { found = true; break; }
      }
      if (!found) {
        digits = digits.slice(0, 10);
      }
    }
    const prefixMatch = storedPhone.match(/^(\+\d+)/);
    const prefix = prefixMatch ? prefixMatch[1] : '+84';

    setFormData((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: digits,
      phonePrefix: prefix,
    }));

    if (user.avatarUrl) {
      const url = user.avatarUrl.startsWith('http')
        ? user.avatarUrl
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`;
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('toast.imageType') || 'Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.imageSize') || 'Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const response = await uploadAvatar(file);
      if (response.success) {
        try {
          const freshUser = await getMe();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          setUser(response.user);
        }
        toast.success(t('toast.avatarSuccess') || 'Avatar updated successfully!');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (t('toast.uploadFailed') || 'Failed to upload avatar');
      toast.error(msg);
      setAvatarPreview(
        user?.avatarUrl
          ? user.avatarUrl.startsWith('http')
            ? user.avatarUrl
            : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`
          : null
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fullPhone: string | null = null;
      if (formData.phone) {
        const digits = formData.phone.replace(/\D/g, '').slice(0, 10);
        fullPhone = `${formData.phonePrefix}${digits}`;
      }
      const response = await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: fullPhone,
      });
      if (response.success) {
        setUser(response.user);
        toast.success(t('toast.updateSuccess') || 'Profile updated successfully!');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('toast.updateFailed') || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newPassword) {
      toast.error(t('profile.enterNewPassword') || 'Enter a new password');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error(t('toast.passwordMin') || 'New password must be at least 6 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('toast.passwordMismatch') || 'New passwords do not match');
      return;
    }
    if (!formData.currentPassword) {
      toast.error(t('profile.currentPasswordRequired') || 'Current password is required');
      return;
    }
    setSavingPassword(true);
    try {
      const response = await updateProfile({
        password: formData.newPassword,
        currentPassword: formData.currentPassword,
      });
      if (response.success) {
        setUser(response.user);
        toast.success('Password updated successfully!');
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatarUrl) {
      return user.avatarUrl.startsWith('http')
        ? user.avatarUrl
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`;
    }
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back') || 'Back'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_1fr] gap-6 lg:gap-8 items-start">
        {/* Left: profile summary */}
        <div className="rounded-2xl border border-border bg-surface shadow-soft-lg overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-primary-light via-primary/15 to-secondary" />
          <div className="px-6 pb-6 -mt-12 relative">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl border-4 border-surface shadow-soft overflow-hidden bg-gradient-to-br from-primary to-primary-dark">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 h-9 w-9 rounded-xl bg-primary text-white shadow-button flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50"
                  aria-label="Change photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-center mt-4">
              <h2 className="text-lg font-bold text-text-primary">
                {user?.name || 'Student'}
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">{t('dashboard.student') || 'Student'}</p>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {t('dashboard.student') || 'Student'}
                </span>
                <CheckCircle2 className="w-5 h-5 text-success" aria-hidden />
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-3 text-text-secondary">
                <Calendar className="w-4 h-4 shrink-0 text-primary" />
                <span>{memberSince}</span>
              </li>
              <li className="flex items-start gap-3 text-text-secondary">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-text-primary font-medium">
                    {user?.email || '—'}
                  </p>
                  <span className="inline-flex mt-1 items-center rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success">
                    {t('common.verified') || '✓ Verified'}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: tabbed form */}
        <div className="rounded-2xl border border-border bg-surface/95 backdrop-blur-sm shadow-soft-lg overflow-hidden">
          <div className="flex border-b border-border bg-background-light/80 px-2 pt-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex-1 flex items-center justify-center py-3 rounded-t-xl transition-colors ${
                activeTab === 'personal'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-background'
              }`}
              aria-current={activeTab === 'personal'}
            >
              <User className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 flex items-center justify-center py-3 rounded-t-xl transition-colors ${
                activeTab === 'security'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-background'
              }`}
              aria-current={activeTab === 'security'}
            >
              <Shield className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 flex items-center justify-center py-3 rounded-t-xl transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-background'
              }`}
              aria-current={activeTab === 'preferences'}
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'personal' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">
                    {t('profile.personal') || 'Personal Information'}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {t('profile.updateInfo') || 'Update your information'}
                  </p>
                </div>
                <form onSubmit={handleSavePersonal} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                      {t('profile.name') || 'Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-border bg-background-light px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t('profile.name') || 'Enter full name'}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                      {t('profile.phone') || 'Phone Number'}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative w-32 shrink-0">
                        <select
                          className="w-full appearance-none rounded-xl border border-border bg-background-light pl-4 pr-8 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer font-medium"
                          value={formData.phonePrefix}
                          onChange={(e) => setFormData((p) => ({ ...p, phonePrefix: e.target.value }))}
                        >
                          <option value="+84">🇻🇳 +84</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+65">🇸🇬 +65</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          className="w-full rounded-xl border border-border bg-background-light pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          value={formData.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData((p) => ({ ...p, phone: val.slice(0, 10) }));
                          }}
                          placeholder={t('profile.phone') || 'Enter phone number'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                      {t('profile.email') || 'Email'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      <input
                        type="email"
                        readOnly
                        disabled
                        className="w-full rounded-xl border border-border/50 bg-background-light/50 pl-11 pr-12 py-3 text-sm text-text-secondary cursor-not-allowed"
                        value={formData.email}
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                    <p className="mt-1.5 text-[11px] text-text-muted">
                      {t('profile.noEmail') || 'Email is managed by the system'}
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-button hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('common.saving') || 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {t('common.save') || 'Save Changes'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">
                    {t('profile.security') || 'Security'}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {t('profile.managePassword') || 'Change your password'}
                  </p>
                </div>
                <form onSubmit={handleSavePassword} className="space-y-5 max-w-xl">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                      <Lock className="w-3.5 h-3.5 inline mr-1" />
                      {t('profile.currentPassword') || 'Current password'}
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-border bg-background-light px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder={t('profile.currentPassword') || 'Current password'}
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                      {t('profile.newPassword') || 'New password'}
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-border bg-background-light px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, newPassword: e.target.value })
                      }
                      placeholder={t('profile.newPassword') || 'New password (min 6 characters)'}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                      {t('profile.confirmPassword') || 'Confirm new password'}
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-border bg-background-light px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder={t('profile.confirmPassword') || 'Confirm new password'}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-button hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      {savingPassword ? 'Updating...' : (t('profile.updatePassword') || 'Update password')}
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'preferences' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">
                    {t('profile.preferences') || 'Preferences'}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {t('profile.notifications') || 'Notifications'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border bg-background-light p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${notificationsEnabled ? 'bg-primary/10' : 'bg-gray-100'}`}>
                      {notificationsEnabled ? (
                        <Bell className="w-5 h-5 text-primary" />
                      ) : (
                        <BellOff className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Push notifications
                      </p>
                      <p className="text-xs text-text-muted">
                        {notificationsEnabled 
                          ? (t('profile.notificationsDesc') || 'Receive notifications when there are updates')
                          : (t('notifications.empty') || 'Notifications are disabled')
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationsEnabled}
                    onClick={() => {
                      const next = !notificationsEnabled;
                      setNotificationsEnabled(next);
                      localStorage.setItem('student-notifications-enabled', String(next));
                      toast.success(next ? 'Notifications enabled' : 'Notifications disabled');
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 ${
                      notificationsEnabled ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
