'use client';

import { useRef } from 'react';

/**
 * Use case: when we want to access a value (e.g. from a prop) in a callback, but we don't want to recreate the callback and/or trigger extra re-renders because of where we want to read it.
 * Example: useEffect needs to read a value from a prop, but a value change should NOT re-call the useEffect function, i.e. the value should not be a direct dependency of the useEffect. You had better use `useRefLatest` than silent the warning on dependencies, because you're likely to cause a bug when other dependencies will change and eslint won't warn you.
 * @param value A value we want to expose to functions without needing to recreate them (typically useCallback, useEffect, useMemo)
 * @returns A reference to that value you should use inside the functions to access the latest value. The reference never changes, but its `current` attribute contains the latest value, updated at each render.
 */
export function useRefLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
