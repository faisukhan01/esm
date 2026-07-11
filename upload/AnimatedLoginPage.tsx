'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Chrome,
  Apple,
  Shield,
  AtSign,
} from 'lucide-react';

// ==================== SVG Illustrations ====================

function DeskPersonIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-w-[320px] mx-auto desk-illustration"
    >
      {/* Desk */}
      <rect x="60" y="200" width="280" height="12" rx="6" fill="#4a3f8a" opacity="0.8" />
      <rect x="80" y="212" width="8" height="80" rx="3" fill="#3d3478" />
      <rect x="312" y="212" width="8" height="80" rx="3" fill="#3d3478" />
      <rect x="70" y="285" width="60" height="8" rx="3" fill="#3d3478" />
      <rect x="270" y="285" width="60" height="8" rx="3" fill="#3d3478" />

      {/* Laptop Base */}
      <rect x="110" y="182" width="160" height="18" rx="4" fill="#c8d6e5" />
      <rect x="108" y="196" width="164" height="6" rx="2" fill="#a4b0be" />

      {/* Laptop Screen */}
      <rect x="125" y="100" width="130" height="82" rx="6" fill="#2d3436" />
      <rect x="130" y="105" width="120" height="72" rx="4" fill="#6c5ce7" />
      {/* Screen Content */}
      <rect x="140" y="115" width="60" height="4" rx="2" fill="#a29bfe" opacity="0.8" />
      <rect x="140" y="125" width="100" height="3" rx="1.5" fill="#dfe6e9" opacity="0.5" />
      <rect x="140" y="133" width="85" height="3" rx="1.5" fill="#dfe6e9" opacity="0.4" />
      <rect x="140" y="141" width="95" height="3" rx="1.5" fill="#dfe6e9" opacity="0.3" />
      <rect x="140" y="153" width="40" height="14" rx="7" fill="#fff" opacity="0.3" />
      <rect x="190" y="153" width="40" height="14" rx="7" fill="#a29bfe" opacity="0.5" />
      {/* Code lines on screen */}
      <rect x="140" y="113" width="100" height="2" rx="1" fill="#a29bfe" opacity="0.3" />
      <rect x="140" y="119" width="80" height="2" rx="1" fill="#fd79a8" opacity="0.3" />
      <rect x="140" y="149" width="90" height="2" rx="1" fill="#00cec9" opacity="0.3" />

      {/* Person - Body */}
      {/* Torso */}
      <path
        d="M175 120 C175 120 165 150 165 170 L165 195 L230 195 L230 170 C230 150 220 120 220 120 Z"
        fill="#667eea"
      />
      {/* Shirt collar */}
      <path d="M185 110 L197 135 L209 110" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" />

      {/* Neck */}
      <rect x="190" y="85" width="20" height="25" rx="8" fill="#f0c8a0" />

      {/* Head */}
      <ellipse cx="200" cy="65" rx="28" ry="32" fill="#f0c8a0" />

      {/* Hair */}
      <path
        d="M172 55 C172 35 185 28 200 28 C215 28 228 35 228 55 C228 50 225 38 200 38 C175 38 172 50 172 55 Z"
        fill="#2d3436"
      />
      <path
        d="M170 55 C170 55 168 45 175 40"
        stroke="#2d3436"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M230 55 C230 55 232 45 225 40"
        stroke="#2d3436"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes */}
      <ellipse cx="190" cy="62" rx="3.5" ry="4" fill="#2d3436" />
      <ellipse cx="210" cy="62" rx="3.5" ry="4" fill="#2d3436" />
      <circle cx="191" cy="61" r="1.2" fill="#fff" />
      <circle cx="211" cy="61" r="1.2" fill="#fff" />

      {/* Eyebrows */}
      <path d="M185 55 Q190 52 195 55" stroke="#2d3436" strokeWidth="1.5" fill="none" />
      <path d="M205 55 Q210 52 215 55" stroke="#2d3436" strokeWidth="1.5" fill="none" />

      {/* Nose */}
      <path d="M198 68 L200 74 L202 68" stroke="#d4a574" strokeWidth="1.2" fill="none" />

      {/* Smile */}
      <path d="M192 80 Q200 87 208 80" stroke="#c0785c" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Ears */}
      <ellipse cx="172" cy="65" rx="5" ry="7" fill="#f0c8a0" />
      <ellipse cx="228" cy="65" rx="5" ry="7" fill="#f0c8a0" />

      {/* Arms */}
      {/* Left arm reaching to keyboard */}
      <path
        d="M170 130 C155 140 145 160 150 180 L155 190 L168 185 L165 175 C162 165 165 150 172 142"
        fill="#667eea"
        stroke="#5a6fd6"
        strokeWidth="1"
      />
      {/* Left hand */}
      <ellipse cx="155" cy="188" rx="8" ry="5" fill="#f0c8a0" transform="rotate(-10, 155, 188)" />

      {/* Right arm reaching to keyboard */}
      <path
        d="M225 130 C240 140 250 160 245 180 L240 190 L227 185 L230 175 C233 165 230 150 223 142"
        fill="#667eea"
        stroke="#5a6fd6"
        strokeWidth="1"
      />
      {/* Right hand */}
      <ellipse cx="242" cy="188" rx="8" ry="5" fill="#f0c8a0" transform="rotate(10, 242, 188)" />

      {/* Chair */}
      <rect x="155" y="210" width="90" height="8" rx="4" fill="#4a3f8a" />
      <rect x="170" y="218" width="6" height="50" rx="3" fill="#3d3478" />
      <rect x="224" y="218" width="6" height="50" rx="3" fill="#3d3478" />
      {/* Chair back */}
      <rect x="170" y="140" width="60" height="70" rx="8" fill="#4a3f8a" opacity="0.7" />
      <rect x="180" y="148" width="40" height="54" rx="6" fill="#5a4f9a" opacity="0.5" />

      {/* Coffee mug on desk */}
      <rect x="290" y="182" width="20" height="18" rx="3" fill="#fff" opacity="0.8" />
      <path d="M310 188 C316 188 316 198 310 198" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" />
      {/* Steam */}
      <path d="M296 178 C296 172 300 172 300 166" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.3">
        <animate attributeName="d" values="M296 178 C296 172 300 172 300 166;M296 176 C298 170 294 170 296 164;M296 178 C296 172 300 172 300 166" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M304 178 C304 173 308 173 308 168" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.2">
        <animate attributeName="d" values="M304 178 C304 173 308 173 308 168;M304 176 C306 171 302 171 304 166;M304 178 C304 173 308 173 308 168" dur="3.5s" repeatCount="indefinite" />
      </path>

      {/* Small plant on desk */}
      <rect x="72" y="185" width="16" height="15" rx="3" fill="#a29bfe" opacity="0.7" />
      <circle cx="80" cy="180" r="10" fill="#00b894" opacity="0.7" />
      <circle cx="74" cy="175" r="7" fill="#00cec9" opacity="0.6" />
      <circle cx="86" cy="177" r="6" fill="#55efc4" opacity="0.6" />
    </svg>
  );
}

function WelcomePersonIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-w-[300px] mx-auto desk-illustration"
    >
      {/* Standing person */}
      {/* Legs */}
      <rect x="175" y="210" width="14" height="70" rx="6" fill="#2d3436" />
      <rect x="210" y="210" width="14" height="70" rx="6" fill="#2d3436" />

      {/* Shoes */}
      <ellipse cx="182" cy="282" rx="12" ry="6" fill="#2d3436" />
      <ellipse cx="217" cy="282" rx="12" ry="6" fill="#2d3436" />

      {/* Body / Shirt */}
      <path
        d="M168 100 C165 120 162 150 164 210 L235 210 C237 150 234 120 231 100 Z"
        fill="#764ba2"
      />

      {/* Arms up waving */}
      {/* Left arm */}
      <path
        d="M168 110 C145 100 130 80 135 55 L140 50"
        fill="#764ba2"
        stroke="#6a4192"
        strokeWidth="1"
      />
      <ellipse cx="138" cy="48" rx="7" ry="6" fill="#f0c8a0" transform="rotate(-20, 138, 48)" />

      {/* Right arm waving */}
      <path
        d="M231 110 C255 95 265 70 258 48"
        fill="#764ba2"
        stroke="#6a4192"
        strokeWidth="1"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 231 110;5 231 110;0 231 110;-5 231 110;0 231 110"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
      <ellipse cx="260" cy="46" rx="7" ry="6" fill="#f0c8a0" transform="rotate(15, 260, 46)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="15 260 46;20 260 46;15 260 46;10 260 46;15 260 46"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Neck */}
      <rect x="192" y="72" width="16" height="22" rx="7" fill="#f0c8a0" />

      {/* Head */}
      <ellipse cx="200" cy="50" rx="26" ry="30" fill="#f0c8a0" />

      {/* Hair */}
      <path
        d="M174 42 C174 22 187 15 200 15 C213 15 226 22 226 42 C226 37 223 25 200 25 C177 25 174 37 174 42 Z"
        fill="#6c5ce7"
      />
      <path
        d="M172 42 C170 38 173 32 178 28"
        stroke="#6c5ce7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M228 42 C230 38 227 32 222 28"
        stroke="#6c5ce7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes - happy squint */}
      <path d="M186 48 Q190 44 194 48" stroke="#2d3436" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M206 48 Q210 44 214 48" stroke="#2d3436" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Big smile */}
      <path d="M188 58 Q200 70 212 58" stroke="#c0785c" strokeWidth="2" fill="#e17055" opacity="0.5" strokeLinecap="round" />

      {/* Blush */}
      <ellipse cx="183" cy="56" rx="6" ry="3" fill="#fab1a0" opacity="0.4" />
      <ellipse cx="217" cy="56" rx="6" ry="3" fill="#fab1a0" opacity="0.4" />

      {/* Sparkles around */}
      <g>
        <path d="M130 30 L133 20 L136 30 L146 33 L136 36 L133 46 L130 36 L120 33 Z" fill="#ffeaa7" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M260 80 L262 74 L264 80 L270 82 L264 84 L262 90 L260 84 L254 82 Z" fill="#dfe6e9" opacity="0.5">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" />
        </path>
        <path d="M155 100 L157 95 L159 100 L164 102 L159 104 L157 109 L155 104 L150 102 Z" fill="#ffeaa7" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.8s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Floating hearts */}
      <g opacity="0.5">
        <path d="M110 60 C110 55 115 50 120 55 C125 50 130 55 130 60 C130 68 120 75 120 75 C120 75 110 68 110 60 Z" fill="#fd79a8">
          <animateTransform attributeName="transform" type="translate" values="0,0;-5,-10;0,0" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M270 35 C270 31 274 27 278 31 C282 27 286 31 286 35 C286 41 278 47 278 47 C278 47 270 41 270 35 Z" fill="#fd79a8">
          <animateTransform attributeName="transform" type="translate" values="0,0;5,-8;0,0" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.5s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}

// ==================== Particle Background ====================

function ParticleBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 15,
      drift: (Math.random() - 0.5) * 60,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `particleFloat ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// ==================== Floating Shapes ====================

function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="float-shape-1 absolute w-20 h-20 rounded-full bg-white opacity-10"
        style={{ top: '15%', right: '10%' }}
      />
      <div
        className="float-shape-2 absolute w-14 h-14 rounded-full bg-white opacity-[0.07]"
        style={{ top: '60%', right: '25%' }}
      />
      <div
        className="float-shape-3 absolute w-24 h-24 rounded-full bg-white opacity-[0.05]"
        style={{ bottom: '15%', left: '5%' }}
      />
      <div
        className="float-shape-4 absolute w-10 h-10 rounded-lg bg-white opacity-[0.08] rotate-45"
        style={{ top: '40%', left: '15%' }}
      />
    </div>
  );
}

// ==================== Password Strength ====================

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { score: 0, label: '', color: '#e5e7eb', width: '0%' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444', width: '20%' };
  if (score <= 2) return { score, label: 'Fair', color: '#f97316', width: '40%' };
  if (score <= 3) return { score, label: 'Good', color: '#eab308', width: '60%' };
  if (score <= 4) return { score, label: 'Strong', color: '#22c55e', width: '80%' };
  return { score, label: 'Very Strong', color: '#16a34a', width: '100%' };
}

// ==================== Floating Label Input ====================

interface FloatingInputProps {
  id: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  success?: boolean;
  togglePassword?: () => void;
  showPassword?: boolean;
  autoComplete?: string;
}

function FloatingInput({
  id,
  type,
  placeholder,
  icon,
  value,
  onChange,
  error,
  success,
  togglePassword,
  showPassword,
  autoComplete,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="login-input-wrapper relative">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          autoComplete={autoComplete}
          className={`login-input w-full h-12 pl-11 pr-11 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-sm outline-none transition-all duration-300 ${
            error
              ? 'login-input-error'
              : success
                ? 'login-input-success'
                : ''
          }`}
        />
        <label
          htmlFor={id}
          className={`floating-label ${isActive ? 'top-0 translate-y-[-50%] !left-3 !text-xs !px-1 bg-white !text-[#667eea]' : ''}`}
        >
          {placeholder}
        </label>
        {togglePassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="eye-toggle absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ==================== Social Login Buttons ====================

function SocialLoginButtons() {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        className="social-btn w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:border-gray-300"
        aria-label="Sign in with Google"
      >
        <Chrome size={20} className="text-gray-600" />
      </button>
      <button
        type="button"
        className="social-btn w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:border-gray-300"
        aria-label="Sign in with Facebook"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>
      <button
        type="button"
        className="social-btn w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:border-gray-300"
        aria-label="Sign in with Apple"
      >
        <Apple size={20} className="text-gray-600" />
      </button>
    </div>
  );
}

// ==================== Divider ====================

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium">Or continue with</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ==================== Cover Panel ====================

interface CoverPanelProps {
  type: 'login' | 'signup';
}

function CoverPanel({ type }: CoverPanelProps) {
  const isLogin = type === 'login';

  return (
    <div className="cover-gradient relative flex flex-col items-center justify-center px-6 py-8 sm:px-8 sm:py-10 md:p-12 min-h-[180px] sm:min-h-[200px] md:min-h-full rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
      <FloatingShapes />

      {/* Glow circles */}
      <div className="glow-circle absolute w-48 h-48 rounded-full bg-white/5 -top-10 -left-10" />
      <div className="glow-circle absolute w-36 h-36 rounded-full bg-white/5 -bottom-8 -right-8" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center">
        {/* Illustration */}
        <div className="mb-4 md:mb-6 fade-in-slide" style={{ '--delay': '0.2s' } as React.CSSProperties}>
          {isLogin ? <WelcomePersonIllustration /> : <DeskPersonIllustration />}
        </div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1.5 md:mb-2"
        >
          {isLogin ? 'Welcome Back!' : 'Hello, Friend!'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-white/70 text-xs sm:text-sm md:text-base max-w-[220px] sm:max-w-[240px] mx-auto"
        >
          {isLogin
            ? 'Enter your credentials to access your account and continue your journey.'
            : 'Fill in your details to create your account and join our community.'}
        </motion.p>
      </div>
    </div>
  );
}

// ==================== Login Form ====================

interface LoginFormProps {
  onToggle: () => void;
}

function LoginForm({ onToggle }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Ripple effect
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${rect.width / 2}px`;
      ripple.style.top = `${rect.height / 2}px`;
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="bg-white flex flex-col justify-center p-6 sm:p-8 md:p-10 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
      <div className="slide-up">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Sign In</h2>
        <p className="text-gray-400 text-xs sm:text-sm mb-5 sm:mb-6">Welcome back! Please sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        <div className="slide-up slide-up-delay-1">
          <FloatingInput
            id="login-email"
            type="email"
            placeholder="Email Address"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            success={email && /\S+@\S+\.\S+/.test(email)}
            autoComplete="email"
          />
        </div>

        <div className="slide-up slide-up-delay-2">
          <FloatingInput
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            success={password.length >= 6}
            togglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between slide-up slide-up-delay-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="custom-checkbox w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-500">Remember me</span>
          </label>
          <button type="button" className="text-sm text-[#667eea] hover:text-[#764ba2] font-medium transition-colors">
            Forgot password?
          </button>
        </div>

        <div className="slide-up slide-up-delay-4">
          <motion.button
            ref={buttonRef}
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </div>
      </form>

      <div className="slide-up slide-up-delay-4">
        <Divider />
        <SocialLoginButtons />
      </div>

      <div className="mt-5 sm:mt-6 text-center slide-up slide-up-delay-5">
        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-[#667eea] hover:text-[#764ba2] font-semibold transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

// ==================== Signup Form ====================

interface SignupFormProps {
  onToggle: () => void;
}

function SignupForm({ onToggle }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const passwordStrength = getPasswordStrength(password);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) newErrors.terms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${rect.width / 2}px`;
      ripple.style.top = `${rect.height / 2}px`;
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="bg-white flex flex-col justify-center p-6 sm:p-8 md:p-10 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none overflow-y-auto max-h-[80vh] md:max-h-none custom-scrollbar">
      <div className="slide-up">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
        <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5">Join us! Fill in your details to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="slide-up slide-up-delay-1">
          <FloatingInput
            id="signup-name"
            type="text"
            placeholder="Full Name"
            icon={<User size={18} />}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            error={errors.fullName}
            success={fullName.trim().length > 0}
            autoComplete="name"
          />
        </div>

        <div className="slide-up slide-up-delay-1">
          <FloatingInput
            id="signup-email"
            type="email"
            placeholder="Email Address"
            icon={<AtSign size={18} />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            success={email && /\S+@\S+\.\S+/.test(email)}
            autoComplete="email"
          />
        </div>

        <div className="slide-up slide-up-delay-2">
          <FloatingInput
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            icon={<Shield size={18} />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            success={password.length >= 8 && passwordStrength.score >= 3}
            togglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            autoComplete="new-password"
          />
          {password && (
            <div className="mt-1.5 px-1">
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="strength-bar rounded-full"
                  style={{
                    width: passwordStrength.width,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>
              <p className="text-xs mt-0.5" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        <div className="slide-up slide-up-delay-3">
          <FloatingInput
            id="signup-confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            icon={<Lock size={18} />}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            error={errors.confirmPassword}
            success={confirmPassword.length > 0 && password === confirmPassword}
            togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            showPassword={showConfirmPassword}
            autoComplete="new-password"
          />
        </div>

        <div className="slide-up slide-up-delay-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              className="custom-checkbox w-4 h-4 rounded mt-0.5"
            />
            <span className="text-sm text-gray-500 leading-snug">
              I agree to the{' '}
              <span className="text-[#667eea] hover:text-[#764ba2] cursor-pointer font-medium">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-[#667eea] hover:text-[#764ba2] cursor-pointer font-medium">
                Privacy Policy
              </span>
            </span>
          </label>
          {errors.terms && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs mt-0.5 ml-6"
            >
              {errors.terms}
            </motion.p>
          )}
        </div>

        <div className="slide-up slide-up-delay-4">
          <motion.button
            ref={buttonRef}
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </div>
      </form>

      <div className="slide-up slide-up-delay-4">
        <Divider />
        <SocialLoginButtons />
      </div>

      <div className="mt-4 sm:mt-5 text-center slide-up slide-up-delay-5">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-[#667eea] hover:text-[#764ba2] font-semibold transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

// ==================== Main Animated Login Page ====================

export default function AnimatedLoginPage() {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggle = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  return (
    <div className="login-bg flex items-center justify-center min-h-screen p-3 sm:p-4 md:p-6">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="flip-container relative z-10 w-full"
      >
        <div
          className={`flip-card ${isFlipped ? 'flipped' : ''}`}
          style={{
            minHeight: '580px',
          }}
        >
          {/* Front Face - Login (illustration left, form right) */}
          <div className="flip-face flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/30 overflow-hidden bg-white">
            <div className="w-full md:w-[45%]">
              <CoverPanel type="login" />
            </div>
            <div className="w-full md:w-[55%]">
              <LoginForm onToggle={handleToggle} />
            </div>
          </div>

          {/* Back Face - Signup (form left, illustration right) */}
          <div className="flip-face flip-face-back flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/30 overflow-hidden bg-white">
            <div className="w-full md:w-[55%] order-2 md:order-1">
              <SignupForm onToggle={handleToggle} />
            </div>
            <div className="w-full md:w-[45%] order-1 md:order-2">
              <CoverPanel type="signup" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
