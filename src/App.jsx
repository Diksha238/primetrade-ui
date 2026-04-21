import { useState, useEffect, createContext, useContext } from "react";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API = "http://localhost:8080/api/v1";

const api = {
  post: async (url, body, token) => {
    const res = await fetch(`${API}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  get: async (url, token) => {
    const res = await fetch(`${API}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  put: async (url, body, token) => {
    const res = await fetch(`${API}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  delete: async (url, token) => {
    const res = await fetch(`${API}${url}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw data;
    }
  },
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pt_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    localStorage.setItem("pt_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("pt_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            background: t.type === "error" ? "#ff4d4f" : "#52c41a",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            maxWidth: 320,
            animation: "slideIn 0.2s ease",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
  return { toasts, addToast, removeToast };
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e8f0",
    fontFamily: "'Courier New', Courier, monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#13131a",
    border: "1px solid #2a2a3d",
    borderRadius: 12,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 0 40px rgba(82,130,255,0.08)",
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: "#5282ff",
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "#555570",
    marginBottom: 32,
  },
  label: {
    display: "block",
    fontSize: 11,
    color: "#777790",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "#0d0d14",
    border: "1px solid #2a2a3d",
    borderRadius: 6,
    color: "#e8e8f0",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 16,
    transition: "border-color 0.2s",
  },
  btn: {
    width: "100%",
    padding: "11px",
    background: "#5282ff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.5,
    transition: "opacity 0.2s",
  },
  btnSm: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #2a2a3d",
    borderRadius: 5,
    color: "#aaa",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDanger: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #ff4d4f44",
    borderRadius: 5,
    color: "#ff4d4f",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  link: {
    color: "#5282ff",
    cursor: "pointer",
    fontSize: 13,
    textDecoration: "underline",
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 12,
  },
};

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) return setError("All fields required");
    setLoading(true);
    try {
      const data = await api.post("/auth/login", form);
      login(data);
    } catch (e) {
      setError(e.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>PRIMETRADE.AI</div>
        <div style={S.subtitle}>Task Manager — Backend Intern Assignment</div>
        <label style={S.label}>Email</label>
        <input
          style={S.input}
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <label style={S.label}>Password</label>
        <input
          style={S.input}
          type="password"
          placeholder="••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {error && <div style={S.errorText}>{error}</div>}
        <button style={S.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#555570" }}>
          No account?{" "}
          <span style={S.link} onClick={onSwitch}>Register</span>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) return setError("All fields required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const data = await api.post("/auth/register", form);
      login(data);
    } catch (e) {
      setError(e.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>PRIMETRADE.AI</div>
        <div style={S.subtitle}>Create your account</div>
        <label style={S.label}>Full Name</label>
        <input style={S.input} placeholder="John Doe" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label style={S.label}>Email</label>
        <input style={S.input} type="email" placeholder="you@example.com" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label style={S.label}>Password</label>
        <input style={S.input} type="password" placeholder="min 6 chars" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label style={S.label}>Role</label>
        <select style={{ ...S.input, marginBottom: 16 }} value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        {error && <div style={S.errorText}>{error}</div>}
        <button style={S.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Register →"}
        </button>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#555570" }}>
          Have an account?{" "}
          <span style={S.link} onClick={onSwitch}>Sign In</span>
        </p>
      </div>
    </div>
  );
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
function TaskModal({ task, token, onClose, onSaved, addToast }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "TODO",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return addToast("Title is required", "error");
    setLoading(true);
    try {
      if (task) {
        await api.put(`/tasks/${task.id}`, form, token);
        addToast("Task updated!");
      } else {
        await api.post("/tasks", form, token);
        addToast("Task created!");
      }
      onSaved();
    } catch (e) {
      addToast(e.error || "Failed to save task", "error");
    } finally {
      setLoading(false);
    }
  };

  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  };
  const modal = {
    background: "#13131a", border: "1px solid #2a2a3d", borderRadius: 10,
    padding: "28px 28px", width: "100%", maxWidth: 440,
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#e8e8f0" }}>
          {task ? "Edit Task" : "New Task"}
        </h3>
        <label style={S.label}>Title *</label>
        <input style={S.input} value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
        <label style={S.label}>Description</label>
        <textarea
          style={{ ...S.input, height: 80, resize: "vertical" }}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Optional description"
        />
        <label style={S.label}>Status</label>
        <select style={{ ...S.input }} value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button style={S.btnSm} onClick={onClose}>Cancel</button>
          <button style={{ ...S.btn, width: "auto", padding: "8px 20px" }}
            onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const statusColors = { TODO: "#5282ff", IN_PROGRESS: "#faad14", DONE: "#52c41a" };

function Dashboard() {
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState(undefined); // undefined=closed, null=new, obj=edit

  const fetchTasks = async () => {
    try {
      const data = await api.get("/tasks", user.token);
      setTasks(data);
    } catch (e) {
      addToast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`, user.token);
      addToast("Task deleted");
      fetchTasks();
    } catch (e) {
      addToast(e.error || "Delete failed", "error");
    }
  };

  const nav = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 28px", background: "#13131a",
    borderBottom: "1px solid #2a2a3d", position: "sticky", top: 0, zIndex: 100,
  };

  const taskCard = {
    background: "#13131a", border: "1px solid #2a2a3d",
    borderRadius: 8, padding: "16px 18px", marginBottom: 10,
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  };

  const badge = (status) => ({
    display: "inline-block", padding: "2px 8px",
    borderRadius: 4, fontSize: 11, fontWeight: 600,
    color: statusColors[status] || "#aaa",
    border: `1px solid ${statusColors[status] || "#aaa"}44`,
    background: `${statusColors[status] || "#aaa"}11`,
  });

  const todoCount = tasks.filter(t => t.status === "TODO").length;
  const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter(t => t.status === "DONE").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Courier New', monospace", color: "#e8e8f0" }}>
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Navbar */}
      <div style={nav}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#5282ff", letterSpacing: 1 }}>PRIMETRADE.AI</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#666" }}>
            {user.name} &nbsp;
            <span style={{ ...badge(user.role === "ADMIN" ? "DONE" : "TODO"), fontSize: 10 }}>{user.role}</span>
          </span>
          <button style={{ ...S.btnSm }} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, padding: "20px 28px 0" }}>
        {[["Total", tasks.length, "#5282ff"], ["Todo", todoCount, "#5282ff"],
          ["In Progress", inProgressCount, "#faad14"], ["Done", doneCount, "#52c41a"]].map(([label, count, color]) => (
          <div key={label} style={{
            background: "#13131a", border: `1px solid ${color}33`,
            borderRadius: 8, padding: "14px 20px", flex: 1, textAlign: "center"
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: 11, color: "#555570", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div style={{ padding: "20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15, color: "#777790", fontWeight: 400, textTransform: "uppercase", letterSpacing: 2 }}>
            Tasks
          </h2>
          <button style={{ ...S.btn, width: "auto", padding: "8px 18px", fontSize: 13 }}
            onClick={() => setModalTask(null)}>
            + New Task
          </button>
        </div>

        {loading ? (
          <div style={{ color: "#444", textAlign: "center", paddingTop: 40 }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ color: "#444", textAlign: "center", paddingTop: 40, fontSize: 14 }}>
            No tasks yet. Create your first task →
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} style={taskCard}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</span>
                  <span style={badge(task.status)}>{task.status}</span>
                </div>
                {task.description && (
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{task.description}</div>
                )}
                <div style={{ fontSize: 11, color: "#444" }}>
                  {user.role === "ADMIN" && `by ${task.userName} · `}
                  {new Date(task.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                <button style={S.btnSm} onClick={() => setModalTask(task)}>Edit</button>
                <button style={S.btnDanger} onClick={() => handleDelete(task.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          token={user.token}
          addToast={addToast}
          onClose={() => setModalTask(undefined)}
          onSaved={() => { setModalTask(undefined); fetchTasks(); }}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        input:focus, textarea:focus, select:focus { border-color: #5282ff !important; }
        button:hover { opacity: 0.85; }
        select option { background: #13131a; }
      `}</style>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function App() {
  const { user } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (user) return <Dashboard />;
  if (showRegister) return <RegisterPage onSwitch={() => setShowRegister(false)} />;
  return <LoginPage onSwitch={() => setShowRegister(true)} />;
}

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}