-- Exam Proctoring Enhancement Migration
-- Run this in Supabase SQL Editor

-- Add additional proctoring settings to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS block_copy_paste BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS block_right_click BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS block_tab_switch BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS require_fullscreen BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS capture_webcam_interval INTEGER DEFAULT 30; -- seconds
ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_violations INTEGER DEFAULT 5;

-- Add webcam data storage to exam_attempts
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS webcam_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS webcam_active BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS fullscreen_active BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS initial_screen_captured BOOLEAN DEFAULT FALSE;

-- Create exam_access_logs to track when students enter/exit exam
CREATE TABLE IF NOT EXISTS exam_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'enter', 'exit_fullscreen', 'violation', 'submit'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_exam_access_logs_exam_id ON exam_access_logs(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_access_logs_student_id ON exam_access_logs(student_id);

-- Function to auto-grade exam (fixed version)
CREATE OR REPLACE FUNCTION grade_exam_attempt(attempt_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_exam_id UUID;
  v_answers JSONB;
  v_questions JSONB;
  v_question JSONB;
  v_correct_answer VARCHAR(10);
  v_student_answer VARCHAR(10);
  v_total_score INTEGER := 0;
  v_question_points INTEGER;
BEGIN
  -- Get exam_id and answers from attempt
  SELECT exam_id, answers INTO v_exam_id, v_answers
  FROM exam_attempts
  WHERE id = attempt_id;

  IF v_exam_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Get questions from exam
  SELECT questions INTO v_questions
  FROM exams
  WHERE id = v_exam_id;

  -- Loop through questions and grade
  FOR v_question IN SELECT * FROM jsonb_array_elements(v_questions)
  LOOP
    v_correct_answer := v_question->>'correctAnswer';
    v_question_points := (v_question->>'points')::INTEGER;
    
    -- Get student answer for this question
    v_student_answer := v_answers->>(v_question->>'id')::text;
    
    -- Check if correct
    IF v_student_answer IS NOT NULL AND v_student_answer = v_correct_answer THEN
      v_total_score := v_total_score + COALESCE(v_question_points, 1);
    END IF;
  END LOOP;

  -- Update attempt with score
  UPDATE exam_attempts 
  SET score = v_total_score, graded = TRUE, submitted_at = NOW()
  WHERE id = attempt_id;

  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;
