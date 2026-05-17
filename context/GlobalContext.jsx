import React, { createContext, useContext, useState } from "react";
import Constants from "expo-constants";
import { themes } from "../colour_themes";
import { Platform } from "react-native";

const debuggerHost = Constants.expoConfig?.hostUri;
const origin = debuggerHost?.split(":")[0] || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
export const API_URL = `http://${origin}:3000/api`;

// Theme Context
export const ThemeContext = createContext({
  theme: themes.light,
  setThemeName: (name) => {},
});

// Auth Context
export const AuthContext = createContext({
  user: null,
  profile: null,
  schoolInfo: null,              // School-level data (UDISE, name, address, etc.)
  teacherInfo: null,             // Teacher profile data (name, code, qualification)
  activeStudentId: null,         // Used by teachers to target a specific student
  activeStudentProfile: null,    // Used by teachers to hold target student's profile
  soundEnabled: true,
  setUser: () => {},
  setProfile: () => {},
  setSchoolInfo: () => {},
  setTeacherInfo: () => {},
  setActiveStudentId: () => {},
  setActiveStudentProfile: () => {},
  setSoundEnabled: () => {},
});

export const useTheme = () => useContext(ThemeContext);
export const useAuth = () => useContext(AuthContext);

export const GlobalContextProvider = ({ children }) => {
  const [themeName, setThemeName] = useState("light");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [activeStudentProfile, setActiveStudentProfile] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const currentTheme = themes[themeName] || themes.light;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setThemeName }}>
      <AuthContext.Provider value={{
          user, setUser, 
          profile, setProfile,
          schoolInfo, setSchoolInfo,
          teacherInfo, setTeacherInfo,
          activeStudentId, setActiveStudentId,
          activeStudentProfile, setActiveStudentProfile,
          soundEnabled, setSoundEnabled 
      }}>
        {children}
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};
