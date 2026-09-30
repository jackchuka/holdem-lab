import { useEffect, useRef, useState } from 'react';
import { NAME_MAX, normalizeName } from '../fortune';
import { useI18n } from '../i18n/i18n';

type Props = {
  savedName: string | null;
  editing: boolean;
  onRead: (name: string) => void;
  onSave: (name: string) => void;
  onEdit: () => void;
  onClear: () => void;
};

export function NamePanel({ savedName, editing, onRead, onSave, onEdit, onClear }: Props) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    setValue(savedName ?? '');
    input.current?.focus();
  }, [editing, savedName]);

  const name = normalizeName(value);
  const valid = name.length > 0 && name.length <= NAME_MAX;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    if (editing) onSave(name);
    else onRead(name);
    setValue('');
  };

  return (
    <div className="name-panel">
      {savedName && !editing && (
        <div className="saved-name">
          <span>{t('name.saved', { name: savedName })}</span>
          <button className="link" onClick={onEdit}>
            {t('name.edit')}
          </button>
          <button className="link" onClick={onClear}>
            {t('name.clear')}
          </button>
        </div>
      )}
      <form className="name-form" onSubmit={submit}>
        <input
          ref={input}
          aria-label={t('name.label')}
          placeholder={t('name.placeholder')}
          maxLength={NAME_MAX}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="secondary" type="submit" disabled={!valid}>
          {editing ? t('name.save') : t('name.submit')}
        </button>
      </form>
      {!savedName && <p className="muted small">{t('name.note')}</p>}
    </div>
  );
}
