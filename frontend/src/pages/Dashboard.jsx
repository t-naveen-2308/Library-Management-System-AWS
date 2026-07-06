import { logout } from '../auth/cognito';

function Dashboard({ setSession }) {
    const handleLogout = () => {
        logout();
        setSession(null);
    };

    return (
        <div className="dashboard-container">
            <header>
                <h2>Library Dashboard</h2>
                <button onClick={handleLogout}>Logout</button>
            </header>
            
            <main>
                <section>
                    <h3>Available Sections</h3>
                    <p>Loading sections from API...</p>
                </section>
                
                <section>
                    <h3>My Books</h3>
                    <p>Loading books from API...</p>
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
