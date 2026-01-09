import React, { useEffect, useMemo, useState } from 'react';

function validate(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = 'Name is required.';
  if (!values.address?.trim()) errors.address = 'Address is required.';
  // contact required: at least one of email or phone
  const hasEmail = Boolean(values.email?.trim());
  const hasPhone = Boolean(values.phone?.trim());
  if (!hasEmail && !hasPhone) errors.contact = 'At least one contact field (email or phone) is required.';
  return errors;
}

// PUBLIC_INTERFACE
export function ResidentForm({ initialValue, onCancel, onSubmit, submitting, submitError, submitSuccess }) {
  /** Resident create/edit form. Basic client-side validation, submits via parent. */
  const isEdit = Boolean(initialValue?.id);

  const initial = useMemo(
    () => ({
      name: '',
      address: '',
      email: '',
      phone: '',
      photo_url: '',
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

  const errors = validate(values);
  const canSubmit = Object.keys(errors).length === 0;

  const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <div className="card">
      <h2 className="h2">{isEdit ? 'Edit Resident' : 'Create Resident'}</h2>

      {submitError ? (
        <div className="alert alert--error" role="alert">
          {submitError}
        </div>
      ) : null}
      {submitSuccess ? (
        <div className="alert alert--success" role="status">
          {submitSuccess}
        </div>
      ) : null}

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ name: true, address: true, email: true, phone: true, photo_url: true, contact: true });
          if (!canSubmit) return;
          onSubmit?.(values);
        }}
      >
        <div className="form-row">
          <label className="label" htmlFor="resident-name">
            Name <span className="required">*</span>
          </label>
          <input
            id="resident-name"
            className={`input ${touched.name && errors.name ? 'input--error' : ''}`}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          />
          {touched.name && errors.name ? <div className="field-error">{errors.name}</div> : null}
        </div>

        <div className="form-row">
          <label className="label" htmlFor="resident-address">
            Address <span className="required">*</span>
          </label>
          <input
            id="resident-address"
            className={`input ${touched.address && errors.address ? 'input--error' : ''}`}
            value={values.address}
            onChange={(e) => setField('address', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
          />
          {touched.address && errors.address ? <div className="field-error">{errors.address}</div> : null}
        </div>

        <div className="form-grid">
          <div className="form-row">
            <label className="label" htmlFor="resident-email">
              Email
            </label>
            <input
              id="resident-email"
              className={`input ${touched.contact && errors.contact ? 'input--error' : ''}`}
              value={values.email || ''}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
              type="email"
            />
          </div>

          <div className="form-row">
            <label className="label" htmlFor="resident-phone">
              Phone
            </label>
            <input
              id="resident-phone"
              className={`input ${touched.contact && errors.contact ? 'input--error' : ''}`}
              value={values.phone || ''}
              onChange={(e) => setField('phone', e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
              type="tel"
            />
          </div>
        </div>

        {touched.contact && errors.contact ? <div className="field-error">{errors.contact}</div> : null}

        <div className="form-row">
          <label className="label" htmlFor="resident-photo">
            Photo URL <span className="muted">(optional)</span>
          </label>
          <input
            id="resident-photo"
            className="input"
            value={values.photo_url || ''}
            onChange={(e) => setField('photo_url', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, photo_url: true }))}
            placeholder="https://…"
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
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
