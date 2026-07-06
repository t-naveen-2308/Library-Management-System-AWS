import { useState, useEffect } from 'react';
import { getCurrentSession } from './auth/cognito';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSession()
      .then(sess => {
        setSession(sess);
        setLoading(false);
      })
      .catch(() => {
        setSession(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      {session ? (
        <Dashboard setSession={setSession} />
      ) : (
        <Login setSession={setSession} />
      )}
    </div>
  );
}

export default App;
