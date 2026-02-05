/**
 * AI Monitoring with TensorFlow.js BlazeFace
 * Detects multiple faces or face direction changes
 * Runs entirely on client-side (no server cost)
 */

import * as blazeface from '@tensorflow-models/blazeface';

let model: blazeface.BlazeFaceModel | null = null;
let isMonitoring = false;
let monitoringInterval: number | null = null;
let faceDirectionHistory: Array<{ x: number; y: number; timestamp: number }> = [];
let violationFlags: Array<{ type: string; timestamp: number; severity: number }> = [];

// Initialize BlazeFace model
export const initAIModel = async (): Promise<void> => {
  try {
    console.log('Loading BlazeFace model...');
    model = await blazeface.load();
    console.log('BlazeFace model loaded successfully');
  } catch (error) {
    console.error('Failed to load BlazeFace model:', error);
    throw error;
  }
};

// Get face detection from video stream
const detectFaces = async (video: HTMLVideoElement): Promise<blazeface.NormalizedFace[]> => {
  if (!model) {
    throw new Error('AI model not initialized');
  }

  const predictions = await model.estimateFaces(video, false);
  return predictions;
};

// Helper to convert landmarks to number[][]
const getLandmarksAsArray = (landmarks: number[][] | undefined): number[][] => {
  if (!landmarks) return [];
  // If it's already an array of arrays, return it
  if (Array.isArray(landmarks) && landmarks.length > 0 && Array.isArray(landmarks[0])) {
    return landmarks as number[][];
  }
  return [];
};

// Calculate face direction (center point)
const getFaceDirection = (face: blazeface.NormalizedFace): { x: number; y: number } => {
  const landmarks = getLandmarksAsArray(face.landmarks);
  if (landmarks.length === 0) {
    return { x: 0.5, y: 0.5 }; // Default center
  }

  // Calculate center from landmarks
  const centerX = landmarks.reduce((sum, point) => sum + (point[0] || 0), 0) / landmarks.length;
  const centerY = landmarks.reduce((sum, point) => sum + (point[1] || 0), 0) / landmarks.length;

  return { x: centerX, y: centerY };
};

// Check for violations
const checkViolations = (faces: blazeface.NormalizedFace[]): Array<{ type: string; severity: number }> => {
  const violations: Array<{ type: string; severity: number }> = [];

  // Check 1: Multiple faces detected
  if (faces.length > 1) {
    violations.push({
      type: 'multiple_faces',
      severity: 3, // High severity
    });
  }

  // Check 2: No face detected (student turned away)
  if (faces.length === 0) {
    violations.push({
      type: 'no_face',
      severity: 2, // Medium severity
    });
  }

  // Check 3: Face direction changed significantly
  if (faces.length === 1) {
    const currentDirection = getFaceDirection(faces[0]);
    faceDirectionHistory.push({
      ...currentDirection,
      timestamp: Date.now(),
    });

    // Keep only last 10 detections (last 5 seconds at 2fps)
    if (faceDirectionHistory.length > 10) {
      faceDirectionHistory.shift();
    }

    // Check if face moved significantly
    if (faceDirectionHistory.length >= 3) {
      const first = faceDirectionHistory[0];
      const last = faceDirectionHistory[faceDirectionHistory.length - 1];
      
      const deltaX = Math.abs(last.x - first.x);
      const deltaY = Math.abs(last.y - first.y);
      
      // If face moved more than 30% of frame, flag as suspicious
      if (deltaX > 0.3 || deltaY > 0.3) {
        violations.push({
          type: 'face_movement',
          severity: 1, // Low severity
        });
      }
    }
  }

  return violations;
};

// Start AI monitoring
export const startAIMonitoring = async (
  videoElement: HTMLVideoElement,
  onViolation: (violation: { type: string; severity: number }) => void,
  _examId: string
): Promise<void> => {
  if (isMonitoring) {
    console.warn('AI monitoring already started');
    return;
  }

  if (!model) {
    await initAIModel();
  }

  isMonitoring = true;
  violationFlags = [];
  faceDirectionHistory = [];

  // Monitor at 2 FPS (every 500ms) to reduce CPU usage
  monitoringInterval = window.setInterval(async () => {
    try {
      const faces = await detectFaces(videoElement);
      const violations = checkViolations(faces);

      // Record violations
      violations.forEach(violation => {
        violationFlags.push({
          ...violation,
          timestamp: Date.now(),
        });

        // Send to backend for flagging (not force submit)
        onViolation(violation);
      });
    } catch (error) {
      console.error('AI monitoring error:', error);
    }
  }, 500); // 2 FPS

  console.log('AI monitoring started');
};

// Stop AI monitoring
export const stopAIMonitoring = (): void => {
  if (monitoringInterval !== null) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  isMonitoring = false;
  violationFlags = [];
  faceDirectionHistory = [];
  console.log('AI monitoring stopped');
};

// Get violation flags (for teacher review)
export const getViolationFlags = (): Array<{ type: string; timestamp: number; severity: number }> => {
  return [...violationFlags];
};

// Get violation summary
export const getViolationSummary = (): {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<number, number>;
} => {
  const byType: Record<string, number> = {};
  const bySeverity: Record<number, number> = {};

  violationFlags.forEach(flag => {
    byType[flag.type] = (byType[flag.type] || 0) + 1;
    bySeverity[flag.severity] = (bySeverity[flag.severity] || 0) + 1;
  });

  return {
    total: violationFlags.length,
    byType,
    bySeverity,
  };
};

// Cleanup (dispose model)
export const cleanupAIModel = async (): Promise<void> => {
  stopAIMonitoring();
  if (model) {
    model.dispose();
    model = null;
  }
};
