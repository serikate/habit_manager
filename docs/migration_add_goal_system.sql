-- 目標管理システムのマイグレーション
-- 作成日: 2025-11-09

-- ==================================================
-- 1. 長期目標テーブルの修正
-- ==================================================

-- description カラムを追加
ALTER TABLE long_term_goals
ADD COLUMN IF NOT EXISTS description TEXT;

-- is_achieved カラムを追加
ALTER TABLE long_term_goals
ADD COLUMN IF NOT EXISTS is_achieved BOOLEAN NOT NULL DEFAULT FALSE;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_long_term_goals_user_achieved
ON long_term_goals(user_id, is_achieved);

-- ==================================================
-- 2. 短期目標テーブルの修正
-- ==================================================

-- target_count を target_value にリネーム
ALTER TABLE short_term_goals
RENAME COLUMN target_count TO target_value;

-- measurement_unit カラムを追加
ALTER TABLE short_term_goals
ADD COLUMN IF NOT EXISTS measurement_unit TEXT NOT NULL DEFAULT 'count';

-- current_value カラムを追加
ALTER TABLE short_term_goals
ADD COLUMN IF NOT EXISTS current_value INTEGER NOT NULL DEFAULT 0;

-- is_achieved カラムを追加
ALTER TABLE short_term_goals
ADD COLUMN IF NOT EXISTS is_achieved BOOLEAN NOT NULL DEFAULT FALSE;

-- deadline カラムを追加（任意）
ALTER TABLE short_term_goals
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_short_term_goals_long_term_goal
ON short_term_goals(long_term_goal_id);

CREATE INDEX IF NOT EXISTS idx_short_term_goals_achieved
ON short_term_goals(user_id, is_achieved);

-- ==================================================
-- 3. 習慣テーブルの修正
-- ==================================================

-- short_term_goal_id カラムを追加（必須）
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS short_term_goal_id UUID;

-- 外部キー制約を追加
ALTER TABLE habits
ADD CONSTRAINT fk_habits_short_term_goal
FOREIGN KEY (short_term_goal_id)
REFERENCES short_term_goals(id)
ON DELETE CASCADE;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_habits_short_term_goal
ON habits(short_term_goal_id);

-- ==================================================
-- 4. RLS（Row Level Security）ポリシーの追加
-- ==================================================

-- 長期目標のRLSポリシー
ALTER TABLE long_term_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own long term goals"
ON long_term_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own long term goals"
ON long_term_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own long term goals"
ON long_term_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own long term goals"
ON long_term_goals FOR DELETE
USING (auth.uid() = user_id);

-- 短期目標のRLSポリシー
ALTER TABLE short_term_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own short term goals"
ON short_term_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own short term goals"
ON short_term_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own short term goals"
ON short_term_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own short term goals"
ON short_term_goals FOR DELETE
USING (auth.uid() = user_id);

-- ==================================================
-- 5. 制約の追加
-- ==================================================

-- measurement_unit の値を制限
ALTER TABLE short_term_goals
ADD CONSTRAINT check_measurement_unit
CHECK (measurement_unit IN ('count', 'days', 'minutes'));

-- current_value は 0 以上
ALTER TABLE short_term_goals
ADD CONSTRAINT check_current_value_positive
CHECK (current_value >= 0);

-- target_value は 1 以上
ALTER TABLE short_term_goals
ADD CONSTRAINT check_target_value_positive
CHECK (target_value >= 1);

-- ==================================================
-- 6. 進捗計算用の関数を作成
-- ==================================================

-- 短期目標の進捗率を計算する関数
CREATE OR REPLACE FUNCTION calculate_short_term_goal_progress(
  p_short_term_goal_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_current_value INTEGER;
  v_target_value INTEGER;
  v_progress DECIMAL(5,2);
BEGIN
  SELECT current_value, target_value
  INTO v_current_value, v_target_value
  FROM short_term_goals
  WHERE id = p_short_term_goal_id;

  IF v_target_value = 0 THEN
    RETURN 0;
  END IF;

  v_progress := (v_current_value::DECIMAL / v_target_value) * 100;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql;

-- 長期目標の進捗率を計算する関数
CREATE OR REPLACE FUNCTION calculate_long_term_goal_progress(
  p_long_term_goal_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_avg_progress DECIMAL(5,2);
BEGIN
  SELECT COALESCE(AVG(calculate_short_term_goal_progress(id)), 0)
  INTO v_avg_progress
  FROM short_term_goals
  WHERE long_term_goal_id = p_long_term_goal_id;

  RETURN v_avg_progress;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 7. トリガーの作成（自動進捗更新）
-- ==================================================

-- 短期目標の達成状態を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_short_term_goal_achievement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_value >= NEW.target_value THEN
    NEW.is_achieved := TRUE;
  ELSE
    NEW.is_achieved := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_short_term_goal_achievement
BEFORE UPDATE OF current_value ON short_term_goals
FOR EACH ROW
EXECUTE FUNCTION update_short_term_goal_achievement();

-- ==================================================
-- 8. コメント
-- ==================================================

COMMENT ON COLUMN long_term_goals.description IS '長期目標の説明文（任意）';
COMMENT ON COLUMN long_term_goals.is_achieved IS '達成状態（全ての短期目標が達成で true）';

COMMENT ON COLUMN short_term_goals.measurement_unit IS '測定単位（count=回数、days=日数、minutes=時間）';
COMMENT ON COLUMN short_term_goals.target_value IS '目標値';
COMMENT ON COLUMN short_term_goals.current_value IS '現在値';
COMMENT ON COLUMN short_term_goals.is_achieved IS '達成状態（current_value >= target_value で true）';
COMMENT ON COLUMN short_term_goals.deadline IS '期限（任意）';

COMMENT ON COLUMN habits.short_term_goal_id IS '紐づく短期目標のID（必須）';
