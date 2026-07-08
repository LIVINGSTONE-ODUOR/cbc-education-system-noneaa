import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import loginBg from '@/assets/hero-bg.png';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AuthService } from '@/lib/auth';

type PasswordStep = 'request' | 'reset' | 'done';

const STYLES = `
  * { box-sizing: border-box; }

  .lp-page {
    position: relative; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; padding: 24px 16px;
  }
  .lp-bg {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
  }
.lp-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg,
      rgba(0,0,0,0.82) 0%,
      rgba(0,0,0,0.72) 50%,
      rgba(0,0,0,0.84) 100%);
    backdrop-filter: blur(2px) saturate(0.9);
  }

  .lp-card-wrap {
    position:relative;z-index:10;
    width:100%;max-width:880px;
    animation:cardRise 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  /* Make the card background significantly darker so the page behind is not visible */
  .lp-card {
    display:flex;
    border-radius:26px;overflow:hidden;
    backdrop-filter: blur(10px);
    background: rgba(0,0,0,0.78);
    border:1px solid rgba(255,255,255,0.10);
    box-shadow:
      0 50px 120px rgba(0,0,0,0.85),
      0 0 0 1px rgba(255,255,255,0.06) inset,
      0 1px 0 rgba(255,255,255,0.08) inset;
  }
  .lp-blob {
    position: absolute; border-radius: 50%;
    filter: blur(90px); pointer-events: none;
    animation: blobPulse 10s ease-in-out infinite;
  }
  .lp-blob-1 { width:480px;height:480px;top:-140px;left:-140px;background:rgba(59,130,246,0.16);animation-delay:0s; }
  .lp-blob-2 { width:380px;height:380px;top:-80px;right:-80px;background:rgba(139,92,246,0.13);animation-delay:3s; }
  .lp-blob-3 { width:420px;height:420px;bottom:-120px;left:35%;background:rgba(6,182,212,0.10);animation-delay:6s; }
  @keyframes blobPulse {
    0%,100% { transform:scale(1) translate(0,0);opacity:0.8; }
    50%      { transform:scale(1.06) translate(12px,-12px);opacity:1; }
  }
  .lp-dots {
    position:absolute;inset:0;pointer-events:none;
    background-image:radial-gradient(rgba(255,255,255,0.055) 1px,transparent 1px);
    background-size:30px 30px;
  }

  /* Card wrapper */
  .lp-card-wrap {
    position:relative;z-index:10;
    width:100%;max-width:880px;
    animation:cardRise 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardRise {
    from{opacity:0;transform:translateY(30px) scale(0.96);}
    to{opacity:1;transform:translateY(0) scale(1);}
  }
  .lp-card {
    display:flex;
    border-radius:26px;overflow:hidden;
    backdrop-filter:blur(24px);
    background:rgba(8,14,32,0.58);
    border:1px solid rgba(255,255,255,0.09);
    box-shadow:
      0 40px 100px rgba(0,0,0,0.6),
      0 0 0 1px rgba(255,255,255,0.05) inset,
      0 1px 0 rgba(255,255,255,0.1) inset;
  }

  /* ── LEFT PANEL ── */
  .lp-left {
    width:42%;
    background:rgba(255,255,255,0.03);
    border-right:1px solid rgba(255,255,255,0.06);
    padding:40px 34px;
    display:flex;flex-direction:column;
    position:relative;overflow:hidden;
  }
  .lp-left-glow {
    position:absolute;top:-80px;right:-80px;
    width:240px;height:240px;
    background:radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 65%);
    border-radius:50%;pointer-events:none;
  }

  /* Back btn */
  .lp-back {
    display:inline-flex;align-items:center;gap:7px;
    color:rgba(255,255,255,0.38);font-size:14px;font-weight:500;
    background:none;border:none;cursor:pointer;font-family:inherit;
    padding:0;margin-bottom:28px;transition:all 0.18s;
  }
  .lp-back:hover{color:rgba(255,255,255,0.8);transform:translateX(-4px);}

  .lp-logo{display:flex;align-items:center;gap:12px;margin-bottom:34px;}
  .lp-logo-icon{
    width:46px;height:46px;
    background:linear-gradient(135deg,#3b82f6,#6366f1);
    border-radius:14px;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 22px rgba(59,130,246,0.45);
    flex-shrink:0;
  }
  .lp-logo-name{font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.4px;line-height:1.1;}
  .lp-logo-sub{font-size:10px;color:rgba(255,255,255,0.3);font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}

  .lp-section-label{font-size:10px;font-weight:700;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:1.4px;margin-bottom:10px;}

  .lp-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto;padding-top:22px;}
  .lp-stat{
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.05);
    border-radius:11px;padding:11px 13px;
    display:flex;align-items:center;gap:9px;
    transition:background 0.18s;cursor:default;
  }
  .lp-stat:hover{background:rgba(255,255,255,0.07);}
  .lp-stat-val{font-size:15px;font-weight:800;color:#fff;line-height:1;}
  .lp-stat-lbl{font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;font-weight:500;}

  /* ── RIGHT PANEL ── */
  .lp-right{
    flex:1;padding:46px 44px;
    display:flex;flex-direction:column;justify-content:center;
    position:relative;overflow:hidden;
  }
  .lp-right-glow{
    position:absolute;bottom:-60px;right:-60px;
    width:220px;height:220px;
    background:radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%);
    border-radius:50%;pointer-events:none;
  }

  .lp-title{font-size:29px;font-weight:800;color:#fff;letter-spacing:-0.7px;line-height:1.15;margin-bottom:5px;}
  .lp-sub{font-size:14px;color:rgba(255,255,255,0.38);margin-bottom:30px;}
  .lp-sub strong{color:rgba(255,255,255,0.65);font-weight:600;}

  /* Error */
  .lp-err{
    background:rgba(239,68,68,0.1);
    border:1px solid rgba(239,68,68,0.25);
    border-radius:12px;padding:11px 14px;
    font-size:13px;color:#fca5a5;
    margin-bottom:16px;display:flex;align-items:center;gap:8px;
  }

  .lp-ok{
    background:rgba(34,197,94,0.10);
    border:1px solid rgba(34,197,94,0.28);
    border-radius:12px;padding:11px 14px;
    font-size:13px;color:#86efac;
    margin-bottom:16px;display:flex;align-items:center;gap:8px;
  }

  /* Fields */
  .lp-field{margin-bottom:16px;}
  .lp-lbl{
    display:flex;align-items:center;justify-content:space-between;
    font-size:13px;font-weight:600;
    color:rgba(255,255,255,0.5);margin-bottom:7px;
  }
  .lp-inp-wrap{position:relative;}
  .lp-inp{
    width:100%;height:50px;padding:0 16px;
    background:rgba(255,255,255,0.07);
    border:1.5px solid rgba(255,255,255,0.1);
    border-radius:13px;
    font-size:14px;color:#fff;font-family:inherit;outline:none;
    transition:all 0.2s;
  }
  .lp-inp::placeholder{color:rgba(255,255,255,0.2);}
  .lp-inp:focus{
    background:rgba(255,255,255,0.1);
    border-color:rgba(99,102,241,0.65);
    box-shadow:0 0 0 3px rgba(99,102,241,0.14);
  }
  .lp-inp.err{border-color:rgba(239,68,68,0.5);box-shadow:0 0 0 3px rgba(239,68,68,0.1);}
  .lp-inp-pw{padding-right:48px;}
  .lp-eye{
    position:absolute;right:14px;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.28);
    display:flex;padding:0;transition:color 0.18s;
  }
  .lp-eye:hover{color:rgba(255,255,255,0.75);}

  /* Submit */
  .lp-btn{
    width:100%;height:50px;
    background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);
    color:#fff;border:none;border-radius:13px;
    font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;
    display:flex;align-items:center;justify-content:center;gap:9px;
    box-shadow:0 8px 28px rgba(59,130,246,0.35);
    transition:all 0.22s;position:relative;overflow:hidden;
    margin-bottom:18px;
  }
  .lp-btn::after{
    content:'';position:absolute;inset:0;
    background:linear-gradient(135deg,rgba(255,255,255,0.11),transparent);
    opacity:0;transition:opacity 0.2s;
  }
  .lp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 38px rgba(59,130,246,0.5);}
  .lp-btn:hover:not(:disabled)::after{opacity:1;}
  .lp-btn:active:not(:disabled){transform:translateY(0);}
  .lp-btn:disabled{opacity:0.45;cursor:not-allowed;box-shadow:none;}

  .lp-divider{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
  .lp-divider-ln{flex:1;height:1px;background:rgba(255,255,255,0.07);}
  .lp-divider-txt{font-size:10px;color:rgba(255,255,255,0.18);white-space:nowrap;letter-spacing:0.3px;}
  .lp-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;}
  .lp-foot-copy{font-size:11px;color:rgba(255,255,255,0.18);}
  .lp-foot-links{display:flex;gap:14px;}
  .lp-foot-links a{font-size:11px;color:rgba(255,255,255,0.25);text-decoration:none;transition:color 0.18s;}
  .lp-foot-links a:hover{color:rgba(255,255,255,0.6);}

  @media(max-width:680px){
    .lp-card{flex-direction:column;}
    .lp-left{width:100%;border-right:none;border-bottom:1px solid rgba(255,255,255,0.06);padding:28px 24px;}
    .lp-stats{display:none;}
    .lp-right{padding:28px 24px;}
  }
`;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading } = useAuth();

  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') || '';

  const initialStep: PasswordStep = tokenFromUrl ? 'reset' : 'request';

  const [step, setStep] = useState<PasswordStep>(initialStep);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const leftStats = useMemo(
    () => [
      { value: 'Secure', label: 'Token protected' },
      { value: 'Fast', label: '1-step reset' },
    ],
    []
  );

  const handleGoBack = () => {
    if (window.history.length > 1) return navigate(-1);
    navigate('/login');
  };

  const canRequest = email.trim().length > 4 && !loading;
  const canReset =
    !!tokenFromUrl &&
    password.length >= 8 &&
    confirm.length >= 8 &&
    password === confirm &&
    !loading;

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!email.trim()) {
      setSubmitError('Email is required.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.requestPasswordReset(email.trim());
      setStep('done');
      toast({ title: 'Reset link sent', description: 'Check your email for next steps.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Password reset request failed.';
      setSubmitError(msg);
      toast({ title: 'Request failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!tokenFromUrl) {
      setSubmitError('Reset token is missing.');
      return;
    }
    if (password !== confirm) {
      setSubmitError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.resetPassword(tokenFromUrl, password);
      setStep('done');
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Password reset failed.';
      setSubmitError(msg);
      toast({ title: 'Reset failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="lp-page">

        <div className="lp-bg" style={{ backgroundImage: `url(${loginBg})` }} />
        <div className="lp-overlay" />
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
        <div className="lp-dots" />

        <div className="lp-card-wrap">
          <div className="lp-card">
            <div className="lp-left">
              <div className="lp-left-glow" />

              <button type="button" className="lp-back" onClick={handleGoBack}>
                <ArrowLeft size={15} /> Back
              </button>

              <div className="lp-logo">
                <div className="lp-logo-icon" />
                <div>
                  <div className="lp-logo-name">NONEAA</div>
                  <div className="lp-logo-sub">Education System</div>
                </div>
              </div>

              <div className="lp-section-label">Account Recovery</div>

              <div className="lp-stats">
                {leftStats.map((s) => (
                  <div className="lp-stat" key={s.label}>
                    <div>
                      <div className="lp-stat-val">{s.value}</div>
                      <div className="lp-stat-lbl">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-right">
              <div className="lp-right-glow" />

              {step === 'done' ? (
                <>
                  <div className="lp-title">All set</div>
                  <div className="lp-sub">Your password was updated successfully.</div>
                  <div className="lp-ok">
                    <CheckCircle2 size={16} /> <span>Proceed to sign in.</span>
                  </div>

                  <button
                    type="button"
                    className="lp-btn"
                    disabled={isLoading || loading}
                    onClick={() => navigate('/login')}
                  >
                    Go to login <ArrowRight size={16} />
                  </button>

                  <div className="lp-divider">
                    <div className="lp-divider-ln" />
                    <span className="lp-divider-txt">Secure · Encrypted · CBE Compliant</span>
                    <div className="lp-divider-ln" />
                  </div>
                  <div className="lp-foot">
                    <span className="lp-foot-copy">© 2026 CBE Noneaa</span>
                    <div className="lp-foot-links">
                      <a href="/privacy">Privacy</a>
                      <a href="/terms">Terms</a>
                      <a href="/support">Help</a>
                    </div>
                  </div>
                </>
              ) : step === 'reset' ? (
                <>
                  <div className="lp-title">Reset password</div>
                  <div className="lp-sub">
                    Enter your new password to finish the reset.
                  </div>

                  {submitError && (
                    <div className="lp-err"><span>⚠</span>{submitError}</div>
                  )}

                  <form onSubmit={onReset}>
                    <div className="lp-field">
                      <div className="lp-lbl"><span>New password</span></div>
                      <div className="lp-inp-wrap">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={cn('lp-inp lp-inp-pw', submitError ? 'err' : '')}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="lp-eye"
                          onClick={() => setShowPassword((v) => !v)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <div className="lp-field">
                      <div className="lp-lbl"><span>Confirm password</span></div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={cn('lp-inp', submitError ? 'err' : '')}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                      />
                    </div>

                    <button type="submit" className="lp-btn" disabled={!canReset || isLoading}>
                      {loading ? (
                        <>
                          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Resetting…
                        </>
                      ) : (
                        <>Update password <ArrowRight size={16} /></>
                      )}
                    </button>

                    <div className="lp-divider">
                      <div className="lp-divider-ln" />
                      <span className="lp-divider-txt">Secure · Encrypted · CBE Compliant</span>
                      <div className="lp-divider-ln" />
                    </div>
                    <div className="lp-foot">
                      <span className="lp-foot-copy">© 2026 CBE Noneaa</span>
                      <div className="lp-foot-links">
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                        <a href="/support">Help</a>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="lp-title">Forgot password</div>
                  <div className="lp-sub">
                    Enter your email and we’ll send you a reset link.
                  </div>

                  {submitError && (
                    <div className="lp-err"><span>⚠</span>{submitError}</div>
                  )}

                  <form onSubmit={onRequest}>
                    <div className="lp-field">
                      <div className="lp-lbl"><span>Email address</span></div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn('lp-inp', submitError ? 'err' : '')}
                        placeholder="you@school.ac.ke"
                        autoComplete="email"
                      />
                    </div>

                    <button type="submit" className="lp-btn" disabled={!canRequest || isLoading}>
                      {loading ? (
                        <>
                          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending…
                        </>
                      ) : (
                        <>Send reset link <ArrowRight size={16} /></>
                      )}
                    </button>

                    <div className="lp-divider">
                      <div className="lp-divider-ln" />
                      <span className="lp-divider-txt">Secure · Encrypted · CBE Compliant</span>
                      <div className="lp-divider-ln" />
                    </div>
                    <div className="lp-foot">
                      <span className="lp-foot-copy">© 2026 CBE Noneaa</span>
                      <div className="lp-foot-links">
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                        <a href="/support">Help</a>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

