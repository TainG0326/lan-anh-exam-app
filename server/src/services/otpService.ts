import { supabase } from '../config/supabase.js';

export interface AuthOTP {
  id: string;
  user_id: string;
  email: string;
  otp_code: string;
  otp_type: 'login' | 'reset';
  expires_at: string;
  verified: boolean;
  attempts: number;
  created_at: string;
}

// In-memory store for OTP (for faster access than DB)
const otpMemoryStore: Map<string, AuthOTP> = new Map();

// OTP expiration time in milliseconds (5 minutes)
const OTP_EXPIRATION = 5 * 60 * 1000;
// Max attempts before OTP is invalidated
const MAX_OTP_ATTEMPTS = 5;

export const OTPService = {
  // Generate 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Create OTP for login (2FA)
  async createLoginOTP(userId: string, email: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION).toISOString();

    const otpEntry: AuthOTP = {
      id: `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      email: email.toLowerCase(),
      otp_code: otp,
      otp_type: 'login',
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
      created_at: new Date().toISOString(),
    };

    // Store in memory
    otpMemoryStore.set(email.toLowerCase(), otpEntry);

    // Also store in DB for persistence
    try {
      await supabase.from('auth_otp').insert({
        user_id: userId,
        email: email.toLowerCase(),
        otp_code: otp,
        otp_type: 'login',
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
      });
    } catch (err) {
      console.error('Failed to store OTP in DB:', err);
    }

    return otp;
  },

  // Create OTP for password reset
  async createResetOTP(userId: string, email: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION).toISOString();

    const otpEntry: AuthOTP = {
      id: `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      email: email.toLowerCase(),
      otp_code: otp,
      otp_type: 'reset',
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
      created_at: new Date().toISOString(),
    };

    // Store in memory
    otpMemoryStore.set(email.toLowerCase(), otpEntry);

    // Also store in DB
    try {
      await supabase.from('auth_otp').insert({
        user_id: userId,
        email: email.toLowerCase(),
        otp_code: otp,
        otp_type: 'reset',
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
      });
    } catch (err) {
      console.error('Failed to store OTP in DB:', err);
    }

    return otp;
  },

  // Verify OTP
  async verifyOTP(email: string, otp: string, type: 'login' | 'reset'): Promise<{ valid: boolean; userId?: string; error?: string }> {
    const normalizedEmail = email.toLowerCase();
    const otpEntry = otpMemoryStore.get(normalizedEmail);

    // Also check DB if not in memory
    let storedOTP = otpEntry;
    if (!storedOTP) {
      try {
        const { data } = await supabase
          .from('auth_otp')
          .select('*')
          .eq('email', normalizedEmail)
          .eq('otp_type', type)
          .eq('verified', false)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          storedOTP = data[0] as AuthOTP;
          // Rehydrate into memory
          otpMemoryStore.set(normalizedEmail, storedOTP);
        }
      } catch (err) {
        console.error('Failed to fetch OTP from DB:', err);
      }
    }

    if (!storedOTP) {
      return { valid: false, error: 'Mã OTP không tồn tại hoặc đã hết hạn.' };
    }

    if (storedOTP.expires_at && new Date(storedOTP.expires_at) < new Date()) {
      otpMemoryStore.delete(normalizedEmail);
      return { valid: false, error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' };
    }

    if (storedOTP.attempts >= MAX_OTP_ATTEMPTS) {
      otpMemoryStore.delete(normalizedEmail);
      return { valid: false, error: 'Đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.' };
    }

    if (storedOTP.otp_code !== otp) {
      // Increment attempts
      storedOTP.attempts += 1;
      otpMemoryStore.set(normalizedEmail, storedOTP);

      // Update in DB
      try {
        await supabase
          .from('auth_otp')
          .update({ attempts: storedOTP.attempts })
          .eq('id', storedOTP.id);
      } catch (err) {
        console.error('Failed to update OTP attempts:', err);
      }

      const remaining = MAX_OTP_ATTEMPTS - storedOTP.attempts;
      return { valid: false, error: `Mã OTP không đúng. Còn ${remaining} lần thử.` };
    }

    // OTP is valid - mark as verified
    storedOTP.verified = true;
    otpMemoryStore.set(normalizedEmail, storedOTP);

    // Update in DB
    try {
      await supabase
        .from('auth_otp')
        .update({ verified: true })
        .eq('id', storedOTP.id);
    } catch (err) {
      console.error('Failed to mark OTP as verified:', err);
    }

    return { valid: true, userId: storedOTP.user_id };
  },

  // Clear OTP after successful login
  clearOTP(email: string): void {
    const normalizedEmail = email.toLowerCase();
    otpMemoryStore.delete(normalizedEmail);
  },

  // Cleanup expired OTPs (call periodically)
  async cleanup(): Promise<void> {
    try {
      await supabase
        .from('auth_otp')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Clear from memory
      for (const [email, otp] of otpMemoryStore.entries()) {
        if (new Date(otp.expires_at) < new Date()) {
          otpMemoryStore.delete(email);
        }
      }
    } catch (err) {
      console.error('Failed to cleanup expired OTPs:', err);
    }
  },
};
