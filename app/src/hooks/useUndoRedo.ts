import { useCallback, useRef, useState } from 'react';

const UNDO_BAR_TIMEOUT_MS = 10_000;

interface UndoEntry {
  label: string;
  undo: () => void;
  redo: () => void;
}

export function useUndoRedo() {
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoLabel, setUndoLabel] = useState<string | null>(null);
  const [undoBarVisible, setUndoBarVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUndoBar = useCallback(() => {
    setUndoBarVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setUndoBarVisible(false), UNDO_BAR_TIMEOUT_MS);
  }, []);

  const push = useCallback((entry: UndoEntry) => {
    undoStack.current.push(entry);
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setUndoLabel(entry.label);
    showUndoBar();
  }, [showUndoBar]);

  const handleUndo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    entry.undo();
    redoStack.current.push(entry);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    setUndoLabel(undoStack.current[undoStack.current.length - 1]?.label ?? null);
    showUndoBar();
  }, [showUndoBar]);

  const handleRedo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    entry.redo();
    undoStack.current.push(entry);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    setUndoLabel(entry.label);
    showUndoBar();
  }, [showUndoBar]);

  return { push, handleUndo, handleRedo, canUndo, canRedo, undoLabel, undoBarVisible };
}
