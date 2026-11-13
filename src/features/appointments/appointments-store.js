export const APPOINTMENTS_ERROR = "Não foi possível carregar suas consultas. Confira a conexão e tente novamente.";

export const EMPTY_APPOINTMENTS_STATE = Object.freeze({ appointments: [], loading: true, error: "" });

// Uma fonte por aplicação: começa no primeiro consumidor e para no último.
export function createAppointmentsStore(fetchAppointments, connect) {
  let state = EMPTY_APPOINTMENTS_STATE;
  let generation = 0;
  let disconnect;
  const listeners = new Set();
  const publish = (next) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const invalidate = () => {
    generation++;
    publish(EMPTY_APPOINTMENTS_STATE);
  };
  const refresh = async () => {
    if (!listeners.size) return;
    const current = ++generation;
    publish({ ...state, loading: true, error: "" });
    try {
      const appointments = await fetchAppointments();
      if (listeners.size && current === generation) publish({ appointments, loading: false, error: "" });
    } catch (error) {
      if (listeners.size && current === generation) publish({ appointments: [], loading: false, error: APPOINTMENTS_ERROR });
    }
  };
  return {
    getSnapshot: () => state,
    refresh,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        disconnect = connect(refresh, invalidate);
        refresh();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          generation++;
          disconnect?.();
          disconnect = undefined;
          state = EMPTY_APPOINTMENTS_STATE;
        }
      };
    },
  };
}
