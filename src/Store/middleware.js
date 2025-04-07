// middlewares.js
/**
 * Creates a JSON storage object for use with persist middleware
 * @param {Object} options Storage options
 * @returns {Object} Storage object with getItem, setItem, and removeItem methods
 */
export const createJSONStorage = (getStorage) => {
  const storage = getStorage();

  return {
    getItem: (name) => {
      const str = storage.getItem(name);
      if (!str) return null;

      try {
        return JSON.parse(str);
      } catch (error) {
        console.error(`Error parsing stored state for ${name}:`, error);
        return null;
      }
    },

    setItem: (name, value) => {
      try {
        const serializedValue = JSON.stringify(value);
        storage.setItem(name, serializedValue);
      } catch (error) {
        console.error(`Error serializing state for ${name}:`, error);
      }
    },

    removeItem: (name) => {
      storage.removeItem(name);
    },
  };
};

/**
 * Creates a persist middleware for Zustand that saves and loads state from storage
 * @param {Function} config The store creation function
 * @param {Object} options Configuration options for persistence
 * @returns {Function} Enhanced store creation function with persistence
 */
export const persist = (config, options) => {
  const {
    name,
    storage = createJSONStorage(() => localStorage),
    partialize = (state) => state,
    merge = (persistedState, currentState) => ({
      ...currentState,
      ...persistedState,
    }),
    version = 0,
    migrate,
    onRehydrateStorage,
  } = options;

  const rehydrate = async (setState, getState) => {
    try {
      const persistedState = storage.getItem(name);

      if (persistedState) {
        let state = persistedState;

        // Handle version migration if needed
        if (version !== persistedState.version && migrate) {
          state = await migrate(persistedState, version);
        }

        // Merge persisted state with current state
        setState(merge(state, getState()), true);
      }

      // Call onRehydrateStorage if provided
      if (onRehydrateStorage) {
        onRehydrateStorage(getState())();
      }
    } catch (error) {
      console.error(`Error rehydrating state for ${name}:`, error);

      // Call onRehydrateStorage with error if provided
      if (onRehydrateStorage) {
        onRehydrateStorage(null)(error);
      }
    }
  };

  return (set, get, api) => {
    const setState = (state, replace) => {
      // Update the state as usual
      set(state, replace);

      // Persist the updated state
      try {
        const partializedState = partialize(get());
        storage.setItem(name, {
          ...partializedState,
          version,
        });
      } catch (error) {
        console.error(`Error persisting state for ${name}:`, error);
      }
    };

    // Call the original store creation function with wrapped setState
    const result = config(setState, get, api);

    // Rehydrate state from storage asynchronously
    rehydrate(set, get);

    return result;
  };
};
