import type { CloudServices } from './services';
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizeCode = (value: string) => value.trim().toUpperCase();
export const emailError = (value: string) =>
  !value.trim()
    ? 'Enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      ? 'Enter a valid email address.'
      : undefined;
export function authErrors(
  values: { name: string; email: string; password: string; confirm: string },
  register: boolean,
  policy: CloudServices['policy'],
) {
  return {
    name: register && !values.name.trim() ? 'Enter your full name.' : undefined,
    email: emailError(values.email),
    password: !values.password
      ? 'Enter your password.'
      : register
        ? policy.passwordError?.(values.password)
        : undefined,
    confirm:
      register && (!values.confirm || values.confirm !== values.password)
        ? 'Passwords must match.'
        : undefined,
  };
}
export const nameError = (value: string, policy: CloudServices['policy']) =>
  !value.trim()
    ? 'Enter a workspace name.'
    : policy.workspaceNameError?.(value.trim());
export const codeError = (value: string, policy: CloudServices['policy']) =>
  !value.trim()
    ? 'Enter the code from your mentor.'
    : /\s/.test(value.trim())
      ? 'Check the code. It should not contain spaces.'
      : policy.workspaceCodeError?.(normalizeCode(value));
