import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('ml_token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('ml_role') || '');
  const [currentView, setCurrentView] = useState('books'); // books, members, loans, overdue, reports, users

  // Login Form State
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);

  // Notifications / Alert
  const [alert, setAlert] = useState(null); // { type: 'success'|'error'|'info', message, details }

  // Shared Data
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [booksTotal, setBooksTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [booksLoading, setBooksLoading] = useState(false);

  // Cart for Loans (1 to 3 books)
  const [loanCart, setLoanCart] = useState([]);
  const [selectedMemberForLoan, setSelectedMemberForLoan] = useState('');

  // Members Data
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);

  // Loans Data
  const [loans, setLoans] = useState([]);
  const [loanStatusFilter, setLoanStatusFilter] = useState('');
  const [loansLoading, setLoansLoading] = useState(false);

  // Overdue Data
  const [overdueList, setOverdueList] = useState([]);
  const [overdueLoading, setOverdueLoading] = useState(false);

  // Reports Data
  const [reportFrom, setReportFrom] = useState('2026-01-01');
  const [reportTo, setReportTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category_id: '', total_copies: 3 });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ full_name: '', document_number: '' });

  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '' });

  // Helper fetch with Auth
  const apiFetch = async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 204) {
      return null;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.message || `Error HTTP ${res.status}`);
      err.code = data?.code;
      err.details = data?.details;
      throw err;
    }
    return data;
  };

  const showAlert = (type, message, details = []) => {
    setAlert({ type, message, details });
    setTimeout(() => {
      setAlert(null);
    }, 6000);
  };

  // Auth actions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      setToken(data.access_token);
      setUserRole(data.role);
      localStorage.setItem('ml_token', data.access_token);
      localStorage.setItem('ml_role', data.role);
      showAlert('success', `Sesión iniciada con éxito como ${data.role}.`);
      setCurrentView('books');
    } catch (err) {
      showAlert('error', err.message, err.details);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserRole('');
    localStorage.removeItem('ml_token');
    localStorage.removeItem('ml_role');
    showAlert('info', 'Sesión cerrada correctamente.');
  };

  // Fetch Categories
  const loadCategories = async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/categories');
      setCategories(data || []);
      if (data?.length > 0 && !bookForm.category_id) {
        setBookForm(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Books
  const loadBooks = async () => {
    if (!token) return;
    setBooksLoading(true);
    try {
      let query = `/books?size=50`;
      if (searchQuery) query += `&q=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory) query += `&category_id=${encodeURIComponent(selectedCategory)}`;
      const data = await apiFetch(query);
      setBooks(data?.items || []);
      setBooksTotal(data?.total || 0);
    } catch (err) {
      showAlert('error', err.message, err.details);
    } finally {
      setBooksLoading(false);
    }
  };

  // Fetch Members
  const loadMembers = async () => {
    if (!token) return;
    setMembersLoading(true);
    try {
      let query = `/members?size=50`;
      if (memberSearch) query += `&q=${encodeURIComponent(memberSearch)}`;
      const data = await apiFetch(query);
      setMembers(data?.items || []);
    } catch (err) {
      showAlert('error', err.message, err.details);
    } finally {
      setMembersLoading(false);
    }
  };

  // Fetch Loans
  const loadLoans = async () => {
    if (!token) return;
    setLoansLoading(true);
    try {
      let query = `/loans?size=50`;
      if (loanStatusFilter) query += `&status=${encodeURIComponent(loanStatusFilter)}`;
      const data = await apiFetch(query);
      setLoans(data?.items || []);
    } catch (err) {
      showAlert('error', err.message, err.details);
    } finally {
      setLoansLoading(false);
    }
  };

  // Fetch Overdue
  const loadOverdue = async () => {
    if (!token) return;
    setOverdueLoading(true);
    try {
      const data = await apiFetch('/loans/overdue');
      setOverdueList(data?.items || []);
    } catch (err) {
      showAlert('error', err.message, err.details);
    } finally {
      setOverdueLoading(false);
    }
  };

  // Fetch Report
  const loadReport = async () => {
    if (!token || userRole !== 'admin') return;
    setReportLoading(true);
    try {
      const data = await apiFetch(`/reports/most-borrowed?from=${reportFrom}&to=${reportTo}`);
      setReportRows(data?.rows || []);
    } catch (err) {
      showAlert('error', err.message, err.details);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadCategories();
      if (currentView === 'books') loadBooks();
      if (currentView === 'members') loadMembers();
      if (currentView === 'loans') {
        loadLoans();
        loadMembers();
      }
      if (currentView === 'overdue') loadOverdue();
      if (currentView === 'reports') loadReport();
    }
  }, [token, currentView, selectedCategory, loanStatusFilter]);

  // Cart actions
  const toggleCartBook = (book) => {
    const exists = loanCart.find(b => b.id === book.id);
    if (exists) {
      setLoanCart(loanCart.filter(b => b.id !== book.id));
    } else {
      if (loanCart.length >= 3) {
        showAlert('error', 'No puedes agregar más de 3 libros a un préstamo (CA-06.1).');
        return;
      }
      if (book.available_copies <= 0) {
        showAlert('error', 'Este libro no tiene ejemplares disponibles.');
        return;
      }
      setLoanCart([...loanCart, book]);
      showAlert('info', `«${book.title}» agregado al carrito de préstamo (${loanCart.length + 1}/3).`);
    }
  };

  // Submit Loan
  const handleCreateLoan = async () => {
    if (!selectedMemberForLoan) {
      showAlert('error', 'Debes seleccionar un socio para registrar el préstamo.');
      return;
    }
    if (loanCart.length === 0) {
      showAlert('error', 'Debes seleccionar al menos un libro para el préstamo.');
      return;
    }

    try {
      await apiFetch('/loans', {
        method: 'POST',
        body: JSON.stringify({
          member_id: selectedMemberForLoan,
          items: loanCart.map(b => ({ book_id: b.id }))
        })
      });
      showAlert('success', '¡Préstamo registrado exitosamente!');
      setLoanCart([]);
      loadBooks();
      loadLoans();
    } catch (err) {
      showAlert('error', err.message, err.details);
    }
  };

  // Return Item
  const handleReturnItem = async (loanId, itemId) => {
    try {
      await apiFetch(`/loans/${loanId}/items/${itemId}/return`, {
        method: 'POST'
      });
      showAlert('success', 'Ejemplar devuelto exitosamente. Stock actualizado.');
      loadLoans();
      loadOverdue();
      loadBooks();
    } catch (err) {
      showAlert('error', err.message, err.details);
    }
  };

  // Create or Update Book
  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await apiFetch(`/books/${editingBook.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: bookForm.title,
            author: bookForm.author,
            category_id: bookForm.category_id,
            total_copies: parseInt(bookForm.total_copies, 10)
          })
        });
        showAlert('success', 'Libro actualizado exitosamente.');
      } else {
        await apiFetch('/books', {
          method: 'POST',
          body: JSON.stringify({
            title: bookForm.title,
            author: bookForm.author,
            isbn: bookForm.isbn,
            category_id: bookForm.category_id,
            total_copies: parseInt(bookForm.total_copies, 10)
          })
        });
        showAlert('success', 'Libro creado exitosamente.');
      }
      setShowBookModal(false);
      setEditingBook(null);
      setBookForm({ title: '', author: '', isbn: '', category_id: categories[0]?.id || '', total_copies: 3 });
      loadBooks();
    } catch (err) {
      showAlert('error', err.message, err.details);
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('¿Estás seguro de dar de baja este libro?')) return;
    try {
      await apiFetch(`/books/${bookId}`, { method: 'DELETE' });
      showAlert('success', 'Libro dado de baja correctamente.');
      loadBooks();
    } catch (err) {
      showAlert('error', err.message, err.details);
    }
  };

  // Create Member
  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/members', {
        method: 'POST',
        body: JSON.stringify(memberForm)
      });
      showAlert('success', 'Socio registrado exitosamente.');
      setShowMemberModal(false);
      setMemberForm({ full_name: '', document_number: '' });
      loadMembers();
    } catch (err) {
      showAlert('error', err.message, err.details);
    }
  };

  // Create Librarian
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: userForm.username,
          password: userForm.password,
          role: 'librarian'
        })
      });
      showAlert('success', 'Bibliotecario registrado exitosamente.');
      setShowUserModal(false);
      setUserForm({ username: '', password: '' });
    } catch (err) {
      showAlert('error', err.message, err.details);
    }
  };

  // Cover upload
  const handleUploadCover = async (bookId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/books/${bookId}/cover`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Error al subir portada');
      }
      showAlert('success', 'Portada actualizada exitosamente.');
      loadBooks();
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // If not logged in, render Login View
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 mb-4">
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Manager Library</h1>
            <p className="text-slate-300 text-xs mt-1 font-semibold uppercase tracking-wider">ADSO 3413974 · SENA</p>
          </div>

          {alert && (
            <div className={`p-4 rounded-xl text-xs mb-6 font-semibold flex items-start gap-3 ${
              alert.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-200' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
            }`}>
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <div>
                <p>{alert.message}</p>
                {alert.details?.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-slate-300">
                    {alert.details.map((d, i) => <li key={i}>{d.issue}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Usuario</label>
              <input
                type="text"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-4 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-right-to-bracket"></i>}
              <span>Iniciar Sesión</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            <p>Credenciales de prueba:</p>
            <p className="mt-1 font-mono text-emerald-400">admin / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-base shadow-md shadow-emerald-600/20">
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base block leading-tight">Manager Library</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Ficha ADSO 3413974</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
            <button
              onClick={() => setCurrentView('books')}
              className={`px-3.5 py-2 rounded-lg transition ${currentView === 'books' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'}`}
            >
              <i className="fa-solid fa-book mr-1.5 text-xs"></i> Catálogo
            </button>
            <button
              onClick={() => setCurrentView('members')}
              className={`px-3.5 py-2 rounded-lg transition ${currentView === 'members' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'}`}
            >
              <i className="fa-solid fa-users mr-1.5 text-xs"></i> Socios
            </button>
            <button
              onClick={() => setCurrentView('loans')}
              className={`px-3.5 py-2 rounded-lg transition relative ${currentView === 'loans' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'}`}
            >
              <i className="fa-solid fa-hand-holding-hand mr-1.5 text-xs"></i> Préstamos
              {loanCart.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                  {loanCart.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('overdue')}
              className={`px-3.5 py-2 rounded-lg transition ${currentView === 'overdue' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'}`}
            >
              <i className="fa-solid fa-triangle-exclamation mr-1.5 text-xs text-amber-500"></i> Vencidos
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => setCurrentView('reports')}
                className={`px-3.5 py-2 rounded-lg transition ${currentView === 'reports' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'}`}
              >
                <i className="fa-solid fa-chart-column mr-1.5 text-xs"></i> Reportes
              </button>
            )}
          </nav>

          {/* User Badge & Actions */}
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              userRole === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {userRole}
            </span>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowUserModal(true)}
                title="Dar de alta bibliotecario"
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm transition"
              >
                <i className="fa-solid fa-user-plus"></i>
              </button>
            )}
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 rounded-lg hover:bg-red-50 text-red-600 text-sm transition"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Alert Notification Banner */}
      {alert && (
        <div className={`mx-auto max-w-7xl mt-4 px-4 w-full`}>
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-start justify-between shadow-md ${
            alert.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            alert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            'bg-sky-50 text-sky-800 border border-sky-200'
          }`}>
            <div className="flex items-start gap-3">
              <i className={`mt-1 fa-solid ${alert.type === 'error' ? 'fa-circle-xmark' : alert.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
              <div>
                <p>{alert.message}</p>
                {alert.details?.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-xs opacity-90">
                    {alert.details.map((d, i) => <li key={i}>{d.issue}</li>)}
                  </ul>
                )}
              </div>
            </div>
            <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">

        {/* Floating Loan Cart Drawer/Bar */}
        {loanCart.length > 0 && currentView !== 'loans' && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-extrabold flex items-center justify-center">
                {loanCart.length}
              </div>
              <div>
                <h4 className="font-bold text-sm">Libros seleccionados para préstamo ({loanCart.length}/3)</h4>
                <p className="text-xs text-slate-400">{loanCart.map(b => b.title).join(', ')}</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('loans')}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition"
            >
              Completar Préstamo &rarr;
            </button>
          </div>
        )}

        {/* VIEW 1: BOOKS CATALOGUE */}
        {currentView === 'books' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Catálogo de Libros</h2>
                <p className="text-sm text-slate-500">{booksTotal} libros activos registrados</p>
              </div>
              {userRole === 'admin' && (
                <button
                  onClick={() => {
                    setEditingBook(null);
                    setBookForm({ title: '', author: '', isbn: '', category_id: categories[0]?.id || '', total_copies: 3 });
                    setShowBookModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span>Nuevo Libro</span>
                </button>
              )}
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-96 relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadBooks()}
                  placeholder="Buscar por título o autor..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    selectedCategory === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                      selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Books Grid */}
            {booksLoading ? (
              <div className="py-20 text-center text-slate-400">
                <i className="fa-solid fa-spinner animate-spin text-3xl mb-3"></i>
                <p className="text-sm font-semibold">Cargando catálogo...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <i className="fa-solid fa-book-open text-4xl text-slate-300 mb-3"></i>
                <h3 className="font-bold text-slate-700">No se encontraron libros</h3>
                <p className="text-xs text-slate-400 mt-1">Intenta con otro término de búsqueda o categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map(b => {
                  const inCart = loanCart.some(item => item.id === b.id);
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase">
                            {b.category?.name || 'General'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.available_copies > 0 ? 'bg-slate-100 text-slate-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {b.available_copies} / {b.total_copies} disponibles
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">{b.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{b.author}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-2">ISBN: {b.isbn}</p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => toggleCartBook(b)}
                          disabled={b.available_copies <= 0 && !inCart}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            inCart
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : b.available_copies > 0
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <i className={`fa-solid ${inCart ? 'fa-trash' : 'fa-cart-plus'} text-[10px]`}></i>
                          <span>{inCart ? 'Quitar' : 'Prestar'}</span>
                        </button>

                        {userRole === 'admin' && (
                          <div className="flex items-center gap-1">
                            <label className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer text-xs" title="Subir portada">
                              <i className="fa-solid fa-image"></i>
                              <input
                                type="file"
                                accept="image/jpeg,image/png"
                                className="hidden"
                                onChange={e => handleUploadCover(b.id, e.target.files[0])}
                              />
                            </label>
                            <button
                              onClick={() => {
                                setEditingBook(b);
                                setBookForm({
                                  title: b.title,
                                  author: b.author,
                                  isbn: b.isbn,
                                  category_id: b.category?.id || categories[0]?.id || '',
                                  total_copies: b.total_copies
                                });
                                setShowBookModal(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 text-xs"
                              title="Editar libro"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteBook(b.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-red-500 text-xs"
                              title="Baja lógica"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MEMBERS */}
        {currentView === 'members' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Gestión de Socios</h2>
                <p className="text-sm text-slate-500">Personas habilitadas para solicitar préstamos</p>
              </div>
              <button
                onClick={() => setShowMemberModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <i className="fa-solid fa-user-plus text-xs"></i>
                <span>Nuevo Socio</span>
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 max-w-md">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadMembers()}
                  placeholder="Buscar socio por nombre o documento..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Nombre Completo</th>
                    <th className="py-3 px-6">Documento</th>
                    <th className="py-3 px-6">ID de Sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-slate-900">{m.full_name}</td>
                      <td className="py-4 px-6 font-mono">{m.document_number}</td>
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">{m.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: LOANS & CHECKOUT */}
        {currentView === 'loans' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: New Loan Registration Box */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center gap-2">
                <i className="fa-solid fa-cart-shopping text-emerald-600"></i>
                <span>Nuevo Préstamo</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">De 1 a 3 libros por operación (CA-06.1)</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Socio Solicitante</label>
                  <select
                    value={selectedMemberForLoan}
                    onChange={e => setSelectedMemberForLoan(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona un socio...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name} ({m.document_number})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Libros Seleccionados ({loanCart.length}/3)</label>
                  {loanCart.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No has agregado libros. Ve al <button onClick={() => setCurrentView('books')} className="text-emerald-600 underline font-bold">Catálogo</button> para elegir.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {loanCart.map(b => (
                        <li key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{b.title}</span>
                            <span className="text-[10px] text-slate-500">{b.category?.name}</span>
                          </div>
                          <button onClick={() => toggleCartBook(b)} className="text-red-500 hover:text-red-700">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={handleCreateLoan}
                  disabled={loanCart.length === 0 || !selectedMemberForLoan}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-40"
                >
                  Registrar Préstamo
                </button>
              </div>
            </div>

            {/* Right: Existing Loans List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-lg">Historial de Préstamos</h3>
                <div className="flex gap-2">
                  <select
                    value={loanStatusFilter}
                    onChange={e => setLoanStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    <option value="">Todos los estados</option>
                    <option value="open">Abiertos (open)</option>
                    <option value="overdue">Vencidos (overdue)</option>
                    <option value="closed">Cerrados (closed)</option>
                  </select>
                </div>
              </div>

              {loansLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <i className="fa-solid fa-spinner animate-spin text-2xl"></i>
                </div>
              ) : loans.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-sm font-semibold text-slate-500">No hay préstamos con este criterio.</p>
                </div>
              ) : (
                loans.map(loan => (
                  <div key={loan.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                          loan.status === 'open' ? 'bg-emerald-100 text-emerald-800' :
                          loan.status === 'overdue' ? 'bg-red-100 text-red-800 animate-pulse' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {loan.status}
                        </span>
                        <span className="text-xs text-slate-400">Prestado: {new Date(loan.loaned_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{loan.id}</span>
                    </div>

                    {/* Loan Items */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {loan.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{item.book_title}</span>
                            <span className="text-[10px] text-slate-500">
                              Vence: {new Date(item.due_at).toLocaleDateString()} · Categoría congelada: {item.category_name}
                            </span>
                          </div>
                          <div>
                            {item.returned_at ? (
                              <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Devuelto ({new Date(item.returned_at).toLocaleDateString()})
                              </span>
                            ) : (
                              <button
                                onClick={() => handleReturnItem(loan.id, item.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition"
                              >
                                Devolver
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: OVERDUE LOANS */}
        {currentView === 'overdue' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">Libros Vencidos en Mora</h2>
              <p className="text-sm text-slate-500">Listado operativo ordenado por mayor retraso primero (HU-09)</p>
            </div>

            {overdueLoading ? (
              <div className="py-20 text-center text-slate-400">
                <i className="fa-solid fa-spinner animate-spin text-3xl"></i>
              </div>
            ) : overdueList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <i className="fa-solid fa-circle-check text-4xl text-emerald-500 mb-3"></i>
                <h3 className="font-bold text-slate-800">¡Al día! No hay préstamos vencidos</h3>
                <p className="text-xs text-slate-400 mt-1">Todos los libros prestados están dentro del plazo de 14 días.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-50/50 text-red-900 uppercase text-[10px] font-extrabold border-b border-red-100">
                    <tr>
                      <th className="py-3 px-6">Libro</th>
                      <th className="py-3 px-6">Socio</th>
                      <th className="py-3 px-6">Fecha Límite</th>
                      <th className="py-3 px-6">Días de Retraso</th>
                      <th className="py-3 px-6 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {overdueList.map(item => (
                      <tr key={item.item_id} className="hover:bg-red-50/20 transition">
                        <td className="py-4 px-6 font-bold text-slate-900">{item.book_title}</td>
                        <td className="py-4 px-6">{item.member_name}</td>
                        <td className="py-4 px-6 text-xs text-slate-500">{new Date(item.due_at).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-xs">
                            {item.days_late} días tarde
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleReturnItem(item.loan_id, item.item_id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          >
                            Registrar Devolución
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: REPORTS (Admin only) */}
        {currentView === 'reports' && userRole === 'admin' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">Reporte de Libros Más Prestados</h2>
              <p className="text-sm text-slate-500">Agrupado por valores congelados en la línea de préstamo (ADR-004)</p>
            </div>

            {/* Date Range Picker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Desde</label>
                <input
                  type="date"
                  value={reportFrom}
                  onChange={e => setReportFrom(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hasta</label>
                <input
                  type="date"
                  value={reportTo}
                  onChange={e => setReportTo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={loadReport}
                disabled={reportLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition"
              >
                {reportLoading ? 'Consultando...' : 'Generar Reporte'}
              </button>
            </div>

            {reportRows.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-sm text-slate-500">No se registraron préstamos en el rango de fechas seleccionado.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-6">#</th>
                      <th className="py-3 px-6">Título Congelado</th>
                      <th className="py-3 px-6">Categoría Congelada</th>
                      <th className="py-3 px-6 text-right">Veces Prestado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {reportRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-6 text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{r.book_title}</td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold">
                            {r.category_name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm">
                            {r.times_borrowed}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL: CREATE / EDIT BOOK */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">
              {editingBook ? 'Editar Libro' : 'Nuevo Libro'}
            </h3>
            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título</label>
                <input
                  type="text"
                  value={bookForm.title}
                  onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Autor</label>
                <input
                  type="text"
                  value={bookForm.author}
                  onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              {!editingBook && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ISBN (13 dígitos)</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })}
                    maxLength={13}
                    placeholder="9780123456789"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                  <select
                    value={bookForm.category_id}
                    onChange={e => setBookForm({ ...bookForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Ejemplares</label>
                  <input
                    type="number"
                    min={1}
                    value={bookForm.total_copies}
                    onChange={e => setBookForm({ ...bookForm, total_copies: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition"
                >
                  Guardar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE MEMBER */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">Registrar Nuevo Socio</h3>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={memberForm.full_name}
                  onChange={e => setMemberForm({ ...memberForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número de Documento</label>
                <input
                  type="text"
                  value={memberForm.document_number}
                  onChange={e => setMemberForm({ ...memberForm, document_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition"
                >
                  Registrar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE LIBRARIAN (Admin only) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">Alta de Bibliotecario</h3>
            <p className="text-xs text-slate-500 mb-4">Rol fijado en 'librarian' (CA-02)</p>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="ej. ana_librarian"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
