import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
    const location = useLocation();

    const isActive = (path) =>
        location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                    <Link className="navbar-brand" to="/">
                        FlashSale Engine
                    </Link>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link className={isActive('/')} to="/">
                                    Storefront
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={isActive('/admin')} to="/admin">
                                    Admin
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main className="container mt-4">{children}</main>
        </div>
    );
}
