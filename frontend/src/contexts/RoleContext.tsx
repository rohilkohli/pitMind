import React, { createContext, useContext, useState } from "react";

export type UserRole = "engineer" | "strategist" | "commentator";

interface RoleContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setRole] = useState<UserRole>("engineer");

  return <RoleContext.Provider value={{ currentRole, setRole }}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
};
