import { User } from '../../../core/types/user.types';
import { buildUpdatePayload, isEmptyPayload, UserFormValue } from './user-display';

const baseUser: User = {
  id: 'b3d2f1a0-1111-4222-8333-444455556666',
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  email: 'juan@example.com',
  role: 'ADMIN',
  isArchived: false,
  createdAt: '2026-08-05T04:21:09.412Z',
  updatedAt: '2026-08-05T04:21:09.412Z',
};

const formFor = (user: User, overrides: Partial<UserFormValue> = {}): UserFormValue => ({
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  email: user.email,
  role: user.role,
  password: '',
  ...overrides,
});

describe('buildUpdatePayload', () => {
  it('sends nothing when nothing changed', () => {
    const payload = buildUpdatePayload(formFor(baseUser), baseUser);
    expect(isEmptyPayload(payload)).toBe(true);
  });

  it('sends only the changed fields', () => {
    const payload = buildUpdatePayload(formFor(baseUser, { firstName: 'Juana' }), baseUser);
    expect(payload).toEqual({ firstName: 'Juana' });
  });

  it('omits the password unless the reset field was filled', () => {
    expect(buildUpdatePayload(formFor(baseUser), baseUser).password).toBeUndefined();
    expect(buildUpdatePayload(formFor(baseUser, { password: 'newpassword123' }), baseUser).password).toBe(
      'newpassword123',
    );
  });

  it('normalizes the email the way the server does before diffing', () => {
    const payload = buildUpdatePayload(formFor(baseUser, { email: '  JUAN@example.com ' }), baseUser);
    expect(isEmptyPayload(payload)).toBe(true);
  });

  it('never re-sends an unchanged role (an unchanged SUPER_ADMIN is a 403)', () => {
    const superAdmin: User = { ...baseUser, role: 'SUPER_ADMIN' };
    const payload = buildUpdatePayload(formFor(superAdmin, { role: 'SUPER_ADMIN' }), superAdmin);
    expect(payload.role).toBeUndefined();
  });

  it('treats a null role as "left untouched"', () => {
    const superAdmin: User = { ...baseUser, role: 'SUPER_ADMIN' };
    const payload = buildUpdatePayload(formFor(superAdmin, { role: null }), superAdmin);
    expect(payload.role).toBeUndefined();
    expect(isEmptyPayload(payload)).toBe(true);
  });

  it('sends a demotion away from SUPER_ADMIN', () => {
    const superAdmin: User = { ...baseUser, role: 'SUPER_ADMIN' };
    const payload = buildUpdatePayload(formFor(superAdmin, { role: 'ADMIN' }), superAdmin);
    expect(payload).toEqual({ role: 'ADMIN' });
  });

  it('handles null names without emitting "null"', () => {
    const nameless: User = { ...baseUser, firstName: null, lastName: null };
    const payload = buildUpdatePayload(formFor(nameless), nameless);
    expect(isEmptyPayload(payload)).toBe(true);
  });
});
