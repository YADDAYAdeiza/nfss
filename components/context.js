"use client"

import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [metaDataTick, setMetaDataTick] = useState(null);
  return (
    <AppContext.Provider value={{ metaDataTick, setMetaDataTick }}>
      {children}
    </AppContext.Provider>
  );
};

export const useFileTickContext = () => useContext(AppContext);
