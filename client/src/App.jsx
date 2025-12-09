import { Routes, Route, Navigate } from 'react-router-dom';
import Storefront from './pages/Storefront.jsx';
import Checkout from './pages/Checkout.jsx';
import Admin from './pages/Admin.jsx';
import Layout from './components/Layout.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/checkout/:orderId" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
