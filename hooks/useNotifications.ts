/**
 * useNotifications - Push Notification & Toast system for PostureGuard
 * 
 * Features:
 * - Browser Push Notifications (Notification API)
 * - In-app toast notifications with auto-dismiss
 * - Head tilt detection notifications (left/right)
 * - Bad posture notifications
 * - Sound alerts
 * - Cooldown system to prevent notification spam
 * - SMS notification trigger via backend
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PostureState } from '../types';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'head-tilt';
  timestamp: Date;
  dismissed: boolean;
}

interface NotificationConfig {
  soundEnabled: boolean;
  pushEnabled: boolean;
  headTiltAlerts: boolean;
  badPostureAlerts: boolean;
  cooldownSeconds: number;  // minimum seconds between same-type notifications
  smsEnabled: boolean;
  caretakerPhone?: string;
  userName?: string;
  isDisabled?: boolean;
  caretakerName?: string;
}

const DEFAULT_CONFIG: NotificationConfig = {
  soundEnabled: true,
  pushEnabled: true,
  headTiltAlerts: true,
  badPostureAlerts: true,
  cooldownSeconds: 30,
  smsEnabled: false,
};

// Notification sounds (using Web Audio API for zero-dependency sounds)
const playNotificationSound = (type: 'warning' | 'critical' | 'head-tilt') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'critical') {
      // Urgent double-beep
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(0, audioCtx.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.25);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'head-tilt') {
      // Quick chirp for head tilt
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1320, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else {
      // Gentle tone for warning
      oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
};

export function useNotifications() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);

  // Cooldown tracking to prevent spam
  const lastNotificationTime = useRef<Record<string, number>>({});
  const headTiltStartRef = useRef<number | null>(null);
  const badPostureStartRef = useRef<number | null>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }
  }, []);

  // Auto-dismiss toasts after 8 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setInterval(() => {
      setToasts(prev => {
        const now = Date.now();
        return prev.filter(t => now - t.timestamp.getTime() < 8000);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toasts.length]);

  const isOnCooldown = useCallback((type: string): boolean => {
    const lastTime = lastNotificationTime.current[type];
    if (!lastTime) return false;
    return (Date.now() - lastTime) < (config.cooldownSeconds * 1000);
  }, [config.cooldownSeconds]);

  const addToast = useCallback((title: string, message: string, type: ToastNotification['type']) => {
    const toast: ToastNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      dismissed: false,
    };

    setToasts(prev => [toast, ...prev].slice(0, 5)); // Keep max 5 toasts
    lastNotificationTime.current[type] = Date.now();
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Send browser push notification
  const sendPushNotification = useCallback((title: string, body: string, icon?: string) => {
    if (!config.pushEnabled || !permissionGranted) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '🦴',
        badge: '/favicon.ico',
        tag: 'posture-guard',
        requireInteraction: false,
        silent: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (e) {
      console.warn('Failed to send push notification:', e);
    }
  }, [config.pushEnabled, permissionGranted]);

  // Send SMS notification via backend
  const sendSMSNotification = useCallback(async (message: string) => {
    if (!config.smsEnabled || !config.caretakerPhone) return;

    try {
      const token = localStorage.getItem('posture_token');
      if (!token) return;

      await fetch('http://localhost:8000/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: config.caretakerPhone,
          message,
        }),
      });
    } catch (e) {
      console.error('Failed to send SMS notification:', e);
    }
  }, [config.smsEnabled, config.caretakerPhone]);

  // === MAIN NOTIFICATION TRIGGERS ===

  // Head Tilt Notification
  const notifyHeadTilt = useCallback((direction: 'left' | 'right', rollDeviation: number) => {
    if (!config.headTiltAlerts) return;
    if (isOnCooldown('head-tilt')) return;

    const dirEmoji = direction === 'left' ? '⬅️' : '➡️';
    const title = `${dirEmoji} Head Tilt Detected!`;
    const message = config.isDisabled
      ? `${config.userName || 'User'} is tilting their head ${direction} (${rollDeviation.toFixed(1)}° deviation). Please check on them.`
      : `Your head is tilting ${direction} (${rollDeviation.toFixed(1)}° deviation). Please straighten up!`;

    // In-app toast
    addToast(title, message, 'head-tilt');

    // Sound alert
    if (config.soundEnabled) {
      playNotificationSound('head-tilt');
    }

    // Browser push notification
    sendPushNotification(title, message);

    // SMS to caretaker if user is disabled
    if (config.isDisabled && config.smsEnabled && config.caretakerPhone) {
      sendSMSNotification(
        `⚠️ PostureGuard Alert: ${config.userName || 'User'} is tilting their head ${direction}. Deviation: ${rollDeviation.toFixed(1)}°. Please check on them. — Sent by PostureGuard`
      );
    }
  }, [config, isOnCooldown, addToast, sendPushNotification, sendSMSNotification]);

  // Bad Posture Notification
  const notifyBadPosture = useCallback((durationSeconds: number) => {
    if (!config.badPostureAlerts) return;
    if (isOnCooldown('bad-posture')) return;

    const minutes = Math.floor(durationSeconds / 60);
    const title = '🔴 Bad Posture Alert!';
    const message = config.isDisabled
      ? `${config.userName || 'User'} has maintained bad posture for ${minutes > 0 ? `${minutes} minute(s)` : `${durationSeconds} seconds`}. Please assist them.`
      : `You've been in bad posture for ${minutes > 0 ? `${minutes} minute(s)` : `${durationSeconds} seconds`}. Time to correct it!`;

    // In-app toast
    addToast(title, message, 'critical');

    // Sound alert
    if (config.soundEnabled) {
      playNotificationSound('critical');
    }

    // Browser push notification
    sendPushNotification(title, message);

    // SMS to caretaker if user is disabled
    if (config.isDisabled && config.smsEnabled && config.caretakerPhone) {
      sendSMSNotification(
        `🔴 PostureGuard Alert: ${config.userName || 'User'} has had bad posture for ${minutes > 0 ? `${minutes} minute(s)` : `${durationSeconds} seconds`}. Please check on them. — Sent by PostureGuard`
      );
    }
  }, [config, isOnCooldown, addToast, sendPushNotification, sendSMSNotification]);

  // Warning Posture Notification
  const notifyPostureWarning = useCallback(() => {
    if (!config.badPostureAlerts) return;
    if (isOnCooldown('posture-warning')) return;

    const title = '⚠️ Posture Needs Correction';
    const message = config.isDisabled
      ? `${config.userName || 'User'}'s posture needs correction.`
      : 'Your posture is starting to deviate. Please adjust your position.';

    addToast(title, message, 'warning');

    if (config.soundEnabled) {
      playNotificationSound('warning');
    }

    sendPushNotification(title, message);
  }, [config, isOnCooldown, addToast, sendPushNotification]);

  // === SENSOR DATA PROCESSOR ===
  // Call this with sensor data to auto-detect and trigger notifications

  const processSensorData = useCallback((
    roll: number,
    rollBaseline: number,
    postureState: PostureState,
    isConnected: boolean
  ) => {
    if (!isConnected) return;

    // --- Head Tilt Detection ---
    let rollDiff = Math.abs(roll - rollBaseline);
    if (rollDiff > 180) rollDiff = 360 - rollDiff;

    const HEAD_TILT_THRESHOLD = 20; // degrees

    if (rollDiff > HEAD_TILT_THRESHOLD) {
      if (!headTiltStartRef.current) {
        headTiltStartRef.current = Date.now();
      }

      // Only notify after 2 seconds of sustained tilt (prevent false positives)
      const tiltDuration = Date.now() - headTiltStartRef.current;
      if (tiltDuration > 2000) {
        // Determine direction: if roll > baseline, tilting right; else left
        let adjustedDiff = roll - rollBaseline;
        if (adjustedDiff > 180) adjustedDiff -= 360;
        if (adjustedDiff < -180) adjustedDiff += 360;

        const direction: 'left' | 'right' = adjustedDiff > 0 ? 'right' : 'left';
        notifyHeadTilt(direction, rollDiff);
      }
    } else {
      headTiltStartRef.current = null;
    }

    // --- Bad Posture Detection ---
    if (postureState === PostureState.BAD) {
      if (!badPostureStartRef.current) {
        badPostureStartRef.current = Date.now();
      }

      const badDuration = (Date.now() - badPostureStartRef.current) / 1000;

      // Notify at 10 seconds, then again every cooldown period
      if (badDuration > 10) {
        notifyBadPosture(Math.floor(badDuration));
      }
    } else if (postureState === PostureState.WARNING) {
      badPostureStartRef.current = null;
      notifyPostureWarning();
    } else {
      badPostureStartRef.current = null;
    }
  }, [notifyHeadTilt, notifyBadPosture, notifyPostureWarning]);

  // Request notification permission manually
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setPermissionGranted(granted);
    return granted;
  }, []);

  return {
    toasts,
    dismissToast,
    permissionGranted,
    requestPermission,
    config,
    setConfig,
    processSensorData,
    notifyHeadTilt,
    notifyBadPosture,
    notifyPostureWarning,
    addToast,
  };
}
