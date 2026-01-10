import React, { useEffect, useMemo, useState } from 'react';

function validate(values, { isEdit }) {
  const errors = {};
  if (!values.username?.trim()) errors.username = 'Email/username is required.';
  // Backend schema currently uses "username" as unique identifier; UI labels as Email/Username.
  if (values.username && !String(values.username).includes('@')) {
    // Allow non-email usernames but provide gentle validation only.
    // Keep non-blocking: do not mark error.
  }

  if (!values.name?.trim()) errors.name = 'Name is required.';
  if (!values.role?.trim()) errors.role = 'Role is required.';

  if (!isEdit) {
    if (!values.password || String(values.password).length < 8) {
      errors.password = 'Temporary password must be at least 8 characters.';
    }
  }

  return errors;
}

// PUBLIC_INTERFACE
export function AdminForm({ initialValue, mode, onCancel, onSubmit, submitting, submitError }) {
  /** Admin create/edit form. `mode` is 'create' or 'edit'. */
  const isEdit = mode === 'edit';

  const initial = useMemo(
    () => ({
      username: '',
      name: '',
      role: 'admin',
      password: '',
      ...initialValue,
    }),
    [initialValue]
  );

  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setValues(initial);
    setTouched({});
  }, [initial]);

  const errors = validate(values, { isEdit });
  const canSubmit = Object.keys(errors).length === 0;

  const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <div className="card">
      <h2 className="h2">{isEdit ? 'Edit Admin' : 'Create Admin'}</h2>

      {submitError ? (
        <div className="alert alert--error" role="alert">
          {submitError}
        </div>
      ) : null}

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ username: true, name: true, role: true, password: true });
          if (!canSubmit) return;
          onSubmit?.(values);
        }}
      >
        <div className="form-row">
          <label className="label" htmlFor="admin-username">
            Email / Username <span className="required">*</span>
          </label>
          <input
            id="admin-username"
            className={`input ${touched.username && errors.username ? 'input--error' : ''}`}
            value={values.username}
            onChange={(e) => setField('username', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
            autoComplete="username"
            disabled={isEdit}
            placeholder="admin@example.com"
          />
          {isEdit ? (
            <p className="muted small" style={{ margin: '6px 0 0' }}>
              Username cannot be changed.
            </p>
          ) : null}
          {touched.username && errors.username ? <div className="field-error">{errors.username}</div> : null}
        </div>

        <div className="form-row">
          <label className="label" htmlFor="admin-name">
            Name <span className="required">*</span>
          </label>
          <input
            id="admin-name"
            className={`input ${touched.name && errors.name ? 'input--error' : ''}`}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            placeholder="Full name"
          />
          {touched.name && errors.name ? <div className="field-error">{errors.name}</div> : null}
        </div>

        <div className="form-row">
          <label className="label" htmlFor="admin-role">
            Role <span className="required">*</span>
          </label>
          <select
            id="admin-role"
            className={`input ${touched.role && errors.role ? 'input--error' : ''}`}
            value={values.role}
            onChange={(e) => setField('role', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, role: true }))}
          >
            <option value="admin">admin</option>
            <option value="viewer">viewer</option>
          </select>
          {touched.role && errors.role ? <div className="field-error">{errors.role}</div> : null}
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            Note: Backend currently enforces the <strong>admin</strong> role for protected endpoints.
          </p>
        </div>

        {!isEdit ? (
          <div className="form-row">
            <label className="label" htmlFor="admin-password">
              Temporary password <span className="required">*</span>
            </label>
            <input
              id="admin-password"
              className={`input ${touched.password && errors.password ? 'input--error' : ''}`}
              value={values.password}
              onChange={(e) => setField('password', e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            {touched.password && errors.password ? <div className="field-error">{errors.password}</div> : null}
          </div>
        ) : null}

        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={!canSubmit || submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
