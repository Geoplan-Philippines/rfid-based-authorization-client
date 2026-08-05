import { HttpErrorResponse } from '@angular/common/http';

import { apiMessages, fieldErrorsFrom, generalMessages, toMessages } from './api-errors';

const errorWith = (status: number, message: string | string[]) =>
  new HttpErrorResponse({
    status,
    error: { statusCode: status, message, error: 'Bad Request', path: '/api/v1/users', timestamp: '' },
  });

describe('toMessages', () => {
  it('normalizes both shapes the API can return', () => {
    expect(toMessages('Email already in use')).toEqual(['Email already in use']);
    expect(toMessages(['a', 'b'])).toEqual(['a', 'b']);
    expect(toMessages(undefined)).toEqual([]);
  });
});

describe('fieldErrorsFrom', () => {
  it('attaches validation strings to the field that caused them', () => {
    const error = errorWith(400, [
      'email must be an email',
      'password must be longer than or equal to 8 characters',
    ]);

    expect(fieldErrorsFrom(error)).toEqual({
      email: 'email must be an email',
      password: 'password must be longer than or equal to 8 characters',
    });
  });

  it('keeps the first message when one field reports several', () => {
    const error = errorWith(400, [
      'password must be longer than or equal to 8 characters',
      'password must be a string',
    ]);

    expect(fieldErrorsFrom(error).password).toBe('password must be longer than or equal to 8 characters');
  });

  it('leaves non-field messages out', () => {
    const error = errorWith(400, ['property confirmPassword should not exist']);
    expect(fieldErrorsFrom(error)).toEqual({});
    expect(generalMessages(error)).toEqual(['property confirmPassword should not exist']);
  });

  it('reads a plain-string message as a general one', () => {
    const error = errorWith(409, 'Email already in use');
    expect(apiMessages(error)).toEqual(['Email already in use']);
    expect(fieldErrorsFrom(error)).toEqual({});
  });
});
