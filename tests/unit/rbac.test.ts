import { hasPermission, isRoleHigherOrEqual, Role, Permissions } from '../../src/shared/types';

describe('RBAC Utilities', () => {
  describe('hasPermission', () => {
    it('should return true for admin with any permission', () => {
      expect(hasPermission(Role.ADMIN, Permissions.CREATE_RECORDS)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permissions.DELETE_USERS)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permissions.READ_ANALYTICS)).toBe(true);
    });

    it('should return true for viewer reading dashboard', () => {
      expect(hasPermission(Role.VIEWER, Permissions.READ_DASHBOARD)).toBe(true);
      expect(hasPermission(Role.VIEWER, Permissions.READ_RECORDS)).toBe(true);
    });

    it('should return false for viewer creating records', () => {
      expect(hasPermission(Role.VIEWER, Permissions.CREATE_RECORDS)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permissions.DELETE_RECORDS)).toBe(false);
    });

    it('should return true for analyst reading analytics', () => {
      expect(hasPermission(Role.ANALYST, Permissions.READ_ANALYTICS)).toBe(true);
      expect(hasPermission(Role.ANALYST, Permissions.READ_USERS)).toBe(true);
    });

    it('should return false for analyst managing users', () => {
      expect(hasPermission(Role.ANALYST, Permissions.CREATE_USERS)).toBe(false);
      expect(hasPermission(Role.ANALYST, Permissions.DELETE_USERS)).toBe(false);
    });
  });

  describe('isRoleHigherOrEqual', () => {
    it('should return true for same role', () => {
      expect(isRoleHigherOrEqual(Role.VIEWER, Role.VIEWER)).toBe(true);
      expect(isRoleHigherOrEqual(Role.ANALYST, Role.ANALYST)).toBe(true);
      expect(isRoleHigherOrEqual(Role.ADMIN, Role.ADMIN)).toBe(true);
    });

    it('should return true for higher role', () => {
      expect(isRoleHigherOrEqual(Role.ADMIN, Role.VIEWER)).toBe(true);
      expect(isRoleHigherOrEqual(Role.ADMIN, Role.ANALYST)).toBe(true);
      expect(isRoleHigherOrEqual(Role.ANALYST, Role.VIEWER)).toBe(true);
    });

    it('should return false for lower role', () => {
      expect(isRoleHigherOrEqual(Role.VIEWER, Role.ANALYST)).toBe(false);
      expect(isRoleHigherOrEqual(Role.VIEWER, Role.ADMIN)).toBe(false);
      expect(isRoleHigherOrEqual(Role.ANALYST, Role.ADMIN)).toBe(false);
    });
  });
});
