import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import ProfilePage from "./pages/profile/ProfilePage";

import MahasiswaDashboard from "./pages/dashboard/MahasiswaDashboard";
import MyClasses from "./pages/class/ClassListPage";
import CreateClass from "./pages/class/ClassCreate";
import ClassInfo from "./pages/class/ClassInfo";
import ClassMembers from "./pages/class/ClassMembers";
import TaskCreateClass from "./pages/class/ClassIndividu";

import CreateGroup from "./pages/class/GroupCreateForm";
import ClassGroupDetail from "./pages/class/GroupDetail";
import EditMasterTask from "./pages/class/EditMasterTask";

import TaskIndividu from "./pages/tasks/TaskIndividu";
import TaskCreate from "./pages/tasks/TaskCreate";
import TaskInfo from "./pages/tasks/TaskInfo";
import TaskEdit from "./pages/tasks/TaskEdit";
import TaskEditInfoTask from "./pages/tasks/TaskEditInfoTask";

import GroupListPage from "./pages/group/GroupListPage";
import GroupCreated from "./pages/group/GroupCreated";
import GroupDetail from "./pages/group/GroupDetail";
import GroupTaskCreate from "./pages/group/TaskCreate";
import GroupMemberAdd from "./pages/group/GroupMemberAdd";
import GroupTaskInfo from "./pages/group/GroupTaskInfo";
import GroupTaskEdit from "./pages/group/GroupTaskEdit";
import EditGroupTask from "./pages/group/EditGroupTask";

import ProgressPage  from "./pages/progress/ProgressPage";
import NotifikasiPage from "./pages/notifikasi/NotifikasiPage";

import DosenDashboard from "./pages/dashboard/DosenDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import UserList from "./pages/admin/user";
// import LoggingPage from "./pages/admin/log";

import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <AuthProvider>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Mahasiswa */}
          <Route path="/dashboard/mahasiswa" element={<DashboardLayout />}>
            <Route path="" element={<MahasiswaDashboard />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Kelas */}
            <Route path="class" element={<MyClasses />} />
            <Route path="class/:classId" element={<ClassInfo />} />
            <Route path="class/:classId/members" element={<ClassMembers />} />
            <Route path="class/groups/:groupId/info" element={<ClassGroupDetail />} />

            {/* Tugas Individu */}
            <Route path="task-individu" element={<TaskIndividu />} />
            <Route path="task-individu/create" element={<TaskCreate />} />
            <Route path="task-individu/:id/info"element={<TaskInfo />} />
            <Route path="task-individu/:id/edit" element={<TaskEdit />} />

            {/* Tugas Kelompok */}
            <Route path="task-kelompok" element={<GroupListPage />} />
            <Route path="task-kelompok/groups/create" element={<GroupCreated />} />
            <Route path="task-kelompok/groups/:groupId/info" element={<GroupDetail />} />
            <Route path="task-kelompok/groups/:groupId/tasks/create" element={<GroupTaskCreate />} />
            <Route path="task-kelompok/groups/:groupId/members/add" element={<GroupMemberAdd />} />
            <Route path="task-kelompok/groups/:groupId/tasks/:taskId/edit" element={<GroupTaskInfo />} />
            <Route path="task-kelompok/groups/:groupId/tasks/:taskId/edit/status" element={<GroupTaskEdit />} />

            {/* Progress tugas */}
            <Route path="progress" element={<ProgressPage />} />

            {/* Notifikasi */}
            <Route path="notifikasi" element={<NotifikasiPage />} />

          </Route>

          {/* Dosen */}
          <Route path="/dashboard/dosen" element={<DashboardLayout />}>
            <Route path="" element={<DosenDashboard />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Kelas */}
            <Route path="class" element={<MyClasses />} />
            <Route path="class/create" element={<CreateClass />} />
            <Route path="class/:classId" element={<ClassInfo />} />
            <Route path="class/master/:masterTaskId" element={<EditMasterTask />} />
            
            <Route path="class/:classId/members" element={<ClassMembers />} />
            <Route path="class/:classId/tasks" element={<TaskCreateClass />} />
            <Route path="class/:classId/groups" element={<CreateGroup />} />
            <Route path="class/groups/:groupId/info" element={<ClassGroupDetail />} />

            {/* Tugas Individu */}
            <Route path="task-individu" element={<TaskIndividu  />} />
            <Route path="task-individu/create" element={<TaskCreate />} />
            <Route path="task-individu/:id/info"element={<TaskInfo />} />
            <Route path="task-individu/:id/edit" element={<TaskEdit />} />
            <Route path="task-individu/:id/edit/info" element={<TaskEditInfoTask />} />

            {/* Tugas Kelompok */}
            <Route path="task-kelompok" element={<GroupListPage />} />
            <Route path="task-kelompok/groups/create" element={<GroupCreated />} />
            <Route path="task-kelompok/groups/:groupId/info" element={<GroupDetail />} />
            <Route path="task-kelompok/groups/:groupId/tasks/create" element={<GroupTaskCreate />} />
            <Route path="task-kelompok/groups/:groupId/tasks/:taskId" element={<EditGroupTask />} />
            <Route path="task-kelompok/groups/:groupId/members/add" element={<GroupMemberAdd />} />
            <Route path="task-kelompok/groups/:groupId/tasks/:taskId/edit" element={<GroupTaskInfo />} />
            <Route path="task-kelompok/groups/:groupId/tasks/:taskId/edit/status" element={<GroupTaskEdit />} />
            {/* Progress Tugas */}
            
            {/* Notifikasi */}
            <Route path="notifikasi" element={<NotifikasiPage />} />
          </Route>

          {/* Admin */}
          <Route path="/dashboard/admin" element={<DashboardLayout />}>
            <Route path="" element={<AdminDashboard />} />
            <Route path="profile" element={<ProfilePage />} />

            <Route path="user" element={<UserList />} />
            {/* <Route path="log" element={<LoggingPage />} /> */}
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
