import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from './api.js';

export function useStartSession() {
  const nav = useNavigate();
  return useMutation({
    mutationFn: ({ protocolKey, mode }) => api('/sessions', { method: 'POST', body: { protocolKey, mode } }),
    onSuccess: (r) => nav(`/coach/${r.session._id}`),
  });
}
