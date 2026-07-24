import React, { createContext, useContext, useState, useEffect } from "react";
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
  userPassword: "",
  setUser: () => {},
  setProfile: () => {},
  setSchoolInfo: () => {},
  setTeacherInfo: () => {},
  setActiveStudentId: () => {},
  setActiveStudentProfile: () => {},
  setSoundEnabled: () => {},
  setUserPassword: () => {},
});

export const useTheme = () => useContext(ThemeContext);
export const useAuth = () => useContext(AuthContext);

export const GlobalContextProvider = ({ children }) => {
  const [themeName, setThemeName] = useState("light");
  const [user, setUserState] = useState(null);
  const [profile, setProfile] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [teacherInfo, setTeacherInfoState] = useState(null);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [activeStudentProfile, setActiveStudentProfile] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userPassword, setUserPassword] = useState("");
  const currentTheme = themes[themeName] || themes.light;

  // Persistent storage wrappers
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedUser = window.localStorage.getItem('hpc_logged_user');
        const savedTeacher = window.localStorage.getItem('hpc_teacher_info');
        if (savedUser && !user) {
          setUserState(JSON.parse(savedUser));
        }
        if (savedTeacher && !teacherInfo) {
          setTeacherInfoState(JSON.parse(savedTeacher));
        }
      } catch (e) {}
    }
  }, []);

  const setUser = (u) => {
    setUserState(u);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (u) window.localStorage.setItem('hpc_logged_user', JSON.stringify(u));
        else window.localStorage.removeItem('hpc_logged_user');
      } catch (e) {}
    }
  };

  const setTeacherInfo = (t) => {
    setTeacherInfoState(t);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (t) window.localStorage.setItem('hpc_teacher_info', JSON.stringify(t));
        else window.localStorage.removeItem('hpc_teacher_info');
      } catch (e) {}
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setTeacherInfo(null);
    setSchoolInfo(null);
    setActiveStudentId(null);
    setActiveStudentProfile(null);
    setUserPassword("");
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setThemeName }}>
      <AuthContext.Provider value={{
          user, setUser, 
          profile, setProfile,
          schoolInfo, setSchoolInfo,
          teacherInfo, setTeacherInfo,
          activeStudentId, setActiveStudentId,
          activeStudentProfile, setActiveStudentProfile,
          soundEnabled, setSoundEnabled,
          userPassword, setUserPassword,
          logout,
        }}>
        {children}
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};
