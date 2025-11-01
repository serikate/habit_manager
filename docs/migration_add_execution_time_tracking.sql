-- ============================================
-- タスク実行時間計測機能
-- 作成日: 2025-01-15
-- ============================================

-- 1. daily_tasks テーブルに started_at カラムを追加
ALTER TABLE daily_tasks
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN daily_tasks.started_at IS '実際のタスク開始日時';

-- 2. task_executions テーブルに started_at カラムを追加
ALTER TABLE task_executions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN task_executions.started_at IS '実行開始日時（編集可能）';

-- 3. task_execution_edits テーブルの作成（編集履歴）
CREATE TABLE IF NOT EXISTS task_execution_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES task_executions(id) ON DELETE CASCADE,

  -- 編集前の値
  old_started_at TIMESTAMPTZ NOT NULL,
  old_completed_at TIMESTAMPTZ NOT NULL,
  old_actual_duration INTEGER NOT NULL,
  old_achievement_rate DECIMAL(5,2) NOT NULL,

  -- 編集後の値
  new_started_at TIMESTAMPTZ NOT NULL,
  new_completed_at TIMESTAMPTZ NOT NULL,
  new_actual_duration INTEGER NOT NULL,
  new_achievement_rate DECIMAL(5,2) NOT NULL,

  -- メタ情報
  edited_by UUID NOT NULL REFERENCES auth.users(id),
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edit_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_task_execution_edits_execution_id
ON task_execution_edits(execution_id);

CREATE INDEX IF NOT EXISTS idx_task_execution_edits_edited_at
ON task_execution_edits(edited_at DESC);

-- コメントの追加
COMMENT ON TABLE task_execution_edits IS 'タスク実行時間の編集履歴';
COMMENT ON COLUMN task_execution_edits.execution_id IS '編集対象のtask_executions.id';
COMMENT ON COLUMN task_execution_edits.edit_reason IS '編集理由（任意）';

-- RLS（Row Level Security）の設定
ALTER TABLE task_execution_edits ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の編集履歴のみ参照可能
CREATE POLICY "Users can view their own execution edits"
ON task_execution_edits
FOR SELECT
USING (
  edited_by = auth.uid()
);

-- ユーザーは編集履歴を作成可能
CREATE POLICY "Users can create execution edits"
ON task_execution_edits
FOR INSERT
WITH CHECK (
  edited_by = auth.uid()
);
